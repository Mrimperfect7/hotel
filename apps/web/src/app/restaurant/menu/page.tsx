'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatINR } from '@/lib/format';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Check,
  X,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  pricePaise: number;
  isVeg: boolean;
  isAvailable: boolean;
  categoryId?: string;
};

type MenuCategory = {
  id: string;
  name: string;
  items: MenuItem[];
};

type RestaurantData = {
  id: string;
  name: string;
  status: string;
  menuCategories?: MenuCategory[];
};

type Dash = {
  restaurant: RestaurantData;
};

function RestaurantMenuContent() {
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(120);
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemVeg, setNewItemVeg] = useState(true);
  const [savingItem, setSavingItem] = useState(false);

  const loadMenu = useCallback(() => {
    setLoading(true);
    api
      .get<{ data?: RestaurantData; restaurant?: RestaurantData; categories?: MenuCategory[] }>(
        '/api/food/menu',
        true
      )
      .then((res) => {
        if (res.categories) {
          setCategories(res.categories);
        }
        if (res.restaurant) {
          setRestaurant(res.restaurant);
        }
      })
      .catch(() => {
        // Fallback: load from dashboard
        api.get<Dash>('/api/food/dashboard', true).then((d) => {
          if (d.restaurant) {
            setRestaurant(d.restaurant);
            if (d.restaurant.menuCategories) {
              setCategories(d.restaurant.menuCategories);
            }
          }
        }).catch(() => {});
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Set default category
  useEffect(() => {
    if (categories.length > 0 && !newItemCategory) {
      setNewItemCategory(categories[0].name);
    }
  }, [categories, newItemCategory]);

  const toggleAvailability = async (item: MenuItem) => {
    setTogglingId(item.id);
    try {
      await api.patch(
        `/api/food/menu/items/${item.id}`,
        { isAvailable: !item.isAvailable },
        true
      );
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.map((i) =>
            i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i
          ),
        }))
      );
    } catch (err: any) {
      alert(err.message || 'Error updating availability');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this dish from the menu?')) return;
    try {
      await api.delete(`/api/food/menu/items/${itemId}`, true);
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.filter((i) => i.id !== itemId),
        }))
      );
    } catch (err: any) {
      alert(err.message || 'Error deleting menu item');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setSavingItem(true);

    try {
      await api.post(
        '/api/food/menu/items',
        {
          name: newItemName.trim(),
          description: newItemDesc.trim(),
          categoryName: newItemCategory || 'Specials',
          pricePaise: Math.round(Number(newItemPrice) * 100),
          isVeg: newItemVeg,
          isAvailable: true,
        },
        true
      );
      setShowAddModal(false);
      setNewItemName('');
      setNewItemDesc('');
      setNewItemPrice(120);
      loadMenu();
    } catch (err: any) {
      alert(err.message || 'Failed to add item');
    } finally {
      setSavingItem(false);
    }
  };

  // Sample default categories if restaurant has none yet
  const displayCategories = categories.length > 0 ? categories : [
    {
      id: 'c1',
      name: 'Temple Prasadam & Sadhya',
      items: [
        { id: 'i1', name: 'Traditional Guruvayoor Sadhya', description: 'Full banana leaf meal with Payasam and pickles', pricePaise: 18000, isVeg: true, isAvailable: true },
        { id: 'i2', name: 'Palpayasam (Special)', description: 'Rich temple style milk payasam in earthen pot', pricePaise: 9000, isVeg: true, isAvailable: true }
      ]
    },
    {
      id: 'c2',
      name: 'Breakfast & Tiffin',
      items: [
        { id: 'i3', name: 'Ghee Roast Dosa', description: 'Crispy fermented crepe with sambar and 3 chutneys', pricePaise: 9000, isVeg: true, isAvailable: true },
        { id: 'i4', name: 'Steamed Idli (3 pcs) + Vada', description: 'Soft steamed rice cakes with medu vada', pricePaise: 7000, isVeg: true, isAvailable: true }
      ]
    }
  ];

  const totalItemsCount = displayCategories.reduce((acc, c) => acc + c.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-temple-800 flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-gold-600" /> Restaurant Menu Management
          </h1>
          <p className="text-sm text-temple-500 mt-1">
            Manage your dishes, sadhya specials, prices, and live in-stock availability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-gold flex items-center gap-1.5 text-xs py-2 px-3 shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
          <Link href="/restaurant" className="btn-primary text-xs py-2 px-3">
            Kitchen Display →
          </Link>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 card p-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-temple-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="input pl-9 text-sm py-2"
            placeholder="Search dish name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-temple-600">
          <span>Total Dishes: <strong>{totalItemsCount}</strong></span>
          <button
            onClick={loadMenu}
            className="btn-outline text-xs py-1.5 px-2.5 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Menu Categories & Items List */}
      <div className="space-y-6">
        {displayCategories.map((cat) => {
          const visibleItems = cat.items.filter(
            (i) =>
              !search ||
              i.name.toLowerCase().includes(search.toLowerCase()) ||
              (i.description && i.description.toLowerCase().includes(search.toLowerCase()))
          );

          if (visibleItems.length === 0 && search) return null;

          return (
            <div key={cat.id} className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-temple-100 pb-2.5">
                <h2 className="font-display text-lg font-bold text-temple-800 flex items-center gap-2">
                  <span className="text-xl">🍛</span> {cat.name}
                  <span className="text-xs font-normal text-temple-400">
                    ({visibleItems.length} items)
                  </span>
                </h2>
              </div>

              <div className="divide-y divide-temple-50">
                {visibleItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 flex flex-wrap items-center justify-between gap-4 hover:bg-temple-50/40 px-2 rounded-lg transition-colors"
                  >
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2">
                        {/* Veg indicator badge */}
                        <span
                          className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                            item.isVeg ? 'border-emerald-600' : 'border-red-600'
                          }`}
                          title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                            }`}
                          />
                        </span>

                        <h3 className="font-bold text-temple-900 text-sm">{item.name}</h3>

                        {!item.isAvailable && (
                          <span className="badge bg-red-100 text-red-700 text-[10px] font-bold">
                            Sold Out
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-temple-500 pl-5">{item.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-temple-800 text-sm whitespace-nowrap">
                        {formatINR(item.pricePaise)}
                      </span>

                      {/* In Stock toggle */}
                      <button
                        type="button"
                        onClick={() => toggleAvailability(item)}
                        disabled={togglingId === item.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                          item.isAvailable
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> In Stock
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5 text-gray-500" /> Out of Stock
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-temple-400 hover:text-red-600 p-1 transition"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-temple-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-temple-100 pb-3">
              <h3 className="font-display text-lg font-bold text-temple-800">
                Add New Menu Dish
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-temple-400 hover:text-temple-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="label">Dish Name</label>
                <input
                  className="input"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Masala Dosa / Ghee Rice"
                  required
                />
              </div>

              <div>
                <label className="label">Description / Ingredients</label>
                <input
                  className="input"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="e.g. Served with coconut chutney and tomato rasam"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <input
                    className="input"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    placeholder="e.g. Breakfast, Sadhya, Snacks"
                    required
                  />
                </div>

                <div>
                  <label className="label">Price (₹)</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isVegCheckbox"
                  checked={newItemVeg}
                  onChange={(e) => setNewItemVeg(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="isVegCheckbox" className="text-sm font-semibold text-temple-700">
                  Pure Vegetarian (Prasadam / Satvik)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-temple-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="btn-gold text-xs py-2 px-5 font-bold"
                >
                  {savingItem ? 'Saving...' : 'Add Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RestaurantMenuPage() {
  return (
    <Suspense fallback={<div className="card h-64 animate-pulse bg-temple-50" />}>
      <RestaurantMenuContent />
    </Suspense>
  );
}
