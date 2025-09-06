export interface User {
  username: string;
  password: string;
  role: 'admin' | 'employee';
  createdAt: string;
}

export interface Commission {
  [key: string]: number;
}

export interface Sale {
  id: string;
  employeeName: string;
  clientName: string;
  reservationNumber: string;
  insuranceTypes: string[];
  date: string;
  timestamp: number;
  commissions: number;
}

export interface SalesStats {
  totalSales: number;
  totalCommissions: number;
  salesByEmployee: Record<string, number>;
  salesByInsurance: Record<string, number>;
  salesByMonth: Record<string, number>;
  commissionsByEmployee: Record<string, number>;
}

export const EMPLOYEES = ["Julie", "Sherman", "Alvin"] as const;

export const INSURANCE_TYPES = [
  "Pneumatique",
  "Bris de glace", 
  "Conducteur supplémentaire",
  "Protection vol",
  "Assistance dépannage"
] as const;

export const DEFAULT_COMMISSIONS: Commission = {
  "Pneumatique": 4.50,
  "Bris de glace": 7.90,
  "Conducteur supplémentaire": 2.75,
  "Protection vol": 5.20,
  "Assistance dépannage": 3.80
};

export const ENCOURAGEMENTS = [
  "🎉 Excellent ! Tes ventes ont été enregistrées avec succès !",
  "💪 Bravo, ta performance est remarquable !",
  "🚀 Encore une vente ! Tu es en feu !",
  "💰 Commission enregistrée. Direction le sommet !",
  "⭐ Bien joué, chaque vente compte !",
  "🏆 Tes efforts paient, continue sur cette lancée !",
  "🎯 Parfait ! Tu vises juste !",
  "💎 Qualité premium, comme d'habitude !"
];

export type Employee = typeof EMPLOYEES[number];
export type InsuranceType = typeof INSURANCE_TYPES[number];