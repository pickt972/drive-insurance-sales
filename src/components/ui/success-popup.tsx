import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, CircleCheck as CheckCircle } from 'lucide-react';

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
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setAnimationPhase(0);
      
      // Séquence d'animation
      const phase1 = setTimeout(() => setAnimationPhase(1), 100);
      const phase2 = setTimeout(() => setAnimationPhase(2), 500);
      const phase3 = setTimeout(() => setAnimationPhase(3), 1000);
      
      // Garder les confettis plus longtemps
      const timer = setTimeout(() => setShowConfetti(false), 6000);
      
      return () => {
        clearTimeout(phase1);
        clearTimeout(phase2);
        clearTimeout(phase3);
        clearTimeout(timer);
      };
    } else {
      setShowConfetti(false);
      setAnimationPhase(0);
    }
  }, [isOpen]);

  const confettiColors = [
    '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', 
    '#96CEB4', '#FFEAA7', '#FF8A80', '#C5E1A5',
    '#DDA0DD', '#98FB98', '#F0E68C', '#FFA07A'
  ];

  const confettiParticles = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1.2,
    x: 10 + Math.random() * 80,
    y: 20 + Math.random() * 50,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    shape: Math.random() > 0.5 ? 'circle' : 'square'
  }));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        {(() => { if (isOpen) console.log('✅ SuccessPopup rendu ouvert'); return null; })()}
        <DialogContent className="z-[9999] max-w-md mx-auto text-center border-0 bg-gradient-to-br from-background via-background to-muted/20 shadow-2xl backdrop-blur-sm">
          <div className="space-y-6 py-6 relative overflow-hidden">
            {/* Effets de background animés */}
            <div className="absolute inset-0 opacity-10">
              <div className={`absolute w-32 h-32 bg-primary rounded-full blur-3xl transition-all duration-1000 ${animationPhase >= 1 ? 'scale-100 opacity-30' : 'scale-0 opacity-0'}`} style={{left: '10%', top: '20%'}} />
              <div className={`absolute w-24 h-24 bg-emerald-500 rounded-full blur-2xl transition-all duration-1000 delay-300 ${animationPhase >= 2 ? 'scale-100 opacity-20' : 'scale-0 opacity-0'}`} style={{right: '15%', bottom: '25%'}} />
              <div className={`absolute w-20 h-20 bg-purple-500 rounded-full blur-xl transition-all duration-1000 delay-500 ${animationPhase >= 3 ? 'scale-100 opacity-25' : 'scale-0 opacity-0'}`} style={{left: '60%', top: '10%'}} />
            </div>

            {/* Icon avec animation plus spectaculaire */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-primary/20 rounded-full animate-pulse"></div>
              <div className={`relative bg-gradient-to-br from-primary to-primary/80 rounded-full p-5 transition-all duration-700 ${animationPhase >= 1 ? 'animate-scale-in shadow-lg shadow-primary/50' : 'scale-0'}`}>
                <CheckCircle className="w-10 h-10 text-primary-foreground animate-pulse" />
              </div>
              {/* Cercles d'animation supplémentaires */}
              <div className={`absolute inset-0 border-2 border-primary/40 rounded-full transition-all duration-1000 ${animationPhase >= 2 ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`} />
              <div className={`absolute inset-0 border border-primary/30 rounded-full transition-all duration-1200 delay-200 ${animationPhase >= 2 ? 'scale-200 opacity-0' : 'scale-100 opacity-100'}`} />
            </div>

            {/* Titre avec animation séquentielle */}
            <div className="space-y-3">
              <DialogTitle className={`text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent transition-all duration-500 ${animationPhase >= 1 ? 'animate-fade-in translate-y-0' : 'translate-y-4 opacity-0'}`}>
                {title}
              </DialogTitle>
              <div className={`flex items-center justify-center gap-3 text-lg text-muted-foreground transition-all duration-700 delay-200 ${animationPhase >= 2 ? 'animate-fade-in translate-y-0' : 'translate-y-4 opacity-0'}`}>
                <PartyPopper className="w-6 h-6 animate-bounce" style={{animationDelay: '0ms'}} />
                <span className="font-medium">{message}</span>
                <PartyPopper className="w-6 h-6 animate-bounce" style={{animationDelay: '150ms'}} />
              </div>
            </div>

            {/* Bouton avec animation retardée */}
            <div className={`transition-all duration-500 delay-500 ${animationPhase >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <Button 
                onClick={onClose}
                size="lg"
                className="relative overflow-hidden group bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 font-semibold">Continuer</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary/30 opacity-0 group-active:opacity-100 transition-opacity duration-150"></div>
              </Button>
            </div>
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
          15% {
            transform: translateY(-80px) translateX(${Math.random() > 0.5 ? '' : '-'}30px) rotate(180deg) scale(1);
            opacity: 1;
          }
          35% {
            transform: translateY(-120px) translateX(${Math.random() > 0.5 ? '' : '-'}60px) rotate(360deg) scale(1);
            opacity: 1;
          }
          65% {
            transform: translateY(-50px) translateX(${Math.random() > 0.5 ? '' : '-'}90px) rotate(540deg) scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh) translateX(${Math.random() > 0.5 ? '' : '-'}150px) rotate(720deg) scale(0.1);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
};