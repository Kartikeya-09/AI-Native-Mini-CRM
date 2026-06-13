'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../../lib/api';
import { Sparkles, ArrowRight, Save, Filter } from 'lucide-react';

export default function NewSegmentPage() {
  const router = useRouter();
  
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // AI Response State
  const [filterCriteria, setFilterCriteria] = useState(null);
  const [humanReadableSummary, setHumanReadableSummary] = useState('');
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  
  // Save State
  const [segmentName, setSegmentName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsAnalyzing(true);
    setClarificationQuestion('');
    setFilterCriteria(null);
    setHumanReadableSummary('');

    try {
      const res = await apiFetch('/api/ai/segment-intent', {
        method: 'POST',
        body: JSON.stringify({ prompt, history: [] })
      });

      if (res.needsClarification) {
        setClarificationQuestion(res.question);
      } else {
        setFilterCriteria(res.filterCriteria);
        setHumanReadableSummary(res.humanReadableSummary);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!segmentName.trim() || !filterCriteria) return;
    setIsSaving(true);
    try {
      await apiFetch('/api/segments', {
        method: 'POST',
        body: JSON.stringify({ name: segmentName, filterCriteria })
      });
      router.push('/segments');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-light text-white tracking-tight flex items-center gap-3">
          <Sparkles className="text-indigo-400" /> AI Segment Creator
        </h1>
        <p className="text-neutral-400 mt-2">Describe your target audience in plain English, and the AI will build the database query.</p>
      </div>

      <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
        <form onSubmit={handleAnalyze} className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'Find shoppers from New York who spent more than $500 last month on electronics...'"
            className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 pr-32 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[160px] resize-none"
          />
          <button
            type="submit"
            disabled={isAnalyzing || !prompt.trim()}
            className="absolute bottom-6 right-6 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl transition-all flex items-center gap-2"
          >
            {isAnalyzing ? 'Analyzing...' : <><Sparkles size={18}/> Generate</>}
          </button>
        </form>
      </div>

      {clarificationQuestion && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex gap-4">
          <div className="mt-1">
            <Sparkles className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-amber-400 font-medium mb-1">Clarification Needed</h3>
            <p className="text-amber-200/80">{clarificationQuestion}</p>
          </div>
        </div>
      )}

      {filterCriteria && (
        <div className="bg-neutral-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl space-y-8 animate-in fade-in zoom-in duration-500">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Interpretation</h3>
            <p className="text-neutral-300 bg-white/5 p-4 rounded-xl border border-white/5">{humanReadableSummary}</p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-4">Generated Logic</h3>
            <div className="bg-black/50 p-6 rounded-xl border border-white/10 font-mono text-sm text-neutral-300 overflow-x-auto">
              <pre>{JSON.stringify(filterCriteria, null, 2)}</pre>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-neutral-400 mb-2">Save Segment As</label>
              <input
                type="text"
                value={segmentName}
                onChange={e => setSegmentName(e.target.value)}
                placeholder="e.g., High-Value NY Electronics Buyers"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving || !segmentName.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium px-8 py-3 rounded-xl transition-all flex items-center gap-2 h-[50px] whitespace-nowrap"
            >
              <Save size={18} /> {isSaving ? 'Saving...' : 'Save Segment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
