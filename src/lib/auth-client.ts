import Cookies from 'js-cookie';
import { User } from '@/types';

export function getToken(): string | undefined {
  return Cookies.get('token');
}

export function setToken(token: string) {
  Cookies.set('token', token, { expires: 7, sameSite: 'strict' });
}

export function removeToken() {
  Cookies.remove('token');
}

export function setUser(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearAuth() {
  removeToken();
  if (typeof window !== 'undefined') localStorage.removeItem('user');
}
