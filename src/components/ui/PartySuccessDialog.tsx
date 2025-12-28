/**
 * Party Success Dialog Component
 * Shows success messages with party animation (confetti, emojis, etc.)
 */

import { useEffect, useState, useCallback } from 'react';

interface PartySuccessDialogProps {
  isOpen: boolean;
  message?: string;
  onClose: () => void;
  duration?: number; // Auto-close duration in milliseconds
}

export default function PartySuccessDialog({ 
  isOpen, 
  message = "Thank you! We will be in touch very soon!", 
  onClose, 
  duration = 6000 
}: PartySuccessDialogProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number; color: string; rotation: number }>>([]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  }, [onClose]);

  // Generate confetti particles
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      
      // Generate confetti particles
      const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'] as const;
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        delay: Math.random() * 1000,
        duration: 2 + Math.random() * 2,
        rotation: Math.random() * 360,
        color: colors[Math.floor(Math.random() * colors.length)] || colors[0]
      }));
      setConfetti(particles);
      
      // Auto-close after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      setConfetti([]);
      return undefined;
    }
  }, [isOpen, duration, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {/* Confetti particles */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            animation: `confetti-fall ${particle.duration}s ease-out ${particle.delay}ms forwards`,
            boxShadow: `0 0 6px ${particle.color}`,
          }}
        />
      ))}

      {/* Emoji confetti */}
      {confetti.slice(0, 20).map((particle) => {
        const emoji = ['🎉', '✨', '🎊', '🚀', '⭐'][particle.id % 5];
        return (
          <div
            key={`emoji-${particle.id}`}
            className="absolute text-2xl pointer-events-none"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animation: `confetti-fall ${particle.duration + 0.5}s ease-out ${particle.delay + 200}ms forwards`,
              transform: `rotate(${particle.rotation}deg)`,
            }}
          >
            {emoji}
          </div>
        );
      })}

      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Dialog Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className={`
            glass-card bg-gradient-to-br from-purple-50 to-pink-50 backdrop-blur-xl border-2 border-purple-200/50 
            text-gray-900 px-8 py-8 rounded-3xl shadow-2xl max-w-md w-full
            transform transition-all duration-500 pointer-events-auto
            ${isVisible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-4 opacity-0 scale-95'
            }
          `}
        >
          {/* Party Icon with animation */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-4xl">🎉</span>
              </div>
              {/* Pulsing ring effect */}
              <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-20"></div>
            </div>
            
            {/* Message */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Thank You!
            </h3>
            <p className="text-gray-700 font-medium text-center text-base leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Close Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleClose}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Awesome! 🚀
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animation for confetti */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes confetti-fall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `
      }} />
    </div>
  );
}

