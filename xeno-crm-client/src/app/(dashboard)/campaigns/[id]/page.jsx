'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '../../../../lib/api';
import { getToken } from '../../../../lib/auth';
import { Megaphone, Activity, Sparkles, Scale, CheckCircle, Eye, MousePointerClick, DollarSign, XCircle, Send } from 'lucide-react';
import { format } from 'date-fns';

function RateCard({ title, count, rate, icon: Icon, colorClass }) {
  return (
    <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl hover:bg-neutral-900/60 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl bg-opacity-10 border border-white/5 ${colorClass}`}>
          <Icon size={18} className={colorClass.replace('bg-', 'text-')} />
        </div>
        <div className="text-right">
          <div className="text-2xl font-light text-white">{count?.toLocaleString() || 0}</div>
          <div className="text-sm font-medium text-neutral-500">Count</div>
        </div>
      </div>
      <div>
        <div className="text-sm text-neutral-400 mb-1">{title}</div>
        <div className="flex items-end gap-2">
          <div className={`text-3xl font-light tracking-tight ${colorClass.replace('bg-', 'text-')}`}>
            {((rate || 0) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id;

  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI features
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [compareId, setCompareId] = useState('');
  const [comparison, setComparison] = useState('');
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    // Fetch campaign and stats
    apiFetch(`/api/campaigns/${campaignId}`).then(data => {
      setCampaign(data);
      setStats(data.stats);
      setLoading(false);
    }).catch(console.error);

    // Fetch list of all campaigns for the compare dropdown
    apiFetch('/api/campaigns').then(setAllCampaigns).catch(console.error);

    // Listen to live stats
    const token = getToken();
    if (token) {
      const source = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/api/stats/live?token=${token}`);
      source.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'stats-update' && data.campaignId === campaignId) {
            setStats(prev => ({ ...prev, ...data.stats }));
          }
        } catch (err) {}
      };
      return () => source.close();
    }
  }, [campaignId]);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const res = await apiFetch(`/api/ai/summary/${campaignId}`);
      setAiSummary(res.summary);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCompare = async () => {
    if (!compareId) return;
    setIsComparing(true);
    try {
      const res = await apiFetch('/api/ai/compare', {
        method: 'POST',
        body: JSON.stringify({ campaignIdA: campaignId, campaignIdB: compareId })
      });
      setComparison(res.comparison);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsComparing(false);
    }
  };

  if (loading || !campaign) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-light text-white tracking-tight">{campaign.name}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
              campaign.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              campaign.status === 'sending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
            }`}>
              {campaign.status.toUpperCase()}
            </span>
          </div>
          <p className="text-neutral-400">Created on {format(new Date(campaign.createdAt), 'MMMM dd, yyyy')} • {campaign.channel.toUpperCase()} Channel</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <RateCard title="Delivery Rate" count={stats?.delivered} rate={stats?.deliveryRate} icon={CheckCircle} colorClass="bg-emerald-500 text-emerald-400" />
        <RateCard title="Open Rate" count={stats?.opened} rate={stats?.openRate} icon={Eye} colorClass="bg-blue-500 text-blue-400" />
        <RateCard title="Click Rate" count={stats?.clicked} rate={stats?.clickRate} icon={MousePointerClick} colorClass="bg-indigo-500 text-indigo-400" />
        <RateCard title="Failure Rate" count={stats?.failed} rate={stats?.sent > 0 ? (stats?.failed / stats?.sent) : 0} icon={XCircle} colorClass="bg-rose-500 text-rose-400" />
      </div>

      {/* Financials & Deep AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core details */}
        <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-white mb-6">Attribution Metrics</h3>
            <div className="space-y-6">
              <div>
                <div className="text-sm text-neutral-400 mb-1">Total Revenue Driven</div>
                <div className="text-4xl font-light text-emerald-400 tracking-tight">
                  ${stats?.attributedRevenue?.toLocaleString(undefined, {minimumFractionDigits:2}) || '0.00'}
                </div>
              </div>
              <div>
                <div className="text-sm text-neutral-400 mb-1">Orders Generated</div>
                <div className="text-2xl font-light text-white">{stats?.attributedOrders?.toLocaleString() || 0}</div>
              </div>
              <div>
                <div className="text-sm text-neutral-400 mb-1">Messages Sent</div>
                <div className="text-2xl font-light text-white">{stats?.sent?.toLocaleString() || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="lg:col-span-2 bg-neutral-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400"/> AI Performance Summary
              </h3>
              <button 
                onClick={handleSummarize}
                disabled={isSummarizing}
                className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                {isSummarizing ? 'Analyzing...' : 'Generate Insights'}
              </button>
            </div>

            {aiSummary ? (
              <div className="text-lg leading-relaxed text-neutral-300 font-light bg-black/30 p-6 rounded-2xl border border-white/5">
                {aiSummary}
              </div>
            ) : (
              <div className="text-neutral-500 italic py-8 text-center bg-black/20 rounded-2xl border border-white/5 border-dashed">
                Click "Generate Insights" to let the AI analyze this campaign's performance data.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compare Tool */}
      <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-6">
          <Scale size={20} className="text-purple-400" />
          <h3 className="text-lg font-medium text-white">Compare with Another Campaign</h3>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <select 
            value={compareId} 
            onChange={e => setCompareId(e.target.value)}
            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/50 appearance-none"
          >
            <option value="">Select a campaign to compare against...</option>
            {allCampaigns.filter(c => c._id !== campaignId).map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <button 
            onClick={handleCompare}
            disabled={!compareId || isComparing}
            className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
          >
            {isComparing ? 'Comparing...' : 'Run Comparison'}
          </button>
        </div>

        {comparison && (
          <div className="text-neutral-300 leading-relaxed font-light bg-black/30 p-6 rounded-2xl border border-white/5 whitespace-pre-wrap">
            {comparison}
          </div>
        )}
      </div>

    </div>
  );
}
