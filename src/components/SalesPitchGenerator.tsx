import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, MessageSquareQuote, RefreshCw, Lightbulb } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useArgumentaires, DEFAULT_ARGUMENTAIRES } from '@/hooks/useArgumentaires';

interface SalesPitchGeneratorProps {
  insuranceType: string;
  insuranceDescription?: string;
}

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function SalesPitchGenerator({ insuranceType }: SalesPitchGeneratorProps) {
  const { argumentaires, loading } = useArgumentaires();
  const [isOpen, setIsOpen] = useState(false);
  const [displayedArguments, setDisplayedArguments] = useState<string[]>([]);
  const [accroche, setAccroche] = useState<string>('');

  const generatePitch = () => {
    // Chercher les arguments pour ce type d'assurance
    const data = argumentaires[insuranceType] || DEFAULT_ARGUMENTAIRES[insuranceType] || {
      arguments: [
        "Cette assurance vous protège efficacement contre les imprévus.",
        "Elle représente un excellent rapport qualité-prix.",
        "C'est un investissement pour votre tranquillité d'esprit.",
        "Elle vous évite des dépenses imprévues potentiellement élevées.",
        "De nombreux clients satisfaits l'ont déjà adoptée."
      ],
      accroches: [
        "Protégez-vous efficacement, simplement.",
        "Votre sécurité, notre engagement."
      ]
    };
    
    // Sélectionner 5 arguments aléatoires
    const randomArgs = getRandomItems(data.arguments, Math.min(5, data.arguments.length));
    const randomAccroche = getRandomItems(data.accroches, 1)[0] || "Faites le bon choix !";
    
    setDisplayedArguments(randomArgs);
    setAccroche(randomAccroche);
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquareQuote className="h-4 w-4 text-primary" />
                    Arguments de vente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {displayedArguments.map((arg, index) => (
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
                      <p className="text-sm font-medium text-green-800 italic">"{accroche}"</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                size="sm"
                onClick={generatePitch}
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Générer de nouveaux arguments
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
