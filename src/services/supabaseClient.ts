import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://supabasekong-hpuzpikkxuolobd2zwkpcepk.62.171.143.55.sslip.io';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4OTcxMDQyMCwiZXhwIjo0OTQ1Mzg0MDIwLCJyb2xlIjoiYW5vbiJ9.s2Tm88Uoi2pDHoZgK-1qMqji07mgEFd9-qe86YvrRfs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseLive = Boolean(supabaseUrl && supabaseAnonKey);
