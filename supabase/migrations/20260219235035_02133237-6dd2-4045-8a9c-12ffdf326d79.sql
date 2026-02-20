
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.email = 'belaflorstudio.mkt@gmail.com' THEN 'Admin'
      WHEN NEW.email = 'gabrielnalli70@gmail.com' THEN 'Admin'
      WHEN NEW.email = 'sousascarolina@gmail.com' THEN 'Carolina'
      WHEN NEW.email = 'carolfsouza2015@gmail.com' THEN 'Carol Souza'
      WHEN NEW.email = 'mahvieira292@gmail.com' THEN 'Maria'
      WHEN NEW.email = 'ana.carolinaamaro824@gmail.com' THEN 'Ana Caroline'
      ELSE COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    END,
    CASE 
      WHEN NEW.email IN ('belaflorstudio.mkt@gmail.com', 'gabrielnalli70@gmail.com') THEN 'ADMIN'::user_role
      WHEN NEW.email IN ('mahvieira292@gmail.com', 'ana.carolinaamaro824@gmail.com') THEN 'SDR'::user_role
      ELSE 'VENDEDORA'::user_role
    END
  );
  RETURN NEW;
END;
$function$;

-- Update existing Carol B profile name to Carolina
UPDATE public.profiles SET full_name = 'Carolina' WHERE full_name = 'Carol B';
