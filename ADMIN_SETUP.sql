-- ============================================
-- 44TAXI - CRIAR ADMIN (Execute no Supabase SQL Editor)
-- https://supabase.com/dashboard/project/wnjpzsxrwwrskakrhfgg/sql/new
-- ============================================

-- Verificar se o usuario ja existe no auth
DO $$
DECLARE
  uid UUID;
BEGIN
  -- Pega o ID do usuario admin@44taxi.com no auth.users
  SELECT id INTO uid FROM auth.users WHERE email = 'admin@44taxi.com';

  IF uid IS NULL THEN
    RAISE NOTICE 'Usuario admin@44taxi.com nao encontrado no auth. Criando...';
    -- Insere na tabela de profiles mesmo assim para quando o usuario fizer login
    INSERT INTO user_profiles (firebase_uid, email, name, role, verified)
    VALUES ('pending', 'admin@44taxi.com', 'Admin', 'admin', true)
    ON CONFLICT (firebase_uid) DO UPDATE SET role = 'admin', verified = true;
  ELSE
    -- Atualiza o perfil existente
    INSERT INTO user_profiles (firebase_uid, email, name, role, verified)
    VALUES (uid, 'admin@44taxi.com', 'Admin', 'admin', true)
    ON CONFLICT (firebase_uid) DO UPDATE SET role = 'admin', verified = true,
      email = 'admin@44taxi.com', name = 'Admin';
  END IF;
END $$;

-- Credenciais:
-- Email: admin@44taxi.com
-- Senha: 1101112
