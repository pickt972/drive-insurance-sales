export interface Profile {
  id: string;
  user_id: string;
  username: string;
  role: 'admin' | 'employee';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InsuranceType {
  id: string;
  name: string;
  commission: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  employee_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  reservation_number: string;
  insurance_type_id: string;
  commission_amount: number;
  notes?: string;
  status: 'active' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Relations
  employee?: Profile;
  insurance_type?: InsuranceType;
  sale_insurances?: SaleInsurance[];
}

export interface SaleInsurance {
  id: string;
  sale_id: string;
  insurance_type_id: string;
  commission_amount: number;
  created_at: string;
  // Relations
  insurance_type?: InsuranceType;
}

export interface AutoExport {
  id: string;
  type: 'csv' | 'pdf' | 'backup';
  file_name: string;
  file_path?: string;
  export_date: string;
  status: 'pending' | 'success' | 'failed';
  error_message?: string;
}

export interface SaleWithDetails extends Sale {
  employee_name: string;
  insurance_name: string;
}

export interface DashboardStats {
  totalSales: number;
  totalCommission: number;
  salesThisWeek: number;
  topSellers: Array<{
    employee_name: string;
    sales_count: number;
    total_commission: number;
  }>;
  recentSales: SaleWithDetails[];
  weeklyEvolution: Array<{
    date: string;
    sales: number;
    commission: number;
  }>;
}