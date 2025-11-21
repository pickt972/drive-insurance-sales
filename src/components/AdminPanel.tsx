import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from 'lucide-react';

export const AdminPanel = () => {
  const { profile, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive font-bold">❌ Accès refusé</p>
          <p className="text-sm text-muted-foreground mt-2">
            Seuls les administrateurs peuvent accéder à ce panneau.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            ⚙️ Panneau d'administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Bienvenue <span className="font-bold text-primary">{profile?.full_name}</span>
            </p>
            
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                ℹ️ <strong>Composant en migration progressive:</strong> Le panneau d'administration complet sera bientôt disponible.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Fonctionnalités à venir:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 ml-4 list-disc">
                <li>Gestion des utilisateurs (création, modification, rôles)</li>
                <li>Gestion des types d'assurance (ajout, tarifs)</li>
                <li>Gestion des objectifs commerciaux</li>
                <li>Système de versioning</li>
                <li>Export de données</li>
              </ul>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium">👥 Utilisateurs</p>
                  <p className="text-xs text-muted-foreground mt-1">En cours de migration</p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium">🛡️ Assurances</p>
                  <p className="text-xs text-muted-foreground mt-1">En cours de migration</p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium">🎯 Objectifs</p>
                  <p className="text-xs text-muted-foreground mt-1">En cours de migration</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
