
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
      WHEN NEW.email = 'sousascarolina@gmail.com' THEN 'Carol B'
      WHEN NEW.email = 'carolfsouza2015@gmail.com' THEN 'Carol Souza'
      WHEN NEW.email = 'mahvieira292@gmail.com' THEN 'Maria'
      ELSE COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    END,
    CASE 
      WHEN NEW.email = 'belaflorstudio.mkt@gmail.com' THEN 'ADMIN'::user_role
      WHEN NEW.email = 'mahvieira292@gmail.com' THEN 'SDR'::user_role
      ELSE 'VENDEDORA'::user_role
    END
  );
  RETURN NEW;
END;
$function$;
