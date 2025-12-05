import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, CircleCheck as CheckCircle, Trophy, Star, Zap, Target, Gift, Flame, Rocket, Crown, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useSales } from '@/hooks/useSales';
import { format } from 'date-fns';

interface CelebrationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  saleAmount: number;
}

// Messages personnalisés avec prénom
const getPersonalizedMessages = (firstName: string) => [
  `🎉 Bravo ${firstName} ! Encore une vente de plus !`,
  `🚀 Excellent travail ${firstName} ! Tu es en feu !`,
  `⭐ Fantastique ${firstName} ! Continue comme ça !`,
  `🏆 Champion ${firstName} ! Une vente de plus au compteur !`,
  `💪 Super boulot ${firstName} ! Tu assures !`,
  `🎯 Parfait ${firstName} ! Objectif en vue !`,
  `🌟 Magnifique ${firstName} ! Tu es au top !`,
  `🔥 Incroyable ${firstName} ! Quel talent !`,
  `💎 Exceptionnel ${firstName} ! Tu brilles !`,
  `🎊 Génial ${firstName} ! Quelle performance !`,
  `⚡ Formidable ${firstName} ! Tu déchires !`,
  `🎈 Superbe ${firstName} ! Continue l'élan !`,
  `🏅 Remarquable ${firstName} ! Tu es un pro !`,
  `✨ Éblouissant ${firstName} ! Quel succès !`,
  `🎪 Spectaculaire ${firstName} ! Bravo l'artiste !`,
  `👑 Roi/Reine du jour ${firstName} ! Impressionnant !`,
  `🌈 ${firstName}, tu illumines la journée !`,
  `💫 ${firstName}, une étoile montante !`,
];

// Messages bonus selon la progression
const getBonusMessages = (salesCount: number, objective: number, totalCommission: number) => {
  const remaining = objective - salesCount;
  const progressPercent = (salesCount / objective) * 100;
  
  if (salesCount >= objective) {
    return [
      `🏆 OBJECTIF DÉPASSÉ ! Tu es une machine à vendre !`,
      `👑 Tu as explosé ton objectif ! La prime te tend les bras !`,
      `🎯 Objectif atteint et dépassé ! Tu mérites une médaille !`,
      `💰 ${totalCommission.toFixed(2)}€ de commission aujourd'hui ! Incroyable !`,
      `🚀 Tu es inarrêtable ! Continue sur cette lancée !`,
    ];
  } else if (remaining === 1) {
    return [
      `🔥 Plus qu'UNE vente pour l'objectif ! Tu y es presque !`,
      `⚡ UNE seule vente te sépare de la victoire !`,
      `🎯 Le finish est à portée de main ! GO GO GO !`,
      `💪 Dernière ligne droite ! Tu vas y arriver !`,
    ];
  } else if (remaining <= 3) {
    return [
      `🎯 Plus que ${remaining} ventes pour l'objectif ! Tu peux le faire !`,
      `💪 ${remaining} ventes et c'est gagné ! Allez ${remaining} de plus !`,
      `🔥 Tu touches au but ! Encore ${remaining} et c'est la fête !`,
      `⭐ ${remaining} ventes = Objectif validé + Bonus potentiel !`,
    ];
  } else if (progressPercent >= 50) {
    return [
      `📈 Tu as dépassé la moitié de ton objectif ! Continue !`,
      `💪 ${salesCount}/${objective} ventes ! Tu es sur la bonne voie !`,
      `🎯 Plus que ${remaining} ventes ! Le bonus t'attend !`,
      `⚡ Mi-parcours dépassé ! La fin de journée s'annonce bien !`,
    ];
  } else if (progressPercent >= 25) {
    return [
      `🌱 Bon début ! ${salesCount}/${objective}, continue comme ça !`,
      `💫 Tu as fait ${progressPercent.toFixed(0)}% de ton objectif ! Bien joué !`,
      `🚀 En route vers l'objectif ! Chaque vente compte !`,
    ];
  }
  
  return [
    `💫 Chaque vente te rapproche du bonus !`,
    `🎯 Continue ainsi, l'objectif est atteignable !`,
    `💪 Tu construis ta réussite vente après vente !`,
  ];
};

// Messages d'encouragement aléatoires
const ENCOURAGEMENT_MESSAGES = [
  "Tu es sur la voie du succès ! 🛤️",
  "Les meilleurs vendeurs font exactement ça ! 📊",
  "Ta détermination paie ! 💎",
  "Les clients t'adorent ! ❤️",
  "Tu fais la différence ! ⭐",
  "Ton énergie est contagieuse ! ⚡",
  "Tu inspires toute l'équipe ! 👏",
  "Rien ne peut t'arrêter ! 🚀",
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
  const [bonusMessage, setBonusMessage] = useState('');
  const [encouragementMessage, setEncouragementMessage] = useState('');
  const [showEffects, setShowEffects] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  
  const { profile } = useAuth();
  const { settings } = useAppSettings();
  const { sales } = useSales();

  const firstName = profile?.full_name?.split(' ')[0] || 'Champion';
  const dailyObjective = settings.daily_objective || 5;

  // Calcul des ventes du jour
  const todaySalesCount = sales.filter(
    sale => sale.sale_date === format(new Date(), 'yyyy-MM-dd')
  ).length;
  
  const todayCommission = sales
    .filter(sale => sale.sale_date === format(new Date(), 'yyyy-MM-dd'))
    .reduce((sum, sale) => sum + (sale.commission || 0), 0);

  useEffect(() => {
    if (isOpen) {
      // Message personnalisé avec prénom
      const personalizedMessages = getPersonalizedMessages(firstName);
      const randomPersonalMessage = personalizedMessages[Math.floor(Math.random() * personalizedMessages.length)];
      setCurrentMessage(randomPersonalMessage);
      
      // Message bonus selon la progression
      const bonusMessages = getBonusMessages(todaySalesCount + 1, dailyObjective, todayCommission + saleAmount);
      const randomBonusMessage = bonusMessages[Math.floor(Math.random() * bonusMessages.length)];
      setBonusMessage(randomBonusMessage);
      
      // Message d'encouragement
      const randomEncouragement = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
      setEncouragementMessage(randomEncouragement);
      
      setShowEffects(true);
      setAnimationPhase(0);
      
      // Séquence d'animation
      const phase1 = setTimeout(() => setAnimationPhase(1), 100);
      const phase2 = setTimeout(() => setAnimationPhase(2), 400);
      const phase3 = setTimeout(() => setAnimationPhase(3), 800);
      const phase4 = setTimeout(() => setAnimationPhase(4), 1200);
      
      return () => {
        clearTimeout(phase1);
        clearTimeout(phase2);
        clearTimeout(phase3);
        clearTimeout(phase4);
      };
    } else {
      setShowEffects(false);
      setAnimationPhase(0);
    }
  }, [isOpen, firstName, todaySalesCount, dailyObjective, todayCommission, saleAmount]);

  const handleClose = () => {
    setShowEffects(false);
    onClose();
  };

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

  const balloonEmojis = ['🎈', '🎊', '🎉', '⭐', '💫', '🌟', '✨', '🎯', '💰', '🏆'];

  const confettiParticles = Array.from({ length: 150 }, (_, i) => ({
    id: i,
    delay: Math.random() * 2,
    x: Math.random() * 100,
    y: Math.random() * 30,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    shape: ['circle', 'square', 'star'][Math.floor(Math.random() * 3)],
    size: 3 + Math.random() * 6
  }));

  const balloons = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    x: 5 + (i * 7.5) + Math.random() * 5,
    color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
    emoji: balloonEmojis[Math.floor(Math.random() * balloonEmojis.length)]
  }));

  const starBursts = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: Math.random() * 3,
    x: Math.random() * 100,
    y: Math.random() * 80
  }));

  const isObjectiveReached = todaySalesCount + 1 >= dailyObjective;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="z-[9999] max-w-2xl mx-auto text-center border-0 bg-gradient-to-br from-background via-primary/5 to-success/10 shadow-2xl backdrop-blur-lg overflow-hidden">
          <DialogTitle className="sr-only">Célébration de vente</DialogTitle>
          
          <div className="space-y-6 py-10 relative overflow-hidden">
            {/* Effets de background */}
            <div className="absolute inset-0 opacity-30">
              <div className={`absolute w-40 h-40 bg-gradient-to-r from-primary to-success rounded-full blur-3xl transition-all duration-1500 ${animationPhase >= 1 ? 'scale-150 opacity-60 animate-pulse' : 'scale-0 opacity-0'}`} style={{left: '10%', top: '10%'}} />
              <div className={`absolute w-32 h-32 bg-gradient-to-r from-warning to-orange rounded-full blur-2xl transition-all duration-1500 delay-300 ${animationPhase >= 2 ? 'scale-120 opacity-40 animate-bounce' : 'scale-0 opacity-0'}`} style={{right: '10%', top: '20%'}} />
              <div className={`absolute w-28 h-28 bg-gradient-to-r from-purple to-info rounded-full blur-xl transition-all duration-1500 delay-600 ${animationPhase >= 3 ? 'scale-110 opacity-50' : 'scale-0 opacity-0'}`} style={{left: '50%', bottom: '15%'}} />
            </div>

            {/* Icon central */}
            <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 bg-success/40 rounded-full animate-ping"></div>
              <div className="absolute inset-1 bg-primary/30 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
              
              <div className={`relative bg-gradient-to-br from-success via-primary to-success/80 rounded-full p-5 transition-all duration-1000 ${animationPhase >= 1 ? 'animate-mega-bounce shadow-2xl shadow-success/60 scale-110' : 'scale-0'}`}>
                {isObjectiveReached ? (
                  <Crown className="w-14 h-14 text-yellow-300 animate-pulse drop-shadow-lg" />
                ) : (
                  <CheckCircle className="w-14 h-14 text-white animate-pulse drop-shadow-lg" />
                )}
                <div className="absolute -top-2 -right-2 animate-bounce">
                  <Trophy className="w-7 h-7 text-yellow-400 drop-shadow-lg" />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4 relative z-10">
              <div className={`text-4xl font-black bg-gradient-to-r from-success via-primary to-warning bg-clip-text text-transparent transition-all duration-800 ${animationPhase >= 1 ? 'animate-mega-bounce-in translate-y-0 scale-100' : 'translate-y-8 opacity-0 scale-75'}`}>
                {isObjectiveReached ? '🏆 OBJECTIF ATTEINT !' : 'VENTE VALIDÉE !'}
              </div>
              
              {/* Message personnalisé */}
              <div className={`text-xl font-bold text-primary transition-all duration-1000 delay-200 ${animationPhase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                {currentMessage}
              </div>
              
              {/* Montant */}
              <div className={`flex items-center justify-center gap-3 transition-all duration-1200 delay-400 ${animationPhase >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                <div className="flex items-center gap-2 bg-gradient-to-r from-success to-primary text-white px-6 py-3 rounded-2xl shadow-2xl shadow-success/40 animate-pulse">
                  <Zap className="w-7 h-7 animate-bounce" />
                  <span className="text-2xl font-black">+{saleAmount.toFixed(2)} €</span>
                  <PartyPopper className="w-7 h-7 animate-bounce" style={{animationDelay: '200ms'}} />
                </div>
              </div>

              {/* Message bonus */}
              <div className={`transition-all duration-1000 delay-600 ${animationPhase >= 4 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-700 dark:text-yellow-300 px-4 py-2 rounded-xl border border-yellow-500/30">
                  <Gift className="w-5 h-5 animate-bounce" />
                  <span className="text-sm font-semibold">{bonusMessage}</span>
                </div>
              </div>

              {/* Progression */}
              <div className={`flex items-center justify-center gap-2 text-sm text-muted-foreground transition-all duration-1000 delay-800 ${animationPhase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
                <Target className="w-4 h-4" />
                <span>
                  Progression : <span className="font-bold text-primary">{todaySalesCount + 1}</span> / {dailyObjective} ventes
                </span>
                {isObjectiveReached && <Flame className="w-4 h-4 text-orange-500 animate-pulse" />}
              </div>

              {/* Message d'encouragement */}
              <div className={`text-sm italic text-muted-foreground transition-all duration-1000 delay-1000 ${animationPhase >= 4 ? 'opacity-100' : 'opacity-0'}`}>
                {encouragementMessage}
              </div>

              {/* Bouton Continuer */}
              <div className={`pt-4 transition-all duration-1000 delay-1200 ${animationPhase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <Button 
                  onClick={handleClose}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-success hover:from-primary/90 hover:to-success/90 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  Continuer les ventes
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Effets visuels */}
      {showEffects && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
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
          
          {balloons.map((balloon) => (
            <FloatingBalloon
              key={balloon.id}
              delay={balloon.delay}
              x={balloon.x}
              color={balloon.color}
              emoji={balloon.emoji}
            />
          ))}
          
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

        .animate-mega-bounce {
          animation: mega-bounce 1s ease infinite;
        }

        .animate-mega-bounce-in {
          animation: mega-bounce-in 0.8s ease-out forwards;
        }
      `}</style>
    </>
  );
};
