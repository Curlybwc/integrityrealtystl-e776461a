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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_analysis_quota: {
        Row: {
          count: number
          id: string
          month_key: string
          monthly_limit: number
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          id?: string
          month_key: string
          monthly_limit?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          id?: string
          month_key?: string
          monthly_limit?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comp_report_overrides: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          overrides: Json
          report_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          overrides?: Json
          report_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          overrides?: Json
          report_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comp_report_overrides_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "comp_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      comp_reports: {
        Row: {
          address: string | null
          arv_aggressive: number | null
          arv_conservative: number | null
          arv_likely: number | null
          confidence: number | null
          confidence_band: string | null
          created_at: string
          created_by: string
          driver_tier: string | null
          engine_version: string | null
          excluded_comp_count: number
          fallback_comp_count: number
          fallback_used: boolean
          good_comp_count: number
          id: string
          included_comp_count: number
          is_active: boolean
          last_refreshed_by: string
          mls_listing_id: string | null
          property_key: string
          refreshed_at: string
          result: Json
          scoring_version: string | null
          search_criteria: Json | null
          status: string
          strong_comp_count: number
          subject: Json
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          arv_aggressive?: number | null
          arv_conservative?: number | null
          arv_likely?: number | null
          confidence?: number | null
          confidence_band?: string | null
          created_at?: string
          created_by: string
          driver_tier?: string | null
          engine_version?: string | null
          excluded_comp_count?: number
          fallback_comp_count?: number
          fallback_used?: boolean
          good_comp_count?: number
          id?: string
          included_comp_count?: number
          is_active?: boolean
          last_refreshed_by: string
          mls_listing_id?: string | null
          property_key: string
          refreshed_at?: string
          result: Json
          scoring_version?: string | null
          search_criteria?: Json | null
          status?: string
          strong_comp_count?: number
          subject: Json
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          arv_aggressive?: number | null
          arv_conservative?: number | null
          arv_likely?: number | null
          confidence?: number | null
          confidence_band?: string | null
          created_at?: string
          created_by?: string
          driver_tier?: string | null
          engine_version?: string | null
          excluded_comp_count?: number
          fallback_comp_count?: number
          fallback_used?: boolean
          good_comp_count?: number
          id?: string
          included_comp_count?: number
          is_active?: boolean
          last_refreshed_by?: string
          mls_listing_id?: string | null
          property_key?: string
          refreshed_at?: string
          result?: Json
          scoring_version?: string | null
          search_criteria?: Json | null
          status?: string
          strong_comp_count?: number
          subject?: Json
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      portal_access_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          portal: string
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          portal: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          portal?: string
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      repair_analyses: {
        Row: {
          analysis_status: string
          analyzed_at: string | null
          created_at: string
          engine_version: string | null
          evidence_hash: string
          evidence_snapshot: Json | null
          failure_reason: string | null
          gut_rehab_mode: boolean
          id: string
          is_active: boolean
          line_items: Json | null
          mls_listing_id: string
          model: string | null
          observations: Json | null
          overridden_at: string | null
          overridden_by: string | null
          photo_count_analyzed: number | null
          pricing_version: number | null
          priority: number
          requested_by: string | null
          total_repair_estimate: number | null
          updated_at: string
        }
        Insert: {
          analysis_status?: string
          analyzed_at?: string | null
          created_at?: string
          engine_version?: string | null
          evidence_hash: string
          evidence_snapshot?: Json | null
          failure_reason?: string | null
          gut_rehab_mode?: boolean
          id?: string
          is_active?: boolean
          line_items?: Json | null
          mls_listing_id: string
          model?: string | null
          observations?: Json | null
          overridden_at?: string | null
          overridden_by?: string | null
          photo_count_analyzed?: number | null
          pricing_version?: number | null
          priority?: number
          requested_by?: string | null
          total_repair_estimate?: number | null
          updated_at?: string
        }
        Update: {
          analysis_status?: string
          analyzed_at?: string | null
          created_at?: string
          engine_version?: string | null
          evidence_hash?: string
          evidence_snapshot?: Json | null
          failure_reason?: string | null
          gut_rehab_mode?: boolean
          id?: string
          is_active?: boolean
          line_items?: Json | null
          mls_listing_id?: string
          model?: string | null
          observations?: Json | null
          overridden_at?: string | null
          overridden_by?: string | null
          photo_count_analyzed?: number | null
          pricing_version?: number | null
          priority?: number
          requested_by?: string | null
          total_repair_estimate?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      repair_pricing_rules: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          rules: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          rules: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          rules?: Json
          version?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "investor"
        | "wholesaler"
        | "partner"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "investor",
        "wholesaler",
        "partner",
      ],
    },
  },
} as const
