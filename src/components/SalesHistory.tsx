import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from 'lucide-react';

export const SalesHistory = () => {
  const { profile, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            📊 Historique des ventes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Vue administrateur: Toutes les ventes de l\'équipe' 
                : `Vos ventes personnelles, ${profile?.full_name}`
              }
            </p>
            
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                ℹ️ <strong>Composant en migration progressive:</strong> L'historique complet des ventes sera bientôt disponible.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Fonctionnalités à venir:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 ml-4 list-disc">
                <li>Tableau de toutes les ventes</li>
                <li>Filtres par date, employé, type d'assurance</li>
                <li>Modification et suppression de ventes</li>
                <li>Export CSV</li>
                <li>Pagination</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
