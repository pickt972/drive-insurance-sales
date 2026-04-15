import React, { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Trophy, Flame, Rocket, Star, Zap, Diamond, Medal, Sparkles, ArrowRight } from 'lucide-react';

interface MilestoneCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneName?: string;
  milestonePercent?: number;
  employeeName?: string;
}

const MILESTONE_MESSAGES = [
  '🏆 PALIER ATTEINT ! Tu es une légende !',
  '👑 NIVEAU SUPÉRIEUR DÉBLOQUÉ !',
  '🔥 PALIER EXPLOSÉ ! Inarrêtable !',
  '💎 PERFORMANCE EXCEPTIONNELLE !',
  '⚡ MILESTONE UNLOCK ! Record battu !',
  '🌟 PALIER FRANCHI ! Standing ovation !',
];

const SUB_MESSAGES = [
  "Tu repousses les limites du possible !",
  "L'excellence n'a jamais été aussi proche !",
  "Ton talent illumine toute l'équipe !",
  "Les sommets n'ont pas fini de trembler !",
  "Un véritable prodige de la vente !",
  "La prochaine étape t'attend déjà !",
];

// Firework burst particle
const FireworkParticle = ({ cx, cy, angle, color, delay, distance }: {
  cx: number; cy: number; angle: number; color: string; delay: number; distance: number;
}) => {
  const rad = (angle * Math.PI) / 180;
  const tx = Math.cos(rad) * distance;
  const ty = Math.sin(rad) * distance;
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: `${cx}%`,
        top: `${cy}%`,
        width: 6,
        height: 6,
        backgroundColor: color,
        boxShadow: `0 0 8px 2px ${color}`,
        animation: `firework-particle 1.8s ease-out ${delay}s forwards`,
        '--tx': `${tx}px`,
        '--ty': `${ty}px`,
      } as React.CSSProperties}
    />
  );
};

// Shooting star
const ShootingStar = ({ delay, startX, startY }: { delay: number; startX: number; startY: number }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${startX}%`,
      top: `${startY}%`,
      animation: `shooting-star 1.2s ease-in ${delay}s forwards`,
    }}
  >
    <div className="w-2 h-2 bg-yellow-300 rounded-full shadow-[0_0_12px_4px_rgba(253,224,71,0.8)]" />
    <div className="absolute top-0 right-full w-16 h-0.5 bg-gradient-to-l from-yellow-300 to-transparent" />
  </div>
);

// Golden rain drop
const GoldenDrop = ({ delay, x }: { delay: number; x: number }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${x}%`,
      top: '-5%',
      animation: `golden-rain 3s linear ${delay}s forwards`,
    }}
  >
    <div className="w-1.5 h-4 bg-gradient-to-b from-yellow-300 via-amber-400 to-transparent rounded-full opacity-80" />
  </div>
);

// Lightning bolt
const LightningBolt = ({ delay, x }: { delay: number; x: number }) => (
  <div
    className="absolute pointer-events-none text-4xl"
    style={{
      left: `${x}%`,
      top: '10%',
      animation: `lightning-flash 0.6s ease-out ${delay}s forwards`,
      filter: 'drop-shadow(0 0 20px rgba(253,224,71,0.9))',
    }}
  >
    ⚡
  </div>
);

// Spinning trophy
const SpinningEmoji = ({ delay, x, y, emoji, size }: { delay: number; x: number; y: number; emoji: string; size: number }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      fontSize: size,
      animation: `spin-fly 3s ease-out ${delay}s forwards`,
    }}
  >
    {emoji}
  </div>
);

export const MilestoneCelebration = ({ isOpen, onClose, milestoneName, milestonePercent = 100, employeeName }: MilestoneCelebrationProps) => {
  const [phase, setPhase] = useState(0);
  const [showEffects, setShowEffects] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);

  const mainMessage = MILESTONE_MESSAGES[Math.floor(Math.random() * MILESTONE_MESSAGES.length)];
  const subMessage = SUB_MESSAGES[Math.floor(Math.random() * SUB_MESSAGES.length)];

  useEffect(() => {
    if (isOpen) {
      setShowEffects(true);
      setPhase(0);
      setScreenFlash(true);
      setShakeScreen(true);

      const timers = [
        setTimeout(() => setScreenFlash(false), 400),
        setTimeout(() => setPhase(1), 200),
        setTimeout(() => setShakeScreen(false), 1500),
        setTimeout(() => { setScreenFlash(true); setTimeout(() => setScreenFlash(false), 200); }, 800),
        setTimeout(() => setPhase(2), 600),
        setTimeout(() => setPhase(3), 1000),
        setTimeout(() => setPhase(4), 1500),
        setTimeout(() => setPhase(5), 2000),
      ];
      return () => timers.forEach(clearTimeout);
    } else {
      setShowEffects(false);
      setPhase(0);
      setScreenFlash(false);
      setShakeScreen(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setShowEffects(false);
    onClose();
  }, [onClose]);

  // Generate fireworks (3 bursts at different positions)
  const fireworks = [
    { cx: 20, cy: 25, delay: 0.3 },
    { cx: 80, cy: 20, delay: 0.8 },
    { cx: 50, cy: 15, delay: 1.3 },
    { cx: 15, cy: 50, delay: 1.8 },
    { cx: 85, cy: 45, delay: 2.2 },
  ];

  const fireworkColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4', '#00FF7F', '#FF4500', '#7B68EE', '#00CED1'];

  const fireworkParticles = fireworks.flatMap((fw, fwIdx) =>
    Array.from({ length: 24 }, (_, i) => ({
      key: `fw-${fwIdx}-${i}`,
      cx: fw.cx,
      cy: fw.cy,
      angle: (360 / 24) * i + Math.random() * 10,
      color: fireworkColors[Math.floor(Math.random() * fireworkColors.length)],
      delay: fw.delay + Math.random() * 0.2,
      distance: 80 + Math.random() * 120,
    }))
  );

  const shootingStars = Array.from({ length: 8 }, (_, i) => ({
    key: `ss-${i}`,
    delay: 0.5 + i * 0.4,
    startX: Math.random() * 60,
    startY: Math.random() * 40,
  }));

  const goldenDrops = Array.from({ length: 60 }, (_, i) => ({
    key: `gd-${i}`,
    delay: Math.random() * 4,
    x: Math.random() * 100,
  }));

  const lightnings = Array.from({ length: 6 }, (_, i) => ({
    key: `lt-${i}`,
    delay: 0.2 + i * 0.5,
    x: 10 + Math.random() * 80,
  }));

  const flyingEmojis = ['🏆', '👑', '💎', '⭐', '🔥', '🚀', '🎯', '💰', '🥇', '🌟', '✨', '🎆', '🎇', '💫', '🎊'];
  const spinningEmojis = Array.from({ length: 20 }, (_, i) => ({
    key: `se-${i}`,
    delay: Math.random() * 3,
    x: Math.random() * 100,
    y: Math.random() * 100,
    emoji: flyingEmojis[Math.floor(Math.random() * flyingEmojis.length)],
    size: 16 + Math.random() * 24,
  }));

  const getMilestoneLabel = () => {
    if (milestonePercent >= 150) return '🔥 LÉGENDE ABSOLUE 🔥';
    if (milestonePercent >= 125) return '💎 PERFORMANCE DIAMANT 💎';
    if (milestonePercent >= 100) return '🏆 OBJECTIF CONQUIS 🏆';
    if (milestonePercent >= 75) return '⚡ PALIER 75% ⚡';
    if (milestonePercent >= 50) return '🎯 MI-PARCOURS ATTEINT 🎯';
    return '🌟 PALIER DÉBLOQUÉ 🌟';
  };

  return (
    <>
      {/* Screen flash overlay */}
      {screenFlash && (
        <div className="fixed inset-0 z-[10001] pointer-events-none bg-white/60 animate-pulse" />
      )}

      {/* Screen shake wrapper */}
      <div className={shakeScreen ? 'animate-screen-shake' : ''}>
        <Dialog open={isOpen} onOpenChange={() => {}}>
          <DialogContent className="z-[9999] max-w-2xl mx-auto text-center border-0 bg-gradient-to-br from-yellow-900/20 via-background to-amber-900/20 shadow-[0_0_80px_20px_rgba(255,215,0,0.3)] backdrop-blur-xl overflow-hidden">
            <DialogTitle className="sr-only">Célébration de palier</DialogTitle>

            <div className="space-y-6 py-8 relative overflow-hidden">
              {/* Animated golden border glow */}
              <div className="absolute inset-0 rounded-xl opacity-60 pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, #FFD700, #FF6B6B, #4ECDC4, #FF69B4, #FFD700)',
                  filter: 'blur(30px)',
                  animation: 'rotate-glow 3s linear infinite',
                }} />

              {/* Pulsing rings */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-64 h-64 rounded-full border-4 border-yellow-400/40 transition-all duration-1000 ${phase >= 1 ? 'scale-150 opacity-0' : 'scale-50 opacity-100'}`}
                  style={{ animation: phase >= 1 ? 'ring-expand 2s ease-out infinite' : 'none' }} />
                <div className={`absolute w-48 h-48 rounded-full border-4 border-amber-300/30 transition-all duration-1000 ${phase >= 2 ? 'scale-150 opacity-0' : 'scale-50 opacity-100'}`}
                  style={{ animation: phase >= 2 ? 'ring-expand 2s ease-out 0.5s infinite' : 'none' }} />
              </div>

              {/* Central icon - Crown with epic animation */}
              <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 bg-yellow-400/50 rounded-full animate-ping" />
                <div className="absolute inset-2 bg-amber-500/40 rounded-full animate-ping" style={{ animationDelay: '0.3s' }} />
                <div className="absolute inset-4 bg-orange-400/30 rounded-full animate-ping" style={{ animationDelay: '0.6s' }} />

                <div className={`relative transition-all duration-1000 ${phase >= 1 ? 'scale-100' : 'scale-0'}`}>
                  <div className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-full p-6 shadow-[0_0_60px_15px_rgba(255,215,0,0.5)]"
                    style={{ animation: phase >= 1 ? 'mega-bounce 1s ease infinite, crown-glow 2s ease-in-out infinite' : 'none' }}>
                    <Crown className="w-16 h-16 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  </div>
                  {/* Orbiting stars */}
                  <div className="absolute inset-0" style={{ animation: 'orbit 3s linear infinite' }}>
                    <Star className="absolute -top-4 left-1/2 w-6 h-6 text-yellow-300 fill-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
                  </div>
                  <div className="absolute inset-0" style={{ animation: 'orbit 3s linear infinite reverse' }}>
                    <Diamond className="absolute -bottom-4 left-1/2 w-5 h-5 text-cyan-300 fill-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
                  </div>
                  <div className="absolute inset-0" style={{ animation: 'orbit 4s linear 1s infinite' }}>
                    <Sparkles className="absolute top-1/2 -right-5 w-5 h-5 text-pink-300 drop-shadow-[0_0_8px_rgba(249,168,212,0.8)]" />
                  </div>
                </div>
              </div>

              {/* Milestone label */}
              <div className={`relative z-10 transition-all duration-800 ${phase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                <div className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-yellow-500/30 via-amber-500/20 to-orange-500/30 border border-yellow-400/50 backdrop-blur-sm"
                  style={{ animation: phase >= 2 ? 'pulse-glow 2s ease-in-out infinite' : 'none' }}>
                  <span className="text-sm font-black tracking-widest text-yellow-600 dark:text-yellow-300 uppercase">
                    {getMilestoneLabel()}
                  </span>
                </div>
              </div>

              {/* Main message */}
              <div className={`relative z-10 space-y-4 transition-all duration-1000 ${phase >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                <h2 className="text-3xl sm:text-4xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #FF6B6B, #FFD700, #4ECDC4, #FFD700)',
                    backgroundSize: '300% 300%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'gradient-shift 3s ease infinite',
                  }}>
                  {mainMessage}
                </h2>

                {employeeName && (
                  <div className={`transition-all duration-1000 delay-200 ${phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <span className="text-xl font-bold text-primary">
                      👏 Bravo {employeeName} ! 👏
                    </span>
                  </div>
                )}

                {milestoneName && (
                  <div className={`transition-all duration-1000 delay-300 ${phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-amber-500/20 px-5 py-3 rounded-2xl border border-primary/30">
                      <Medal className="w-6 h-6 text-yellow-500 animate-bounce" />
                      <span className="text-lg font-bold text-foreground">{milestoneName}</span>
                      <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" style={{ animationDelay: '200ms' }} />
                    </div>
                  </div>
                )}

                {milestonePercent && (
                  <div className={`transition-all duration-1000 delay-500 ${phase >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="flex items-center justify-center gap-3">
                      <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
                      <span className="text-5xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent"
                        style={{ animation: 'number-pop 0.5s ease-out forwards', textShadow: '0 0 40px rgba(255,100,0,0.3)' }}>
                        {milestonePercent}%
                      </span>
                      <Flame className="w-8 h-8 text-orange-500 animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                <p className={`text-base text-muted-foreground italic transition-all duration-1000 delay-700 ${phase >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                  {subMessage}
                </p>

                <div className={`pt-4 transition-all duration-1000 delay-1000 ${phase >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <Button
                    onClick={handleClose}
                    size="lg"
                    className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:via-amber-400 hover:to-orange-400 text-white font-black px-10 py-4 rounded-2xl shadow-[0_0_30px_5px_rgba(255,215,0,0.4)] hover:shadow-[0_0_40px_10px_rgba(255,215,0,0.6)] transition-all duration-300 gap-2 text-lg"
                  >
                    <Rocket className="w-6 h-6" />
                    Continuer l'ascension
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Full-screen effects */}
      {showEffects && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {/* Firework particles */}
          {fireworkParticles.map((p) => (
            <FireworkParticle key={p.key} {...p} />
          ))}

          {/* Shooting stars */}
          {shootingStars.map((s) => (
            <ShootingStar key={s.key} {...s} />
          ))}

          {/* Golden rain */}
          {goldenDrops.map((d) => (
            <GoldenDrop key={d.key} {...d} />
          ))}

          {/* Lightning bolts */}
          {lightnings.map((l) => (
            <LightningBolt key={l.key} {...l} />
          ))}

          {/* Spinning emojis */}
          {spinningEmojis.map((e) => (
            <SpinningEmoji key={e.key} {...e} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes firework-particle {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 1;
          }
          20% {
            transform: translate(calc(var(--tx) * 0.4), calc(var(--ty) * 0.4)) scale(1.5);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }

        @keyframes shooting-star {
          0% {
            transform: translate(0, 0) rotate(-45deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate(300px, 300px) rotate(-45deg);
            opacity: 0;
          }
        }

        @keyframes golden-rain {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(120vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes lightning-flash {
          0% {
            transform: translateY(-20px) scale(0);
            opacity: 0;
          }
          20% {
            transform: translateY(0) scale(2);
            opacity: 1;
          }
          40% {
            opacity: 0;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: translateY(20px) scale(0);
            opacity: 0;
          }
        }

        @keyframes spin-fly {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          20% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
          80% {
            transform: scale(1) rotate(540deg);
            opacity: 0.6;
          }
          100% {
            transform: scale(0) rotate(720deg) translateY(-100px);
            opacity: 0;
          }
        }

        @keyframes rotate-glow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes ring-expand {
          0% {
            transform: scale(0.5);
            opacity: 0.6;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        @keyframes orbit {
          from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
        }

        @keyframes crown-glow {
          0%, 100% {
            box-shadow: 0 0 30px 10px rgba(255, 215, 0, 0.4);
          }
          50% {
            box-shadow: 0 0 60px 20px rgba(255, 215, 0, 0.7);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 10px 2px rgba(255, 215, 0, 0.3);
          }
          50% {
            box-shadow: 0 0 25px 8px rgba(255, 215, 0, 0.5);
          }
        }

        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes number-pop {
          0% { transform: scale(0.3); }
          50% { transform: scale(1.3); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }

        .animate-screen-shake {
          animation: screen-shake 0.5s ease-in-out 3;
        }

        @keyframes screen-shake {
          0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
          10% { transform: translateX(-4px) translateY(2px) rotate(-0.5deg); }
          20% { transform: translateX(6px) translateY(-3px) rotate(0.5deg); }
          30% { transform: translateX(-8px) translateY(1px) rotate(-1deg); }
          40% { transform: translateX(4px) translateY(-2px) rotate(0.5deg); }
          50% { transform: translateX(-2px) translateY(3px) rotate(-0.5deg); }
          60% { transform: translateX(6px) translateY(-1px) rotate(0.3deg); }
          70% { transform: translateX(-3px) translateY(2px) rotate(-0.3deg); }
          80% { transform: translateX(2px) translateY(-1px) rotate(0.2deg); }
          90% { transform: translateX(-1px) translateY(1px) rotate(-0.1deg); }
        }
      `}</style>
    </>
  );
};
