import { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

vi.mock('../lib/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import api from '../lib/api';

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByText('MeOS')).toBeInTheDocument();
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
  });

  it('shows a link to register', () => {
    renderLogin();
    expect(screen.getByText('立即注册')).toBeInTheDocument();
  });

  it('displays an error message on login failure', async () => {
    const axiosError = new Error('Request failed');
    (axiosError as unknown as { response: { data: { error: string } } }).response = {
      data: { error: '邮箱或密码错误' },
    };
    vi.mocked(api.post).mockRejectedValueOnce(axiosError);

    renderLogin();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'bad@example.com' } });
      fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByRole('button', { name: '登录' }));
    });

    await waitFor(() => {
      expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument();
    });
  });

  it('navigates to home on successful login', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'ok@example.com', name: 'OK' }, token: 'jwt-token' },
    });

    renderLogin();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'ok@example.com' } });
      fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'secret' } });
      fireEvent.click(screen.getByRole('button', { name: '登录' }));
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'ok@example.com',
        password: 'secret',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('disables the button and shows loading text while submitting', async () => {
    let resolvePost!: (v: { data: { user: object; token: string } }) => void;
    vi.mocked(api.post).mockReturnValueOnce(new Promise((res) => { resolvePost = res; }));

    renderLogin();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'x@example.com' } });
      fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'secret' } });
      fireEvent.click(screen.getByRole('button', { name: '登录' }));
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '登录中...' })).toBeDisabled();
    });

    resolvePost({ data: { user: {}, token: 't' } });
  });
});
