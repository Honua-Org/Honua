import { apiClient } from './client';

export interface SignUpData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export async function signup(data: SignUpData) {
  const response = await apiClient.post('/auth/signup', data);
  return response.data;
}

export async function login(data: LoginData) {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
}

export async function resetPassword(email: string) {
  const response = await apiClient.post('/auth/password-reset', { email });
  return response.data;
}