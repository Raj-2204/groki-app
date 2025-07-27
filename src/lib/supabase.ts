import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Database {
  public: {
    Tables: {
      user_inventory: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          quantity: number;
          unit: string;
          category: string | null;
          expiry_date: string | null;
          is_low_stock: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          quantity: number;
          unit: string;
          category?: string | null;
          expiry_date?: string | null;
          is_low_stock?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          quantity?: number;
          unit?: string;
          category?: string | null;
          expiry_date?: string | null;
          is_low_stock?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_messages: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          is_user: boolean;
          is_voice: boolean;
          timestamp: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          is_user: boolean;
          is_voice?: boolean;
          timestamp?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          is_user?: boolean;
          is_voice?: boolean;
          timestamp?: string;
        };
      };
    };
  };
}