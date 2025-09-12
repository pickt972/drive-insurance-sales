export interface ObjectiveHistory {
  id: string;
  employee_name: string;
  objective_type: 'monthly' | 'weekly' | 'yearly';
  target_amount: number;
  target_sales_count: number;
  achieved_amount: number;
  achieved_sales_count: number;
  progress_percentage_amount: number;
  progress_percentage_sales: number;
  period_start: string;
  period_end: string;
  description?: string;
  is_completed: boolean;
  objective_achieved: boolean;
  created_at: string;
  archived_at: string;
}