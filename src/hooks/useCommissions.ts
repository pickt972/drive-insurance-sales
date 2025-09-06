import { useState, useEffect } from "react";
import { Commission, DEFAULT_COMMISSIONS } from "@/types/sales";

export const useCommissions = () => {
  const [commissions, setCommissions] = useState<Commission>(DEFAULT_COMMISSIONS);

  useEffect(() => {
    const savedCommissions = localStorage.getItem("insurance-commissions");
    if (savedCommissions) {
      setCommissions(JSON.parse(savedCommissions));
    } else {
      localStorage.setItem("insurance-commissions", JSON.stringify(DEFAULT_COMMISSIONS));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("insurance-commissions", JSON.stringify(commissions));
  }, [commissions]);

  const updateCommission = (insuranceType: string, amount: number) => {
    setCommissions(prev => ({
      ...prev,
      [insuranceType]: amount
    }));
  };

  const addCommission = (insuranceType: string, amount: number) => {
    setCommissions(prev => ({
      ...prev,
      [insuranceType]: amount
    }));
  };

  const removeCommission = (insuranceType: string) => {
    setCommissions(prev => {
      const { [insuranceType]: removed, ...rest } = prev;
      return rest;
    });
  };

  const calculateTotal = (insuranceTypes: string[]): number => {
    return insuranceTypes.reduce((total, type) => {
      return total + (commissions[type] || 0);
    }, 0);
  };

  return {
    commissions,
    updateCommission,
    addCommission,
    removeCommission,
    calculateTotal,
    getCommissionTypes: () => Object.keys(commissions)
  };
};