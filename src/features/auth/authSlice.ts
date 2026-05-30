import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { User, Role } from '../../shared/types';
import type { RootState } from '../../app/store';
import * as authService from '../../shared/services/authService';
import type { ProfileUpdates, CreateUserPayload, AdminEditUserPayload } from '../../shared/services/authService';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  /** Admin: all users for management */
  users: User[];
  usersLoading: boolean;
}

const initialState: AuthState = {
  user: authService.getPersistedUser(),
  loading: false,
  error: null,
  users: [],
  usersLoading: false,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    return authService.login(email, password);
  },
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async ({ name, email, password, role }: { name: string; email: string; password: string; role: Role }) => {
    return authService.register(name, email, password, role);
  },
);

export const updateProfileThunk = createAsyncThunk(
  'auth/updateProfile',
  async (updates: ProfileUpdates) => {
    return authService.updateProfile(updates);
  },
);

export const changePasswordThunk = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
    await authService.changePassword(currentPassword, newPassword);
  },
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

/* ── Admin thunks ── */

export const fetchUsersThunk = createAsyncThunk('auth/fetchUsers', async () => {
  return authService.fetchAllUsers();
});

export const adminCreateUserThunk = createAsyncThunk(
  'auth/adminCreateUser',
  async (payload: CreateUserPayload) => {
    return authService.adminCreateUser(payload);
  },
);

export const adminEditUserThunk = createAsyncThunk(
  'auth/adminEditUser',
  async ({ userId, payload }: { userId: string; payload: AdminEditUserPayload }) => {
    return authService.adminEditUser(userId, payload);
  },
);

export const adminResetPasswordThunk = createAsyncThunk(
  'auth/adminResetPassword',
  async (userId: string) => {
    return authService.adminResetPassword(userId);
  },
);

export const adminDeleteUserThunk = createAsyncThunk(
  'auth/adminDeleteUser',
  async (userId: string) => {
    return authService.adminDeleteUser(userId);
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearTemporaryPassword(state) {
      if (state.user) {
        state.user.temporaryPassword = undefined;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Ошибка входа';
      })
      // Register
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Ошибка регистрации';
      })
      // Update profile
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // Change password — clear temporaryPassword
      .addCase(changePasswordThunk.fulfilled, (state) => {
        if (state.user) {
          state.user.temporaryPassword = undefined;
        }
      })
      // Logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
      })
      // Fetch all users (admin)
      .addCase(fetchUsersThunk.pending, (state) => {
        state.usersLoading = true;
      })
      .addCase(fetchUsersThunk.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsersThunk.rejected, (state) => {
        state.usersLoading = false;
      })
      // Admin create user
      .addCase(adminCreateUserThunk.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      // Admin edit user
      .addCase(adminEditUserThunk.fulfilled, (state, action) => {
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = action.payload;
        if (state.user?.id === action.payload.id) {
          state.user = action.payload;
        }
      })
      // Admin reset password
      .addCase(adminResetPasswordThunk.fulfilled, (state, action) => {
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.users[idx] = action.payload;
      })
      // Admin delete user
      .addCase(adminDeleteUserThunk.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      });
  },
});

export const { clearTemporaryPassword } = authSlice.actions;

/* ── Selectors ── */

/** All users with the manager role (for assignment dropdowns). */
export const selectManagers = (state: RootState): User[] =>
  state.auth.users.filter((u) => u.role === 'manager');

export default authSlice.reducer;
