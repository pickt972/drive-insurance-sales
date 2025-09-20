import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export const InsuranceManagement: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Gestion des assurances
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Module de gestion des types d'assurance et commissions à implémenter.
        </p>
      </CardContent>
    </Card>
  );
};