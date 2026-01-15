/**
 * Minimal Supabase generated types placeholder.
 *
 * Replace with real generated types when your CLI is configured.
 * This file exists to prevent Supabase generics collapsing to `never`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {


/**
 * --- AlexAI patch: api_keys table typing ---
 * Add/adjust fields to match your Supabase schema.
 */
api_keys: {
  Row: {
    id: string
    user_id: string
    api_key_hash: string
    label: string | null
    created_at: string
    revoked_at: string | null
  }
  Insert: {
    id?: string
    user_id: string
    api_key_hash: string
    label?: string | null
    created_at?: string
    revoked_at?: string | null
  }
  Update: {
    id?: string
    user_id?: string
    api_key_hash?: string
    label?: string | null
    created_at?: string
    revoked_at?: string | null
  }
  Relationships: []
}

      sprint_planning_memories: {
        Row: {
          id: string
          created_at: string | null
          sprint_id: string
          project_id: string
          project_name: string
          goals: string[]
          crew_assignments: Record<string, string[]>
          velocity_target: number
          prior_analysis: string | null
          risk_organization: string | null
          quark_optimization: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          sprint_id: string
          project_id: string
          project_name: string
          goals: string[]
          crew_assignments: Record<string, string[]>
          velocity_target: number
          prior_analysis?: string | null
          risk_organization?: string | null
          quark_optimization?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          sprint_id?: string
          project_id?: string
          project_name?: string
          goals?: string[]
          crew_assignments?: Record<string, string[]>
          velocity_target?: number
          prior_analysis?: string | null
          risk_organization?: string | null
          quark_optimization?: string | null
        }
        Relationships: []
      },
      [table: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: any[];
      };
    };
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
    CompositeTypes: Record<string, any>;
  };
}
