import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import postsRouter from './routes/posts';
import linkPreviewRouter from './routes/linkPreview';

// Load environment variables before any other code
dotenv.config();

// Validate required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount API routes
app.use('/api/link-preview', linkPreviewRouter);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Authentication routes
app.post('/auth/signup', async (req: express.Request, res: express.Response) => {
  const { email, password, username } = req.body;

  // Validate username
  const usernameRegex = /^[a-z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Invalid username. Only lowercase letters, numbers, and underscores are allowed.' });
  }

  // Check if username already exists
  const { data: existingUser, error: usernameError } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();

  if (usernameError && usernameError.code !== 'PGRST116') {
    return res.status(500).json({ error: 'Error checking username availability' });
  }

  if (existingUser) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        },
        emailRedirectTo: `${process.env.CLIENT_URL}/verify-email`,
      }
    });

    if (error) throw error;

    if (data?.user?.identities?.length === 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    res.json({
      message: 'Registration successful. Please check your email for verification.',
      data
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/login', async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  try {
    // First check if the user exists and is verified
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData.users.find(u => u.email === email);

    if (user && !user.email_confirmed_at) {
      return res.status(400).json({
        error: 'Please verify your email before logging in. Check your inbox for the verification link.'
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/auth/forgot-password', async (req: express.Request, res: express.Response) => {
  const { email } = req.body;

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    res.json({ message: 'Password reset email sent' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Mount routes
app.use('/api/posts', postsRouter);
app.use('/api/link-preview', linkPreviewRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});