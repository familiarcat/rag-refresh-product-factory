export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
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
      api_keys: {
        Row: {
          id: string;
          created_at: string | null;
          revoked_at: string | null;
          key_hash: string;
          // include any other columns you use:
          name: string | null;
          user_id: string | null;
          scopes: string[] | null;
          is_active: boolean | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          revoked_at?: string | null;
          key_hash: string;
          name?: string | null;
          user_id?: string | null;
          scopes?: string[] | null;
          is_active?: boolean | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          revoked_at?: string | null;
          key_hash?: string;
          name?: string | null;
          user_id?: string | null;
          scopes?: string[] | null;
          is_active?: boolean | null;
        };
        Relationships: [];
      };
      sprints: {
        Row: {
          id: string;
          created_at: string | null;
          updated_at: string | null;
          project_id: string;
          name: string;
          sprint_number: number;
          start_date: string;
          end_date: string;
          goals: string[];
          status: string;
          velocity_target: number | null;
          velocity_actual: number | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          project_id: string;
          name: string;
          sprint_number: number;
          start_date: string;
          end_date: string;
          goals: string[];
          status?: string;
          velocity_target?: number | null;
          velocity_actual?: number | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          project_id?: string;
          name?: string;
          sprint_number?: number;
          start_date?: string;
          end_date?: string;
          goals?: string[];
          status?: string;
          velocity_target?: number | null;
          velocity_actual?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
