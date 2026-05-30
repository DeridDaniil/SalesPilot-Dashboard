import type { Client } from '../types';
import { getClients, setClients } from './storageService';

export async function fetchClients(): Promise<Client[]> {
  return getClients();
}

export async function fetchClientById(id: string): Promise<Client> {
  const client = getClients().find((c) => c.id === id);
  if (!client) throw new Error(`Client "${id}" not found`);
  return { ...client };
}

export type ClientPayload = Omit<Client, 'id' | 'createdAt'>;

export async function createClient(payload: ClientPayload): Promise<Client> {
  const clients = getClients();
  const client: Client = {
    ...payload,
    id: `c${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  setClients([client, ...clients]);
  return client;
}

export async function updateClient(id: string, payload: Partial<ClientPayload>): Promise<Client> {
  const clients = getClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error(`Client "${id}" not found`);
  clients[idx] = { ...clients[idx], ...payload };
  setClients(clients);
  return { ...clients[idx] };
}

/** Check if a client with this email already exists (for dedup on lead conversion) */
export async function fetchClientByEmail(email: string): Promise<Client | null> {
  const clients = getClients();
  return clients.find((c) => c.email.toLowerCase() === email.toLowerCase()) ?? null;
}
