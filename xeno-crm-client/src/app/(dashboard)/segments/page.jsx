'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import Link from 'next/link';
import { Filter, Plus, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function SegmentsPage() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/segments')
      .then(data => {
        setSegments(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Segments</h1>
          <p className="text-neutral-400 mt-2">Manage your target audiences.</p>
        </div>
        <Link 
          href="/segments/new"
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus size={18}/> Create with AI
        </Link>
      </div>

      <div className="bg-neutral-900/40 border border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="bg-black/40 border-b border-white/5 text-xs uppercase font-medium text-neutral-500">
            <tr>
              <th className="px-6 py-4">Segment Name</th>
              <th className="px-6 py-4">Criteria Overview</th>
              <th className="px-6 py-4">Audience Size</th>
              <th className="px-6 py-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {segments.map(s => (
              <tr key={s._id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-white flex items-center gap-2">
                    <Filter size={16} className="text-indigo-500" />
                    {s.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 flex-wrap">
                    {s.filterCriteria?.clauses?.slice(0, 2).map((c, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs">
                        {c.field} {c.operator} {c.value}
                      </span>
                    ))}
                    {s.filterCriteria?.clauses?.length > 2 && (
                      <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-neutral-500">
                        +{s.filterCriteria.clauses.length - 2} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-white">
                    <Users size={14} className="text-neutral-500" />
                    {s.shopperCountAtSave?.toLocaleString() || 0}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-neutral-500">
                  {format(new Date(s.createdAt), 'MMM dd, yyyy')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {segments.length === 0 && (
          <div className="p-12 text-center text-neutral-500">
            No segments created yet. Click "Create with AI" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
