import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export function useRealtimeSales(onNewSale?: () => void) {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  
  // Use ref to avoid re-subscribing when callback changes
  const onNewSaleRef = useRef(onNewSale);
  onNewSaleRef.current = onNewSale;

  useEffect(() => {
    if (!user) return;

    console.log('🔴 Subscribing to realtime sales...');

    // Canal pour écouter les nouvelles ventes
    const channel = supabase
      .channel('sales_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'insurance_sales',
          filter: isAdmin ? undefined : `employee_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🎉 Nouvelle vente détectée:', payload);
          
          const sale = payload.new as any;
          
          // Notification visuelle
          toast({
            title: '🎉 Nouvelle vente enregistrée !',
            description: `${sale.employee_name || 'Employé'} - ${(sale.amount || 0).toFixed(2)} €`,
            duration: 5000,
          });

          // Callback pour rafraîchir les données
          onNewSaleRef.current?.();
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime status:', status);
      });

    return () => {
      console.log('🔴 Unsubscribing from realtime sales');
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAdmin, toast]);
}
