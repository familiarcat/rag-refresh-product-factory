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

      personas: {
        Row: {
          id: string
          name: string
          type: string
          description: string | null
          technical_level: number
          goals: string[] | null
          pain_points: string[] | null
          preferred_crew_member: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          description?: string | null
          technical_level: number
          goals?: string[] | null
          pain_points?: string[] | null
          preferred_crew_member?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          description?: string | null
          technical_level?: number
          goals?: string[] | null
          pain_points?: string[] | null
          preferred_crew_member?: string | null
          created_at?: string
        }
        Relationships: []
      },
      sprints: {
        Row: {
          id: string
          project_id: string
          name: string
          sprint_number: number
          start_date: string
          end_date: string
          goals: string[]
          status: string
          velocity_target: number
          velocity_actual: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          sprint_number: number
          start_date: string
          end_date: string
          goals?: string[]
          status: string
          velocity_target?: number
          velocity_actual?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          sprint_number?: number
          start_date?: string
          end_date?: string
          goals?: string[]
          status?: string
          velocity_target?: number
          velocity_actual?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      },
      stories: {
        Row: {
          id: string
          sprint_id: string | null
          project_id: string
          title: string
          description: string | null
          story_type: string
          status: string
          persona_id: string | null
          assigned_crew_member: string | null
          story_points: number | null
          priority: string | number
          start_date: string | null
          estimated_completion: string | null
          estimated_hours: number | null
          related_goals: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sprint_id?: string | null
          project_id: string
          title: string
          description?: string | null
          story_type: string
          status: string
          persona_id?: string | null
          assigned_crew_member?: string | null
          story_points?: number | null
          priority: string | number
          start_date?: string | null
          estimated_completion?: string | null
          estimated_hours?: number | null
          related_goals?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sprint_id?: string | null
          project_id?: string
          title?: string
          description?: string | null
          story_type?: string
          status?: string
          persona_id?: string | null
          assigned_crew_member?: string | null
          story_points?: number | null
          priority?: string | number
          start_date?: string | null
          estimated_completion?: string | null
          estimated_hours?: number | null
          related_goals?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      },
      tasks: {
        Row: {
          id: string
          story_id: string
          title: string
          status: string
          assigned_crew_member: string | null
          estimated_hours: number | null
          actual_hours: number | null
          created_at: string
        }
        Insert: {
          id?: string
          story_id: string
          title: string
          status: string
          assigned_crew_member?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          title?: string
          status?: string
          assigned_crew_member?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          created_at?: string
        }
        Relationships: []
      },
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
