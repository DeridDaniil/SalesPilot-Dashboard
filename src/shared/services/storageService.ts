import type { Lead, Client } from '../types';
import { LEADS, CLIENTS } from './mockData';

const KEYS = {
  leads: 'salespilot_leads',
  clients: 'salespilot_clients',
  seeded: 'salespilot_seeded',
} as const;

/** Every localStorage key owned by the app — used by the demo-data reset. */
const PROJECT_KEYS: readonly string[] = [
  'salespilot_user',
  'salespilot_registered_users',
  'salespilot_registered_creds',
  KEYS.leads,
  KEYS.clients,
  KEYS.seeded,
];

/** One-time seed: writes mock data to localStorage if not already done. */
export function ensureSeed(): void {
  if (localStorage.getItem(KEYS.seeded)) return;
  localStorage.setItem(KEYS.leads, JSON.stringify(LEADS));
  localStorage.setItem(KEYS.clients, JSON.stringify(CLIENTS));
  localStorage.setItem(KEYS.seeded, '1');
}

/**
 * Wipes all app-owned localStorage keys and re-seeds the demo data, returning
 * the app to a clean state. Only project keys are removed — other site storage
 * is left untouched. The caller is responsible for logging the user out /
 * reloading afterwards.
 */
export function resetDemoData(): void {
  PROJECT_KEYS.forEach((key) => localStorage.removeItem(key));
  ensureSeed();
}

/* ── Leads ── */

export function getLeads(): Lead[] {
  const raw = localStorage.getItem(KEYS.leads);
  return raw ? JSON.parse(raw) : [];
}

export function setLeads(leads: Lead[]): void {
  localStorage.setItem(KEYS.leads, JSON.stringify(leads));
}

/* ── Clients ── */

export function getClients(): Client[] {
  const raw = localStorage.getItem(KEYS.clients);
  return raw ? JSON.parse(raw) : [];
}

export function setClients(clients: Client[]): void {
  localStorage.setItem(KEYS.clients, JSON.stringify(clients));
}
