import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// 暂时禁用Supabase，稍后添加
let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn("Failed to initialize Supabase:", error);
  }
} else {
  console.info("Supabase未配置，使用本地存储。稍后可以配置数据库。");
}

export { supabase };

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  template_json: any;
  created_at: string;
  updated_at: string;
}

