'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Calendar,
  FileQuestion,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  Megaphone,
  ShieldCheck,
  Users,
  Video,
  X
} from 'lucide-react';
import { useApp, AdminTabType } from '@/context/AppContext';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, toggleRole, adminTab, setAdminTab, isMobileSidebarOpen, setIsMobileSidebarOpen } = useApp();

  const studentNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutGrid },
    { name: 'My Courses', href: '/courses', icon: BookOpen },
    { name: 'Videos', href: '/videos', icon: Video },
    { name: 'Templates', href: '/downloads', icon: FileText },
    { name: 'Quizzes', href: '/quizzes', icon: FileQuestion },
    { name: 'Progress', href: '/progress', icon: BarChart3 },
    { name: 'Schedule', href: '/schedule', icon: Calendar }
  ];

  const adminNavItems: Array<{ name: string; tab: AdminTabType; icon: React.ElementType }> = [
    { name: 'Manage Courses', tab: 'courses', icon: BookOpen },
    { name: 'Video Library', tab: 'videos', icon: Video },
    { name: 'Templates & Files', tab: 'materials', icon: FileText },
    { name: 'Quiz & Exam Builder', tab: 'quizzes', icon: FileQuestion },
    { name: 'Student Accounts', tab: 'users', icon: Users },
    { name: 'Announcements', tab: 'announcements', icon: Megaphone }
  ];

  const sidebarContent = (
    <aside className="w-64 sidebar-gradient text-white flex flex-col justify-between shrink-0 h-full shadow-2xl overflow-y-auto">
      <div className="p-6 flex flex-col gap-6">
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white shadow-md shrink-0 border border-white/20">
              <img
                src="/logo.jpeg"
                alt="BookKeep-It Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-base text-white tracking-wide leading-tight">
                BookKeep<span className="text-cyan-200">-It</span>
              </h1>
              <span className="text-[10px] text-white/80 font-medium">
                {user.role === 'admin' ? 'Admin Control Suite' : 'LMS & Practice Suite'}
              </span>
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
          {user.role === 'admin' ? (
            <>
              <div className="px-3 py-1 mb-1">
                <span className="text-[10px] uppercase font-black tracking-wider text-cyan-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Management Navigation
                </span>
              </div>

              {adminNavItems.map((item) => {
                const isActive = pathname === '/admin' && adminTab === item.tab;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.tab}
                    href="/admin"
                    onClick={() => {
                      setAdminTab(item.tab);
                      setIsMobileSidebarOpen(false);
                    }}
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

              {/* Quick Switch to Student View */}
              <div className="pt-4 mt-2 border-t border-white/15">
                <button
                  onClick={() => {
                    toggleRole();
                    router.push('/');
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold text-white/85 hover:text-white hover:bg-white/10 transition"
                  title="Switch to Student View to browse courses and materials"
                >
                  <GraduationCap className="w-4 h-4 text-cyan-300" />
                  <span>Switch to Student View</span>
                </button>
              </div>
            </>
          ) : (
            studentNavItems.map((item) => {
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
            })
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
