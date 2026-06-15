require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

async function seed() {
  if (!supabaseServiceKey) {
    console.log('SUPABASE_SERVICE_KEY nao configurada. Execute manualmente no SQL Editor:');
    console.log('');
    console.log('INSERT INTO user_profiles (firebase_uid, email, name, role, verified)');
    console.log("SELECT id, 'admin@44taxi.com', 'Admin', 'admin', true");
    console.log("FROM auth.users WHERE email = 'admin@44taxi.com'");
    console.log('ON CONFLICT (firebase_uid) DO UPDATE SET role = \'admin\';');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: users } = await supabase.auth.admin.listUsers();
  const adminUser = users?.users?.find(u => u.email === 'admin@44taxi.com');

  if (!adminUser) {
    console.log('Admin nao encontrado. Execute primeiro: node -e \'require("dotenv").config(); const {createClient}=require("@supabase/supabase-js"); createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY).auth.signUp({email:"admin@44taxi.com",password:"1101112"})\'');
    return;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      firebase_uid: adminUser.id,
      email: 'admin@44taxi.com',
      name: 'Admin',
      role: 'admin',
      verified: true,
    }, { onConflict: 'firebase_uid' })
    .select()
    .single();

  if (error) {
    console.error('Erro:', error.message);
  } else {
    console.log('Admin criado com sucesso!');
    console.log('Email: admin@44taxi.com');
    console.log('Senha: 1101112');
  }
}

seed().then(() => process.exit(0));
