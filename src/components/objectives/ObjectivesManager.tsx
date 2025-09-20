import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

export const ObjectivesManager: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Gestion des objectifs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Module de définition et suivi des objectifs de vente à implémenter.
        </p>
      </CardContent>
    </Card>
  );
};