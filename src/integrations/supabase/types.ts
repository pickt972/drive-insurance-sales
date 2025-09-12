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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      auto_exports: {
        Row: {
          error_message: string | null
          export_date: string
          file_name: string
          file_path: string | null
          id: string
          status: string
          type: string
        }
        Insert: {
          error_message?: string | null
          export_date?: string
          file_name: string
          file_path?: string | null
          id?: string
          status?: string
          type: string
        }
        Update: {
          error_message?: string | null
          export_date?: string
          file_name?: string
          file_path?: string | null
          id?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      employee_objectives: {
        Row: {
          created_at: string
          description: string | null
          employee_name: string
          id: string
          is_active: boolean
          objective_type: string
          period_end: string
          period_start: string
          target_amount: number
          target_sales_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_name: string
          id?: string
          is_active?: boolean
          objective_type?: string
          period_end: string
          period_start: string
          target_amount?: number
          target_sales_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_name?: string
          id?: string
          is_active?: boolean
          objective_type?: string
          period_end?: string
          period_start?: string
          target_amount?: number
          target_sales_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      insurance_types: {
        Row: {
          commission: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          commission: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          commission?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      objective_history: {
        Row: {
          achieved_amount: number
          achieved_sales_count: number
          archived_at: string
          created_at: string
          description: string | null
          employee_name: string
          id: string
          is_completed: boolean
          objective_achieved: boolean
          objective_type: string
          period_end: string
          period_start: string
          progress_percentage_amount: number
          progress_percentage_sales: number
          target_amount: number
          target_sales_count: number
        }
        Insert: {
          achieved_amount?: number
          achieved_sales_count?: number
          archived_at?: string
          created_at?: string
          description?: string | null
          employee_name: string
          id?: string
          is_completed?: boolean
          objective_achieved?: boolean
          objective_type: string
          period_end: string
          period_start: string
          progress_percentage_amount?: number
          progress_percentage_sales?: number
          target_amount?: number
          target_sales_count?: number
        }
        Update: {
          achieved_amount?: number
          achieved_sales_count?: number
          archived_at?: string
          created_at?: string
          description?: string | null
          employee_name?: string
          id?: string
          is_completed?: boolean
          objective_achieved?: boolean
          objective_type?: string
          period_end?: string
          period_start?: string
          progress_percentage_amount?: number
          progress_percentage_sales?: number
          target_amount?: number
          target_sales_count?: number
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      sale_insurances: {
        Row: {
          commission_amount: number
          created_at: string
          id: string
          insurance_type_id: string
          sale_id: string
        }
        Insert: {
          commission_amount: number
          created_at?: string
          id?: string
          insurance_type_id: string
          sale_id: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          id?: string
          insurance_type_id?: string
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_insurances_insurance_type_id_fkey"
            columns: ["insurance_type_id"]
            isOneToOne: false
            referencedRelation: "insurance_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_insurances_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_email: string | null
          client_name: string
          client_phone: string | null
          commission_amount: number
          created_at: string
          employee_name: string
          id: string
          insurance_type_id: string
          notes: string | null
          reservation_number: string
          status: string
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          commission_amount: number
          created_at?: string
          employee_name: string
          id?: string
          insurance_type_id: string
          notes?: string | null
          reservation_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          commission_amount?: number
          created_at?: string
          employee_name?: string
          id?: string
          insurance_type_id?: string
          notes?: string | null
          reservation_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_insurance_type_id_fkey"
            columns: ["insurance_type_id"]
            isOneToOne: false
            referencedRelation: "insurance_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_completed_objective: {
        Args: {
          p_achieved_amount: number
          p_achieved_sales_count: number
          p_objective_achieved: boolean
          p_objective_id: string
          p_progress_percentage_amount: number
          p_progress_percentage_sales: number
        }
        Returns: undefined
      }
      cleanup_expired_reset_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_password_reset_token: {
        Args: {
          p_expires_at: string
          p_token: string
          p_user_id: string
          p_username: string
        }
        Returns: undefined
      }
      get_valid_reset_token: {
        Args: { p_token: string; p_username: string }
        Returns: {
          token: string
          user_id: string
          username: string
        }[]
      }
      link_profile_to_user: {
        Args: { p_user_id: string; p_username: string }
        Returns: undefined
      }
      mark_reset_token_used: {
        Args: { p_token: string }
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
    Enums: {},
  },
} as const
