import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lqkhcnkqanufdyaierhk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxa2hjbmtxYW51ZmR5YWllcmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMzcyOTcsImV4cCI6MjA5MTcxMzI5N30.eDeAJhinq334Traw2t1yq7ahAXQgQj85Ang_3Jx8GmI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
