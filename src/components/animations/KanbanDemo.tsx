'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Scissors, Receipt, MessageSquare } from 'lucide-react';

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

    // Loop cycle: automatically transition cards between columns every 3.8 seconds
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
    <div className="relative w-full bg-white dark:bg-[#211B24] border border-[#E8E1E5] dark:border-[#3A3040] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl text-[#242126] dark:text-[#F5EFF5] overflow-hidden transition-colors duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E8E1E5] dark:border-[#3A3040] text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2F7D68] dark:bg-[#55B99A] animate-ping inline-block" />
          <span className="font-bold tracking-wide">Live Studio Floor</span>
          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#F1EBEF] dark:bg-[#2B2230] text-[#4B263F] dark:text-[#D6A0B4] border border-[#E8E1E5] dark:border-[#3A3040] font-semibold">
            Auto-Sync
          </span>
        </div>
        <div className="text-[11px] text-[#77717A] dark:text-[#B5AAB8] font-mono">
          <span>Today: 18 Sessions</span>
        </div>
      </div>

      {/* 3 Kanban Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
        {/* Col 1: Waiting */}
        <div className="bg-[#F7F5F2] dark:bg-[#151218] rounded-xl sm:rounded-2xl p-2.5 border border-[#E8E1E5] dark:border-[#3A3040] min-h-[130px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C69A5D] dark:text-[#D4AD76] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C69A5D] dark:bg-[#D4AD76]" />
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
                  className="p-2.5 rounded-xl bg-white dark:bg-[#2B2230] border border-[#E8E1E5] dark:border-[#3A3040] shadow-xs text-left"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#242126] dark:text-[#F5EFF5]">
                    <span>{card.name}</span>
                    <span className="text-[10px] text-[#C69A5D] dark:text-[#D4AD76] font-mono">{card.price}</span>
                  </div>
                  <p className="text-[10px] text-[#77717A] dark:text-[#B5AAB8] truncate">{card.service}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Col 2: In Chair */}
        <div className="bg-[#F7F5F2] dark:bg-[#151218] rounded-xl sm:rounded-2xl p-2.5 border border-[#B77A91] dark:border-[#D6A0B4] min-h-[130px] flex flex-col ring-1 ring-[#B77A91]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4B263F] dark:text-[#D6A0B4] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4B263F] dark:bg-[#D6A0B4] animate-pulse" />
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
                  className="p-2.5 rounded-xl bg-white dark:bg-[#2B2230] border border-[#B77A91]/60 dark:border-[#D6A0B4]/60 shadow-xs text-left"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#4B263F] dark:text-[#D6A0B4]">
                    <span>{card.name}</span>
                    <span className="text-[10px] font-mono">{card.price}</span>
                  </div>
                  <p className="text-[10px] text-[#77717A] dark:text-[#B5AAB8] truncate">{card.service}</p>
                  <div className="text-[9px] text-[#B77A91] dark:text-[#D6A0B4] flex items-center gap-1 pt-0.5">
                    <Scissors className="w-2.5 h-2.5" />
                    <span>Stylist: {card.stylist}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Col 3: Ready for Billing */}
        <div className="bg-[#F7F5F2] dark:bg-[#151218] rounded-xl sm:rounded-2xl p-2.5 border border-[#E8E1E5] dark:border-[#3A3040] min-h-[130px] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F7D68] dark:text-[#55B99A] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D68] dark:bg-[#55B99A]" />
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
                  className="p-2.5 rounded-xl bg-white dark:bg-[#2B2230] border border-[#2F7D68]/40 dark:border-[#55B99A]/40 shadow-xs text-left"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#242126] dark:text-[#F5EFF5]">
                    <span>{card.name}</span>
                    <span className="text-[10px] text-[#2F7D68] dark:text-[#55B99A] font-mono font-bold">
                      {card.price}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#77717A] dark:text-[#B5AAB8] truncate">{card.service}</p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-[#2F7D68]/15 dark:bg-[#55B99A]/20 text-[#2F7D68] dark:text-[#55B99A] border border-[#2F7D68]/30 dark:border-[#55B99A]/30 font-semibold">
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
            className="absolute bottom-2 right-2 max-w-[calc(100%-1rem)] bg-[#2F7D68] dark:bg-[#55B99A] text-white dark:text-[#151218] text-[10px] sm:text-[11px] font-semibold px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl z-30"
          >
            <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="flex items-center gap-1 truncate">
              <span>Sending WhatsApp</span>
              <span className="inline-flex gap-0.5 shrink-0">
                <span className="w-1 h-1 rounded-full bg-current animate-bounce" />
                <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0.15s]" />
                <span className="w-1 h-1 rounded-full bg-current animate-bounce [animation-delay:0.3s]" />
              </span>
            </span>
          </motion.div>
        )}

        {showBubble && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-2 right-2 max-w-[calc(100%-1rem)] bg-[#2F7D68] dark:bg-[#55B99A] text-white dark:text-[#151218] text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl z-30 border border-white/20"
          >
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">Booking confirmed ✅ 4:00 PM with Stylist</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
