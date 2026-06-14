import Link from 'next/link';
import { ArrowRight, Zap, Target, BarChart3, Bot, Sparkles, Upload, Wand2, Send } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-neutral-950 to-neutral-950 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.03]" 
      style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '128px 128px'
    }}/>

      {/* Header */}
      <header className="relative z-50 border-b border-white/5 bg-neutral-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 font-semibold text-xl tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles size={16} className="text-white" />
            </div>
            Xeno<span className="text-neutral-500 font-light">CRM</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-neutral-300 hover:text-white transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/register" className="bg-white text-black hover:bg-neutral-200 text-sm font-medium px-5 py-2.5 rounded-full transition-all active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
            <Sparkles size={14} /> Meet the first AI-Native CRM
          </div>
          
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-500 mb-8 leading-tight">
            Marketing Automation, <br/><span className="font-medium text-white">Powered by Intelligence.</span>
          </h1>
          
          <p className="text-xl text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop building complex workflows. Just tell XenoCRM what you want to achieve, and watch our AI agents build segments, write copy, and launch campaigns instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-8 py-4 rounded-full transition-all active:scale-95 flex items-center justify-center gap-2 text-lg">
              Start Free Trial <ArrowRight size={20} />
            </Link>
            <Link href="#demo" className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium px-8 py-4 rounded-full transition-all active:scale-95 flex items-center justify-center gap-2 text-lg">
              View Demo
            </Link>
          </div>
        </section>

        {/* Mock UI Preview */}
        <section className="px-6 pb-32 max-w-6xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-xl p-2 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent z-20 pointer-events-none" />
            <div className="rounded-xl overflow-hidden bg-black aspect-video relative flex items-center justify-center border border-white/5">
              <div className="text-center z-10">
                <Bot size={48} className="text-indigo-500 mx-auto mb-4 opacity-50" />
                <div className="text-2xl font-light text-neutral-600">App Dashboard Preview</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-6 border-t border-white/5 bg-neutral-900/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">Everything you need to grow.</h2>
              <p className="text-neutral-400 max-w-2xl mx-auto">A complete suite of tools redesigned from the ground up for the AI era.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Target, title: "AI Segmentation", desc: "Type 'Find big spenders in NY'. Our LLM writes the database query natively." },
                { icon: Zap, title: "Omnichannel Delivery", desc: "Send personalized emails and SMS instantly with parallel queue execution." },
                { icon: BarChart3, title: "Live Revenue Attribution", desc: "Watch revenue tick up in real-time on your dashboard using Server-Sent Events." }
              ].map((f, i) => (
                <div key={i} className="bg-neutral-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl hover:bg-neutral-800/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                    <f.icon size={24} />
                  </div>
                  <h3 className="text-xl font-medium mb-3">{f.title}</h3>
                  <p className="text-neutral-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">How it Works</h2>
              <p className="text-neutral-400 max-w-2xl mx-auto">Get started in minutes with our simple three-step process.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Upload, title: "1. Connect Your Store", desc: "Sync your customer data in seconds with our secure API integration." },
                { icon: Wand2, title: "2. Describe Your Goal", desc: "Tell our AI what you want to achieve using plain language." },
                { icon: Send, title: "3. Launch Campaigns", desc: "Watch as AI builds segments, writes copy, and sends personalized campaigns." }
              ].map((f, i) => (
                <div key={i} className="bg-neutral-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl hover:bg-neutral-800/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6">
                    <f.icon size={24} />
                  </div>
                  <h3 className="text-xl font-medium mb-3">{f.title}</h3>
                  <p className="text-neutral-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 px-6 border-t border-white/5 bg-neutral-900/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">Simple, Transparent Pricing</h2>
              <p className="text-neutral-400 max-w-2xl mx-auto">Start free, scale as you grow. No hidden fees.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { 
                  name: "Starter", 
                  price: "Free", 
                  desc: "Perfect for testing the waters",
                  features: ["Up to 1,000 customers", "Basic segmentation", "Email campaigns only", "Community support"]
                },
                { 
                  name: "Growth", 
                  price: "$49/mo", 
                  desc: "For growing businesses",
                  features: ["Up to 10,000 customers", "AI-powered segmentation", "Email + SMS campaigns", "Priority support", "Revenue attribution"]
                },
                { 
                  name: "Enterprise", 
                  price: "Custom", 
                  desc: "For large organizations",
                  features: ["Unlimited customers", "Custom AI models", "All channels + integrations", "Dedicated support", "SLA guarantee"]
                }
              ].map((plan, i) => (
                <div key={i} className={`bg-neutral-900/40 border rounded-3xl p-8 backdrop-blur-xl hover:bg-neutral-800/40 transition-colors ${plan.name === "Growth" ? "border-indigo-500/50 relative" : "border-white/5"}`}>
                  {plan.name === "Growth" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Popular
                    </div>
                  )}
                  <h3 className="text-xl font-medium mb-2">{plan.name}</h3>
                  <p className="text-neutral-400 text-sm mb-4">{plan.desc}</p>
                  <div className="text-3xl font-bold text-white mb-6">{plan.price}</div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-sm text-neutral-300">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-indigo-400" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.name === "Enterprise" ? (
                    <button className="w-full py-3 rounded-xl font-medium transition-all active:scale-95 bg-white/5 hover:bg-white/10 border border-white/10 text-white">
                      Contact Sales
                    </button>
                  ) : (
                    <Link href="/register" className={`w-full py-3 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center ${plan.name === "Growth" ? "bg-indigo-500 hover:bg-indigo-600 text-white" : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"}`}>
                      Get Started
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-neutral-950 pt-16 pb-8 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-semibold text-lg tracking-tight mb-4">
              <Sparkles size={16} className="text-indigo-500" /> XenoCRM
            </div>
            <p className="text-neutral-500 text-sm max-w-xs">
              The AI-Native CRM platform built for modern marketers. Automate everything, from segmentation to delivery.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Changelog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-600">
          <div>© {new Date().getFullYear()} XenoCRM Inc. All rights reserved.</div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
