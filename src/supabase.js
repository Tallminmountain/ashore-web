import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aafcriaxykjifdjvxjou.supabase.co'

// 优先用 sb_publishable_ key，兼容新版 Supabase
const supabaseAnonKey = 'sb_publishable_OFVW0uyWnS84ToAh8gzcdQ_4xSKrexx'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
