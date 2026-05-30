import type { User, Role } from '../types';
import { USERS, CREDENTIALS } from './mockData';
import { getClients, getLeads } from './storageService';

/** Built-in demo users (u1/u2/u3) cannot be deleted or have their email changed. */
export function isSeedUser(id: string): boolean {
  return USERS.some((u) => u.id === id);
}

const STORAGE_KEY = 'salespilot_user';
const REGISTERED_USERS_KEY = 'salespilot_registered_users';
const REGISTERED_CREDS_KEY = 'salespilot_registered_creds';

const DEFAULT_PASSWORD = '12345';

function buildFullName(first: string, last: string, middle?: string): string {
  return middle ? `${first} ${middle} ${last}` : `${first} ${last}`;
}

function buildAvatar(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

/** Merge built-in + registered users */
function getAllUsers(): User[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    const extra: User[] = raw ? JSON.parse(raw) : [];
    // Registered users override built-ins by id
    const builtinIds = new Set(extra.map((u) => u.id));
    const builtins = USERS.filter((u) => !builtinIds.has(u.id));
    return [...builtins, ...extra];
  } catch {
    return [...USERS];
  }
}

/** Merge built-in + registered credentials */
function getAllCredentials(): Record<string, { password: string; userId: string }> {
  try {
    const raw = localStorage.getItem(REGISTERED_CREDS_KEY);
    const extra = raw ? JSON.parse(raw) : {};
    return { ...CREDENTIALS, ...extra };
  } catch {
    return { ...CREDENTIALS };
  }
}

function getExtraCredentials(): Record<string, { password: string; userId: string }> {
  try {
    const raw = localStorage.getItem(REGISTERED_CREDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getExtraUsers(): User[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveExtraUsers(users: User[]): void {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

function saveExtraCredentials(creds: Record<string, { password: string; userId: string }>): void {
  localStorage.setItem(REGISTERED_CREDS_KEY, JSON.stringify(creds));
}

export async function login(email: string, password: string): Promise<User> {
  const allCreds = getAllCredentials();
  const cred = allCreds[email];
  if (!cred || cred.password !== password) {
    throw new Error('Неверная почта или пароль');
  }

  const allUsers = getAllUsers();
  const user = allUsers.find((u) => u.id === cred.userId);
  if (!user) throw new Error('Пользователь не найден');

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export async function register(
  name: string,
  email: string,
  password: string,
  role: Role,
): Promise<User> {
  const allCreds = getAllCredentials();
  if (allCreds[email]) {
    throw new Error('Эта почта уже зарегистрирована');
  }

  const parts = name.trim().split(/\s+/);
  const firstName = parts[0] || name;
  const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

  const id = 'u' + Date.now();
  const avatar = buildAvatar(firstName, lastName || firstName);

  const user: User = {
    id,
    name: name.trim(),
    firstName,
    lastName,
    email,
    role,
    avatar,
  };

  // Persist registered user
  const existingUsers = getExtraUsers();
  existingUsers.push(user);
  saveExtraUsers(existingUsers);

  // Persist credential
  const extraCreds = getExtraCredentials();
  extraCreds[email] = { password, userId: id };
  saveExtraCredentials(extraCreds);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

export interface ProfileUpdates {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone?: string;
}

export async function updateProfile(updates: ProfileUpdates): Promise<User> {
  const current = getPersistedUser();
  if (!current) throw new Error('Нет активной сессии');

  const emailChanged = updates.email !== current.email;
  const isSeedUser = !!USERS.find((u) => u.id === current.id);

  if (emailChanged && isSeedUser) {
    throw new Error('Изменение почты для встроенных аккаунтов не поддерживается');
  }

  if (emailChanged) {
    const allCreds = getAllCredentials();
    if (allCreds[updates.email]) {
      throw new Error('Эта почта уже используется другим пользователем');
    }
  }

  const fullName = buildFullName(updates.firstName, updates.lastName, updates.middleName);
  const updated: User = {
    ...current,
    firstName: updates.firstName,
    lastName: updates.lastName,
    middleName: updates.middleName || undefined,
    email: updates.email,
    phone: updates.phone || undefined,
    name: fullName,
    avatar: buildAvatar(updates.firstName, updates.lastName),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Update registered users and migrate credentials if email changed
  if (!isSeedUser) {
    const extra = getExtraUsers();
    const idx = extra.findIndex((u) => u.id === current.id);
    if (idx !== -1) {
      extra[idx] = updated;
      saveExtraUsers(extra);
    }

    if (emailChanged) {
      const extraCreds = getExtraCredentials();
      if (extraCreds[current.email]) {
        extraCreds[updates.email] = extraCreds[current.email];
        delete extraCreds[current.email];
        saveExtraCredentials(extraCreds);
      }
    }
  }

  return updated;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const current = getPersistedUser();
  if (!current) throw new Error('Нет активной сессии');

  const allCreds = getAllCredentials();
  const cred = allCreds[current.email];
  if (!cred || cred.password !== currentPassword) {
    throw new Error('Неверный текущий пароль');
  }

  // Store updated password in extras (overrides builtins via merge order)
  const extraCreds = getExtraCredentials();
  extraCreds[current.email] = { password: newPassword, userId: current.id };
  saveExtraCredentials(extraCreds);

  // Clear temporaryPassword flag
  if (current.temporaryPassword) {
    const updated = { ...current, temporaryPassword: undefined };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Also update in registered users
    const extra = getExtraUsers();
    const idx = extra.findIndex((u) => u.id === current.id);
    if (idx !== -1) {
      extra[idx] = updated;
      saveExtraUsers(extra);
    }
  }
}

/* ── Admin: user management ── */

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  role: Role;
}

export async function adminCreateUser(payload: CreateUserPayload): Promise<User> {
  const allCreds = getAllCredentials();
  if (allCreds[payload.email]) {
    throw new Error('Эта почта уже зарегистрирована');
  }

  const id = 'u' + Date.now();
  const fullName = buildFullName(payload.firstName, payload.lastName, payload.middleName);
  const avatar = buildAvatar(payload.firstName, payload.lastName);

  const user: User = {
    id,
    name: fullName,
    firstName: payload.firstName,
    lastName: payload.lastName,
    middleName: payload.middleName || undefined,
    email: payload.email,
    role: payload.role,
    avatar,
    temporaryPassword: true,
  };

  const extra = getExtraUsers();
  extra.push(user);
  saveExtraUsers(extra);

  const extraCreds = getExtraCredentials();
  extraCreds[payload.email] = { password: DEFAULT_PASSWORD, userId: id };
  saveExtraCredentials(extraCreds);

  return user;
}

export interface AdminEditUserPayload {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  role: Role;
  phone?: string;
}

export async function adminEditUser(userId: string, payload: AdminEditUserPayload): Promise<User> {
  const allUsers = getAllUsers();
  const target = allUsers.find((u) => u.id === userId);
  if (!target) throw new Error('Пользователь не найден');

  const emailChanged = payload.email !== target.email;
  if (emailChanged && isSeedUser(userId)) {
    throw new Error('Изменение почты для встроенных аккаунтов не поддерживается');
  }
  const roleChanged = payload.role !== target.role;
  if (roleChanged && isSeedUser(userId)) {
    throw new Error('Роль встроенного демо-пользователя нельзя изменить');
  }
  if (emailChanged) {
    const allCreds = getAllCredentials();
    if (allCreds[payload.email]) {
      throw new Error('Эта почта уже используется другим пользователем');
    }
  }

  const fullName = buildFullName(payload.firstName, payload.lastName, payload.middleName);
  const updated: User = {
    ...target,
    firstName: payload.firstName,
    lastName: payload.lastName,
    middleName: payload.middleName || undefined,
    email: payload.email,
    phone: payload.phone || undefined,
    role: payload.role,
    name: fullName,
    avatar: buildAvatar(payload.firstName, payload.lastName),
  };

  // Update in extra users (or add if seed user being edited for first time)
  const extra = getExtraUsers();
  const idx = extra.findIndex((u) => u.id === userId);
  if (idx !== -1) {
    extra[idx] = updated;
  } else {
    extra.push(updated);
  }
  saveExtraUsers(extra);

  // Migrate credentials if email changed
  if (emailChanged) {
    const extraCreds = getExtraCredentials();
    const allCreds = getAllCredentials();
    const oldCred = allCreds[target.email];
    if (oldCred) {
      extraCreds[payload.email] = oldCred;
      delete extraCreds[target.email];
      saveExtraCredentials(extraCreds);
    }
  }

  // If editing the currently logged-in user, update session
  const current = getPersistedUser();
  if (current && current.id === userId) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return updated;
}

export async function adminResetPassword(userId: string): Promise<User> {
  const allUsers = getAllUsers();
  const target = allUsers.find((u) => u.id === userId);
  if (!target) throw new Error('Пользователь не найден');

  // Reset password to default
  const extraCreds = getExtraCredentials();
  extraCreds[target.email] = { password: DEFAULT_PASSWORD, userId };
  saveExtraCredentials(extraCreds);

  // Set temporaryPassword flag
  const updated = { ...target, temporaryPassword: true };
  const extra = getExtraUsers();
  const idx = extra.findIndex((u) => u.id === userId);
  if (idx !== -1) {
    extra[idx] = updated;
  } else {
    extra.push(updated);
  }
  saveExtraUsers(extra);

  return updated;
}

export async function adminDeleteUser(userId: string): Promise<string> {
  if (isSeedUser(userId)) {
    throw new Error('Демо-пользователя нельзя удалить');
  }

  const allUsers = getAllUsers();
  const target = allUsers.find((u) => u.id === userId);
  if (!target) throw new Error('Пользователь не найден');

  // Block deletion of a manager that still owns clients or leads, otherwise
  // those records would be left with a managerId that no longer exists.
  const hasClients = getClients().some((c) => c.managerId === userId);
  const hasLeads = getLeads().some((l) => l.managerId === userId);
  if (hasClients || hasLeads) {
    throw new Error('Нельзя удалить менеджера: за ним закреплены клиенты или лиды.');
  }

  // Remove from registered users
  const extra = getExtraUsers();
  saveExtraUsers(extra.filter((u) => u.id !== userId));

  // Remove credentials
  const extraCreds = getExtraCredentials();
  delete extraCreds[target.email];
  saveExtraCredentials(extraCreds);

  return userId;
}

export async function fetchAllUsers(): Promise<User[]> {
  return getAllUsers();
}

export async function logout(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
}

export function getPersistedUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as User;

    // Self-heal a stale seed session that was persisted before the demo data
    // changed (e.g. an old "Alex Mercer" / *.com session from a previous build).
    // If the stored email is no longer a valid credential, refresh the session
    // from the canonical seed user so the UI shows up-to-date data.
    if (isSeedUser(stored.id) && !getAllCredentials()[stored.email]) {
      const canonical = getAllUsers().find((u) => u.id === stored.id);
      if (canonical) {
        const refreshed: User = { ...canonical, temporaryPassword: stored.temporaryPassword };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
        return refreshed;
      }
    }

    return stored;
  } catch {
    return null;
  }
}
