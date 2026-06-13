'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import Link from 'next/link';
import { Megaphone, Plus, Search, Activity, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [segments, setSegments] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [channel, setChannel] = useState('email');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/campaigns'),
      apiFetch('/api/segments')
    ]).then(([cData, sData]) => {
      setCampaigns(cData);
      setSegments(sData);
      if (sData.length > 0) setSegmentId(sData[0]._id);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('Saving campaign...');
    try {
      // 1. Create
      const newCampaign = await apiFetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({ name, segmentId, channel, messageTemplate })
      });
      
      setSubmitStatus('Launching campaign...');
      // 2. Launch
      const launchResult = await apiFetch(`/api/campaigns/${newCampaign._id}/launch`, { method: 'POST' });
      
      alert(`Success! Launched to ${launchResult.audienceCount} shoppers.`);
      setShowCreate(false);
      setCampaigns([newCampaign, ...campaigns]); // optimistic update
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('');
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light text-white tracking-tight">Campaigns</h1>
          <p className="text-neutral-400 mt-2">Manage and orchestrate your AI campaigns.</p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-2"
        >
          {showCreate ? 'Cancel' : <><Plus size={18}/> New Campaign</>}
        </button>
      </div>

      {showCreate && (
        <div className="bg-neutral-900/40 border border-white/5 backdrop-blur-xl rounded-3xl p-8">
          <h2 className="text-xl font-medium text-white mb-6">Create New Campaign</h2>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Campaign Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Target Segment</label>
                <select required value={segmentId} onChange={e => setSegmentId(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 appearance-none">
                  {segments.map(s => <option key={s._id} value={s._id}>{s.name} ({s.shopperCountAtSave} shoppers)</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Channel</label>
              <div className="flex gap-4">
                {['email', 'sms', 'push'].map(ch => (
                  <label key={ch} className="flex items-center gap-2 text-white bg-black/30 border border-white/10 px-4 py-2 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                    <input type="radio" name="channel" value={ch} checked={channel === ch} onChange={e => setChannel(e.target.value)} className="accent-indigo-500" />
                    {ch.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2 flex justify-between">
                Message Template
                <span className={`text-xs ${messageTemplate.length > (channel === 'sms' ? 500 : 2000) ? 'text-red-400' : 'text-neutral-500'}`}>
                  {messageTemplate.length} / {channel === 'sms' ? 500 : 2000} chars
                </span>
              </label>
              <textarea required value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} rows={4} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50" placeholder="Hello {{firstName}}, special offer on {{productCategory}}..."/>
            </div>

            <button disabled={isSubmitting} type="submit" className="bg-white text-black font-medium px-6 py-3 rounded-xl hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-50">
              {submitStatus || 'Launch Campaign'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-neutral-900/40 border border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="bg-black/40 border-b border-white/5 text-xs uppercase font-medium text-neutral-500">
            <tr>
              <th className="px-6 py-4">Campaign</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Channel</th>
              <th className="px-6 py-4">Sent</th>
              <th className="px-6 py-4">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {campaigns.map(c => (
              <tr key={c._id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <Link href={`/campaigns/${c._id}`} className="font-medium text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                    <Megaphone size={16} className="text-indigo-500" />
                    {c.name}
                  </Link>
                  <div className="text-xs text-neutral-500 mt-1">{format(new Date(c.createdAt), 'MMM dd, yyyy')}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    c.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    c.status === 'sending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
                  }`}>
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 uppercase text-xs tracking-wider">{c.channel}</td>
                <td className="px-6 py-4 font-medium text-white">{c.stats?.sent?.toLocaleString() || 0}</td>
                <td className="px-6 py-4 font-medium text-emerald-400">${c.stats?.attributedRevenue?.toLocaleString(undefined, {minimumFractionDigits: 2}) || '0.00'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
