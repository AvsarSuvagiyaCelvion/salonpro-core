'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, UserPlus, Users, Key, AlertCircle, CheckCircle2, X } from 'lucide-react';

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

  // Add Admin Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'super_admin' | 'admin'>('admin');
  const [saving, setSaving] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function loadAdmins() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/admins');
      const data = await res.json();
      if (res.ok) {
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

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
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
        loadAdmins();
      }, 1200);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Platform Admins & Security</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Access Control
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage authorized platform administrators and review zero-trust security controls.
          </p>
        </div>

        <button
          onClick={() => {
            setModalMessage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Platform Admin</span>
        </button>
      </div>

      {/* Security Architecture Explainer Card */}
      <div className="bg-gradient-to-r from-amber-50 via-slate-50 to-pink-50 border border-amber-200/90 rounded-3xl p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold text-2xl shrink-0">
            🛡️
          </div>
          <div className="space-y-3">
            <div>
              <h2 className="text-base font-black text-slate-900">How Admin Security Works (Zero Public Signup)</h2>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Your question: <em>&quot;If someone opens domain.com/admin, can they make themselves an admin? What is the security?&quot;</em>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>1. No Public Registration</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  There is no &quot;Sign Up&quot; form on /admin. An outsider visiting /admin only sees a locked login form. Without your password, they can never enter.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Protected Admin Creation</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The API endpoint to create a new admin strictly checks for your active Super Admin session. Only you, from inside this dashboard, can authorize a new admin.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>3. Cryptographic JWT Cookie</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Admin session is stored in an httpOnly, signed cookie with HMAC SHA-256 encryption. Browser scripts cannot steal or forge this token.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authorized Admins Table */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Authorized Platform Administrators ({admins.length})</h2>
            <p className="text-xs text-slate-500">Only these accounts have full access to platform settings and all salon branches</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                <th className="py-3 px-3">Admin Name</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Role Tier</th>
                <th className="py-3 px-3">Registered Date</th>
                <th className="py-3 px-3 text-right">Security Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                        {a.name?.charAt(0) || 'A'}
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{a.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-700 font-semibold">
                    {a.email}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                      {a.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">
                    {new Date(a.created_at).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Active Verified</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Platform Admin</h3>
                <p className="text-xs text-slate-500">Grant administrator access to a trusted partner</p>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="newadmin@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Role Tier</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="admin">Platform Admin (Manage Salons & Analytics)</option>
                  <option value="super_admin">Super Admin (Full Root Permissions)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
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
