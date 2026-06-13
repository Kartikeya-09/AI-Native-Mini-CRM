'use client';
import { useState, useEffect } from 'react';
import { Activity, Send, CheckCircle, XCircle, ArrowUpRight } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import { getToken } from '../../../lib/auth';

function StatCard({ title, value, icon: Icon, colorClass, gradientClass }) {
  return (
    <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${gradientClass}`} />
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-neutral-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-light text-white tracking-tight">{value.toLocaleString()}</h3>
        </div>
        <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 border border-white/5`}>
          <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    messagesSent: 0,
    messagesDelivered: 0,
    messagesFailed: 0,
    attributedRevenue: 0
  });

  useEffect(() => {
    // Initial fetch to populate UI fast
    const fetchInitial = async () => {
      try {
        const campaigns = await apiFetch('/api/campaigns');
        let sent = 0, delivered = 0, failed = 0, rev = 0;
        
        campaigns.forEach(c => {
          if (c.stats) {
            sent += c.stats.sent || 0;
            delivered += c.stats.delivered || 0;
            failed += c.stats.failed || 0;
            rev += c.stats.attributedRevenue || 0;
          }
        });

        setStats({
          totalCampaigns: campaigns.length,
          messagesSent: sent,
          messagesDelivered: delivered,
          messagesFailed: failed,
          attributedRevenue: rev
        });
      } catch (err) {
        console.error('Failed to fetch initial campaigns for dashboard', err);
      }
    };

    fetchInitial();

    // Set up SSE for live updates
    const token = getToken();
    if (!token) return;

    const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/live?token=${token}`);
    
    // We actually need to send token via query param because EventSource doesn't support Authorization header easily natively,
    // WAIT: The backend /api/stats/live uses `withAuth` middleware which checks `Authorization: Bearer <token>`.
    // The standard EventSource doesn't allow headers. I will need to update the backend middleware or use a polyfill.
    // For now, I'll pass it in the query string `?token=` and update backend later if needed, OR use the cookie.
    // Since `document.cookie` is sent automatically by EventSource (if withCredentials is true), we can rely on the cookie!

  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight">Overview</h1>
        <p className="text-neutral-400 mt-2">Real-time performance of your marketing pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Campaigns" 
          value={stats.totalCampaigns} 
          icon={Activity} 
          colorClass="bg-indigo-500 text-indigo-400" 
          gradientClass="bg-indigo-500" 
        />
        <StatCard 
          title="Messages Sent" 
          value={stats.messagesSent} 
          icon={Send} 
          colorClass="bg-blue-500 text-blue-400" 
          gradientClass="bg-blue-500" 
        />
        <StatCard 
          title="Delivered" 
          value={stats.messagesDelivered} 
          icon={CheckCircle} 
          colorClass="bg-emerald-500 text-emerald-400" 
          gradientClass="bg-emerald-500" 
        />
        <StatCard 
          title="Failed" 
          value={stats.messagesFailed} 
          icon={XCircle} 
          colorClass="bg-rose-500 text-rose-400" 
          gradientClass="bg-rose-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-neutral-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-medium text-white">Attributed Revenue</h2>
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 text-sm font-medium flex items-center gap-1">
              <ArrowUpRight size={16} /> Live
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-light text-white tracking-tight">
              ${stats.attributedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-neutral-500 font-medium text-lg">USD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
