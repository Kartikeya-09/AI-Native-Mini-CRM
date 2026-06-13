'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import { Users, Mail, Phone, ShoppingBag, MapPin, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function ShoppersPage() {
  const [shoppers, setShoppers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch('/api/shoppers')
      .then(response => {
        setShoppers(response.data || []);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const filteredShoppers = shoppers.filter(s => 
    s.email.toLowerCase().includes(search.toLowerCase()) || 
    (s.firstName && s.firstName.toLowerCase().includes(search.toLowerCase())) ||
    (s.lastName && s.lastName.toLowerCase().includes(search.toLowerCase()))
  );

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
            onChange={e => setSearch(e.target.value)}
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
              {filteredShoppers.map(s => (
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
                        ${(s.totalSpend || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
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
          {filteredShoppers.length === 0 && (
            <div className="p-12 text-center text-neutral-500">
              No shoppers found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
