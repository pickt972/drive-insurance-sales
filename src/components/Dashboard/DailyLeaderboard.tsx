import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface EmployeeSales {
  user_id: string;
  employee_name: string;
  sales_count: number;
  total_commission: number;
}

export function DailyLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<EmployeeSales[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    fetchTodaySales();
  }, []);

  const fetchTodaySales = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await (supabase as any)
        .from('insurance_sales')
        .select(`
          user_id,
          commission_amount,
          profiles:user_id(full_name)
        `)
        .eq('sale_date', today);

      if (error) throw error;

      // Grouper par employé
      const salesByEmployee: Record<string, EmployeeSales> = {};
      
      data?.forEach((sale: any) => {
        const userId = sale.user_id;
        const employeeName = sale.profiles?.full_name || 'Inconnu';
        
        if (!salesByEmployee[userId]) {
          salesByEmployee[userId] = {
            user_id: userId,
            employee_name: employeeName,
            sales_count: 0,
            total_commission: 0,
          };
        }
        
        salesByEmployee[userId].sales_count += 1;
        salesByEmployee[userId].total_commission += sale.commission_amount || 0;
      });

      // Convertir en tableau et trier par nombre de ventes
      const sortedLeaderboard = Object.values(salesByEmployee)
        .sort((a, b) => b.sales_count - a.sales_count || b.total_commission - a.total_commission);

      setLeaderboard(sortedLeaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{index + 1}</span>;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const currentUserRank = useMemo(() => {
    const index = leaderboard.findIndex(e => e.user_id === profile?.id);
    return index >= 0 ? index + 1 : null;
  }, [leaderboard, profile?.id]);

  if (loading) {
    return (
      <Card className="modern-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="modern-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
              <Users className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Classement du jour</CardTitle>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), 'EEEE d MMMM', { locale: fr })}
              </p>
            </div>
          </div>
          {currentUserRank && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Votre position</p>
              <p className="text-lg font-bold text-primary">
                {currentUserRank === 1 ? '🥇' : currentUserRank === 2 ? '🥈' : currentUserRank === 3 ? '🥉' : `#${currentUserRank}`}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Aucune vente aujourd'hui</p>
            <p className="text-sm">Soyez le premier à enregistrer une vente !</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((employee, index) => {
              const isCurrentUser = employee.user_id === profile?.id;
              return (
                <div
                  key={employee.user_id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    index === 0 && "bg-gradient-to-r from-yellow-500/10 to-orange-500/5 border border-yellow-500/20",
                    index === 1 && "bg-gradient-to-r from-gray-500/10 to-gray-500/5 border border-gray-400/20",
                    index === 2 && "bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20",
                    index > 2 && "bg-muted/30 hover:bg-muted/50",
                    isCurrentUser && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <div className="w-6 flex justify-center">
                    {getRankIcon(index)}
                  </div>
                  
                  <Avatar className={cn(
                    "h-9 w-9",
                    index === 0 && "ring-2 ring-yellow-500",
                    index === 1 && "ring-2 ring-gray-400",
                    index === 2 && "ring-2 ring-amber-500"
                  )}>
                    <AvatarFallback className={cn(
                      "text-xs font-medium",
                      index === 0 && "bg-yellow-500/20 text-yellow-700",
                      index === 1 && "bg-gray-400/20 text-gray-700",
                      index === 2 && "bg-amber-500/20 text-amber-700"
                    )}>
                      {getInitials(employee.employee_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm truncate",
                      isCurrentUser && "text-primary"
                    )}>
                      {employee.employee_name}
                      {isCurrentUser && " (vous)"}
                      {getRankBadge(index) && <span className="ml-1">{getRankBadge(index)}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employee.sales_count} vente{employee.sales_count > 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-sm text-emerald-600">
                      {employee.total_commission.toFixed(2)} €
                    </p>
                    <p className="text-xs text-muted-foreground">commission</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
