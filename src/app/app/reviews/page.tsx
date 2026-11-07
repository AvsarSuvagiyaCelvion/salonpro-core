'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  MessageSquare,
  Eye,
  EyeOff,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Calendar,
  Sparkles,
  User,
  Users,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  salon_id: string;
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  appointment_id: string;
  appointment_date: string;
  service_name: string | null;
  staff_id: string | null;
  staff_name: string | null;
  rating: number;
  comment: string | null;
  owner_reply: string | null;
  owner_replied_at: string | null;
  status: 'visible' | 'hidden';
  created_at: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface StaffReviewStat {
  staffId: string;
  staffName: string;
  reviewCount: number;
  averageRating: number;
}

export default function OwnerReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [staffStats, setStaffStats] = useState<StaffReviewStat[]>([]);
  const [planAllowed, setPlanAllowed] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

  // Reply Modal State
  const [replyModalReview, setReplyModalReview] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  async function loadReviews(targetPage = page) {
    try {
      setLoading(true);
      setActionError(null);

      const params = new URLSearchParams({
        page: targetPage.toString(),
        pageSize: pageSize.toString(),
      });

      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (ratingFilter !== 'all') params.set('rating', ratingFilter);

      const res = await fetch(`/api/reviews?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load reviews');
      }

      setReviews(data.reviews || []);
      setStats(
        data.stats || {
          averageRating: 0,
          totalReviews: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        }
      );
      setStaffStats(data.staffStats || []);
      setPlanAllowed(data.planAllowed ?? true);

      if (data.pagination) {
        setPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalRecords(data.pagination.total || 0);
      }
    } catch (err: any) {
      setActionError(err.message || 'Error loading reviews');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews(1);
  }, [statusFilter, ratingFilter]);

  function handleOpenReplyModal(rev: ReviewItem) {
    setReplyModalReview(rev);
    setReplyText(rev.owner_reply || '');
    setActionError(null);
  }

  async function handleSaveReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyModalReview) return;
    setSavingReply(true);
    setActionError(null);

    const cleanReply = replyText.trim();
    if (cleanReply.length > 300) {
      setActionError('Reply must not exceed 300 characters.');
      setSavingReply(false);
      return;
    }

    try {
      const res = await fetch(`/api/reviews/${replyModalReview.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_reply: cleanReply || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update reply');
      }

      // Update in state
      setReviews((prev) =>
        prev.map((r) => (r.id === replyModalReview.id ? { ...r, ...data.review } : r))
      );

      setReplyModalReview(null);
      setActionSuccess('Your reply has been saved.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Error saving reply');
    } finally {
      setSavingReply(false);
    }
  }

  async function handleToggleStatus(rev: ReviewItem) {
    const newStatus = rev.status === 'visible' ? 'hidden' : 'visible';
    try {
      const res = await fetch(`/api/reviews/${rev.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update visibility');

      setReviews((prev) =>
        prev.map((r) => (r.id === rev.id ? { ...r, status: newStatus } : r))
      );

      setActionSuccess(
        newStatus === 'hidden'
          ? 'Review hidden from public booking page.'
          : 'Review is now visible publicly.'
      );
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      setActionError(err.message || 'Error updating status');
    }
  }

  // First name helper
  function getFirstName(fullName: string): string {
    if (!fullName) return 'Client';
    return fullName.trim().split(/\s+/)[0];
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#1F2937] dark:text-white">
              Client Reviews & Ratings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              ★ {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
            </span>
          </div>
          <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1">
            Real feedback from completed visits · Respond to clients and manage public visibility
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadReviews(page)}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] text-xs font-semibold text-[#1F2937] dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Plan Gating Warning Callout */}
      {!planAllowed && (
        <div className="bg-gradient-to-r from-amber-500/15 via-[#D4A77F]/15 to-transparent border border-amber-500/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 text-xl font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#1F2937] dark:text-white">
                Unlock Reviews & Ratings on Pro
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-0.5 max-w-xl">
                Your current Basic plan does not display verified client ratings on your public booking page. Upgrade to Pro or Premium to manage ratings, respond to feedback, and showcase your 5-star reputation!
              </p>
            </div>
          </div>
          <Link
            href="/app/subscription"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-extrabold shadow-md whitespace-nowrap cursor-pointer transition-all active:scale-95"
          >
            <span>Upgrade Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Top Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Score & Total */}
        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-[#A0A8B8] font-bold uppercase tracking-wider">
            <span>Overall Score</span>
            <Sparkles className="w-4 h-4 text-[#D4A77F]" />
          </div>

          <div className="my-4 flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-black text-[#1F2937] dark:text-white">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
            </span>
            <div>
              <div className="flex items-center text-amber-400 text-base">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      i < Math.round(stats.averageRating)
                        ? 'text-amber-400'
                        : 'text-neutral-300 dark:text-neutral-700'
                    }
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-0.5">
                Out of 5.0 stars
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#2A2F3A] flex items-center justify-between text-xs">
            <span className="text-[#6B7280] dark:text-[#A0A8B8]">Total Verified Reviews:</span>
            <span className="font-bold text-[#1F2937] dark:text-white">{stats.totalReviews}</span>
          </div>
        </div>

        {/* Card 2: Star Distribution Bars */}
        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs text-[#6B7280] dark:text-[#A0A8B8] font-bold uppercase tracking-wider mb-2">
            Rating Distribution
          </div>

          <div className="space-y-1.5 my-auto">
            {([5, 4, 3, 2, 1] as const).map((stars) => {
              const count = stats.distribution[stars] || 0;
              const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-2 text-xs">
                  <span className="w-10 text-[11px] font-bold text-[#6B7280] dark:text-[#A0A8B8] flex items-center gap-0.5">
                    {stars} <span className="text-amber-400">★</span>
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    />
                  </div>
                  <span className="w-8 text-[11px] text-right text-neutral-400 font-mono">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-[11px] text-neutral-400 text-right">
            Based on {stats.totalReviews} visible review{stats.totalReviews === 1 ? '' : 's'}
          </div>
        </div>

        {/* Card 3: Staff Breakdown */}
        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#6B7280] dark:text-[#A0A8B8] font-bold uppercase tracking-wider mb-2">
            <span>Stylist Performance</span>
            <Users className="w-4 h-4 text-[#D4A77F]" />
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {staffStats.length === 0 ? (
              <p className="text-xs text-neutral-400 py-4 text-center">No staff reviews logged yet.</p>
            ) : (
              staffStats.map((st) => (
                <div
                  key={st.staffId}
                  className="flex items-center justify-between text-xs p-2 rounded-xl bg-neutral-50 dark:bg-[#10141F] border border-neutral-100 dark:border-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F] flex items-center justify-center font-bold text-[10px]">
                      {st.staffName.charAt(0)}
                    </div>
                    <span className="font-semibold text-[#1F2937] dark:text-white truncate max-w-[120px]">
                      {st.staffName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-400">{st.reviewCount} reviews</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-bold text-[11px]">
                      ★ {st.averageRating > 0 ? st.averageRating.toFixed(1) : '-'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 text-[11px] text-neutral-400 text-right">
            {staffStats.length} active team member{staffStats.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#6B7280] dark:text-[#A0A8B8] flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          {/* Status Tabs */}
          <div className="flex items-center bg-neutral-100 dark:bg-[#10141F] p-0.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
            {(['all', 'visible', 'hidden'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                  statusFilter === s
                    ? 'bg-white dark:bg-[#1C2230] text-[#1F2937] dark:text-white shadow-2xs'
                    : 'text-[#6B7280] dark:text-[#A0A8B8] hover:text-[#1F2937] dark:hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Rating Dropdown */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="bg-neutral-100 dark:bg-[#10141F] border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-[#1F2937] dark:text-white focus:outline-none focus:border-[#D4A77F] cursor-pointer"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars only</option>
            <option value="3">3 Stars only</option>
            <option value="2">2 Stars only</option>
            <option value="1">1 Star only</option>
          </select>
        </div>

        <div className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">
          Showing <strong>{reviews.length}</strong> of <strong>{totalRecords}</strong> review{totalRecords === 1 ? '' : 's'}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="p-12 text-center text-neutral-400 text-xs">
          <div className="w-8 h-8 border-3 border-[#D4A77F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading client reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl p-12 text-center shadow-xs">
          <Star className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
          <h3 className="text-base font-bold text-[#1F2937] dark:text-white">No reviews found</h3>
          <p className="text-xs text-[#6B7280] dark:text-[#A0A8B8] mt-1">
            {statusFilter !== 'all' || ratingFilter !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'Completed client appointments will receive review prompts in their portal.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={`bg-white dark:bg-[#141926] border rounded-3xl p-5 shadow-xs transition-all space-y-3.5 ${
                rev.status === 'hidden'
                  ? 'border-neutral-200 dark:border-neutral-800 opacity-70 bg-neutral-50/50'
                  : 'border-[#E5E7EB] dark:border-[#2A2F3A]'
              }`}
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F] flex items-center justify-center font-bold text-xs shrink-0">
                    {getFirstName(rev.customer_name).charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1F2937] dark:text-white">
                        {getFirstName(rev.customer_name)}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400">
                        +91 {rev.customer_mobile}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8] flex flex-wrap items-center gap-1.5 mt-0.5">
                      {rev.service_name && (
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                          {rev.service_name}
                        </span>
                      )}
                      {rev.staff_name && (
                        <>
                          <span>•</span>
                          <span>Stylist: <strong>{rev.staff_name}</strong></span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        {new Date(rev.appointment_date).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Stars */}
                  <div className="flex items-center text-amber-400 text-xs px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < rev.rating ? 'text-amber-400' : 'text-neutral-300 dark:text-neutral-700'}>
                        ★
                      </span>
                    ))}
                    <span className="ml-1.5 font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                      {rev.rating}.0
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      rev.status === 'visible'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>
              </div>

              {/* Client Comment */}
              {rev.comment ? (
                <p className="text-xs sm:text-sm text-[#1F2937] dark:text-white leading-relaxed italic">
                  &ldquo;{rev.comment}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-neutral-400 italic">No written comment left by client.</p>
              )}

              {/* Owner Reply Box (if present) */}
              {rev.owner_reply && (
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#8C5E2E] dark:text-[#D4A77F] flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Your Response</span>
                    </span>
                    {rev.owner_replied_at && (
                      <span className="text-[10px] text-neutral-400">
                        {new Date(rev.owner_replied_at).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {rev.owner_reply}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                <span className="text-[11px] text-neutral-400">
                  Reviewed on{' '}
                  {new Date(rev.created_at).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(rev)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-semibold transition-all cursor-pointer"
                    title={rev.status === 'visible' ? 'Hide from public booking page' : 'Make visible publicly'}
                  >
                    {rev.status === 'visible' ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Unhide</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenReplyModal(rev)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{rev.owner_reply ? 'Edit Reply' : 'Reply'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl">
              <span className="text-xs text-[#6B7280] dark:text-[#A0A8B8]">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => loadReviews(page - 1)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => loadReviews(page + 1)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT OWNER REPLY ================= */}
      {replyModalReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto p-2 sm:p-4 flex min-h-full items-start sm:items-center justify-center animate-fade-in">
          <div className="relative bg-white dark:bg-[#141926] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-3xl max-w-lg w-full my-auto flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#E5E7EB] dark:border-[#2A2F3A] shrink-0 bg-white dark:bg-[#141926]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D4A77F]/15 text-[#8C5E2E] dark:text-[#D4A77F] flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#1F2937] dark:text-white">
                    {replyModalReview.owner_reply ? 'Edit Salon Response' : 'Reply to Client'}
                  </h3>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#A0A8B8]">
                    Client: {getFirstName(replyModalReview.customer_name)} ({replyModalReview.rating}★)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyModalReview(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 touch-scroll">

            {/* Client Comment Preview */}
            {replyModalReview.comment && (
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#10141F] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 italic">
                &ldquo;{replyModalReview.comment}&rdquo;
              </div>
            )}

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1F2937] dark:text-white mb-1.5">
                  Your Public Reply (max 300 characters)
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Thank you for visiting us! We are thrilled to hear you loved your hair treatment..."
                  className="w-full bg-[#F8F9FA] dark:bg-[#10141F] border border-[#E5E7EB] dark:border-[#2A2F3A] rounded-2xl px-4 py-2.5 text-xs text-[#1F2937] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#747D8D] focus:outline-none focus:border-[#D4A77F]"
                />
                <div className="flex justify-between items-center text-[10px] text-neutral-400 mt-1">
                  <span>Replies appear publicly below the review</span>
                  <span>{replyText.length}/300</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB] dark:border-[#2A2F3A]">
                <button
                  type="button"
                  onClick={() => setReplyModalReview(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReply || !replyText.trim()}
                  className="px-5 py-2 rounded-xl bg-[#D4A77F] hover:bg-[#B8905F] text-[#080B12] text-xs font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {savingReply ? 'Saving...' : 'Post Reply'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

