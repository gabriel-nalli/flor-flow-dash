CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.email = 'belaflorstudio.mkt@gmail.com' THEN 'Admin'
      WHEN NEW.email = 'sousascarolina@gmail.com' THEN 'Carol B'
      WHEN NEW.email = 'carolfsouza2015@gmail.com' THEN 'Carol Souza'
      ELSE COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    END,
    CASE 
      WHEN NEW.email = 'belaflorstudio.mkt@gmail.com' THEN 'ADMIN'::user_role
      ELSE 'VENDEDORA'::user_role
    END
  );
  RETURN NEW;
END;
$$;