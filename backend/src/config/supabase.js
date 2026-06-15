const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://wnjpzsxrwwrskakrhfgg.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_mWFzAPYyXdhy0Psxj-x7lA_mYzu0clG';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
module.exports.admin = supabaseAdmin;
