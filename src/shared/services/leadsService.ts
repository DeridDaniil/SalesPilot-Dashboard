import type { Lead } from '../types';
import { getLeads, setLeads } from './storageService';

export async function fetchLeads(): Promise<Lead[]> {
  return getLeads();
}

export async function fetchLeadById(id: string): Promise<Lead> {
  const lead = getLeads().find((l) => l.id === id);
  if (!lead) throw new Error(`Lead "${id}" not found`);
  return { ...lead };
}

export type LeadPayload = Omit<Lead, 'id' | 'createdAt'>;

export async function createLead(payload: LeadPayload): Promise<Lead> {
  const leads = getLeads();
  const lead: Lead = {
    ...payload,
    id: `l${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  setLeads([lead, ...leads]);
  return lead;
}

export async function updateLead(id: string, payload: Partial<LeadPayload>): Promise<Lead> {
  const leads = getLeads();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) throw new Error(`Lead "${id}" not found`);
  leads[idx] = { ...leads[idx], ...payload };
  setLeads(leads);
  return { ...leads[idx] };
}

export async function deleteLead(id: string): Promise<string> {
  const leads = getLeads();
  setLeads(leads.filter((l) => l.id !== id));
  return id;
}
