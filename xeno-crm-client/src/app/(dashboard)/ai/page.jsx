'use client';
import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import { Bot, User, Sparkles, Send, CheckCircle2, Megaphone, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AICopilotPage() {
  const router = useRouter();
  
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am your AI Campaign Copilot. Tell me who you want to target and what you want to achieve, and I will build a complete campaign for you.' }
  ]);
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // The current active plan being iterated on
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isLaunching, setIsLaunching] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentPlan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);

    try {
      if (!currentPlan) {
        // First request: Generate Intent
        const res = await apiFetch('/api/ai/campaign-intent', {
          method: 'POST',
          body: JSON.stringify({ prompt: userText, history: messages.map(m => ({ role: m.role, content: m.text })) })
        });
        
        setCurrentPlan(res);
        setMessages(prev => [...prev, { role: 'assistant', text: "Here is the campaign plan I've put together. How does this look? You can ask me to change the channel, tweak the message, or adjust the target audience." }]);
      } else {
        // Subsequent request: Revise Plan
        const res = await apiFetch('/api/ai/revise-plan', {
          method: 'POST',
          body: JSON.stringify({ plan: currentPlan, feedback: userText, history: messages.map(m => ({ role: m.role, content: m.text })) })
        });
        
        setCurrentPlan(res);
        setMessages(prev => [...prev, { role: 'assistant', text: "I've updated the campaign plan based on your feedback. Ready to launch?" }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Sorry, I encountered an error: ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLaunch = async () => {
    if (!currentPlan) return;

    // Validate plan has required fields
    const validChannels = ['email', 'sms', 'push'];
    const channelMappings = {
      'whatsapp': 'sms',
      'telegram': 'sms',
      'text': 'sms',
      'message': 'sms',
      'notification': 'push',
      'notifications': 'push',
      'mobile': 'push',
      'app': 'push',
      'mail': 'email',
    };

    if (!currentPlan.name || !currentPlan.channel || !currentPlan.template || !currentPlan.segmentCriteria) {
      alert('Plan is missing required fields. Please regenerate the plan.');
      return;
    }

    // Normalize and validate channel
    const normalizedChannel = currentPlan.channel.toLowerCase().trim();
    let finalChannel = normalizedChannel;

    if (validChannels.includes(normalizedChannel)) {
      finalChannel = normalizedChannel;
    } else if (channelMappings[normalizedChannel]) {
      finalChannel = channelMappings[normalizedChannel];
    } else {
      alert(`Invalid channel: ${currentPlan.channel}. Valid channels are: email, sms, push`);
      return;
    }

    setIsLaunching(true);
    try {
      // 1. Save Segment
      const segment = await apiFetch('/api/segments', {
        method: 'POST',
        body: JSON.stringify({
          name: `${currentPlan.name} Target Audience`,
          filterCriteria: currentPlan.segmentCriteria
        })
      });

      // 2. Save Campaign
      const campaign = await apiFetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: currentPlan.name,
          segmentId: segment._id,
          channel: finalChannel,
          messageTemplate: currentPlan.template
        })
      });

      // 3. Launch
      await apiFetch(`/api/campaigns/${campaign._id}/launch`, { method: 'POST' });

      alert('Campaign launched successfully!');
      router.push('/campaigns');
    } catch (err) {
      alert(`Launch failed: ${err.message}`);
      setIsLaunching(false);
    }
  };

  return (
    <div className="h-full flex flex-col xl:flex-row gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-h-[calc(100vh-6rem)]">
      
      {/* Chat Column */}
      <div className="flex-1 flex flex-col bg-neutral-900/40 border border-white/5 backdrop-blur-xl rounded-3xl overflow-hidden min-h-[500px]">
        {/* Chat Header */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-black/20">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Campaign Copilot</h2>
            <p className="text-sm text-neutral-400">AI-powered marketing assistant</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.role === 'user' ? 'bg-neutral-800 text-white' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
              }`}>
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                m.role === 'user' 
                  ? 'bg-white/10 text-white rounded-tr-none' 
                  : 'bg-indigo-500/10 border border-indigo-500/20 text-neutral-200 rounded-tl-none'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Bot size={14} />
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl rounded-tl-none px-5 py-4 flex gap-1">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-black/20 border-t border-white/5">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="e.g. Let's send a 20% discount SMS to VIP shoppers..."
              className="w-full bg-neutral-900 border border-white/10 rounded-full pl-6 pr-14 py-4 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            />
            <button 
              type="submit"
              disabled={isTyping || !input.trim()}
              className="absolute right-2 w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white flex items-center justify-center transition-all"
            >
              <Send size={16} className="-ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Draft Plan Panel */}
      {currentPlan && (
        <div className="w-full xl:w-[400px] flex-shrink-0 bg-neutral-900/40 border border-white/5 backdrop-blur-xl rounded-3xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
          <div className="p-6 border-b border-white/5 bg-black/20 flex items-center gap-2 text-indigo-400 font-medium">
            <CheckCircle2 size={18} />
            Draft Campaign Plan
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Campaign Name</div>
              <div className="text-white font-medium">{currentPlan.name}</div>
            </div>
            
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Channel</div>
              <div className="inline-flex px-3 py-1 bg-white/5 border border-white/10 rounded-md text-sm text-neutral-300 uppercase tracking-wide">
                {currentPlan.channel}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Message Copy</div>
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-sm text-neutral-300 whitespace-pre-wrap">
                {currentPlan.template}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Target Logic (Auto-Generated)</div>
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-xs font-mono text-neutral-400 overflow-x-auto">
                <pre>{JSON.stringify(currentPlan.segmentCriteria, null, 2)}</pre>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-black/20">
            <button 
              onClick={handleLaunch}
              disabled={isLaunching}
              className="w-full bg-white text-black hover:bg-neutral-200 font-medium px-4 py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLaunching ? 'Launching...' : <><Megaphone size={18} /> Accept & Launch</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
