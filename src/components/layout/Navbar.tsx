'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  LogOut,
  Mail,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  User
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const {
    user,
    notifications,
    setIsSearchOpen,
    setIsNotificationDrawerOpen,
    setIsMobileSidebarOpen,
    toggleRole,
    logout
  } = useApp();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (pathname) {
      case '/courses':
        return { breadcrumb: 'My Courses', title: 'MY COURSES' };
      case '/videos':
        return { breadcrumb: 'Videos', title: 'INSTRUCTIONAL VIDEOS' };
      case '/downloads':
        return { breadcrumb: 'Templates', title: 'DOWNLOADS & TEMPLATES' };
      case '/quizzes':
        return { breadcrumb: 'Quizzes', title: 'QUIZZES & ASSESSMENTS' };
      case '/progress':
        return { breadcrumb: 'Progress', title: 'PROGRESS TRACKER' };
      case '/schedule':
        return { breadcrumb: 'Schedule', title: 'STUDY SCHEDULE' };
      case '/notifications':
        return { breadcrumb: 'My Mail', title: 'MY MAIL & ANNOUNCEMENTS' };
      case '/profile':
        return { breadcrumb: 'Profile', title: 'STUDENT PROFILE' };
      case '/settings':
        return { breadcrumb: 'Settings', title: 'ACCOUNT SETTINGS' };
      case '/help':
        return { breadcrumb: 'Help & Support', title: 'HELP & SUPPORT' };
      case '/admin':
        return { breadcrumb: 'Admin Portal', title: 'ADMIN CONTROL CENTER' };
      default:
        return { breadcrumb: 'Dashboard', title: 'DASHBOARD' };
    }
  };

  const pageInfo = getPageTitle();

  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const handleLogout = () => {
    setIsProfileDropdownOpen(false);
    logout();
  };

  return (
    <header className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-6 py-4 sticky top-0 z-20 flex flex-col space-y-3">
      {/* Main Top Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Mobile Hamburger Button + Breadcrumb & Page Title */}
        <div className="flex items-center gap-3">
          {/* Mobile View Hamburger Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs transition"
            title="Open Mobile Navigation Menu"
          >
            <Menu className="w-5 h-5 text-[#0077b6]" />
          </button>

          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-0.5">
              <Link href="/" className="hover:text-[#0077b6]">Dashboard</Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#0077b6]">{pageInfo.breadcrumb}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#00b4d8] text-white flex items-center justify-center font-black text-base shadow-md shadow-cyan-500/20">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {pageInfo.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Right Controls: Search, My Mail, Admin Switcher, Top-Right Profile Dropdown */}
        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
          {/* Oval Search Bar */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-full px-3.5 py-1.5 text-xs text-slate-400 shadow-xs transition w-44 sm:w-60"
          >
            <div className="w-5 h-5 rounded-full bg-[#00b4d8] text-white flex items-center justify-center shrink-0">
              <Search className="w-3 h-3" />
            </div>
            <span className="truncate">Search Here</span>
          </button>

          {/* My Mail Pill Button */}
          <button
            onClick={() => setIsNotificationDrawerOpen(true)}
            className="relative px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#0077b6] hover:from-[#2563eb] hover:to-[#023e8a] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">My Mail</span>
            {unreadCount > 0 && (
              <span className="bg-white text-[#0077b6] text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Student vs Admin Switcher */}
          <button
            onClick={toggleRole}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 border ${
              user.role === 'admin'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="Toggle between Student View and Admin Mode"
          >
            {user.role === 'admin' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin Mode</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-[#0077b6]" />
                <span className="hidden sm:inline">Student View</span>
              </>
            )}
          </button>

          {/* TOP RIGHT PROFILE VIEW WITH INTERACTIVE DROPDOWN MENU */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-2 rounded-full bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition group"
            >
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-[#00b4d8]"
              />
              <span className="text-xs font-bold text-slate-800 hidden md:inline truncate max-w-[100px]">
                {user.name}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-transform duration-200" />
            </button>

            {/* Profile Dropdown Popup Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0077b6] transition"
                  >
                    <User className="w-4 h-4 text-[#0077b6]" />
                    <span>Profile</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0077b6] transition"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Date Banner */}
      <div className="flex justify-end text-xs text-slate-400 font-medium">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {todayDateFormatted}
        </span>
      </div>
    </header>
  );
};
