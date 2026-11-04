'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function TiltCard({ children, className = '' }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine)');
    setIsDesktop(media.matches);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktop || shouldReduceMotion || !cardRef.current || !innerRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 12;
    const rotateX = ((y / rect.height) - 0.5) * -12;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (innerRef.current) {
        innerRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        innerRef.current.style.setProperty('--glow-x', `${x}px`);
        innerRef.current.style.setProperty('--glow-y', `${y}px`);
      }
    });
  };

  const handleMouseLeave = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    if (innerRef.current) {
      innerRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="perspective-[1000px] h-full"
    >
      <div
        ref={innerRef}
        style={{
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease',
          willChange: 'transform',
        }}
        className={`relative p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1a0e1f]/90 border border-slate-200/90 dark:border-pink-500/20 shadow-xs hover:shadow-xl dark:shadow-pink-950/20 hover:border-pink-300/80 dark:hover:border-pink-500/50 transition-all duration-300 h-full overflow-hidden group ${className}`}
      >
        {/* Subtle radial cursor glow follower (CSS variable, 0 React re-renders) */}
        <div
          className="absolute w-52 h-52 rounded-full pointer-events-none blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-1"
          style={{
            left: 'var(--glow-x, -200px)',
            top: 'var(--glow-y, -200px)',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(225, 29, 72, 0.15) 0%, rgba(147, 51, 234, 0.08) 50%, transparent 70%)',
          }}
        />
        {children}
      </div>
    </div>
  );
}
