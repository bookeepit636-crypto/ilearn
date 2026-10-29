'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Mail,
  MessageSquare,
  Send
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function HelpSupportPage() {
  const { faqs } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqs[0]?.id || null);

  const [contactSubject, setContactSubject] = useState('');
  const [contactCategory, setContactCategory] = useState('Technical Issue');
  const [contactMessage, setContactMessage] = useState('');
  const [submittedStatus, setSubmittedStatus] = useState(false);

  const categories = ['All', 'Bookkeeping', 'Quizzes & Grades', 'Technical Support', 'Account & Settings'];

  const filteredFaqs =
    selectedCategory === 'All' ? faqs : faqs.filter((f) => f.category === selectedCategory);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject || !contactMessage) return;

    setSubmittedStatus(true);
    setContactSubject('');
    setContactMessage('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-[#0077b6]" />
          Help Center & Student Support
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Search user guides, view bookkeeping FAQs, or contact the administrator for technical and academic assistance.
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0077b6]" />
            Frequently Asked Questions (FAQs)
          </h2>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-[#0077b6] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;

            return (
              <div
                key={faq.id}
                className="card-theme rounded-2xl bg-white border border-slate-100 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 bg-slate-50/50 hover:bg-slate-100/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-extrabold text-[#0077b6] uppercase bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full">
                      {faq.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800">{faq.question}</h3>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#0077b6] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 pt-2 text-xs text-slate-600 border-t border-slate-100 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-theme p-6 rounded-3xl bg-white border border-slate-100 space-y-5">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Mail className="w-5 h-5 text-[#0077b6]" />
          Contact System Administrator
        </h2>

        {submittedStatus ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold space-y-1">
            <p>✓ Your support ticket has been dispatched to the Administrator.</p>
            <p className="text-slate-600 font-normal">An instructor will respond to your email shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="e.g. Issue downloading Excel worksheet"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={contactCategory}
                  onChange={(e) => setContactCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                >
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Accounting Question">Accounting Question</option>
                  <option value="Quiz Regrading">Quiz Regrading Request</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Message</label>
              <textarea
                rows={4}
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Provide detailed description of your request..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition"
              >
                <Send className="w-4 h-4" />
                Submit Ticket
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
