-- Function to automatically create a profile when a user is created or confirmed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  username_base text;
  unique_username text;
  counter integer := 1;
BEGIN
  -- Only proceed if user is confirmed (email verified) and no profile exists
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Check if profile already exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
      -- Generate username from metadata or email
      username_base := COALESCE(
        NEW.raw_user_meta_data->>'username',
        LOWER(REPLACE(NEW.raw_user_meta_data->>'full_name', ' ', '')),
        SPLIT_PART(NEW.email, '@', 1)
      );
      
      -- Ensure username is unique
      unique_username := username_base;
      WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = unique_username) LOOP
        unique_username := username_base || counter;
        counter := counter + 1;
      END LOOP;
      
      -- Insert profile
      INSERT INTO public.profiles (
        id,
        full_name,
        username,
        avatar_url,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
        unique_username,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
        NOW(),
        NOW()
      );
      
      -- Update user metadata with the final username
      UPDATE auth.users 
      SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
          'username', unique_username,
          'full_name', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1))
        )
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- Create trigger for when users are confirmed (email verified)
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Also create a trigger for immediate user creation (for cases without email verification)
CREATE OR REPLACE FUNCTION public.handle_immediate_user()
RETURNS trigger AS $$
DECLARE
  username_base text;
  unique_username text;
  counter integer := 1;
BEGIN
  -- Only proceed if user is immediately confirmed (no email verification required)
  IF NEW.email_confirmed_at IS NOT NULL THEN
    -- Generate username from metadata or email
    username_base := COALESCE(
      NEW.raw_user_meta_data->>'username',
      LOWER(REPLACE(NEW.raw_user_meta_data->>'full_name', ' ', '')),
      SPLIT_PART(NEW.email, '@', 1)
    );
    
    -- Ensure username is unique
    unique_username := username_base;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = unique_username) LOOP
      unique_username := username_base || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Insert profile
    INSERT INTO public.profiles (
      id,
      full_name,
      username,
      avatar_url,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
      unique_username,
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
      NOW(),
      NOW()
    );
    
    -- Update user metadata with the final username
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'username', unique_username,
        'full_name', COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1))
      )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for immediate user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_immediate_user();