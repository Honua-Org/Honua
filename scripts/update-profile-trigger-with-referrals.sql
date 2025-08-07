-- Updated function to automatically create a profile and handle referrals when a user is created or confirmed
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  username_base text;
  unique_username text;
  counter integer := 1;
  referral_code text;
  inviter_id uuid;
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
      
      -- Process referral if present in user metadata
      referral_code := NEW.raw_user_meta_data->>'referral_code';
      IF referral_code IS NOT NULL AND referral_code != '' THEN
        -- Find the inviter by username first
        SELECT id INTO inviter_id FROM public.profiles WHERE username = referral_code;
        
        -- If not found by username, try by user ID (first 8 characters)
        IF inviter_id IS NULL THEN
          SELECT id INTO inviter_id FROM public.profiles WHERE id::text ILIKE referral_code || '%' LIMIT 1;
        END IF;
        
        -- If inviter found, create referral record and award points
        IF inviter_id IS NOT NULL THEN
          -- Create referral record
          INSERT INTO public.referrals (
            inviter_id,
            invited_user_id,
            referral_code,
            status,
            points_awarded,
            created_at,
            completed_at
          ) VALUES (
            inviter_id,
            NEW.id,
            referral_code,
            'completed',
            10,
            NOW(),
            NOW()
          ) ON CONFLICT (inviter_id, invited_user_id) DO NOTHING;
          
          -- Award points to inviter using the reputation system
          BEGIN
            PERFORM add_reputation_points(
              inviter_id,
              10,
              'peer_recognition',
              NEW.id,
              'referral',
              'Invited new user: ' || referral_code
            );
          EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail the entire operation
            RAISE WARNING 'Error awarding referral points: %', SQLERRM;
          END;
        END IF;
      END IF;
      
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

-- Updated function for immediate user creation (for cases without email verification)
CREATE OR REPLACE FUNCTION public.handle_immediate_user()
RETURNS trigger AS $$
DECLARE
  username_base text;
  unique_username text;
  counter integer := 1;
  referral_code text;
  inviter_id uuid;
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
    
    -- Process referral if present in user metadata
    referral_code := NEW.raw_user_meta_data->>'referral_code';
    IF referral_code IS NOT NULL AND referral_code != '' THEN
      -- Find the inviter by username first
      SELECT id INTO inviter_id FROM public.profiles WHERE username = referral_code;
      
      -- If not found by username, try by user ID (first 8 characters)
      IF inviter_id IS NULL THEN
        SELECT id INTO inviter_id FROM public.profiles WHERE id::text ILIKE referral_code || '%' LIMIT 1;
      END IF;
      
      -- If inviter found, create referral record and award points
      IF inviter_id IS NOT NULL THEN
        -- Create referral record
        INSERT INTO public.referrals (
          inviter_id,
          invited_user_id,
          referral_code,
          status,
          points_awarded,
          created_at,
          completed_at
        ) VALUES (
          inviter_id,
          NEW.id,
          referral_code,
          'completed',
          10,
          NOW(),
          NOW()
        ) ON CONFLICT (inviter_id, invited_user_id) DO NOTHING;
        
        -- Award points to inviter using the reputation system
        BEGIN
          PERFORM add_reputation_points(
            inviter_id,
            10,
            'peer_recognition',
            NEW.id,
            'referral',
            'Invited new user: ' || referral_code
          );
        EXCEPTION WHEN OTHERS THEN
          -- Log error but don't fail the entire operation
          RAISE WARNING 'Error awarding referral points: %', SQLERRM;
        END;
      END IF;
    END IF;
    
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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for when users are confirmed (email verified)
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for immediate user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_immediate_user();