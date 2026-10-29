'use client';

import React, { useState } from 'react';
import {
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FolderArchive,
  Plus,
  Search,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DownloadableMaterial } from '@/types';
import { uploadToCloudinary } from '@/lib/cloudinary';

export default function DownloadsPage() {
  const { materials, user, addMaterial, deleteMaterial } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('PDF Notes');
  const [newFileType, setNewFileType] = useState<'pdf' | 'xlsx' | 'docx' | 'zip'>('pdf');
  const [newSize, setNewSize] = useState('1.5 MB');
  const [newDescription, setNewDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const categories = ['All', 'PDF Notes', 'Worksheets', 'Practice Exercises', 'Templates'];

  const filteredMaterials = materials.filter((m) => {
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'xlsx':
        return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
      case 'pdf':
        return <FileText className="w-6 h-6 text-red-500" />;
      case 'zip':
        return <FolderArchive className="w-6 h-6 text-amber-500" />;
      default:
        return <FileCheck className="w-6 h-6 text-[#0077b6]" />;
    }
  };

  const handleDownload = (material: DownloadableMaterial) => {
    const blob = new Blob(
      [
        `BookKeep-It Material Download\nTitle: ${material.title}\nCategory: ${material.category}\nDate: ${new Date().toISOString()}\n\nSample Accounting Practice Data:\nAccount Code,Account Name,Debit ($),Credit ($)\n101,Cash,15000,0\n102,Accounts Receivable,4500,0\n201,Accounts Payable,0,2500\n301,Owner's Equity,0,17000\n`
      ],
      { type: 'text/csv;charset=utf-8;' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${material.title.replace(/\s+/g, '_')}.${material.fileType}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newMat: DownloadableMaterial = {
      id: `dl-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      fileType: newFileType,
      fileSize: newSize,
      downloadUrl: '#',
      description: newDescription || 'Practice material for offline study.',
      downloadsCount: 1,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    addMaterial(newMat);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Download className="w-6 h-6 text-[#0077b6]" />
            Downloads & Practice Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Save PDF lecture notes, Excel T-Account worksheets, practice ledgers, and accounting templates for offline study.
          </p>
        </div>

        {user.role === 'admin' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition"
          >
            <Upload className="w-4 h-4" />
            Upload New Material (Cloudinary)
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#0077b6] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full bg-white border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0077b6]"
          />
        </div>
      </div>

      {/* Material Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((mat) => (
          <div
            key={mat.id}
            className="card-theme p-5 rounded-3xl bg-white border border-slate-100 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  {getFileIcon(mat.fileType)}
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-cyan-50 text-[#0077b6] border border-cyan-200 px-2.5 py-0.5 rounded-full">
                  {mat.category}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-800 group-hover:text-[#0077b6] transition">
                {mat.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{mat.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 font-mono">
                {mat.fileSize} • {mat.fileType.toUpperCase()}
              </div>

              <div className="flex items-center gap-2">
                {user.role === 'admin' && (
                  <button
                    onClick={() => deleteMaterial(mat.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 transition"
                    title="Delete Material"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDownload(mat)}
                  className="px-4 py-1.5 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Upload Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#0077b6]" />
                Upload New Material
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Material Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Adjusted Trial Balance Excel Template"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                  >
                    <option value="PDF Notes">PDF Notes</option>
                    <option value="Worksheets">Worksheets</option>
                    <option value="Practice Exercises">Practice Exercises</option>
                    <option value="Templates">Templates</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">File Format</label>
                  <select
                    value={newFileType}
                    onChange={(e) =>
                      setNewFileType(e.target.value as 'pdf' | 'xlsx' | 'docx' | 'zip')
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-[#0077b6]"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="xlsx">Excel Spreadsheet (.xlsx)</option>
                    <option value="docx">Word Document (.docx)</option>
                    <option value="zip">ZIP Archive (.zip)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold shadow-md shadow-cyan-500/20"
                >
                  Upload Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
