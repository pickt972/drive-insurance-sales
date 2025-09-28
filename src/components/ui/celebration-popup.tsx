import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PartyPopper, CircleCheck as CheckCircle, Trophy, Star, Zap } from 'lucide-react';

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

const ConfettiParticle = ({ delay, x, y, color, shape, size }: { 
  delay: number; 
  x: number; 
  y: number; 
  color: string; 
  shape: string;
  size: number;
}) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      borderRadius: shape === 'circle' ? '50%' : shape === 'star' ? '0%' : '0%',
      animation: `confetti-explosion 4s ease-out ${delay}s forwards`,
      transform: `rotate(${Math.random() * 360}deg)`,
      zIndex: 1000,
    }}
  />
);

const Firework = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      animation: `firework-burst 2s ease-out ${delay}s forwards`,
      zIndex: 1001,
    }}
  >
    <div className="relative">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-8 bg-gradient-to-t from-yellow-400 to-transparent"
          style={{
            transform: `rotate(${i * 30}deg)`,
            transformOrigin: 'bottom center',
            animation: `spark-${i} 2s ease-out ${delay}s forwards`,
          }}
        />
      ))}
    </div>
  </div>
);

const FloatingBalloon = ({ delay, x, color, emoji }: { 
  delay: number; 
  x: number; 
  color: string;
  emoji: string;
}) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${x}%`,
      bottom: '-10%',
      animation: `balloon-rise 6s ease-out ${delay}s forwards`,
      zIndex: 999,
    }}
  >
    <div className="relative">
      <div 
        className="w-12 h-16 rounded-full shadow-2xl relative overflow-hidden"
        style={{ 
          backgroundColor: color,
          background: `linear-gradient(135deg, ${color}, ${color}dd)`
        }}
      >
        <div className="absolute top-2 left-2 w-3 h-3 bg-white/40 rounded-full blur-sm"></div>
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-lg">
          {emoji}
        </div>
      </div>
      <div className="w-px h-12 bg-gray-600 mx-auto"></div>
      <div className="w-2 h-1 bg-gray-600 mx-auto rounded-full"></div>
    </div>
  </div>
);

const StarBurst = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      animation: `star-burst 3s ease-out ${delay}s forwards`,
      zIndex: 1002,
    }}
  >
    <Star className="w-8 h-8 text-yellow-400 animate-spin" />
  </div>
);

export const CelebrationPopup = ({ isOpen, onClose, saleAmount }: CelebrationPopupProps) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [showEffects, setShowEffects] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const randomMessage = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      setCurrentMessage(randomMessage);
      
      setShowEffects(true);
      setAnimationPhase(0);
      
      // Séquence d'animation époustouflante
      const phase1 = setTimeout(() => setAnimationPhase(1), 100);
      const phase2 = setTimeout(() => setAnimationPhase(2), 400);
      const phase3 = setTimeout(() => setAnimationPhase(3), 800);
      const phase4 = setTimeout(() => setAnimationPhase(4), 1200);
      
      // Fermer automatiquement après 4 secondes
      const autoClose = setTimeout(() => {
        setShowEffects(false);
        onClose();
      }, 6000);
      
      return () => {
        clearTimeout(phase1);
        clearTimeout(phase2);
        clearTimeout(phase3);
        clearTimeout(phase4);
        clearTimeout(autoClose);
      };
    } else {
      setShowEffects(false);
      setAnimationPhase(0);
    }
  }, [isOpen, onClose]);

  const confettiColors = [
    '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#FF8A80', '#C5E1A5', '#DDA0DD', '#98FB98', 
    '#F0E68C', '#FFA07A', '#87CEEB', '#DEB887', '#F5DEB3',
    '#FF69B4', '#00CED1', '#FF1493', '#00FF7F', '#FFB6C1'
  ];

  const balloonColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98FB98', '#FFA07A', '#87CEEB', '#FF69B4'
  ];

  const balloonEmojis = ['🎈', '🎊', '🎉', '⭐', '💫', '🌟', '✨', '🎯'];

  // Plus de confettis pour un effet plus spectaculaire
  const confettiParticles = Array.from({ length: 150 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    x: Math.random() * 100,
    y: Math.random() * 30,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    shape: ['circle', 'square', 'star'][Math.floor(Math.random() * 3)],
    size: 3 + Math.random() * 6
  }));

  // Plus de ballons
  const balloons = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    x: 5 + (i * 7.5) + Math.random() * 5,
    color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
    emoji: balloonEmojis[Math.floor(Math.random() * balloonEmojis.length)]
  }));

  // Feux d'artifice
  const fireworks = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: 0.5 + Math.random() * 2,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 40
  }));

  // Étoiles qui éclatent
  const starBursts = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    x: Math.random() * 100,
    y: Math.random() * 80
  }));

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="z-[9999] max-w-2xl mx-auto text-center border-0 bg-gradient-to-br from-background via-primary/5 to-success/10 shadow-2xl backdrop-blur-lg overflow-hidden">
          <DialogTitle className="sr-only">Célébration de vente</DialogTitle>
          
          <div className="space-y-8 py-12 relative overflow-hidden">
            {/* Effets de background ultra-dynamiques */}
            <div className="absolute inset-0 opacity-30">
              <div className={`absolute w-40 h-40 bg-gradient-to-r from-primary to-success rounded-full blur-3xl transition-all duration-1500 ${animationPhase >= 1 ? 'scale-150 opacity-60 animate-pulse' : 'scale-0 opacity-0'}`} style={{left: '10%', top: '10%'}} />
              <div className={`absolute w-32 h-32 bg-gradient-to-r from-warning to-orange rounded-full blur-2xl transition-all duration-1500 delay-300 ${animationPhase >= 2 ? 'scale-120 opacity-40 animate-bounce' : 'scale-0 opacity-0'}`} style={{right: '10%', top: '20%'}} />
              <div className={`absolute w-28 h-28 bg-gradient-to-r from-purple to-info rounded-full blur-xl transition-all duration-1500 delay-600 ${animationPhase >= 3 ? 'scale-110 opacity-50 animate-spin' : 'scale-0 opacity-0'}`} style={{left: '50%', bottom: '15%'}} />
              <div className={`absolute w-36 h-36 bg-gradient-to-r from-success to-primary rounded-full blur-2xl transition-all duration-1500 delay-900 ${animationPhase >= 4 ? 'scale-130 opacity-35 animate-pulse' : 'scale-0 opacity-0'}`} style={{right: '20%', bottom: '10%'}} />
            </div>

            {/* Icon central ultra-spectaculaire */}
            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
              {/* Anneaux d'énergie multiples */}
              <div className="absolute inset-0 bg-success/40 rounded-full animate-ping"></div>
              <div className="absolute inset-1 bg-primary/30 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
              <div className="absolute inset-2 bg-warning/20 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
              <div className="absolute inset-3 bg-info/20 rounded-full animate-pulse"></div>
              
              {/* Icon principal avec effet 3D */}
              <div className={`relative bg-gradient-to-br from-success via-primary to-success/80 rounded-full p-6 transition-all duration-1000 ${animationPhase >= 1 ? 'animate-mega-bounce shadow-2xl shadow-success/60 scale-110' : 'scale-0'}`}>
                <CheckCircle className="w-16 h-16 text-white animate-pulse drop-shadow-lg" />
                <div className="absolute -top-2 -right-2 animate-bounce">
                  <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
                </div>
                <div className="absolute -bottom-1 -left-1 animate-spin">
                  <Star className="w-6 h-6 text-yellow-300" />
                </div>
              </div>
              
              {/* Cercles d'expansion ultra-dynamiques */}
              <div className={`absolute inset-0 border-4 border-success/60 rounded-full transition-all duration-1500 ${animationPhase >= 2 ? 'scale-200 opacity-0' : 'scale-100 opacity-100'}`} />
              <div className={`absolute inset-0 border-2 border-primary/50 rounded-full transition-all duration-1800 delay-300 ${animationPhase >= 2 ? 'scale-250 opacity-0' : 'scale-100 opacity-100'}`} />
              <div className={`absolute inset-0 border border-warning/40 rounded-full transition-all duration-2000 delay-500 ${animationPhase >= 2 ? 'scale-300 opacity-0' : 'scale-100 opacity-100'}`} />
            </div>

            {/* Messages avec animations séquentielles époustouflantes */}
            <div className="space-y-6 relative z-10">
              <div className={`text-5xl font-black bg-gradient-to-r from-success via-primary to-warning bg-clip-text text-transparent transition-all duration-800 ${animationPhase >= 1 ? 'animate-mega-bounce-in translate-y-0 scale-100' : 'translate-y-8 opacity-0 scale-75'}`}>
                VENTE VALIDÉE !
              </div>
              
              <div className={`text-2xl font-bold text-primary transition-all duration-1000 delay-400 ${animationPhase >= 2 ? 'animate-slide-in-rainbow translate-y-0' : 'translate-y-6 opacity-0'}`}>
                {currentMessage}
              </div>
              
              <div className={`flex items-center justify-center gap-4 transition-all duration-1200 delay-800 ${animationPhase >= 3 ? 'animate-mega-scale-in translate-y-0' : 'translate-y-6 opacity-0'}`}>
                <div className="flex items-center gap-2 bg-gradient-to-r from-success to-primary text-white px-8 py-4 rounded-2xl shadow-2xl shadow-success/40 animate-pulse">
                  <Zap className="w-8 h-8 animate-bounce" />
                  <span className="text-3xl font-black">+{saleAmount.toFixed(2)} €</span>
                  <PartyPopper className="w-8 h-8 animate-bounce" style={{animationDelay: '200ms'}} />
                </div>
              </div>

              {/* Étoiles flottantes autour du montant */}
              <div className={`absolute inset-0 transition-all duration-1000 delay-1000 ${animationPhase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-float-star"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${30 + Math.random() * 40}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 2}s`
                    }}
                  >
                    <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Effets visuels ultra-spectaculaires */}
      {showEffects && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {/* Confettis explosifs */}
          {confettiParticles.map((particle) => (
            <ConfettiParticle
              key={particle.id}
              delay={particle.delay}
              x={particle.x}
              y={particle.y}
              color={particle.color}
              shape={particle.shape}
              size={particle.size}
            />
          ))}
          
          {/* Ballons magiques */}
          {balloons.map((balloon) => (
            <FloatingBalloon
              key={balloon.id}
              delay={balloon.delay}
              x={balloon.x}
              color={balloon.color}
              emoji={balloon.emoji}
            />
          ))}
          
          {/* Feux d'artifice */}
          {fireworks.map((firework) => (
            <Firework
              key={firework.id}
              delay={firework.delay}
              x={firework.x}
              y={firework.y}
            />
          ))}
          
          {/* Étoiles qui éclatent */}
          {starBursts.map((star) => (
            <StarBurst
              key={star.id}
              delay={star.delay}
              x={star.x}
              y={star.y}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes confetti-explosion {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg) scale(0);
            opacity: 1;
          }
          10% {
            transform: translateY(-60px) translateX(${Math.random() > 0.5 ? '' : '-'}20px) rotate(90deg) scale(1);
            opacity: 1;
          }
          25% {
            transform: translateY(-140px) translateX(${Math.random() > 0.5 ? '' : '-'}60px) rotate(270deg) scale(1.2);
            opacity: 1;
          }
          50% {
            transform: translateY(-180px) translateX(${Math.random() > 0.5 ? '' : '-'}100px) rotate(450deg) scale(1);
            opacity: 0.9;
          }
          75% {
            transform: translateY(-120px) translateX(${Math.random() > 0.5 ? '' : '-'}140px) rotate(630deg) scale(0.8);
            opacity: 0.6;
          }
          100% {
            transform: translateY(120vh) translateX(${Math.random() > 0.5 ? '' : '-'}200px) rotate(900deg) scale(0.2);
            opacity: 0;
          }
        }

        @keyframes balloon-rise {
          0% {
            transform: translateY(0) scale(0) rotate(0deg);
            opacity: 0;
          }
          15% {
            transform: translateY(-80px) scale(1) rotate(5deg);
            opacity: 1;
          }
          30% {
            transform: translateY(-160px) scale(1.1) rotate(-3deg);
            opacity: 1;
          }
          60% {
            transform: translateY(-300px) scale(1) rotate(2deg);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-120vh) scale(0.6) rotate(-10deg);
            opacity: 0;
          }
        }

        @keyframes firework-burst {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          20% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }

        @keyframes star-burst {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(2) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(4) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes mega-bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0) scale(1);
          }
          40%, 43% {
            transform: translate3d(0,-30px,0) scale(1.1);
          }
          70% {
            transform: translate3d(0,-15px,0) scale(1.05);
          }
          90% {
            transform: translate3d(0,-4px,0) scale(1.02);
          }
        }

        @keyframes mega-bounce-in {
          0% {
            transform: scale(0.3) translateY(100px);
            opacity: 0;
          }
          50% {
            transform: scale(1.05) translateY(-10px);
            opacity: 1;
          }
          70% {
            transform: scale(0.9) translateY(0px);
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0px);
            opacity: 1;
          }
        }

        @keyframes slide-in-rainbow {
          0% {
            transform: translateX(-100px) scale(0.8);
            opacity: 0;
          }
          50% {
            transform: translateX(10px) scale(1.05);
            opacity: 1;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes mega-scale-in {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes float-star {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        .animate-mega-bounce {
          animation: mega-bounce 2s infinite;
        }

        .animate-mega-bounce-in {
          animation: mega-bounce-in 1s ease-out forwards;
        }

        .animate-slide-in-rainbow {
          animation: slide-in-rainbow 1s ease-out forwards;
        }

        .animate-mega-scale-in {
          animation: mega-scale-in 1.2s ease-out forwards;
        }

        .animate-float-star {
          animation: float-star 3s ease-in-out infinite;
        }

        ${Array.from({ length: 12 }).map((_, i) => `
          @keyframes spark-${i} {
            0% {
              transform: rotate(${i * 30}deg) translateY(0) scale(1);
              opacity: 1;
            }
            100% {
              transform: rotate(${i * 30}deg) translateY(-40px) scale(0);
              opacity: 0;
            }
          }
        `).join('')}
      `}</style>
    </>
  );
};