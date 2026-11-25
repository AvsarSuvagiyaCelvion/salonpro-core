'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  Users,
  Wallet,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Phone,
  ShieldCheck,
  Zap,
  TrendingUp,
  CreditCard,
  X,
  ExternalLink,
  Loader2,
  Info,
} from 'lucide-react';
import { showToast } from '@/lib/toast';

interface WalletData {
  balance_inr: number;
  credits_count: number;
  rate_per_msg: number;
  total_recharged_inr: number;
  total_messages_sent: number;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface AudienceCounts {
  all: number;
  inactive_30d: number;
  vip: number;
  today: number;
}

interface CampaignItem {
  id: string;
  title: string;
  audience_filter: string;
  message_body: string;
  total_recipients: number;
  delivered_count: number;
  failed_count: number;
  credits_used: number;
  status: string;
  created_at: string;
}

const PRESET_TEMPLATES = [
  {
    id: 'festive_offer',
    name: 'Festive Season Special (Flat 20% Off)',
    category: 'Promotion',
    title: 'Festive Beauty Glow Special',
    body: '✨ Exclusive Festive Glow Offer! Book any Luxury Hair Spa, Facial, or Bridal Care service this week and enjoy Flat 20% Off! Reserve your festive chair now before slots fill up. Reply to confirm!',
  },
  {
    id: 'miss_you',
    name: 'We Miss You! (Re-visit Reminder)',
    category: 'Retention',
    title: 'Special Re-visit VIP Welcome',
    body: '🌸 Hello! We haven\'t seen you in a while and miss having you at the studio. Treat yourself to fresh hair styling or refreshing cleanup with code WELCOMEBACK for a complimentary wash! See you soon.',
  },
  {
    id: 'vip_invitation',
    name: 'VIP Priority Access (New Treatment)',
    category: 'VIP Exclusive',
    title: 'VIP Exclusive Priority Access',
    body: '👑 Dear VIP Client, experience our newest Premium Hydra Glow & Keratin treatment with priority salon booking. Weekend VIP appointments are now exclusively unlocked for you.',
  },
  {
    id: 'weekend_reminder',
    name: 'Weekend Self-Care Reminder',
    category: 'Reminder',
    title: 'Weekend Self-Care Time',
    body: '💇‍♀️ Time for your self-care session! Beat the weekend rush and secure your preferred stylist today. Quick touch-ups, beard trims, and glow therapies available.',
  },
];

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'campaigns' | 'pricing'>('create');
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [audiences, setAudiences] = useState<AudienceCounts>({ all: 0, inactive_30d: 0, vip: 0, today: 0 });
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);

  // Campaign Form State
  const [title, setTitle] = useState('Festive Beauty Glow Special');
  const [selectedAudience, setSelectedAudience] = useState<'all' | 'inactive_30d' | 'vip' | 'today'>('all');
  const [messageBody, setMessageBody] = useState(PRESET_TEMPLATES[0].body);
  const [sending, setSending] = useState(false);
  const [sendSuccessModal, setSendSuccessModal] = useState<{
    open: boolean;
    recipients: number;
    creditsDeducted: number;
  } | null>(null);

  // Recharge Modal State
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [rechargePacks] = useState([
    { credits: 100, inr: 85, label: 'Starter', popular: false },
    { credits: 500, inr: 425, label: 'Studio Growth', popular: true },
    { credits: 1000, inr: 850, label: 'Festive Blast', popular: false },
    { credits: 2500, inr: 2125, label: 'Mega Enterprise', popular: false },
  ]);
  const [selectedPackCredits, setSelectedPackCredits] = useState(500);
  const [recharging, setRecharging] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/marketing/campaigns');
      if (res.ok) {
        const json = await res.json();
        setWallet(json.wallet);
        setAudiences(json.audiences);
        setCampaigns(json.campaigns || []);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  }

  function handleSelectTemplate(tpl: typeof PRESET_TEMPLATES[0]) {
    setTitle(tpl.title);
    setMessageBody(tpl.body);
    showToast(`Loaded template: "${tpl.name}"`, 'success');
  }

  const currentAudienceCount = audiences[selectedAudience] || 0;
  const creditsNeeded = currentAudienceCount;
  const currentCredits = wallet?.credits_count || 0;
  const hasEnoughCredits = currentCredits >= creditsNeeded;

  async function handleSendCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !messageBody.trim()) {
      showToast('Please enter campaign title and message body.', 'error');
      return;
    }

    if (currentAudienceCount === 0) {
      showToast('No clients found in the selected audience segment.', 'error');
      return;
    }

    if (!hasEnoughCredits) {
      setRechargeModalOpen(true);
      showToast('Insufficient credits. Please recharge your wallet at direct cost (₹0.85/msg).', 'error');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          audienceFilter: selectedAudience,
          messageBody,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to dispatch campaign.');
      }

      setSendSuccessModal({
        open: true,
        recipients: json.totalRecipients,
        creditsDeducted: json.creditsDeducted,
      });

      showToast('WhatsApp campaign dispatched successfully!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Error sending campaign', 'error');
    } finally {
      setSending(false);
    }
  }

  async function handleRechargeSubmit() {
    setRecharging(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay payment gateway. Please check your internet connection.');
      }

      // 1. Create Razorpay order on server
      const orderRes = await fetch('/api/marketing/wallet/recharge/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: selectedPackCredits }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to initialize payment.');
      }

      // 2. Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'StudioDesk',
        description: `Recharge ${selectedPackCredits} WhatsApp Marketing Credits`,
        order_id: orderData.orderId,
        prefill: {
          name: orderData.salonName || '',
          contact: orderData.salonPhone || '',
          email: orderData.salonEmail || '',
        },
        theme: {
          color: '#111111',
        },
        modal: {
          ondismiss: function () {
            setRecharging(false);
          },
        },
        handler: async function (response: any) {
          try {
            // 3. Verify signature on server and credit wallet
            const verifyRes = await fetch('/api/marketing/wallet/recharge/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                credits: selectedPackCredits,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              showToast(`Wallet recharged! Added ${selectedPackCredits} credits.`, 'success');
              setRechargeModalOpen(false);
              fetchData();
            } else {
              showToast(verifyData.error || 'Payment verification failed.', 'error');
            }
          } catch (vErr: any) {
            showToast(vErr.message || 'Payment verification error.', 'error');
          } finally {
            setRecharging(false);
          }
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.on('payment.failed', function (resp: any) {
        const errMsg = resp.error?.description || resp.error?.reason || 'Transaction could not be completed.';
        showToast(`Payment Failed: ${errMsg}`, 'error');
        setRecharging(false);
      });

      razorpay.open();
    } catch (err: any) {
      showToast(err.message || 'Error during recharge', 'error');
      setRecharging(false);
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header & Live Wallet Banner */}
      <div className="bg-white dark:bg-[#141926] p-6 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F]">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
              WhatsApp Marketing & Broadcast Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-[#A0A8B8] mt-1.5 flex items-center gap-2">
            <span>Direct Meta WhatsApp Cloud API</span>
            <span className="inline-block w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              100% At-Cost Price (₹0.85/msg · ₹0 Platform Surcharge)
            </span>
          </p>
        </div>

        {/* Wallet Balance Card */}
        <div className="flex items-center gap-4 bg-neutral-50 dark:bg-[#10141F] p-4 rounded-2xl border border-neutral-200 dark:border-[#2A2F3A] shrink-0">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-neutral-500 dark:text-[#A0A8B8] uppercase tracking-wider">
              Available Credits
            </div>
            <div className="text-2xl font-extrabold text-neutral-900 dark:text-white flex items-baseline gap-1.5">
              <span>{loading ? '...' : (wallet?.credits_count || 0).toLocaleString('en-IN')}</span>
              <span className="text-xs font-normal text-neutral-500">msgs</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Cost: ₹{wallet?.rate_per_msg || 0.85}/msg
            </div>
          </div>
          <button
            onClick={() => setRechargeModalOpen(true)}
            className="ml-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#D4A77F] hover:bg-[#B8905F] text-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Credits</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-[#2A2F3A] pb-3">
        {[
          { id: 'create', label: 'Create Bulk Campaign', icon: Send },
          { id: 'campaigns', label: 'Campaign History & Delivery', icon: Clock },
          { id: 'pricing', label: 'At-Cost Transparency (ભાવ-તો-ભાવ)', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-xs'
                  : 'text-neutral-500 dark:text-[#A0A8B8] hover:bg-neutral-100 dark:hover:bg-[#141926]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: CREATE CAMPAIGN ================= */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Campaign Builder (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleSendCampaign} className="space-y-6">
              {/* Step 1: Select Audience */}
              <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8]">
                    1. Select Audience Segment
                  </label>
                  <span className="text-[11px] text-neutral-400">Target specific customer segments</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    {
                      id: 'all',
                      label: 'All Clients',
                      count: audiences.all,
                      desc: 'Full directory',
                    },
                    {
                      id: 'inactive_30d',
                      label: 'Inactive 30d+',
                      count: audiences.inactive_30d,
                      desc: 'Win-back promo',
                    },
                    {
                      id: 'vip',
                      label: 'VIP Spenders',
                      count: audiences.vip,
                      desc: '> ₹2,000 spend',
                    },
                    {
                      id: 'today',
                      label: 'Today\'s Bookings',
                      count: audiences.today,
                      desc: 'Pre-visit alert',
                    },
                  ].map((aud) => {
                    const isSelected = selectedAudience === aud.id;
                    return (
                      <button
                        type="button"
                        key={aud.id}
                        onClick={() => setSelectedAudience(aud.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#D4A77F] bg-[#D4A77F]/10 dark:bg-[#D4A77F]/15 ring-2 ring-[#D4A77F]/20'
                            : 'border-neutral-200 dark:border-[#2A2F3A] hover:bg-neutral-50 dark:hover:bg-[#10141F]'
                        }`}
                      >
                        <div className="text-lg font-black text-neutral-900 dark:text-white">
                          {loading ? '...' : aud.count}
                        </div>
                        <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                          {aud.label}
                        </div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {aud.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Choose Template */}
              <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8]">
                    2. Quick High-Converting Templates
                  </label>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    1-Click Load
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PRESET_TEMPLATES.map((tpl) => (
                    <button
                      type="button"
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl)}
                      className="p-3 text-left rounded-xl border border-neutral-200 dark:border-[#2A2F3A] hover:border-[#D4A77F] dark:hover:border-[#D4A77F] hover:bg-neutral-50 dark:hover:bg-[#10141F] transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                          {tpl.category}
                        </span>
                        <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-[#D4A77F] transition-colors" />
                      </div>
                      <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1.5">
                        {tpl.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Compose Message */}
              <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8] block">
                  3. Campaign Content
                </label>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Campaign Internal Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Diwali Mega Makeover Offer"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-[#D4A77F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    WhatsApp Message Text
                  </label>
                  <textarea
                    rows={5}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    required
                    placeholder="Type your WhatsApp message..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] bg-white dark:bg-[#10141F] text-xs font-medium text-neutral-900 dark:text-white focus:outline-none focus:border-[#D4A77F] resize-none"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Supports WhatsApp formatting: *bold*, _italics_, and emojis.
                  </p>
                </div>
              </div>

              {/* Step 4: Dispatch Action Bar */}
              <div className="bg-white dark:bg-[#141926] p-5 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-neutral-900 dark:text-white">
                    Recipients: {currentAudienceCount} clients
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    Credits needed: {creditsNeeded} · Available: {currentCredits}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {!hasEnoughCredits ? (
                    <button
                      type="button"
                      onClick={() => setRechargeModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Recharge {creditsNeeded - currentCredits} Credits</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={sending || currentAudienceCount === 0}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Dispatching via Meta API...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send WhatsApp Campaign</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Right: Interactive Phone Preview Mockup (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 bg-white dark:bg-[#141926] p-6 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-[#A0A8B8]">
                  Live Mobile WhatsApp Preview
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                  Client Screen View
                </span>
              </div>

              {/* Smartphone Frame Mockup */}
              <div className="w-full max-w-sm mx-auto bg-[#0B141A] rounded-[36px] p-3 shadow-2xl border-4 border-neutral-800">
                {/* Phone Notch / Speaker */}
                <div className="w-24 h-4 bg-neutral-800 rounded-full mx-auto mb-2" />

                {/* WhatsApp Chat Header */}
                <div className="bg-[#1F2C34] text-white px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#D4A77F] text-black font-bold flex items-center justify-center text-xs">
                    SP
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">Salon Studio</div>
                    <div className="text-[10px] text-emerald-400">Official Business Account ✓</div>
                  </div>
                </div>

                {/* Chat Wallpaper & Message Bubble */}
                <div className="bg-[#0D1821] p-3 rounded-2xl min-h-[280px] flex flex-col justify-end mt-2 space-y-2">
                  <div className="max-w-[90%] bg-[#005C4B] text-white p-3 rounded-2xl rounded-tr-xs text-[11px] leading-relaxed shadow-sm">
                    <div className="whitespace-pre-wrap">{messageBody || 'Your message preview will appear here...'}</div>
                    <div className="text-[9px] text-emerald-200 text-right mt-1.5 flex items-center justify-end gap-1">
                      <span>Just now</span>
                      <span>✓✓</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Chat Input */}
                <div className="bg-[#1F2C34] px-3 py-2 rounded-2xl mt-2 flex items-center justify-between text-neutral-400 text-[11px]">
                  <span>Message...</span>
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>

              <div className="text-[11px] text-neutral-400 text-center">
                Audience: <strong className="text-neutral-700 dark:text-neutral-200">{currentAudienceCount} recipients</strong> · Guaranteed 100% Meta Safe delivery
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: CAMPAIGN HISTORY ================= */}
      {activeTab === 'campaigns' && (
        <div className="bg-white dark:bg-[#141926] rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-neutral-200 dark:border-[#2A2F3A] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Campaign Dispatch Records
              </h3>
              <p className="text-xs text-neutral-500">
                Full delivery audit trail of bulk messages dispatched from your salon
              </p>
            </div>
            <button
              onClick={fetchData}
              className="p-2 rounded-xl border border-neutral-200 dark:border-[#2A2F3A] hover:bg-neutral-50 dark:hover:bg-[#10141F] text-neutral-600 dark:text-neutral-300 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-[#10141F] border-b border-neutral-200 dark:border-[#2A2F3A] text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-5">Campaign Title</th>
                  <th className="py-3 px-4">Audience</th>
                  <th className="py-3 px-4 text-center">Delivered / Total</th>
                  <th className="py-3 px-4 text-center">Credits Used</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-[#2A2F3A]">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-neutral-400">
                      No campaigns sent yet. Create your first campaign above!
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#10141F]/50">
                      <td className="py-3.5 px-5 font-semibold text-neutral-900 dark:text-white max-w-xs">
                        <div className="truncate">{c.title}</div>
                        <div className="text-[11px] text-neutral-400 truncate mt-0.5">{c.message_body}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-neutral-600 dark:text-neutral-300 capitalize">
                        {c.audience_filter.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-neutral-900 dark:text-white">
                        <span className="text-emerald-600">{c.delivered_count}</span> / {c.total_recipients}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#8C5E2E] dark:text-[#D4A77F]">
                        {c.credits_used}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500">
                        {new Date(c.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: AT-COST TRANSPARENCY ================= */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#141926] p-6 rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-xs">
            <div className="max-w-2xl space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F] border border-[#D4A77F]/30">
                100% Direct Cost Policy (ભાવ-તો-ભાવ)
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                Zero Commission. Direct Meta At-Cost Pricing.
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                Unlike competitors who add hefty 100% to 200% markups (charging ₹1.50 to ₹2.50 per WhatsApp message), 
                <strong> StudioDesk passes 100% of Meta’s official cost directly to your salon at ₹0.85 per marketing message with ₹0 platform surcharge</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#10141F] border border-neutral-200 dark:border-[#2A2F3A]">
                <div className="text-xs font-bold text-neutral-400 uppercase">Official Meta Cost</div>
                <div className="text-2xl font-extrabold text-neutral-900 dark:text-white mt-1">₹0.85</div>
                <div className="text-[11px] text-neutral-500 mt-1">Direct Meta India Cloud API rate</div>
              </div>
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">StudioDesk Markup</div>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">₹0.00</div>
                <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-1">0% commission & 0 monthly fees</div>
              </div>
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-[#10141F] border border-neutral-200 dark:border-[#2A2F3A]">
                <div className="text-xs font-bold text-neutral-400 uppercase">Number Ban Protection</div>
                <div className="text-2xl font-extrabold text-emerald-600 mt-1">100% Safe</div>
                <div className="text-[11px] text-neutral-500 mt-1">Official Meta Cloud API Verified</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= RECHARGE MODAL ================= */}
      {rechargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#10141F] rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-[#2A2F3A] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    Add WhatsApp Credits (At-Cost)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Direct Meta rate: ₹0.85/msg · No hidden fees
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRechargeModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Select Credit Pack
              </label>
              <div className="grid grid-cols-2 gap-3">
                {rechargePacks.map((pack) => {
                  const isSelected = selectedPackCredits === pack.credits;
                  return (
                    <button
                      type="button"
                      key={pack.credits}
                      onClick={() => setSelectedPackCredits(pack.credits)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                          : 'border-neutral-200 dark:border-[#2A2F3A] hover:bg-neutral-50 dark:hover:bg-[#141926]'
                      }`}
                    >
                      {pack.popular && (
                        <span className="absolute -top-2 right-3 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                          Most Popular
                        </span>
                      )}
                      <div className="text-xs font-semibold text-neutral-500">{pack.label}</div>
                      <div className="text-lg font-black text-neutral-900 dark:text-white mt-0.5">
                        {pack.credits.toLocaleString('en-IN')} msgs
                      </div>
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        ₹{pack.inr} <span className="text-[10px] font-normal text-neutral-400">(₹0.85/msg)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#141926] border border-neutral-200 dark:border-[#2A2F3A] flex items-center justify-between text-xs">
              <span className="text-neutral-500">Total Payable Amount:</span>
              <span className="text-base font-extrabold text-neutral-900 dark:text-white">
                ₹{Math.round(selectedPackCredits * 0.85)}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRechargeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={recharging}
                onClick={handleRechargeSubmit}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {recharging && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Pay & Add {selectedPackCredits} Credits</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUCCESS MODAL ================= */}
      {sendSuccessModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-[#10141F] rounded-3xl border border-neutral-200 dark:border-[#2A2F3A] shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              WhatsApp Broadcast Dispatched!
            </h3>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Your bulk message was delivered successfully to <strong>{sendSuccessModal.recipients} clients</strong>. 
              {sendSuccessModal.creditsDeducted} credits were deducted from your wallet at direct Meta cost.
            </p>

            <button
              onClick={() => setSendSuccessModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-black text-xs font-bold cursor-pointer transition-all"
            >
              Done & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
