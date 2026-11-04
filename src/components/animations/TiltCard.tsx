'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function TiltCard({ children, className = '' }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [cursorGlow, setCursorGlow] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine)');
    setIsDesktop(media.matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop || shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Tilt calculations (-10deg to 10deg)
    const rotateY = ((x / rect.width) - 0.5) * 14;
    const rotateX = ((y / rect.height) - 0.5) * -14;

    setRotation({ x: rotateX, y: rotateY });
    setCursorGlow({ x, y });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    if (isDesktop && !shouldReduceMotion) setIsHovered(true);
  };

  if (!isDesktop || shouldReduceMotion) {
    return (
      <div className={`p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="perspective-[1000px] h-full"
    >
      <motion.div
        animate={{
          rotateX: rotation.x,
          rotateY: rotation.y,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`relative p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs transition-shadow duration-300 h-full overflow-hidden ${
          isHovered ? 'shadow-xl shadow-pink-900/10 border-pink-300/80' : ''
        } ${className}`}
      >
        {/* Glow Follower Effect on Hover */}
        {isHovered && (
          <div
            style={{
              left: `${cursorGlow.x}px`,
              top: `${cursorGlow.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute w-44 h-44 rounded-full bg-radial from-pink-400/20 via-purple-300/10 to-transparent pointer-events-none blur-2xl"
          />
        )}
        {children}
      </motion.div>
    </div>
  );
}
