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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'active'>('all');
  const [lowStockCount, setLowStockCount] = useState(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formActive, setFormActive] = useState(true);

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

  useEffect(() => {
    fetchProducts();
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
    if (!confirm('Are you sure you want to delete this product?')) return;
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

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + Number(p.price) * p.stock,
    0
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2a1630] tracking-tight">
            Products & Inventory
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Retail salon items, stock levels, and low-inventory reorder alerts
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#b3135b] hover:bg-[#99104e] text-white text-xs font-bold shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
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

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Total Catalog Items
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2a1630] mt-2">
            {products.length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Active retail beauty products</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Low Stock Alerts
            </span>
            {lowStockCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-2">
            {lowStockCount}
          </div>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">
            {lowStockCount > 0 ? 'Items need reordering urgently' : 'All stock levels healthy'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Retail Stock Value
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2a1630] mt-2">
            ₹{totalInventoryValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Total on-shelf retail worth
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Products' },
            { id: 'low_stock', label: `Low Stock (${lowStockCount})` },
            { id: 'active', label: 'Active Only' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === btn.id
                  ? 'bg-[#b3135b] text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by product, brand, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:border-[#b3135b]"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-4">Brand & SKU</th>
                <th className="py-4 px-4 text-right">Retail Price</th>
                <th className="py-4 px-4 text-right">Cost Price</th>
                <th className="py-4 px-4 text-center">Stock Level</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No products found. Click &quot;Add Product&quot; to add your first retail item.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-pink-50 text-[#b3135b] flex items-center justify-center font-bold text-xs border border-pink-100">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-[#2a1630] text-sm">{p.name}</div>
                          {p.is_low_stock && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              Low stock
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-neutral-700">{p.brand || 'In-House'}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{p.sku || '-'}</div>
                    </td>

                    <td className="py-4 px-4 text-right font-extrabold text-[#2a1630] text-sm">
                      ₹{Number(p.price).toLocaleString('en-IN')}
                    </td>

                    <td className="py-4 px-4 text-right text-neutral-500 font-medium">
                      ₹{Number(p.cost_price || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${
                          p.is_low_stock
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {p.stock} units
                      </span>
                      <span className="block text-[10px] text-neutral-400 mt-0.5">
                        Min threshold: {p.min_stock}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.active ? 'bg-emerald-50 text-emerald-600' : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        {p.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-600 hover:text-[#b3135b]"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-neutral-400 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 animate-scaleUp">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-100 mb-5">
              <h2 className="text-lg font-bold text-[#2a1630]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Product Name <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Moroccan Argan Hair Serum 100ml"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Moroccanoil"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    SKU / Barcode
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-ARG-001"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm font-mono focus:outline-none focus:border-[#b3135b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Selling Price (₹) <span className="text-pink-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="850.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm font-bold text-[#2a1630] focus:outline-none focus:border-[#b3135b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Cost Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="450.00"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#b3135b]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    In-Stock Quantity
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm font-mono focus:outline-none focus:border-[#b3135b]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Min Stock Reorder Level
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 text-sm font-mono focus:outline-none focus:border-[#b3135b]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="productActive"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded text-[#b3135b] focus:ring-[#b3135b]"
                />
                <label htmlFor="productActive" className="text-xs font-semibold text-neutral-700">
                  Active for retail & session billing
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-neutral-100 text-neutral-600 text-xs font-semibold hover:bg-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-[#b3135b] hover:bg-[#99104e] text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
