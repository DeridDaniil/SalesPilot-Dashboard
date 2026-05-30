import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Client, ClientFilters } from '../../shared/types';
import type { RootState } from '../../app/store';
import * as clientsService from '../../shared/services/clientsService';
import type { ClientPayload } from '../../shared/services/clientsService';

interface ClientsState {
  items: Client[];
  selectedClient: Client | null;
  loading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
  filters: ClientFilters;
}

const initialState: ClientsState = {
  items: [],
  selectedClient: null,
  loading: false,
  detailLoading: false,
  saving: false,
  error: null,
  filters: {
    status: 'all',
    managerId: '',
    dateSort: 'default',
    search: '',
  },
};

export const fetchClients = createAsyncThunk('clients/fetchAll', async () => {
  return clientsService.fetchClients();
});

export const fetchClientById = createAsyncThunk(
  'clients/fetchById',
  async (id: string) => {
    return clientsService.fetchClientById(id);
  },
);

export const createClient = createAsyncThunk(
  'clients/create',
  async (payload: ClientPayload) => {
    return clientsService.createClient(payload);
  },
);

export const updateClient = createAsyncThunk(
  'clients/update',
  async ({ id, payload }: { id: string; payload: Partial<ClientPayload> }) => {
    return clientsService.updateClient(id, payload);
  },
);

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    setFilters(state, action: { payload: Partial<ClientFilters> }) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = initialState.filters;
    },
    clearSelectedClient(state) {
      state.selectedClient = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load clients';
      })
      .addCase(fetchClientById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
        // Drop any previously loaded client so a failed lookup can't show stale data.
        state.selectedClient = null;
      })
      .addCase(fetchClientById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedClient = action.payload;
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.error.message ?? 'Failed to load client';
      })
      .addCase(createClient.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.saving = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createClient.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Failed to create client';
      })
      .addCase(updateClient.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.items.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        state.selectedClient = action.payload;
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Failed to update client';
      });
  },
});

export const { setFilters, clearFilters, clearSelectedClient } = clientsSlice.actions;

/* ── Selectors ── */

export const selectFilteredClients = (state: RootState): Client[] => {
  const { items, filters } = state.clients;
  const user = state.auth.user;

  let filtered = items;

  // Role-based: managers only see their own clients
  if (user?.role === 'manager') {
    filtered = filtered.filter((c) => c.managerId === user.id);
  }

  if (filters.status !== 'all') {
    filtered = filtered.filter((c) => c.status === filters.status);
  }

  if (filters.managerId) {
    filtered = filtered.filter((c) => c.managerId === filters.managerId);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }

  // Date sort
  if (filters.dateSort === 'newest') {
    filtered = [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else if (filters.dateSort === 'oldest') {
    filtered = [...filtered].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return filtered;
};

export default clientsSlice.reducer;
