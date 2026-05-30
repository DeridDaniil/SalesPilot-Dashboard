import { describe, it, expect } from 'vitest';
import {
  login,
  register,
  logout,
  getPersistedUser,
  changePassword,
  isSeedUser,
  adminCreateUser,
  adminEditUser,
  adminDeleteUser,
  fetchAllUsers,
} from './authService';
import { setClients, setLeads } from './storageService';
import type { Client, Lead } from '../types';

describe('authService — seeded credentials', () => {
  it('logs in a built-in admin with correct credentials and persists session', async () => {
    const user = await login('admin@salespilot.ru', 'admin');
    expect(user.id).toBe('u1');
    expect(user.role).toBe('admin');
    expect(getPersistedUser()?.id).toBe('u1');
  });

  it('rejects login with an invalid password', async () => {
    await expect(login('admin@salespilot.ru', 'wrong')).rejects.toThrow();
  });

  it('clears the persisted session on logout', async () => {
    await login('anna@salespilot.ru', 'manager');
    expect(getPersistedUser()).not.toBeNull();
    await logout();
    expect(getPersistedUser()).toBeNull();
  });
});

describe('authService — registration and password change', () => {
  it('registers a new user, persists the session and allows login after', async () => {
    const created = await register('New User', 'new@example.com', 'secret', 'manager');
    expect(created.email).toBe('new@example.com');
    expect(created.role).toBe('manager');
    expect(getPersistedUser()?.email).toBe('new@example.com');

    await logout();

    const loggedIn = await login('new@example.com', 'secret');
    expect(loggedIn.id).toBe(created.id);
  });

  it('rejects registration when email is already in use', async () => {
    await expect(
      register('Dup', 'admin@salespilot.ru', 'x', 'manager'),
    ).rejects.toThrow();
  });

  it('changes password for a logged-in user', async () => {
    await register('Pw User', 'pw@example.com', 'old-pass', 'manager');
    await changePassword('old-pass', 'new-pass');
    await logout();

    await expect(login('pw@example.com', 'old-pass')).rejects.toThrow();
    const ok = await login('pw@example.com', 'new-pass');
    expect(ok.email).toBe('pw@example.com');
  });
});

describe('authService — admin user management & seed-user protection', () => {
  it('flags built-in users as seed and others as not', () => {
    expect(isSeedUser('u1')).toBe(true);
    expect(isSeedUser('u2')).toBe(true);
    expect(isSeedUser('u3')).toBe(true);
    expect(isSeedUser('u-created')).toBe(false);
  });

  it('refuses to delete a built-in seed user', async () => {
    await expect(adminDeleteUser('u1')).rejects.toThrow();
    const users = await fetchAllUsers();
    expect(users.some((u) => u.id === 'u1')).toBe(true);
  });

  it('creates and deletes a non-seed user', async () => {
    const created = await adminCreateUser({
      firstName: 'New',
      lastName: 'Manager',
      email: 'new.manager@example.com',
      role: 'manager',
    });
    expect((await fetchAllUsers()).some((u) => u.id === created.id)).toBe(true);

    await adminDeleteUser(created.id);
    expect((await fetchAllUsers()).some((u) => u.id === created.id)).toBe(false);
  });

  it('refuses to change a seed user email but allows other field edits', async () => {
    await expect(
      adminEditUser('u2', {
        firstName: 'Анна',
        lastName: 'Кузнецова',
        email: 'changed@salespilot.ru',
        role: 'manager',
      }),
    ).rejects.toThrow();

    const renamed = await adminEditUser('u2', {
      firstName: 'Аннета',
      lastName: 'Кузнецова',
      email: 'anna@salespilot.ru',
      role: 'manager',
    });
    expect(renamed.firstName).toBe('Аннета');
    expect(renamed.email).toBe('anna@salespilot.ru');
  });

  it('allows changing the email of a created user', async () => {
    const created = await adminCreateUser({
      firstName: 'Edit',
      lastName: 'Me',
      email: 'edit.me@example.com',
      role: 'manager',
    });

    const updated = await adminEditUser(created.id, {
      firstName: 'Edit',
      lastName: 'Me',
      email: 'edited@example.com',
      role: 'manager',
    });
    expect(updated.email).toBe('edited@example.com');

    // Old email credential is migrated, new one logs in.
    const ok = await login('edited@example.com', '12345');
    expect(ok.id).toBe(created.id);
  });

  it('refuses to change the role of a seed user', async () => {
    await expect(
      adminEditUser('u1', {
        firstName: 'Александр',
        lastName: 'Морозов',
        email: 'admin@salespilot.ru',
        role: 'manager',
      }),
    ).rejects.toThrow();

    // The seed admin keeps its role.
    const users = await fetchAllUsers();
    expect(users.find((u) => u.id === 'u1')?.role).toBe('admin');
  });

  it('refuses to delete a manager that still owns clients or leads', async () => {
    const created = await adminCreateUser({
      firstName: 'Темп',
      lastName: 'Менеджер',
      email: 'temp.mgr@example.com',
      role: 'manager',
    });

    const lead: Lead = {
      id: 'l-temp',
      name: 'Тест Лид',
      email: 'lead@example.ru',
      phone: '+7 (900) 000-00-00',
      company: 'Тест',
      status: 'new',
      source: 'Website',
      value: 100000,
      managerId: created.id,
      managerName: created.name,
      createdAt: '2026-01-15',
      notes: '',
    };
    setLeads([lead]);

    await expect(adminDeleteUser(created.id)).rejects.toThrow();
    expect((await fetchAllUsers()).some((u) => u.id === created.id)).toBe(true);

    // Once the related records are gone, deletion is allowed again.
    setLeads([]);
    setClients([] as Client[]);
    await expect(adminDeleteUser(created.id)).resolves.toBe(created.id);
  });
});

describe('authService — stale seed session self-heal', () => {
  it('refreshes a seed session that was persisted with an outdated email/name', () => {
    // Simulate a session stored before the demo data was localized.
    localStorage.setItem(
      'salespilot_user',
      JSON.stringify({
        id: 'u1',
        name: 'Alex Mercer',
        firstName: 'Alex',
        lastName: 'Mercer',
        email: 'admin@salespilot.com',
        role: 'admin',
        avatar: 'AM',
      }),
    );

    const healed = getPersistedUser();
    expect(healed?.id).toBe('u1');
    expect(healed?.email).toBe('admin@salespilot.ru');
    expect(healed?.name).toBe('Александр Морозов');
    expect(healed?.role).toBe('admin');
  });

  it('leaves a valid current seed session untouched', () => {
    localStorage.setItem(
      'salespilot_user',
      JSON.stringify({
        id: 'u1',
        name: 'Александр Морозов',
        firstName: 'Александр',
        lastName: 'Морозов',
        email: 'admin@salespilot.ru',
        role: 'admin',
        avatar: 'АМ',
      }),
    );

    const user = getPersistedUser();
    expect(user?.email).toBe('admin@salespilot.ru');
    expect(user?.name).toBe('Александр Морозов');
  });
});
