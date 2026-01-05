-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create bookmarks table for syncing across devices
CREATE TABLE public.bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surah_number INTEGER NOT NULL CHECK (surah_number >= 1 AND surah_number <= 114),
  ayah_number INTEGER NOT NULL CHECK (ayah_number >= 1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, surah_number, ayah_number)
);

-- Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Bookmark policies
CREATE POLICY "Users can view their own bookmarks" 
ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" 
ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Create reading progress table
CREATE TABLE public.reading_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  last_surah INTEGER NOT NULL DEFAULT 1 CHECK (last_surah >= 1 AND last_surah <= 114),
  last_ayah INTEGER NOT NULL DEFAULT 1 CHECK (last_ayah >= 1),
  per_surah_progress JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

-- Progress policies
CREATE POLICY "Users can view their own progress" 
ON public.reading_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.reading_progress FOR UPDATE USING (auth.uid() = user_id);

-- Create user settings table
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  show_translations BOOLEAN NOT NULL DEFAULT true,
  font_size_px INTEGER NOT NULL DEFAULT 24,
  theme TEXT NOT NULL DEFAULT 'light',
  preferred_reciter TEXT NOT NULL DEFAULT 'ar.alafasy',
  playback_speed NUMERIC NOT NULL DEFAULT 1.0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Settings policies
CREATE POLICY "Users can view their own settings" 
ON public.user_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reading_progress_updated_at
BEFORE UPDATE ON public.reading_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  
  INSERT INTO public.reading_progress (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on user creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();