-- ============================================
-- 44TAXI - SETUP COMPLETO (Execute no Supabase SQL Editor)
-- https://supabase.com/dashboard/project/wnjpzsxrwwrskakrhfgg/sql/new
-- ============================================

-- 1. UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL DEFAULT '',
  role VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK (role IN ('cliente','taxista','entregador','dono_delivery','dono_restaurante','admin')),
  verified BOOLEAN DEFAULT FALSE,
  face_verified BOOLEAN DEFAULT FALSE,
  blocked BOOLEAN DEFAULT FALSE,
  total_rides INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  firebase_uid VARCHAR(255), name VARCHAR(255), email VARCHAR(255), phone VARCHAR(20),
  document VARCHAR(20), documents JSONB DEFAULT '{}', selfie TEXT,
  cnh_number VARCHAR(20), vehicle_type VARCHAR(20) CHECK (vehicle_type IN ('moto','carro')),
  vehicle_plate VARCHAR(10), vehicle_model VARCHAR(100), vehicle_year INT, vehicle_color VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  current_lat DECIMAL(10,7), current_lng DECIMAL(10,7), available BOOLEAN DEFAULT FALSE,
  total_rides INT DEFAULT 0, rating DECIMAL(2,1) DEFAULT 5.0, total_earnings DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  firebase_uid VARCHAR(255), name VARCHAR(255), email VARCHAR(255), phone VARCHAR(20),
  document VARCHAR(20), documents JSONB DEFAULT '{}', selfie TEXT,
  vehicle_type VARCHAR(20) CHECK (vehicle_type IN ('moto','bicicleta','carro')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  current_lat DECIMAL(10,7), current_lng DECIMAL(10,7), available BOOLEAN DEFAULT FALSE,
  total_deliveries INT DEFAULT 0, rating DECIMAL(2,1) DEFAULT 5.0, total_earnings DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  owner_firebase_uid VARCHAR(255), owner_name VARCHAR(255), owner_email VARCHAR(255), owner_phone VARCHAR(20),
  name VARCHAR(255) NOT NULL, description TEXT, category VARCHAR(100),
  phone VARCHAR(20), address_street VARCHAR(255), address_city VARCHAR(100), address_state VARCHAR(50),
  lat DECIMAL(10,7), lng DECIMAL(10,7), delivery_fee DECIMAL(8,2) DEFAULT 0, delivery_time_min INT DEFAULT 30,
  rating DECIMAL(2,1) DEFAULT 5.0, open BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','active','inactive','rejected','suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, description TEXT,
  price DECIMAL(10,2) NOT NULL, promotional_price DECIMAL(10,2), image_url TEXT,
  category VARCHAR(100), available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_type VARCHAR(10) CHECK (vehicle_type IN ('moto','carro')),
  origin_lat DECIMAL(10,7) NOT NULL, origin_lng DECIMAL(10,7) NOT NULL,
  origin_address TEXT NOT NULL,
  destination_lat DECIMAL(10,7) NOT NULL, destination_lng DECIMAL(10,7) NOT NULL,
  destination_address TEXT NOT NULL,
  distance_km DECIMAL(8,2), duration_min INT,
  estimated_price DECIMAL(10,2), final_price DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','accepted','arrived','in_progress','completed','cancelled')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('pix','card','cash')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','refunded')),
  rating INT CHECK (rating BETWEEN 1 AND 5), review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS food_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  delivery_person_id UUID REFERENCES delivery_people(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled')),
  items JSONB NOT NULL, subtotal DECIMAL(10,2) NOT NULL, delivery_fee DECIMAL(8,2) DEFAULT 0,
  discount DECIMAL(8,2) DEFAULT 0, total DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20), payment_status VARCHAR(20) DEFAULT 'pending',
  delivery_address TEXT NOT NULL, delivery_lat DECIMAL(10,7), delivery_lng DECIMAL(10,7),
  notes TEXT, rating_restaurant INT, rating_delivery INT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL, address TEXT NOT NULL,
  lat DECIMAL(10,7), lng DECIMAL(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL, pix_key VARCHAR(255) NOT NULL,
  pix_type VARCHAR(20) CHECK (pix_type IN ('cpf','cnpj','email','phone','random')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('payment','withdrawal','refund','fee','commission')),
  amount DECIMAL(12,2) NOT NULL, fee DECIMAL(8,2) DEFAULT 0, net_amount DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'pending', description TEXT,
  reference_type VARCHAR(50), reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL, message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_rides_passenger ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_food_orders_customer ON food_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_food_orders_restaurant ON food_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_available ON drivers(available, status);
CREATE INDEX IF NOT EXISTS idx_delivery_people_available ON delivery_people(available, status);
CREATE INDEX IF NOT EXISTS idx_restaurants_active ON restaurants(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);

-- 4. AUTO UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS  BEGIN NEW.updated_at = NOW(); RETURN NEW; END;  LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_user_profiles_timestamp BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER IF NOT EXISTS update_drivers_timestamp BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER IF NOT EXISTS update_delivery_people_timestamp BEFORE UPDATE ON delivery_people FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER IF NOT EXISTS update_restaurants_timestamp BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER IF NOT EXISTS update_menu_items_timestamp BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER IF NOT EXISTS update_food_orders_timestamp BEFORE UPDATE ON food_orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER IF NOT EXISTS update_support_tickets_timestamp BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 5. RLS POLICIES
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios podem ler proprio perfil" ON user_profiles;
CREATE POLICY "Usuarios podem ler proprio perfil" ON user_profiles
  FOR SELECT USING (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Usuarios podem criar perfil" ON user_profiles;
CREATE POLICY "Usuarios podem criar perfil" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = firebase_uid);

DROP POLICY IF EXISTS "Usuarios podem atualizar perfil" ON user_profiles;
CREATE POLICY "Usuarios podem atualizar perfil" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = firebase_uid);

-- 6. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Usuarios podem ler documentos" ON storage.objects;
CREATE POLICY "Usuarios podem ler documentos" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuarios podem enviar documentos" ON storage.objects;
CREATE POLICY "Usuarios podem enviar documentos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- 7. CRIAR ADMIN
DO  DECLARE uid UUID; BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'admin@44taxi.com';
  IF uid IS NULL THEN
    INSERT INTO user_profiles (firebase_uid, email, name, role, verified)
    VALUES ('00000000-0000-0000-0000-000000000000', 'admin@44taxi.com', 'Admin', 'admin', true)
    ON CONFLICT (firebase_uid) DO UPDATE SET role = 'admin', verified = true;
  ELSE
    INSERT INTO user_profiles (firebase_uid, email, name, role, verified)
    VALUES (uid::text, 'admin@44taxi.com', 'Admin', 'admin', true)
    ON CONFLICT (firebase_uid) DO UPDATE SET role = 'admin', verified = true,
      email = 'admin@44taxi.com', name = 'Admin';
  END IF;
END ;

-- Credenciais:
-- App: https://contadtv169-stack.github.io/44taxi/
-- Admin: /44taxi/#/admin/login - admin@44taxi.com / 1101112
