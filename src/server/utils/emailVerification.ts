import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    // Use Supabase's built-in email service
    const { error } = await supabase.auth.signUp({
      email,
      password: token, // Temporary password that will be changed after verification
      options: {
        emailRedirectTo: `${process.env.CLIENT_URL}/verify-email`,
      },
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

export const verifyEmail = async (token: string) => {
  try {
    // Verify the email using Supabase's built-in verification
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error verifying email:', error);
    return { success: false, error: error.message };
  }
};