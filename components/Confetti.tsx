
import React from 'react';

// Using a simple CSS-based confetti effect to avoid heavy libraries.
export const Confetti: React.FC = () => {
  const confettiPieces = Array.from({ length: 50 }).map((_, i) => {
    const style: React.CSSProperties = {
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 3 + 2}s`,
      animationDelay: `${Math.random() * 2}s`,
      backgroundColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
    };
    return <div key={i} className="confetti" style={style}></div>;
  });

  return (
    <>
      <style>{`
        .confetti {
          position: absolute;
          top: -10px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          opacity: 0;
          animation: drop linear infinite;
        }
        @keyframes drop {
          0% { transform: translateY(0) rotateZ(0); opacity: 1; }
          100% { transform: translateY(110vh) rotateZ(720deg); opacity: 0; }
        }
      `}</style>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-50">
        {confettiPieces}
      </div>
    </>
  );
};
