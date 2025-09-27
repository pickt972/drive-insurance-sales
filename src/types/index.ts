export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'employee';
  isActive: boolean;
  createdAt: string;
}

export interface InsuranceType {
  id: string;
  name: string;
  commission: number;
  isActive: boolean;
}

export interface Sale {
  id: string;
  employeeName: string;
  clientName: string;
  reservationNumber: string;
  insuranceTypes: string[];
  commissionAmount: number;
  createdAt: string;
  notes?: string;
}

export interface DashboardStats {
  totalSales: number;
  totalCommission: number;
  salesThisWeek: number;
  topSellers: Array<{
    name: string;
    sales: number;
    commission: number;
  }>;
}