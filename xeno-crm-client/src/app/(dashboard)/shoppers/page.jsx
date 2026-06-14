'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import { Users, Mail, Phone, ShoppingBag, MapPin, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function ShoppersPage() {
  const [shoppers, setShoppers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });
  const limit = 50;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (debouncedSearch) params.append('q', debouncedSearch);
    
    apiFetch(`/api/shoppers?${params.toString()}`)
      .then(response => {
        setShoppers(response.data || []);
        setMeta(response.meta || { total: 0, page: 1, limit, totalPages: 0 });
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setLoading(false);
      });
  }, [page, debouncedSearch]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handlePrevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < meta.totalPages) setPage(page + 1);
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Shoppers CRM</h1>
          <p className="text-neutral-400 mt-2">View and search your synced customer database.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
          <input 
            type="text"
            placeholder="Search email or name..."
            value={search}
            onChange={handleSearchChange}
            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
      </div>

      <div className="bg-neutral-900/40 border border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="bg-black/40 border-b border-white/5 text-xs uppercase font-medium text-neutral-500">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Purchases</th>
                <th className="px-6 py-4">Attributes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {shoppers.map(s => (
                <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
                        {s.firstName?.[0] || s.email[0]}
                      </div>
                      <div>
                        <div>{s.firstName} {s.lastName}</div>
                        <div className="text-xs text-neutral-500 font-normal">ID: {s.externalId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Mail size={14} className="text-neutral-500" />
                      {s.email}
                    </div>
                    {s.phone && (
                      <div className="flex items-center gap-2 text-neutral-400 text-xs">
                        <Phone size={12} className="text-neutral-500" />
                        {s.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-white">
                        <ShoppingBag size={14} className="text-indigo-400" />
                        {s.orderCount || 0} orders
                      </div>
                      <div className="text-emerald-400 font-medium">
                        ${(s.totalSpent || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </div>
                      {s.lastOrderDate && (
                        <div className="text-xs text-neutral-500">
                          Last: {format(new Date(s.lastOrderDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {s.attributes?.city && (
                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs flex items-center gap-1">
                          <MapPin size={10} /> {s.attributes.city}
                        </span>
                      )}
                      {s.attributes?.loyaltyTier && (
                        <span className={`px-2 py-1 rounded-md border text-xs font-medium ${
                          s.attributes.loyaltyTier === 'gold' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          s.attributes.loyaltyTier === 'silver' ? 'bg-neutral-400/10 text-neutral-300 border-neutral-400/20' :
                          'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                          {s.attributes.loyaltyTier.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shoppers.length === 0 && (
            <div className="p-12 text-center text-neutral-500">
              No shoppers found matching your criteria.
            </div>
          )}
        </div>
        
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/20">
            <div className="text-sm text-neutral-400">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, meta.total)} of {meta.total.toLocaleString()} shoppers
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-neutral-300 px-4">
                Page {page} of {meta.totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page === meta.totalPages}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
