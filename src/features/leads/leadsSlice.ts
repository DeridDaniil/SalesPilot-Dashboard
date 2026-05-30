import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Lead } from '../../shared/types';
import type { RootState } from '../../app/store';
import * as leadsService from '../../shared/services/leadsService';
import type { LeadPayload } from '../../shared/services/leadsService';

interface LeadsState {
  items: Lead[];
  selectedLead: Lead | null;
  loading: boolean;
  detailLoading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: LeadsState = {
  items: [],
  selectedLead: null,
  loading: false,
  detailLoading: false,
  saving: false,
  error: null,
};

export const fetchLeads = createAsyncThunk('leads/fetchAll', async () => {
  return leadsService.fetchLeads();
});

export const fetchLeadById = createAsyncThunk(
  'leads/fetchById',
  async (id: string) => {
    return leadsService.fetchLeadById(id);
  },
);

export const createLead = createAsyncThunk(
  'leads/create',
  async (payload: LeadPayload) => {
    return leadsService.createLead(payload);
  },
);

export const updateLead = createAsyncThunk(
  'leads/update',
  async ({ id, payload }: { id: string; payload: Partial<LeadPayload> }) => {
    return leadsService.updateLead(id, payload);
  },
);

export const deleteLead = createAsyncThunk(
  'leads/delete',
  async (id: string) => {
    return leadsService.deleteLead(id);
  },
);

const leadsSlice = createSlice({
  name: 'leads',
  initialState,
  reducers: {
    clearSelectedLead(state) {
      state.selectedLead = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to load leads';
      })
      .addCase(fetchLeadById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
        // Drop any previously loaded lead so a failed lookup can't show stale data.
        state.selectedLead = null;
      })
      .addCase(fetchLeadById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedLead = action.payload;
      })
      .addCase(fetchLeadById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.error.message ?? 'Failed to load lead';
      })
      .addCase(createLead.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createLead.fulfilled, (state, action) => {
        state.saving = false;
        state.items = [action.payload, ...state.items];
      })
      .addCase(createLead.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Failed to create lead';
      })
      .addCase(updateLead.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateLead.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.items.findIndex((l) => l.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        state.selectedLead = action.payload;
      })
      .addCase(updateLead.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message ?? 'Failed to update lead';
      })
      .addCase(deleteLead.fulfilled, (state, action) => {
        state.items = state.items.filter((l) => l.id !== action.payload);
      });
  },
});

export const { clearSelectedLead } = leadsSlice.actions;

/* ── Selectors ── */

export const selectVisibleLeads = (state: RootState): Lead[] => {
  const { items } = state.leads;
  const user = state.auth.user;

  if (user?.role === 'manager') {
    return items.filter((l) => l.managerId === user.id);
  }
  return items;
};

export default leadsSlice.reducer;
