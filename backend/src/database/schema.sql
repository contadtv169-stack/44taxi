-- ============================================
-- 44TAXI - Complete Database Schema (Supabase/PostgreSQL)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- USERS & AUTH
-- =====================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL CHECK (role IN ('cliente', 'taxista', 'entregador', 'dono_delivery', 'admin')),
  document_type VARCHAR(10) CHECK (document_type IN ('cpf', 'cnpj')),
  document_number VARCHAR(20),
  verified BOOLEAN DEFAULT FALSE,
  face_verified BOOLEAN DEFAULT FALSE,
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- DRIVERS (Taxistas)
-- =====================
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  cnh_number VARCHAR(20) NOT NULL,
  cnh_front_url TEXT,
  cnh_back_url TEXT,
  selfie_url TEXT,
  vehicle_type VARCHAR(20) CHECK (vehicle_type IN ('moto', 'carro')),
  vehicle_plate VARCHAR(10) NOT NULL,
  vehicle_model VARCHAR(100),
  vehicle_year INT,
  vehicle_color VARCHAR(50),
  vehicle_doc_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  current_lat DECIMAL(10,7),
  current_lng DECIMAL(10,7),
  available BOOLEAN DEFAULT FALSE,
  total_rides INT DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 5.0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- DELIVERY PEOPLE (Entregadores)
-- =====================
CREATE TABLE delivery_people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(20) CHECK (vehicle_type IN ('moto', 'bicicleta', 'carro')),
  vehicle_plate VARCHAR(10),
  selfie_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  current_lat DECIMAL(10,7),
  current_lng DECIMAL(10,7),
  available BOOLEAN DEFAULT FALSE,
  total_deliveries INT DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 5.0,
  total_earnings DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- RESTAURANTS
-- =====================
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  category VARCHAR(100),
  phone VARCHAR(20),
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(50),
  address_zip VARCHAR(20),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  delivery_fee DECIMAL(8,2) DEFAULT 0,
  delivery_time_min INT DEFAULT 30,
  rating DECIMAL(2,1) DEFAULT 5.0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected', 'suspended')),
  open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- MENU ITEMS
-- =====================
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  promotional_price DECIMAL(10,2),
  image_url TEXT,
  category VARCHAR(100),
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- RIDES (Corridas)
-- =====================
CREATE TABLE rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  passenger_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_type VARCHAR(10) CHECK (vehicle_type IN ('moto', 'carro')),
  origin_lat DECIMAL(10,7) NOT NULL,
  origin_lng DECIMAL(10,7) NOT NULL,
  origin_address TEXT NOT NULL,
  destination_lat DECIMAL(10,7) NOT NULL,
  destination_lng DECIMAL(10,7) NOT NULL,
  destination_address TEXT NOT NULL,
  distance_km DECIMAL(8,2),
  duration_min INT,
  estimated_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'arrived', 'in_progress', 'completed', 'cancelled')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('pix', 'card', 'cash')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  krypt_transaction_id VARCHAR(255),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  cancelled_by VARCHAR(20),
  cancellation_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- FOOD ORDERS
-- =====================
CREATE TABLE food_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  delivery_person_id UUID REFERENCES delivery_people(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')),
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(8,2) DEFAULT 0,
  discount DECIMAL(8,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) CHECK (payment_method IN ('pix', 'card', 'cash')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  krypt_transaction_id VARCHAR(255),
  delivery_address TEXT NOT NULL,
  delivery_lat DECIMAL(10,7),
  delivery_lng DECIMAL(10,7),
  notes TEXT,
  rating_restaurant INT CHECK (rating_restaurant BETWEEN 1 AND 5),
  rating_delivery INT CHECK (rating_delivery BETWEEN 1 AND 5),
  review TEXT,
  estimated_time INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- FAVORITE ADDRESSES
-- =====================
CREATE TABLE favorite_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- WITHDRAWALS (Saques)
-- =====================
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  pix_key VARCHAR(255) NOT NULL,
  pix_type VARCHAR(20) CHECK (pix_type IN ('cpf', 'cnpj', 'email', 'phone', 'random')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  krypt_transaction_id VARCHAR(255),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- TRANSACTIONS LOG
-- =====================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'withdrawal', 'refund', 'fee', 'commission')),
  amount DECIMAL(12,2) NOT NULL,
  fee DECIMAL(8,2) DEFAULT 0,
  net_amount DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'pending',
  description TEXT,
  reference_type VARCHAR(50),
  reference_id UUID,
  krypt_transaction_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- SUPPORT TICKETS
-- =====================
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_rides_passenger ON rides(passenger_id);
CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_food_orders_customer ON food_orders(customer_id);
CREATE INDEX idx_food_orders_restaurant ON food_orders(restaurant_id);
CREATE INDEX idx_food_orders_status ON food_orders(status);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_drivers_available ON drivers(available, status);
CREATE INDEX idx_delivery_people_available ON delivery_people(available, status);
CREATE INDEX idx_restaurants_active ON restaurants(status);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);

-- =====================
-- AUTO UPDATE TIMESTAMPS
-- =====================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_timestamp BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_drivers_timestamp BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_delivery_people_timestamp BEFORE UPDATE ON delivery_people FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_restaurants_timestamp BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_menu_items_timestamp BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_food_orders_timestamp BEFORE UPDATE ON food_orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_support_tickets_timestamp BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =====================
-- RLS POLICIES (Row Level Security)
-- =====================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_orders ENABLE ROW LEVEL SECURITY;
