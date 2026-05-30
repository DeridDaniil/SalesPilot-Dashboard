import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import clientsReducer from '../features/clients/clientsSlice';
import leadsReducer from '../features/leads/leadsSlice';
import { ensureSeed } from '../shared/services/storageService';
import App from '../App';

function renderApp(initialPath: string) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      clients: clientsReducer,
      leads: leadsReducer,
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </Provider>,
  );
}

describe('App smoke test', () => {
  it('renders the login screen for unauthenticated users', async () => {
    renderApp('/dashboard');

    await waitFor(() => {
      expect(screen.getByText('SalesPilot')).toBeInTheDocument();
    });

    expect(
      screen.getByPlaceholderText('admin@salespilot.ru'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Войти/i })).toBeInTheDocument();
  });

  it('boots the app with seeded localStorage data without crashing', () => {
    ensureSeed();
    renderApp('/login');
    expect(screen.getByText('SalesPilot')).toBeInTheDocument();
  });
});
