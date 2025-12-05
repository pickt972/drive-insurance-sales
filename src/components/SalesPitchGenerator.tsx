import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, MessageSquareQuote, RefreshCw, X, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SalesPitchGeneratorProps {
  insuranceType: string;
  insuranceDescription?: string;
}

interface SalesPitch {
  arguments: string[];
  accroche: string;
}

export function SalesPitchGenerator({ insuranceType, insuranceDescription }: SalesPitchGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pitch, setPitch] = useState<SalesPitch | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const generatePitch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sales-pitch`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            insuranceType,
            insuranceDescription,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération');
      }

      const data = await response.json();
      setPitch(data);
    } catch (error) {
      console.error('Error generating pitch:', error);
      toast.error(error instanceof Error ? error.message : 'Impossible de générer les arguments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !pitch) {
      generatePitch();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Argumentaire</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Argumentaire de vente
            <Badge variant="secondary" className="ml-2">{insuranceType}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Génération des arguments en cours...</p>
            </div>
          ) : pitch ? (
            <>
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquareQuote className="h-4 w-4 text-primary" />
                    Arguments de vente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pitch.arguments.map((arg, index) => (
                    <div
                      key={index}
                      className="flex gap-3 p-3 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-relaxed">{arg}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-full bg-green-500/10">
                      <Sparkles className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-700 mb-1">Phrase d'accroche</p>
                      <p className="text-sm font-medium text-green-800 italic">"{pitch.accroche}"</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                size="sm"
                onClick={generatePitch}
                className="w-full gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Générer de nouveaux arguments
              </Button>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Cliquez pour générer des arguments de vente</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
