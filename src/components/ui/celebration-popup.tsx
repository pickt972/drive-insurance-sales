import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PartyPopper, CircleCheck as CheckCircle } from 'lucide-react';

interface CelebrationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  saleAmount: number;
}

const CELEBRATION_MESSAGES = [
  "🎉 Bravo ! Encore une vente de plus !",
  "🚀 Excellent travail ! Tu es en feu !",
  "⭐ Fantastique ! Continue comme ça !",
  "🏆 Champion ! Une vente de plus au compteur !",
  "💪 Super boulot ! Tu assures !",
  "🎯 Parfait ! Objectif en vue !",
  "🌟 Magnifique ! Tu es au top !",
  "🔥 Incroyable ! Quel talent !",
  "💎 Exceptionnel ! Tu brilles !",
  "🎊 Génial ! Quelle performance !",
  "⚡ Formidable ! Tu déchires !",
  "🎈 Superbe ! Continue l'élan !",
  "🏅 Remarquable ! Tu es un pro !",
  "✨ Éblouissant ! Quel succès !",
  "🎪 Spectaculaire ! Bravo l'artiste !"
];

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
      animation: `confetti-burst 3s ease-out ${delay}s forwards`,
      transform: `rotate(${Math.random() * 360}deg)`,
    }}
  />
);

const Balloon = ({ delay, x, color }: { delay: number; x: number; color: string }) => (
  <div
    className="absolute w-8 h-10 pointer-events-none"
    style={{
      left: `${x}%`,
      bottom: '0%',
      animation: `balloon-float 4s ease-out ${delay}s forwards`,
    }}
  >
    <div 
      className="w-full h-full rounded-full shadow-lg"
      style={{ backgroundColor: color }}
    />
    <div className="w-px h-8 bg-gray-400 mx-auto" />
  </div>
);

export const CelebrationPopup = ({ isOpen, onClose, saleAmount }: CelebrationPopupProps) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Sélectionner un message aléatoire
      const randomMessage = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      setCurrentMessage(randomMessage);
      
      setShowConfetti(true);
      setAnimationPhase(0);
      
      // Séquence d'animation
      const phase1 = setTimeout(() => setAnimationPhase(1), 100);
      const phase2 = setTimeout(() => setAnimationPhase(2), 500);
      const phase3 = setTimeout(() => setAnimationPhase(3), 1000);
      
      // Fermer automatiquement après 3 secondes
      const autoClose = setTimeout(() => {
        setShowConfetti(false);
        onClose();
      }, 3000);
      
      return () => {
        clearTimeout(phase1);
        clearTimeout(phase2);
        clearTimeout(phase3);
        clearTimeout(autoClose);
      };
    } else {
      setShowConfetti(false);
      setAnimationPhase(0);
    }
  }, [isOpen, onClose]);

  const confettiColors = [
    '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', 
    '#96CEB4', '#FFEAA7', '#FF8A80', '#C5E1A5',
    '#DDA0DD', '#98FB98', '#F0E68C', '#FFA07A'
  ];

  const balloonColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98FB98', '#FFA07A'
  ];

  const confettiParticles = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1.5,
    x: 10 + Math.random() * 80,
    y: 20 + Math.random() * 50,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    shape: Math.random() > 0.5 ? 'circle' : 'square'
  }));

  const balloons = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    x: 10 + (i * 10) + Math.random() * 5,
    color: balloonColors[Math.floor(Math.random() * balloonColors.length)]
  }));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="z-[9999] max-w-lg mx-auto text-center border-0 bg-gradient-to-br from-background via-background to-primary/10 shadow-2xl backdrop-blur-sm">
          <div className="space-y-6 py-8 relative overflow-hidden">
            {/* Effets de background animés */}
            <div className="absolute inset-0 opacity-20">
              <div className={`absolute w-32 h-32 bg-primary rounded-full blur-3xl transition-all duration-1000 ${animationPhase >= 1 ? 'scale-100 opacity-40' : 'scale-0 opacity-0'}`} style={{left: '10%', top: '20%'}} />
              <div className={`absolute w-24 h-24 bg-success rounded-full blur-2xl transition-all duration-1000 delay-300 ${animationPhase >= 2 ? 'scale-100 opacity-30' : 'scale-0 opacity-0'}`} style={{right: '15%', bottom: '25%'}} />
              <div className={`absolute w-20 h-20 bg-warning rounded-full blur-xl transition-all duration-1000 delay-500 ${animationPhase >= 3 ? 'scale-100 opacity-35' : 'scale-0 opacity-0'}`} style={{left: '60%', top: '10%'}} />
            </div>

            {/* Icon avec animation spectaculaire */}
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-success/30 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-success/20 rounded-full animate-pulse"></div>
              <div className={`relative bg-gradient-to-br from-success to-success/80 rounded-full p-5 transition-all duration-700 ${animationPhase >= 1 ? 'animate-bounce shadow-lg shadow-success/50' : 'scale-0'}`}>
                <CheckCircle className="w-10 h-10 text-white animate-pulse" />
              </div>
              {/* Cercles d'animation supplémentaires */}
              <div className={`absolute inset-0 border-2 border-success/40 rounded-full transition-all duration-1000 ${animationPhase >= 2 ? 'scale-150 opacity-0' : 'scale-100 opacity-100'}`} />
              <div className={`absolute inset-0 border border-success/30 rounded-full transition-all duration-1200 delay-200 ${animationPhase >= 2 ? 'scale-200 opacity-0' : 'scale-100 opacity-100'}`} />
            </div>

            {/* Message avec animation séquentielle */}
            <div className="space-y-4">
              <DialogTitle className={`text-3xl font-bold bg-gradient-to-r from-success to-success/70 bg-clip-text text-transparent transition-all duration-500 ${animationPhase >= 1 ? 'animate-fade-in translate-y-0' : 'translate-y-4 opacity-0'}`}>
                Vente Validée !
              </DialogTitle>
              <div className={`text-lg font-medium text-primary transition-all duration-700 delay-200 ${animationPhase >= 2 ? 'animate-fade-in translate-y-0' : 'translate-y-4 opacity-0'}`}>
                {currentMessage}
              </div>
              <div className={`flex items-center justify-center gap-3 text-xl font-bold text-success transition-all duration-700 delay-400 ${animationPhase >= 3 ? 'animate-fade-in translate-y-0' : 'translate-y-4 opacity-0'}`}>
                <PartyPopper className="w-6 h-6 animate-bounce" />
                <span>+{saleAmount.toFixed(2)} €</span>
                <PartyPopper className="w-6 h-6 animate-bounce" style={{animationDelay: '150ms'}} />
              </div>
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
          {balloons.map((balloon) => (
            <Balloon
              key={balloon.id}
              delay={balloon.delay}
              x={balloon.x}
              color={balloon.color}
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
            transform: translateY(-100px) translateX(${Math.random() > 0.5 ? '' : '-'}40px) rotate(180deg) scale(1);
            opacity: 1;
          }
          35% {
            transform: translateY(-150px) translateX(${Math.random() > 0.5 ? '' : '-'}80px) rotate(360deg) scale(1);
            opacity: 1;
          }
          65% {
            transform: translateY(-80px) translateX(${Math.random() > 0.5 ? '' : '-'}120px) rotate(540deg) scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh) translateX(${Math.random() > 0.5 ? '' : '-'}200px) rotate(720deg) scale(0.1);
            opacity: 0;
          }
        }

        @keyframes balloon-float {
          0% {
            transform: translateY(0) scale(0);
            opacity: 0;
          }
          20% {
            transform: translateY(-50px) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) scale(0.8);
            opacity: 0;
          }
        }

        @keyframes animate-fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: animate-fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </>
  );
};