import { describe, it, expect, beforeEach } from 'vitest';
import { ensureSeed } from './storageService';
import {
  fetchLeads,
  fetchLeadById,
  createLead,
  updateLead,
  deleteLead,
} from './leadsService';
import type { LeadPayload } from './leadsService';

const sampleLead: LeadPayload = {
  name: 'Test Lead',
  email: 'test@example.com',
  phone: '+1 555 000 0000',
  company: 'Test Co',
  status: 'new',
  source: 'Website',
  value: 10000,
  managerId: 'u2',
  managerName: 'Анна Кузнецова',
  notes: 'created from unit test',
};

describe('leadsService — localStorage-backed CRUD over mock data', () => {
  beforeEach(() => {
    ensureSeed();
  });

  it('loads the seeded leads after first boot', async () => {
    const leads = await fetchLeads();
    expect(leads.length).toBeGreaterThan(0);
    expect(leads.every((l) => typeof l.id === 'string')).toBe(true);
  });

  it('creates, reads, updates and deletes a lead', async () => {
    const before = (await fetchLeads()).length;

    const created = await createLead(sampleLead);
    expect(created.id).toMatch(/^l\d+/);
    expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect((await fetchLeads()).length).toBe(before + 1);

    const fetched = await fetchLeadById(created.id);
    expect(fetched.email).toBe(sampleLead.email);

    const updated = await updateLead(created.id, { status: 'qualified', value: 22000 });
    expect(updated.status).toBe('qualified');
    expect(updated.value).toBe(22000);

    await deleteLead(created.id);
    expect((await fetchLeads()).length).toBe(before);
    await expect(fetchLeadById(created.id)).rejects.toThrow();
  });
});
