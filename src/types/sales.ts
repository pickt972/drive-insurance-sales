export interface Sale {
  id: string;
  employeeName: string;
  clientName: string;
  reservationNumber: string;
  insuranceTypes: string[];
  date: string;
  timestamp: number;
}

export interface SalesStats {
  totalSales: number;
  salesByEmployee: Record<string, number>;
  salesByInsurance: Record<string, number>;
  salesByMonth: Record<string, number>;
}

export const EMPLOYEES = ["Julie", "Sherman", "Alvin"] as const;

export const INSURANCE_TYPES = [
  "Pneumatique",
  "Bris de glace", 
  "Conducteur supplémentaire"
] as const;

export type Employee = typeof EMPLOYEES[number];
export type InsuranceType = typeof INSURANCE_TYPES[number];