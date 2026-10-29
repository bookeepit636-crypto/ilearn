'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  FileQuestion,
  LayoutGrid,
  Menu,
  Video
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { setIsMobileSidebarOpen } = useApp();

  const items = [
    { name: 'Home', href: '/', icon: LayoutGrid },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Videos', href: '/videos', icon: Video },
    { name: 'Quizzes', href: '/quizzes', icon: FileQuestion }
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-1 px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-around"
    >
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-[#0077b6] font-extrabold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition ${
                isActive ? 'bg-cyan-50 text-[#0077b6]' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
          </Link>
        );
      })}

      {/* Menu / All features trigger */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-slate-500 hover:text-slate-800 transition"
      >
        <div className="p-1 rounded-xl text-slate-500 hover:bg-slate-100 transition">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
      </button>
    </nav>
  );
};
