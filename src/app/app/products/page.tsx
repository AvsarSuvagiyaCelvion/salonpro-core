'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  TrendingDown,
  DollarSign,
  Tag,
  Boxes,
  ShoppingCart,
  Users,
  Sparkles,
  Phone,
  MessageSquare,
  CreditCard,
  Clock,
  Check,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  brand: string | null;
  sku: string | null;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  active: boolean;
  is_low_stock: boolean;
}

interface ProductSale {
  item_id: string;
  product_name: string;
  qty: number;
  unit_price: number;
  total_price: number;
  sold_at: string;
  staff_id: string;
  staff_name: string;
  product_commission_pct: number;
  staff_commission_earned: number;
  customer_id: string;
  customer_name: string;
  customer_mobile: string;
  invoice_id: string;
  invoice_number: string;
  payment_method: string;
}

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'active'>('all');
  const [lowStockCount, setLowStockCount] = useState(0);

  // Add/Edit Product Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields for Product
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formActive, setFormActive] = useState(true);

  // Quick Retail Sell POS Modal State
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellProductId, setSellProductId] = useState('');
  const [sellQty, setSellQty] = useState('1');
  const [sellStaffId, setSellStaffId] = useState('');
  const [customerSelectionType, setCustomerSelectionType] = useState<'existing' | 'new'>('new');
  const [sellCustomerId, setSellCustomerId] = useState('');
  const [sellCustomerName, setSellCustomerName] = useState('');
  const [sellCustomerMobile, setSellCustomerMobile] = useState('');
  const [sellPaymentMethod, setSellPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [selling, setSelling] = useState(false);
  const [saleSuccessInfo, setSaleSuccessInfo] = useState<any | null>(null);

  async function fetchProducts() {
    try {
      setLoading(true);
      const url = `/api/products?filter=${filter}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data.products || []);
      setLowStockCount(data.lowStockCount || 0);
    } catch {
      setMessage({ type: 'error', text: 'Failed to fetch products' });
    } finally {
      setLoading(false);
    }
  }

  async function fetchSales() {
    try {
      const res = await fetch('/api/products/sell');
      if (res.ok) {
        const data = await res.json();
        setSales(data.sales || []);
        setSalesStats(data.stats || null);
      }
    } catch {}
  }

  async function fetchStaffAndCustomers() {
    try {
      const [staffRes, custRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/customers'),
      ]);
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffList(staffData.staff || []);
        if (staffData.staff?.length > 0 && !sellStaffId) {
          setSellStaffId(staffData.staff[0].id);
        }
      }
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomersList(custData.customers || []);
      }
    } catch {}
  }

  useEffect(() => {
    fetchProducts();
    fetchSales();
    fetchStaffAndCustomers();
  }, [filter, searchQuery]);

  function handleOpenAdd() {
    setEditingProduct(null);
    setFormName('');
    setFormBrand('');
    setFormSku('');
    setFormPrice('');
    setFormCostPrice('');
    setFormStock('10');
    setFormMinStock('5');
    setFormActive(true);
    setIsModalOpen(true);
  }

  function handleOpenEdit(p: Product) {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBrand(p.brand || '');
    setFormSku(p.sku || '');
    setFormPrice(p.price.toString());
    setFormCostPrice(p.cost_price?.toString() || '');
    setFormStock(p.stock.toString());
    setFormMinStock(p.min_stock.toString());
    setFormActive(p.active);
    setIsModalOpen(true);
  }

  function handleOpenSell(product?: Product) {
    setSaleSuccessInfo(null);
    if (product) {
      setSellProductId(product.id);
    } else if (products.length > 0) {
      setSellProductId(products[0].id);
    }
    setSellQty('1');
    if (staffList.length > 0) {
      setSellStaffId(staffList[0].id);
    }
    setCustomerSelectionType('new');
    setSellCustomerId('');
    setSellCustomerName('');
    setSellCustomerMobile('');
    setSellPaymentMethod('cash');
    setIsSellModalOpen(true);
  }

  async function handleSubmitProduct(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = {
      name: formName,
      brand: formBrand,
      sku: formSku,
      price: Number(formPrice),
      cost_price: Number(formCostPrice) || 0,
      stock: parseInt(formStock, 10) || 0,
      min_stock: parseInt(formMinStock, 10) || 5,
      active: formActive,
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save product');
      }

      await fetchProducts();
      setIsModalOpen(false);
      setMessage({
        type: 'success',
        text: editingProduct ? 'Product updated successfully' : 'Product added successfully',
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('Are you sure you want to remove this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchProducts();
      setMessage({ type: 'success', text: 'Product removed' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete product' });
    }
  }

  async function handleExecuteSell(e: React.FormEvent) {
    e.preventDefault();
    setSelling(true);
    setMessage(null);

    try {
      const payload: any = {
        productId: sellProductId,
        qty: parseInt(sellQty, 10) || 1,
        staffId: sellStaffId,
        paymentMethod: sellPaymentMethod,
      };

      if (customerSelectionType === 'existing' && sellCustomerId) {
        payload.customerId = sellCustomerId;
      } else {
        payload.customerName = sellCustomerName.trim() || 'Walk-in Client';
        payload.customerMobile = sellCustomerMobile.trim();
      }

      const res = await fetch('/api/products/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process product sale');
      }

      setSaleSuccessInfo(data);
      await fetchProducts();
      await fetchSales();
    } catch (err: any) {
      alert(err.message || 'Sale failed');
    } finally {
      setSelling(false);
    }
  }

  const selectedProduct = products.find((p) => p.id === sellProductId);
  const selectedStaff = staffList.find((s) => s.id === sellStaffId);
  const sellTotalPrice = selectedProduct ? selectedProduct.price * (parseInt(sellQty, 10) || 1) : 0;
  const staffCommEarned = selectedStaff
    ? sellTotalPrice * (Number(selectedStaff.product_commission_pct || 0) / 100)
    : 0;

  const totalInventoryUnits = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-pink-600">
            Salon Retail & Inventory OS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2a1630] tracking-tight">
            Products & Retail Management
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Track stock inventory, sell retail products via staff, and manage commissions
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleOpenSell()}
            disabled={products.length === 0}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-900/10 transition-all cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Sell Product (Quick POS)</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#b3135b] hover:bg-[#99104e] text-white text-xs font-extrabold shadow-md shadow-pink-900/20 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2 font-medium animate-fadeIn ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Total Products
            </span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#b3135b] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2a1630]">{products.length}</div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Catalog SKUs</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              In-Stock Units
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2a1630]">{totalInventoryUnits}</div>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Physical Units</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Low Stock Alerts
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{lowStockCount}</div>
          <span className="text-[11px] text-amber-600/80 mt-0.5 block font-semibold">
            {lowStockCount > 0 ? 'Needs reordering' : 'Stock levels optimal'}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Retail Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{Number(salesStats?.total_retail_revenue || 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            {salesStats?.total_units_sold || 0} Units Sold via Staff
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto no-scrollbar touch-scroll">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'bg-[#b3135b] text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Product Inventory ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 shrink-0 whitespace-nowrap ${
            activeTab === 'sales'
              ? 'bg-[#b3135b] text-white shadow-xs'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Retail Sales & Staff Commissions ({sales.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: PRODUCT INVENTORY ================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by name, brand, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-neutral-200 text-xs text-[#2a1630] focus:outline-none focus:border-[#b3135b] transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-neutral-800 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                All Products
              </button>
              <button
                onClick={() => setFilter('low_stock')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filter === 'low_stock'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Low Stock ({lowStockCount})</span>
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filter === 'active'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                Active Only
              </button>
            </div>
          </div>

          {/* Product Cards Grid */}
          {loading ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200/80">
              <div className="w-8 h-8 border-3 border-[#b3135b] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-neutral-500">Loading salon inventory...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-neutral-200/80">
              <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-800">No products found</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                {searchQuery || filter !== 'all'
                  ? 'No items matched your current filters.'
                  : 'Start adding salon retail shampoos, oils, waxes, and serums.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className={`bg-white rounded-3xl p-5 border transition-all hover:shadow-md flex flex-col justify-between ${
                    p.is_low_stock
                      ? 'border-amber-300 ring-2 ring-amber-50 shadow-xs'
                      : 'border-neutral-200/80 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        {p.brand && (
                          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                            {p.brand}
                          </span>
                        )}
                        <h3 className="font-extrabold text-sm text-[#2a1630]">{p.name}</h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                          p.is_low_stock
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {p.is_low_stock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </div>

                    {p.sku && (
                      <span className="text-[10px] text-neutral-400 font-mono block mb-3">
                        SKU: {p.sku}
                      </span>
                    )}

                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs mb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                          Retail Price
                        </span>
                        <strong className="text-sm font-black text-[#2a1630]">
                          ₹{Number(p.price).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                          Stock Quantity
                        </span>
                        <strong
                          className={`text-sm font-black ${
                            p.is_low_stock ? 'text-amber-600' : 'text-emerald-700'
                          }`}
                        >
                          {p.stock} units
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenSell(p)}
                      disabled={p.stock <= 0}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sell to Client</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-xl text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 cursor-pointer"
                      title="Edit product"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: RETAIL SALES & STAFF COMMISSION ================= */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-[#2a1630]">
                Retail Sales & Staff Performance Log
              </h3>
              <p className="text-xs text-neutral-500">
                Every product purchased by clients, linked to the recommending staff stylist
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenSell()}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm self-start sm:self-auto cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Record New Sale</span>
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-neutral-800">No retail product sales yet</h4>
              <p className="text-xs text-neutral-500 mt-1">
                Click &quot;Sell Product (Quick POS)&quot; to record your first client sale.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-600">
                <thead className="bg-neutral-50 text-[10px] uppercase font-black tracking-wider text-neutral-400 border-b border-neutral-100">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Sold By (Staff)</th>
                    <th className="py-3 px-4">Staff Commission</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {sales.map((sale) => (
                    <tr key={sale.item_id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4 text-[11px] text-neutral-500 whitespace-nowrap">
                        {new Date(sale.sold_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        {new Date(sale.sold_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-neutral-900">
                        {sale.product_name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-neutral-800">
                        x{sale.qty}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900">{sale.customer_name}</div>
                        {sale.customer_mobile && sale.customer_mobile !== '0000000000' && (
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {sale.customer_mobile}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#b3135b] block">
                          {sale.staff_name || 'Counter Sale'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {sale.product_commission_pct}% Rate
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-700">
                        ₹{Number(sale.staff_commission_earned || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-neutral-900 block">
                          ₹{Number(sale.total_price).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-sm bg-neutral-100 text-neutral-600 font-bold">
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-neutral-500">
                        #{sale.invoice_number}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: QUICK RETAIL SELL POS ================= */}
      {isSellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#2a1630]">Sell Product (Quick POS)</h3>
                  <span className="text-[11px] text-neutral-400">Credit sale & commission to staff</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSellModalOpen(false)}
                className="p-1 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saleSuccessInfo ? (
              <div className="text-center py-4 space-y-4 animate-scale-in">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    Sale Completed & Recorded
                  </span>
                  <h4 className="text-xl font-black text-[#2a1630] mt-2">
                    Invoice #{saleSuccessInfo.invoice.number}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    Successfully sold to <strong>{saleSuccessInfo.invoice.customerName}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Total Billed:</span>
                    <strong className="text-neutral-900">
                      ₹{saleSuccessInfo.invoice.total.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Staff Credited:</span>
                    <strong className="text-[#b3135b]">{saleSuccessInfo.staff.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Staff Commission Earned:</span>
                    <strong className="text-emerald-700">
                      ₹{saleSuccessInfo.staff.commissionEarned} ({saleSuccessInfo.staff.commissionPct}%)
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Inventory Stock Remaining:</span>
                    <strong className="text-neutral-800">
                      {saleSuccessInfo.product.remainingStock} units
                    </strong>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {saleSuccessInfo.whatsappUrl && (
                    <a
                      href={saleSuccessInfo.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send Digital Bill on WhatsApp ➔</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSaleSuccessInfo(null);
                      setIsSellModalOpen(false);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold cursor-pointer"
                  >
                    Done / Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteSell} className="space-y-4">
                {/* 1. Select Product */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Select Product <span className="text-pink-600">*</span>
                  </label>
                  <select
                    required
                    value={sellProductId}
                    onChange={(e) => setSellProductId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900 bg-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                        {p.name} — ₹{p.price} ({p.stock} units in stock)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Quantity & Staff Member */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Quantity <span className="text-pink-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedProduct ? selectedProduct.stock : 99}
                      value={sellQty}
                      onChange={(e) => setSellQty(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Sold By (Staff) <span className="text-pink-600">*</span>
                    </label>
                    <select
                      required
                      value={sellStaffId}
                      onChange={(e) => setSellStaffId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900 bg-white"
                    >
                      {staffList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.product_commission_pct}% Comm.)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Customer Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Customer Info
                    </label>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setCustomerSelectionType('new')}
                        className={`font-bold cursor-pointer ${
                          customerSelectionType === 'new' ? 'text-[#b3135b] underline' : 'text-neutral-400'
                        }`}
                      >
                        + Walk-in Client
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setCustomerSelectionType('existing')}
                        className={`font-bold cursor-pointer ${
                          customerSelectionType === 'existing'
                            ? 'text-[#b3135b] underline'
                            : 'text-neutral-400'
                        }`}
                      >
                        Existing Client
                      </button>
                    </div>
                  </div>

                  {customerSelectionType === 'existing' ? (
                    <select
                      value={sellCustomerId}
                      onChange={(e) => setSellCustomerId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900 bg-white"
                    >
                      <option value="">-- Choose Existing Client --</option>
                      {customersList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.mobile})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Client Name"
                        value={sellCustomerName}
                        onChange={(e) => setSellCustomerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900"
                      />
                      <input
                        type="tel"
                        placeholder="WhatsApp No. (for bill)"
                        value={sellCustomerMobile}
                        onChange={(e) => setSellCustomerMobile(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900 font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Payment Mode */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Payment Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cash', 'upi', 'card'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSellPaymentMethod(m)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                          sellPaymentMethod === m
                            ? 'border-[#b3135b] bg-pink-50 text-[#b3135b]'
                            : 'border-neutral-200 text-neutral-600'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Order Summary */}
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-neutral-900">
                    <span>Retail Total (₹):</span>
                    <span className="text-sm font-black text-[#b3135b]">
                      ₹{sellTotalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-500">
                    <span>
                      Staff Earns ({selectedStaff?.name || 'Staff'}{' '}
                      {selectedStaff?.product_commission_pct || 0}%):
                    </span>
                    <strong className="text-emerald-700 font-mono">
                      +₹{staffCommEarned.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSellModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-neutral-500 hover:bg-neutral-100 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selling || !selectedProduct || selectedProduct.stock <= 0}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {selling ? 'Processing Sale...' : 'Complete Sale & Issue Bill'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT PRODUCT ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <h3 className="font-black text-base text-[#2a1630]">
                {editingProduct ? 'Edit Retail Product' : 'Add New Retail Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Product Name <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Moroccan Argan Hair Oil"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. L'Oreal, Wella"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    SKU / Barcode
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="e.g. OIL-001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Selling Price (₹) <span className="text-pink-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="999"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    placeholder="550"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Physical Stock Count <span className="text-pink-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="10"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Low Stock Alert Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    placeholder="5"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#b3135b] outline-none text-xs text-neutral-900 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-500 hover:bg-neutral-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#b3135b] hover:bg-[#99104e] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
