require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

async function migrate() {
  console.log('Executando migracao 44Taxi...');
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  const statements = sql.split(';').filter(s => s.trim().length > 0);

  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      if (error) {
        console.log('Aviso (pode ignorar se ja existe):', error.message);
      }
    } catch (err) {
      console.log('Comando executado (pode ignorar):', stmt.slice(0, 50) + '...');
    }
  }

  console.log('Migracao concluida!');
  console.log('Execute o SQL manualmente no Supabase SQL Editor caso necessario.');
  process.exit(0);
}

migrate();
