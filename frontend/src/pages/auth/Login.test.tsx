import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Login from './Login';
import { server, http, HttpResponse } from '../../test/msw';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('react-toastify', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
);

const renderLogin = () => render(<Login />, { wrapper });

const fillCredentials = async (user: ReturnType<typeof userEvent.setup>, email: string, password: string) => {
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(screen.getByLabelText(/^password/i), password);
};

beforeEach(() => {
  navigateMock.mockClear();
  toastSuccess.mockClear();
  toastError.mockClear();
});

describe('Login form rendering', () => {
  test('renders email, password, and sign-in button', () => {
    renderLogin();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});

describe('Login form validation', () => {
  test('shows validation errors when submitting empty fields', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
});

describe('Password visibility toggle', () => {
  test('toggles password input type when the eye icon is clicked', async () => {
    const user = userEvent.setup();
    renderLogin();

    const password = screen.getByLabelText(/^password/i);
    expect(password).toHaveAttribute('type', 'password');

    // The toggle is the only unnamed icon button inside the form
    const toggle = screen.getAllByRole('button').find((b) => b !== screen.getByRole('button', { name: /sign in/i }));
    await user.click(toggle!);

    expect(password).toHaveAttribute('type', 'text');
  });
});

describe('Login submission — success', () => {
  test('on successful login: stores token, toasts welcome, navigates customer to /tailors', async () => {
    server.use(
      http.post('*/auth/login', async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string };
        expect(body).toEqual({ email: 'a@example.com', password: 'secret123' });
        return HttpResponse.json({
          token: 'tok-abc',
          user: { _id: 'u1', name: 'Ada', email: 'a@example.com', role: 'customer', avatar: '', isVerified: true },
        });
      })
    );

    const user = userEvent.setup();
    renderLogin();

    await fillCredentials(user, 'a@example.com', 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/tailors'));
    expect(toastSuccess).toHaveBeenCalledWith(expect.stringMatching(/welcome back, ada/i));
    expect(localStorage.getItem('token')).toBe('tok-abc');
  });

  test('navigates a tailor to /tailor/dashboard', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({
          token: 'tok-t',
          user: { _id: 'u2', name: 'Tailor T', email: 't@example.com', role: 'tailor', avatar: '', isVerified: true },
        })
      )
    );

    const user = userEvent.setup();
    renderLogin();

    await fillCredentials(user, 't@example.com', 'secret123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/tailor/dashboard'));
  });
});

describe('Login submission — failure', () => {
  test('on 401 with a message: shows toast error, does not navigate, re-enables button', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
      )
    );

    const user = userEvent.setup();
    renderLogin();

    await fillCredentials(user, 'bad@example.com', 'wrongpw');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Invalid credentials'));
    expect(navigateMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
  });

  test('on 500 without a message: falls back to "Login failed"', async () => {
    server.use(
      http.post('*/auth/login', () => HttpResponse.json({}, { status: 500 }))
    );

    const user = userEvent.setup();
    renderLogin();

    await fillCredentials(user, 'a@example.com', 'whatever');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Login failed'));
  });
});
