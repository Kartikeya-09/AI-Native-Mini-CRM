'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Megaphone, Users, MessageSquareText, Filter, LogOut } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { removeToken } from '../../lib/auth';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Segments', href: '/segments', icon: Filter },
  { name: 'Shoppers', href: '/shoppers', icon: Users },
  { name: 'AI Assistant', href: '/ai', icon: MessageSquareText },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // Lazy seed trigger on mount
  useEffect(() => {
    apiFetch('/api/campaigns').catch(err => {
      console.error('Failed to trigger lazy seed', err);
    });
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-indigo-500/30 flex">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-neutral-900/40 border-r border-white/5 backdrop-blur-2xl hidden md:flex flex-col relative z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 font-semibold text-xl tracking-tight text-white mb-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Megaphone size={16} className="text-white" />
            </div>
            Xeno<span className="text-neutral-500 font-light">CRM</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                    isActive 
                      ? "bg-indigo-500/10 text-indigo-400" 
                      : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon size={18} className={cn(
                    "transition-transform group-hover:scale-110",
                    isActive ? "text-indigo-400" : "text-neutral-500 group-hover:text-neutral-300"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl text-sm font-medium text-neutral-400 hover:bg-white/5 hover:text-red-400 transition-all group"
          >
            <LogOut size={18} className="text-neutral-500 group-hover:text-red-400 transition-transform group-hover:scale-110" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-neutral-950 to-neutral-950 relative">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
        <div className="flex-1 p-8 md:p-12 relative z-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
