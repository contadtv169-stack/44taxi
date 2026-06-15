-- ============================================
-- 44TAXI - SETUP COMPLETO (Execute no Supabase SQL Editor)
-- https://supabase.com/dashboard/project/wnjpzsxrwwrskakrhfgg/sql/new
-- ============================================

-- 1. RLS POLICIES para o app funcionar SEM backend
-- firebase_uid e VARCHAR, auth.uid() e UUID -> cast ::text
CREATE POLICY "Usuarios podem ler proprio perfil" ON user_profiles
  FOR SELECT USING (auth.uid()::text = firebase_uid);

CREATE POLICY "Usuarios podem criar perfil" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

CREATE POLICY "Usuarios podem atualizar perfil" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = firebase_uid);

-- 2. CRIAR/FIX ADMIN
DO $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'admin@44taxi.com';

  IF uid IS NULL THEN
    RAISE NOTICE 'Usuario admin@44taxi.com nao encontrado no auth.';
    INSERT INTO user_profiles (firebase_uid, email, name, role, verified)
    VALUES ('00000000-0000-0000-0000-000000000000', 'admin@44taxi.com', 'Admin', 'admin', true)
    ON CONFLICT (firebase_uid) DO UPDATE SET role = 'admin', verified = true;
  ELSE
    INSERT INTO user_profiles (firebase_uid, email, name, role, verified)
    VALUES (uid::text, 'admin@44taxi.com', 'Admin', 'admin', true)
    ON CONFLICT (firebase_uid) DO UPDATE SET role = 'admin', verified = true,
      email = 'admin@44taxi.com', name = 'Admin';
  END IF;
END $$;

-- Credenciais Admin:
-- URL: https://contadtv169-stack.github.io/44taxi/#/admin/login
-- Email: admin@44taxi.com
-- Senha: 1101112
