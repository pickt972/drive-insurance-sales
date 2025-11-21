import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Trophy, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from 'lucide-react';

export const Dashboard = () => {
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
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            {isAdmin ? '📊 Dashboard Admin' : '📊 Mon Dashboard'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">
            Bienvenue <span className="font-bold text-primary">{profile?.full_name}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Rôle: <span className="font-semibold">{isAdmin ? 'Administrateur' : 'Utilisateur'}</span>
          </p>
        </CardContent>
      </Card>

      {/* Statistiques simplifiées */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">
              En cours de chargement...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--- €</div>
            <p className="text-xs text-muted-foreground">
              En cours de chargement...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---</div>
            <p className="text-xs text-muted-foreground">
              Ventes récentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectif</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">---%</div>
            <p className="text-xs text-muted-foreground">
              Progression
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Message info */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            ℹ️ <strong>Composant en migration progressive:</strong> Les statistiques détaillées seront bientôt disponibles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
