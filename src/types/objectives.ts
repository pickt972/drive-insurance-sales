export interface EmployeeObjective {
  id: string;
  employee_name: string;
  objective_type: 'monthly' | 'weekly' | 'yearly';
  target_amount: number;
  target_sales_count: number;
  period_start: string;
  period_end: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ObjectiveProgress {
  objective: EmployeeObjective;
  current_amount: number;
  current_sales_count: number;
  progress_percentage_amount: number;
  progress_percentage_sales: number;
  days_remaining: number;
}