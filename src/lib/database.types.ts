export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    CompositeTypes: Record<string, never>;
    Enums: {
      app_role:
        | "admin"
        | "editor"
        | "coordinator"
        | "collaborator"
        | "viewer";
      match_status: "Pendiente" | "Confirmado" | "Realizado";
    };
    Functions: Record<string, never>;
    Tables: {
      profiles: {
        Relationships: [];
        Row: {
          id: string;
          full_name: string | null;
          role: Database["public"]["Enums"]["app_role"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
      };
      people: {
        Relationships: [];
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          full_name?: string;
          phone?: string | null;
          email?: string | null;
          active?: boolean;
          notes?: string | null;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      roles: {
        Relationships: [];
        Row: {
          id: string;
          name: string;
          category: string;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          name?: string;
          category?: string;
          sort_order?: number;
          active?: boolean;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      matches: {
        Relationships: [];
        Row: {
          id: string;
          competition: string | null;
          external_match_id: string | null;
          production_code: string | null;
          production_mode: string | null;
          status: Database["public"]["Enums"]["match_status"];
          home_team: string;
          away_team: string;
          venue: string | null;
          commentary_plan: string | null;
          transport: string | null;
          kickoff_at: string;
          duration_minutes: number;
          timezone: string;
          owner_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          competition?: string | null;
          external_match_id?: string | null;
          production_code?: string | null;
          production_mode?: string | null;
          status?: Database["public"]["Enums"]["match_status"];
          home_team: string;
          away_team: string;
          venue?: string | null;
          commentary_plan?: string | null;
          transport?: string | null;
          kickoff_at: string;
          duration_minutes?: number;
          timezone?: string;
          owner_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          competition?: string | null;
          external_match_id?: string | null;
          production_code?: string | null;
          production_mode?: string | null;
          status?: Database["public"]["Enums"]["match_status"];
          home_team?: string;
          away_team?: string;
          venue?: string | null;
          commentary_plan?: string | null;
          transport?: string | null;
          kickoff_at?: string;
          duration_minutes?: number;
          timezone?: string;
          owner_id?: string | null;
          notes?: string | null;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      assignments: {
        Relationships: [];
        Row: {
          id: string;
          match_id: string;
          role_id: string;
          person_id: string | null;
          confirmed: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          match_id: string;
          role_id: string;
          person_id?: string | null;
          confirmed?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          person_id?: string | null;
          confirmed?: boolean;
          notes?: string | null;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      audit_log: {
        Relationships: [];
        Row: {
          id: number;
          table_name: string;
          record_id: string;
          match_id: string | null;
          action: string;
          changed_by: string | null;
          before: Json | null;
          after: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          table_name: string;
          record_id: string;
          match_id?: string | null;
          action: string;
          changed_by?: string | null;
          before?: Json | null;
          after?: Json | null;
          created_at?: string;
        };
        Update: {
          table_name?: string;
          record_id?: string;
          match_id?: string | null;
          action?: string;
          changed_by?: string | null;
          before?: Json | null;
          after?: Json | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
  };
}

export type AppRole = Database["public"]["Enums"]["app_role"];
export type MatchStatus = Database["public"]["Enums"]["match_status"];
export type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
export type PersonRow = Database["public"]["Tables"]["people"]["Row"];
export type RoleRow = Database["public"]["Tables"]["roles"]["Row"];
export type AssignmentRow = Database["public"]["Tables"]["assignments"]["Row"];
export type AuditRow = Database["public"]["Tables"]["audit_log"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
