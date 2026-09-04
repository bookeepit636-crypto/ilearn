'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Calendar,
  FileQuestion,
  FileText,
  HelpCircle,
  LayoutGrid,
  ShieldCheck,
  Video,
  X
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, isMobileSidebarOpen, setIsMobileSidebarOpen } = useApp();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutGrid },
    { name: 'My Courses', href: '/courses', icon: BookOpen },
    { name: 'Videos', href: '/videos', icon: Video },
    { name: 'Templates', href: '/downloads', icon: FileText },
    { name: 'Quizzes', href: '/quizzes', icon: FileQuestion },
    { name: 'Progress', href: '/progress', icon: BarChart3 },
    { name: 'Schedule', href: '/schedule', icon: Calendar }
  ];

  const sidebarContent = (
    <aside className="w-64 sidebar-gradient text-white flex flex-col justify-between shrink-0 h-full shadow-2xl overflow-y-auto">
      <div className="p-6 flex flex-col gap-6">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white text-[#0077b6] flex items-center justify-center font-black text-lg shadow-md">
              BK
            </div>
            <div>
              <h1 className="font-extrabold text-base text-white tracking-wide leading-tight">
                BookKeep<span className="text-cyan-200">-It</span>
              </h1>
              <span className="text-[10px] text-white/80 font-medium">LMS & Practice Suite</span>
            </div>
          </div>

          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation List */}
        <nav className="flex flex-col gap-1.5 pt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'nav-pill-active'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0077b6]' : 'text-white'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {user.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold transition-all mt-2 ${
                pathname === '/admin'
                  ? 'bg-white text-indigo-700 font-extrabold shadow-lg'
                  : 'text-white/90 hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Help & Support Footer Link */}
      <div className="p-6 pt-0">
        <Link
          href="/help"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="flex items-center gap-3 text-xs font-bold text-white/90 hover:text-white transition py-2"
        >
          <HelpCircle className="w-4 h-4 text-white" />
          <span>Help & Support</span>
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 z-30 shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Slide-Over Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex">
          <div className="h-full animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
          <div
            className="flex-1 h-full"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        </div>
      )}
    </>
  );
};
