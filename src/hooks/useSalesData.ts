import { useState, useEffect } from "react";
import { Sale, SalesStats, EMPLOYEES, INSURANCE_TYPES } from "@/types/sales";

export const useSalesData = () => {
  const [sales, setSales] = useState<Sale[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedSales = localStorage.getItem("insurance-sales");
    if (savedSales) {
      setSales(JSON.parse(savedSales));
    }
  }, []);

  // Save to localStorage whenever sales change
  useEffect(() => {
    localStorage.setItem("insurance-sales", JSON.stringify(sales));
  }, [sales]);

  const addSale = (sale: Omit<Sale, "id" | "timestamp">) => {
    const newSale: Sale = {
      ...sale,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setSales(prev => [newSale, ...prev]);
    return newSale;
  };

  const deleteSale = (id: string) => {
    setSales(prev => prev.filter(sale => sale.id !== id));
  };

  const getStats = (): SalesStats => {
    const totalSales = sales.length;
    
    const salesByEmployee = EMPLOYEES.reduce((acc, employee) => {
      acc[employee] = sales.filter(sale => sale.employeeName === employee).length;
      return acc;
    }, {} as Record<string, number>);

    const salesByInsurance = INSURANCE_TYPES.reduce((acc, insurance) => {
      acc[insurance] = sales.filter(sale => 
        sale.insuranceTypes.includes(insurance)
      ).length;
      return acc;
    }, {} as Record<string, number>);

    const salesByMonth = sales.reduce((acc, sale) => {
      const month = new Date(sale.date).toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long' 
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSales,
      salesByEmployee,
      salesByInsurance,
      salesByMonth,
    };
  };

  return {
    sales,
    addSale,
    deleteSale,
    getStats,
  };
};