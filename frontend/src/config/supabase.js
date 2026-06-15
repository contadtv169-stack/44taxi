import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wnjpzsxrwwrskakrhfgg.supabase.co';
const supabaseAnonKey = 'sb_publishable_mWFzAPYyXdhy0Psxj-x7lA_mYzu0clG';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
