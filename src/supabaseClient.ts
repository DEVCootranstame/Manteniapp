import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qhnyjdpnetlqqiwtofbs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobnlqZHBuZXRscXFpd3RvZmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMzQ3MzIsImV4cCI6MjA5MjkxMDczMn0.by7F0YsH6Hbxe8pbAL9XqTqg8-5tn9Y-PvbM3pqeygk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
