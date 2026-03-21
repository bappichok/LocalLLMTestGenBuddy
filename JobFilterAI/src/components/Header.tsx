import { Search, Moon, Sun, Download, Upload, Plus } from 'lucide-react';
import React, { useRef } from 'react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
  onAddJob: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export function Header({ searchQuery, setSearchQuery, isDark, toggleTheme, onAddJob, onExport, onImport }: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = ''; // Reset
    }
  };

  return (
    <header className="sticky top-0 z-10 flex flex-col sm:flex-row items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
          J
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">JobFilterAI</h1>
      </div>

      <div className="flex-1 max-w-md w-full relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search by company or role..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-900 dark:text-slate-100"
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" title="Import Data">
          <Upload size={18} />
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
        
        <button onClick={onExport} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" title="Export Data">
          <Download size={18} />
        </button>

        <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" title="Toggle Theme">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button onClick={onAddJob} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-colors shadow-sm ml-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Add Job</span>
        </button>
      </div>
    </header>
  );
}
