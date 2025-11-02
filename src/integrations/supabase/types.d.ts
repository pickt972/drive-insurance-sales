export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          first_name: string
          last_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          first_name: string
          last_name: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          first_name?: string
          last_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role: 'admin' | 'employee'
          created_at: string
        }
        Insert: {
          user_id: string
          role: 'admin' | 'employee'
          created_at?: string
        }
        Update: {
          user_id?: string
          role?: 'admin' | 'employee'
          created_at?: string
        }
      }
      insurance_types: {
        Row: {
          id: string
          name: string
          commission: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          commission: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          commission?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          employee_name: string
          client_name: string
          client_email: string | null
          client_phone: string | null
          reservation_number: string
          commission_amount: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_name: string
          client_name: string
          client_email?: string | null
          client_phone?: string | null
          reservation_number: string
          commission_amount: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_name?: string
          client_name?: string
          client_email?: string | null
          client_phone?: string | null
          reservation_number?: string
          commission_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sale_insurances: {
        Row: {
          id: string
          sale_id: string
          insurance_type_id: string
          commission_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          insurance_type_id: string
          commission_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          insurance_type_id?: string
          commission_amount?: number
          created_at?: string
        }
      }
      objectives: {
        Row: {
          id: string
          employee_name: string
          objective_type: 'amount' | 'sales_count'
          target_amount: number
          target_sales_count: number
          period: 'monthly' | 'quarterly' | 'yearly'
          start_date: string
          end_date: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_name: string
          objective_type: 'amount' | 'sales_count'
          target_amount?: number
          target_sales_count?: number
          period: 'monthly' | 'quarterly' | 'yearly'
          start_date: string
          end_date: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_name?: string
          objective_type?: 'amount' | 'sales_count'
          target_amount?: number
          target_sales_count?: number
          period?: 'monthly' | 'quarterly' | 'yearly'
          start_date?: string
          end_date?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_profile: {
        Args: Record<string, never>
        Returns: {
          id: string
          user_id: string
          username: string
          first_name: string
          last_name: string
          is_active: boolean
          created_at: string
        }[]
      }
      has_role: {
        Args: {
          role_name: string
        }
        Returns: boolean
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
