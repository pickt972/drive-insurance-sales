import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, CheckCircle } from 'lucide-react';

interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

const ConfettiParticle = ({ delay, x, y, color, shape }: { 
  delay: number; 
  x: number; 
  y: number; 
  color: string; 
  shape: string; 
}) => (
  <div
    className="absolute w-3 h-3 pointer-events-none"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      backgroundColor: color,
      borderRadius: shape === 'circle' ? '50%' : '0%',
      animation: `confetti-burst 2s ease-out ${delay}s forwards`,
      transform: `rotate(${Math.random() * 360}deg)`,
    }}
  />
);

export const SuccessPopup = ({ isOpen, onClose, message, title = "Félicitations !" }: SuccessPopupProps) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const confettiColors = [
    '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', 
    '#96CEB4', '#FFEAA7', '#FF8A80', '#C5E1A5',
    '#DDA0DD', '#98FB98', '#F0E68C', '#FFA07A'
  ];

  const confettiParticles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    delay: Math.random() * 0.8,
    x: 20 + Math.random() * 60,
    y: 30 + Math.random() * 40,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    shape: Math.random() > 0.5 ? 'circle' : 'square'
  }));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md mx-auto text-center border-0 bg-gradient-to-br from-background via-background to-muted/20 shadow-2xl">
          <div className="space-y-6 py-6">
            {/* Icon avec animation */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
              <div className="relative bg-primary rounded-full p-4 animate-scale-in">
                <CheckCircle className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>

            {/* Titre */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground animate-fade-in">
                {title}
              </h2>
              <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground animate-fade-in">
                <PartyPopper className="w-5 h-5" />
                <span>{message}</span>
                <PartyPopper className="w-5 h-5" />
              </div>
            </div>

            {/* Bouton */}
            <Button 
              onClick={onClose}
              size="lg"
              className="relative overflow-hidden group bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10">Continuer</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confettis */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {confettiParticles.map((particle) => (
            <ConfettiParticle
              key={particle.id}
              delay={particle.delay}
              x={particle.x}
              y={particle.y}
              color={particle.color}
              shape={particle.shape}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes confetti-burst {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg) scale(0);
            opacity: 1;
          }
          10% {
            transform: translateY(-20px) translateX(0) rotate(180deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(200px) translateX(${Math.random() > 0.5 ? '' : '-'}${50 + Math.random() * 100}px) rotate(720deg) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};