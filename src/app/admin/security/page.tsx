'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, UserPlus, Users, Key, AlertCircle, CheckCircle2, X, Eye, EyeOff, Trash2, ArrowRight, QrCode, Building, Smartphone, Save, CreditCard } from 'lucide-react';
import ImageUploader from '@/components/ui/ImageUploader';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export default function AdminSecurityPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [currentAdminEmail, setCurrentAdminEmail] = useState('');

  // Add Admin Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] = useState(false);
  const [newRole, setNewRole] = useState<'super_admin' | 'admin'>('admin');
  const [saving, setSaving] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Platform Payment Settings State
  const [platformSettings, setPlatformSettings] = useState({
    platform_upi_id: '8320653782@okaxis',
    platform_upi_number: '8320653782',
    platform_account_name: 'Avsar Suvagiya',
    platform_bank_name: 'State Bank of India',
    platform_account_number: 'XXXXXX1234',
    platform_ifsc_code: 'SBIN0001234',
    platform_support_whatsapp: '918320653782',
    platform_upi_qr_url: '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  async function loadAdmins() {
    try {
      setLoading(true);
      const [adminsRes, authRes, settingsRes] = await Promise.all([
        fetch('/api/admin/admins'),
        fetch('/api/admin/auth'),
        fetch('/api/admin/settings'),
      ]);

      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.loggedIn && authData.admin) {
          setIsSuperAdmin(authData.admin.role === 'super_admin');
          setCurrentAdminEmail(authData.admin.email || '');
        }
      }

      if (settingsRes.ok) {
        const settsData = await settingsRes.json();
        if (settsData.settings) {
          setPlatformSettings((prev) => ({ ...prev, ...settsData.settings }));
        }
      }

      if (adminsRes.status === 403) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      const data = await adminsRes.json();
      if (adminsRes.ok) {
        setAdmins(data.admins || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function handleSavePlatformSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsSuccess(false);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(platformSettings),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update platform payment settings');
      }
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleDeleteAdmin(id: string, email: string) {
    if (!window.confirm(`Revoke platform administrator access for ${email}? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/admins?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove admin');
      await loadAdmins();
    } catch (err: any) {
      alert(err.message || 'Error removing administrator');
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setModalMessage(null);

    if (newPassword.length < 8) {
      setModalMessage({ type: 'error', text: 'Admin password must be at least 8 characters.' });
      setSaving(false);
      return;
    }

    if (newPassword !== newConfirmPassword) {
      setModalMessage({ type: 'error', text: 'Passwords do not match. Please verify your confirm password.' });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          confirmPassword: newConfirmPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add administrator');
      }

      setModalMessage({ type: 'success', text: `Admin ${newName} registered successfully!` });
      setTimeout(() => {
        setIsModalOpen(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewConfirmPassword('');
        loadAdmins();
      }, 1200);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (isSuperAdmin === false) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white dark:bg-[#141926] border border-amber-300 dark:border-amber-900/50 rounded-3xl p-8 text-center shadow-lg">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          🔒
        </div>
        <h2 className="text-xl font-black text-[#1F2937] dark:text-[#FFFFFF]">Access Restricted: Super Admin Only</h2>
        <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-2 mb-6 leading-relaxed">
          Your account is authorized as a <strong>Platform Admin (Manage Salons &amp; Analytics)</strong>. 
          Administrator credential management and platform security settings strictly require <strong>Super Admin (Full Root Permissions)</strong>.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href="/admin/salons"
            className="px-5 py-2.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs transition-all shadow-md"
          >
            Go to Salons Directory ➔
          </Link>
          <Link
            href="/admin"
            className="px-5 py-2.5 rounded-2xl bg-[#F3F4F6] dark:bg-[#1C2230] text-[#1F2937] dark:text-[#FFFFFF] font-bold text-xs transition-all border border-[#E5E7EB] dark:border-[#2A2F3A]"
          >
            Platform Overview
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#1F2937] dark:text-[#FFFFFF] tracking-tight">Platform Admins & Security</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F] border border-[#D4A77F]/30">
              Access Control
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#A0A8B8] mt-1">
            Manage authorized platform administrators and review zero-trust security controls.
          </p>
        </div>

        <button
          onClick={() => {
            setModalMessage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs sm:text-sm shadow-md shadow-[#D4A77F]/20 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Platform Admin</span>
        </button>
      </div>

      {/* Security Architecture Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 text-white rounded-3xl p-6 shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-2xl shrink-0">
            🛡️
          </div>
          <div className="space-y-3 w-full">
            <div>
              <h2 className="text-base font-black text-white">Platform Security Architecture Overview</h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                SalonPro enforces enterprise-grade zero-trust principles across all tenants, APIs, and platform administrative interfaces.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 shadow-xs">
                <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Tenant Isolation & RLS</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Strict PostgreSQL Row-Level Security (RLS) combined with server-side query scoping on every <code className="text-amber-200">salon_id</code> ensures strict data segregation.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 shadow-xs">
                <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Advisory Transaction Locks</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  PostgreSQL advisory locking (<code className="text-amber-200">pg_advisory_xact_lock</code>) guarantees zero race conditions or double-bookings during concurrent slot reservations.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 shadow-xs">
                <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Bcrypt & HttpOnly Auth</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Passphrases and customer PINs are hashed with bcrypt. Sessions use signed, HttpOnly JWT cookies inaccessible to client-side scripts.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 shadow-xs">
                <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Rate Limiting & Honeypots</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Endpoints enforce IP and identity rate limits with sliding lockout resets. Public booking forms include honeypot hooks to neutralize automated bots.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authorized Admins Table */}
      <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1F2937] dark:text-[#FFFFFF]">Authorized Platform Administrators ({admins.length})</h2>
            <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Only these accounts have full access to platform settings and all salon branches</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#2A2F3A] text-[#6B7280] dark:text-[#A0A8B8] font-bold uppercase tracking-wider text-[10px] bg-[#F8F9FA] dark:bg-[#10141F]">
                <th className="py-3 px-3">Admin Name</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Permission Tier</th>
                <th className="py-3 px-3">Registered Date</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2A2F3A]">
              {admins.map((a) => (
                <tr key={a.id} className="hover:bg-[#F3F4F6] dark:hover:bg-[#1C2230] transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#D4A77F] text-[#080B12] font-black flex items-center justify-center text-xs">
                        {a.name?.charAt(0) || 'A'}
                      </div>
                      <span className="font-bold text-[#1F2937] dark:text-[#FFFFFF] text-sm">{a.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[#1F2937] dark:text-[#FFFFFF] font-semibold">
                    {a.email}
                  </td>
                  <td className="py-3.5 px-3">
                    {a.role === 'super_admin' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F] border border-[#D4A77F]/30 inline-flex items-center gap-1">
                        <span>👑</span>
                        <span>Super Admin (Full Root)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 inline-flex items-center gap-1">
                        <span>🛡️</span>
                        <span>Platform Admin (Salons &amp; Analytics)</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-[#6B7280] dark:text-[#A0A8B8]">
                    {new Date(a.created_at).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {a.email.toLowerCase() === currentAdminEmail.toLowerCase() ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Current Session</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteAdmin(a.id, a.email)}
                        className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                        title="Revoke Admin Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= PLATFORM PAYMENT SETTINGS (SUPER ADMIN ONLY) ================= */}
      {isSuperAdmin && (
        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1F2937] dark:text-[#FFFFFF] flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#D4A77F]" />
                <span>Platform Payment &amp; Direct Bank Settings</span>
              </h2>
              <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-0.5">
                Configure your official UPI ID, QR code, and bank details shown to salon owners on the subscription checkout modal.
              </p>
            </div>

            {settingsSuccess && (
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved Successfully!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSavePlatformSettings} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1">
                  Platform UPI ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8320653782@okaxis"
                  value={platformSettings.platform_upi_id}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, platform_upi_id: e.target.value })}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1">
                  PhonePe / GPay Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8320653782"
                  value={platformSettings.platform_upi_number}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, platform_upi_number: e.target.value })}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1">
                  Support WhatsApp Number (With Country Code)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 918320653782"
                  value={platformSettings.platform_support_whatsapp}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, platform_support_whatsapp: e.target.value })}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1">
                  Bank Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Avsar Suvagiya"
                  value={platformSettings.platform_account_name}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, platform_account_name: e.target.value })}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Bank of India"
                  value={platformSettings.platform_bank_name}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, platform_bank_name: e.target.value })}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456789012"
                  value={platformSettings.platform_account_number}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, platform_account_number: e.target.value })}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3 py-2 font-mono text-xs focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1">
                  Bank IFSC Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBIN0001234"
                  value={platformSettings.platform_ifsc_code}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, platform_ifsc_code: e.target.value.toUpperCase() })}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3 py-2 font-mono uppercase text-xs focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              {/* QR Image Upload */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#1F2937] dark:text-[#FFFFFF] mb-1.5">
                  Platform Payment QR Code Image (GPay / PhonePe / BharatPe)
                </label>
                <div className="flex items-center gap-4">
                  {platformSettings.platform_upi_qr_url ? (
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 bg-white p-1 rounded-xl border border-neutral-300 flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={platformSettings.platform_upi_qr_url}
                          alt="Platform QR"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlatformSettings({ ...platformSettings, platform_upi_qr_url: '' })}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600"
                        title="Remove QR"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-[#10141F] flex items-center justify-center text-neutral-400 shrink-0">
                      <QrCode className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1">
                    <ImageUploader
                      value={platformSettings.platform_upi_qr_url || null}
                      onChange={(url) => setPlatformSettings({ ...platformSettings, platform_upi_qr_url: url || '' })}
                      type="logo"
                      label="Upload QR Code"
                      helperText="JPEG or PNG QR Code image (max 400KB)"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Upload your high-res UPI payment QR code to show on checkout.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'Saving Details...' : 'Save Platform Payment Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add New Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-[#9CA3AF] dark:text-[#747D8D] hover:text-[#1F2937] dark:text-[#FFFFFF]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-[#1F2937] dark:text-[#FFFFFF] text-base">Add New Platform Admin</h3>
                <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">Grant administrator access to a trusted partner</p>
              </div>
            </div>

            {modalMessage && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  modalMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {modalMessage.type === 'success' ? '✓' : '⚠️'}
                <span>{modalMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">Admin Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3.5 py-2.5 text-sm text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">Admin Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="newadmin@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3.5 py-2.5 text-sm text-[#1F2937] dark:text-[#FFFFFF] font-mono focus:outline-none focus:border-[#D4A77F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">Admin Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-[#1F2937] dark:text-[#FFFFFF] font-mono focus:outline-none focus:border-[#D4A77F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#747D8D] hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors p-1 cursor-pointer focus:outline-none"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">Confirm Admin Password *</label>
                <div className="relative">
                  <input
                    type={showNewConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={newConfirmPassword}
                    onChange={(e) => setNewConfirmPassword(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-[#1F2937] dark:text-[#FFFFFF] font-mono focus:outline-none focus:border-[#D4A77F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewConfirmPassword(!showNewConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#747D8D] hover:text-[#1F2937] dark:hover:text-[#FFFFFF] transition-colors p-1 cursor-pointer focus:outline-none"
                    aria-label={showNewConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showNewConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2937] dark:text-[#FFFFFF] mb-1">Admin Role Tier</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-xl px-3.5 py-2.5 text-sm text-[#1F2937] dark:text-[#FFFFFF] focus:outline-none focus:border-[#D4A77F]"
                >
                  <option value="admin">Platform Admin (Manage Salons & Analytics)</option>
                  <option value="super_admin">Super Admin (Full Root Permissions)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] font-bold text-xs sm:text-sm shadow-md shadow-[#D4A77F]/20 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {saving ? 'Registering Admin...' : 'Confirm & Authorize Admin ➔'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
