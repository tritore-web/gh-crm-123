export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string
          description: string
          id: string
          occurred_at: string
          opportunity_id: string | null
          type: string
          voids_activity_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string
          customer_id: string
          description: string
          id?: string
          occurred_at?: string
          opportunity_id?: string | null
          type: string
          voids_activity_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string
          description?: string
          id?: string
          occurred_at?: string
          opportunity_id?: string | null
          type?: string
          voids_activity_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_team_summary"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_next_actions"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "v_next_actions"
            referencedColumns: ["opportunity_id"]
          },
          {
            foreignKeyName: "activities_voids_activity_id_fkey"
            columns: ["voids_activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: never
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_team_summary"
            referencedColumns: ["owner_id"]
          },
        ]
      }
      customers: {
        Row: {
          accepts_communications: boolean
          archived_at: string | null
          created_at: string
          created_by: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          owner_id: string
          phone: string
          source: string
          updated_at: string
        }
        Insert: {
          accepts_communications?: boolean
          archived_at?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          owner_id: string
          phone: string
          source: string
          updated_at?: string
        }
        Update: {
          accepts_communications?: boolean
          archived_at?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          owner_id?: string
          phone?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_team_summary"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "customers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_team_summary"
            referencedColumns: ["owner_id"]
          },
        ]
      }
      opportunities: {
        Row: {
          archived_at: string | null
          closed_on: string | null
          created_at: string
          created_by: string
          customer_id: string
          estimated_amount: number
          final_amount: number | null
          id: string
          lost_reason: string | null
          next_action_date: string | null
          next_action_text: string | null
          notes: string | null
          owner_id: string
          stage: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          closed_on?: string | null
          created_at?: string
          created_by?: string
          customer_id: string
          estimated_amount?: number
          final_amount?: number | null
          id?: string
          lost_reason?: string | null
          next_action_date?: string | null
          next_action_text?: string | null
          notes?: string | null
          owner_id: string
          stage?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          closed_on?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string
          estimated_amount?: number
          final_amount?: number | null
          id?: string
          lost_reason?: string | null
          next_action_date?: string | null
          next_action_text?: string | null
          notes?: string | null
          owner_id?: string
          stage?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "v_team_summary"
            referencedColumns: ["owner_id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "v_next_actions"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_team_summary"
            referencedColumns: ["owner_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          must_change_password: boolean
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          must_change_password?: boolean
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          must_change_password?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          currency: string
          id: number
          manual_send_min_interval_minutes: number
          morning_summary_enabled: boolean
          timezone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          currency?: string
          id?: number
          manual_send_min_interval_minutes?: number
          morning_summary_enabled?: boolean
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          currency?: string
          id?: number
          manual_send_min_interval_minutes?: number
          morning_summary_enabled?: boolean
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "v_team_summary"
            referencedColumns: ["owner_id"]
          },
        ]
      }
      summary_runs: {
        Row: {
          error_detail: string | null
          finished_at: string | null
          id: string
          recipients_sent: number
          recipients_total: number
          requested_by: string | null
          started_at: string
          status: string
          trigger_type: string
        }
        Insert: {
          error_detail?: string | null
          finished_at?: string | null
          id?: string
          recipients_sent?: number
          recipients_total?: number
          requested_by?: string | null
          started_at?: string
          status?: string
          trigger_type: string
        }
        Update: {
          error_detail?: string | null
          finished_at?: string | null
          id?: string
          recipients_sent?: number
          recipients_total?: number
          requested_by?: string | null
          started_at?: string
          status?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "summary_runs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summary_runs_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "v_team_summary"
            referencedColumns: ["owner_id"]
          },
        ]
      }
    }
    Views: {
      v_lost_reasons_month: {
        Row: {
          lost_count: number | null
          lost_reason: string | null
          owner_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_team_summary"
            referencedColumns: ["owner_id"]
          },
        ]
      }
      v_next_actions: {
        Row: {
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          estimated_amount: number | null
          is_overdue: boolean | null
          next_action_date: string | null
          next_action_text: string | null
          opportunity_id: string | null
          owner_id: string | null
          owner_name: string | null
          stage: string | null
          title: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_team_summary"
            referencedColumns: ["owner_id"]
          },
        ]
      }
      v_pipeline_summary: {
        Row: {
          estimated_total: number | null
          opportunities_count: number | null
          owner_id: string | null
          stage: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_team_summary"
            referencedColumns: ["owner_id"]
          },
        ]
      }
      v_team_summary: {
        Row: {
          lost_month_count: number | null
          open_count: number | null
          open_estimated_total: number | null
          overdue_actions_count: number | null
          owner_id: string | null
          owner_name: string | null
          won_month_count: number | null
          won_month_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      app_role: { Args: never; Returns: string }
      app_today: { Args: never; Returns: string }
      is_seller: { Args: never; Returns: boolean }
      is_supervisor: { Args: never; Returns: boolean }
      mark_password_changed: { Args: never; Returns: undefined }
      write_audit: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id: string
          p_entity_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
