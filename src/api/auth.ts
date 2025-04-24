import { supabase } from '../lib/supabase';
import { apiClient } from './client';

export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  async signup(data: SignUpData) {
    try {
      const response = await apiClient.post('/auth/signup', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Signup failed');
    }
  },

  async login(data: LoginData) {
    try {
      const response = await apiClient.post('/auth/login', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  logout() {
    window.location.href = '/login';
  },

  isAuthenticated() {
    return !!supabase.auth.getSession();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
};

export const { login, signup, logout, isAuthenticated, getCurrentUser } = authService;

export const resetPassword = async (email: string) => {
  try {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Password reset request failed');
  }
};