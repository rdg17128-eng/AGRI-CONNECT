import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gxogbczrbmjlzcadvafu.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_gwmcOaotUnRFtC4-fosV0w_9l1gnjs_';

export const supabase = createClient(supabaseUrl, supabaseKey);
