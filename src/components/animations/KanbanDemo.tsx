'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Clock, Scissors, Receipt, MessageSquare, Sparkles } from 'lucide-react';

interface KanbanCard {
  id: string;
  name: string;
  service: string;
  stylist: string;
  price: string;
  col: 'waiting' | 'chair' | 'billing';
}

const initialCards: KanbanCard[] = [
  {
    id: 'c1',
    name: 'Pooja Patel',
    service: 'Hydra Glow Facial',
    stylist: 'Priya',
    price: '₹2,500',
    col: 'waiting',
  },
  {
    id: 'c2',
    name: 'Sneha Shah',
    service: 'Hair Keratin Spa',
    stylist: 'Rahul V.',
    price: '₹3,200',
    col: 'chair',
  },
  {
    id: 'c3',
    name: 'Anita Sharma',
    service: 'Gel Nails & Polish',
    stylist: 'Kajal',
    price: '₹1,200',
    col: 'billing',
  },
];

export default function KanbanDemo() {
  const shouldReduceMotion = useReducedMotion();
  const [cards, setCards] = useState<KanbanCard[]>(initialCards);
  const [showBubble, setShowBubble] = useState(false);
  const [isTypingDots, setIsTypingDots] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) return;

    // Loop cycle: automatically transition cards between columns every 3.5 seconds
    const interval = setInterval(() => {
      setCards((prev) => {
        return prev.map((card) => {
          if (card.col === 'waiting') return { ...card, col: 'chair' };
          if (card.col === 'chair') return { ...card, col: 'billing' };
          return { ...card, col: 'waiting' };
        });
      });
    }, 3800);

    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    // Trigger WhatsApp notification popup cycle
    const bubbleTimer = setInterval(() => {
      setIsTypingDots(true);
      setShowBubble(false);

      const t1 = setTimeout(() => {
        setIsTypingDots(false);
        setShowBubble(true);
      }, 1200);

      const t2 = setTimeout(() => {
        setShowBubble(false);
      }, 4500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }, 6500);

    return () => clearInterval(bubbleTimer);
  }, [shouldReduceMotion]);

  const waitingCards = cards.filter((c) => c.col === 'waiting');
  const chairCards = cards.filter((c) => c.col === 'chair');
  const billingCards = cards.filter((c) => c.col === 'billing');

  return (
    <div className="relative w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl text-white overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="font-bold text-white tracking-wide">Live Studio Floor</span>
          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold">
            Auto-Sync
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          <span>Today: 18 Sessions</span>
        </div>
      </div>

      {/* 3 Kanban Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
        {/* Col 1: Waiting */}
        <div className="bg-slate-950/60 rounded-2xl p-2.5 border border-slate-800/80 min-h-[140px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Waiting ({waitingCards.length})
            </span>
          </div>

          <div className="space-y-2 flex-1">
            <AnimatePresence mode="popLayout">
              {waitingCards.map((card) => (
                <motion.div
                  layout
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-md text-left"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-100">
                    <span>{card.name}</span>
                    <span className="text-[10px] text-amber-300 font-mono">{card.price}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{card.service}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Col 2: In Chair */}
        <div className="bg-slate-950/60 rounded-2xl p-2.5 border border-pink-500/40 min-h-[140px] flex flex-col ring-1 ring-pink-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              In Chair ({chairCards.length})
            </span>
          </div>

          <div className="space-y-2 flex-1">
            <AnimatePresence mode="popLayout">
              {chairCards.map((card) => (
                <motion.div
                  layout
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-pink-950/80 to-purple-950/70 border border-pink-500/50 shadow-md text-left"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-pink-100">
                    <span>{card.name}</span>
                    <span className="text-[10px] text-pink-400 font-mono">{card.price}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">{card.service}</p>
                  <div className="text-[9px] text-pink-300/80 flex items-center gap-1 pt-0.5">
                    <Scissors className="w-2.5 h-2.5" />
                    <span>Stylist: {card.stylist}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Col 3: Ready for Billing */}
        <div className="bg-slate-950/60 rounded-2xl p-2.5 border border-slate-800/80 min-h-[140px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Ready for Bill ({billingCards.length})
            </span>
          </div>

          <div className="space-y-2 flex-1">
            <AnimatePresence mode="popLayout">
              {billingCards.map((card) => (
                <motion.div
                  layout
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="p-2.5 rounded-xl bg-slate-800/90 border border-emerald-500/40 shadow-md text-left"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-100">
                    <span>{card.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {card.price}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{card.service}</p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      <Receipt className="w-2.5 h-2.5" />
                      <span>Ready for GST Invoice</span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Floating Animated WhatsApp Notification Pill */}
      <AnimatePresence>
        {isTypingDots && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-2 right-2 bg-emerald-600/95 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl shadow-emerald-950/40 z-30"
          >
            <MessageSquare className="w-3.5 h-3.5 text-white" />
            <span className="flex items-center gap-1">
              <span>Sending WhatsApp</span>
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-white animate-bounce" />
                <span className="w-1 h-1 rounded-full bg-white animate-bounce [animation-delay:0.15s]" />
                <span className="w-1 h-1 rounded-full bg-white animate-bounce [animation-delay:0.3s]" />
              </span>
            </span>
          </motion.div>
        )}

        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl shadow-emerald-950/50 z-30 border border-emerald-400/30"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
            <span>Booking confirmed ✅ 4:00 PM with Stylist</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
