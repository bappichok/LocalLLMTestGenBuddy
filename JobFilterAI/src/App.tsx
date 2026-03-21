import React, { useEffect, useState, useMemo } from 'react';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { JobModal } from './components/JobModal';
import { getJobs, addJob, updateJob, deleteJob, clearAllJobs } from './lib/db';
import type { Job } from './lib/db';

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  useEffect(() => {
    getJobs().then(setJobs);
    
    const darkModePref = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isLocalDark = localStorage.getItem('theme') === 'dark';
    if (isLocalDark || (!localStorage.getItem('theme') && darkModePref)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSaveJob = async (job: Job) => {
    if (editingJob) {
      await updateJob(job);
      setJobs(jobs.map(j => j.id === job.id ? job : j));
    } else {
      await addJob(job);
      setJobs([...jobs, job]);
    }
    setEditingJob(null);
  };

  const handleDeleteJob = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      await deleteJob(id);
      setJobs(jobs.filter(j => j.id !== id));
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(jobs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-tracker-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const importedJobs = JSON.parse(text) as Job[];
      if (!Array.isArray(importedJobs)) throw new Error('Invalid format');
      if (!window.confirm(`This will erase current jobs and import ${importedJobs.length} jobs. Proceed?`)) return;
      
      await clearAllJobs();
      for (const job of importedJobs) {
        await addJob(job);
      }
      setJobs(importedJobs);
    } catch (e) {
      alert('Failed to import JSON file');
    }
  };

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const lowerQuery = searchQuery.toLowerCase();
    return jobs.filter(j => 
      j.companyName.toLowerCase().includes(lowerQuery) ||
      j.jobTitle.toLowerCase().includes(lowerQuery)
    );
  }, [jobs, searchQuery]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onAddJob={() => setIsModalOpen(true)}
        onExport={handleExport}
        onImport={handleImport}
      />
      <main className="flex-1 overflow-hidden h-full">
        <KanbanBoard 
          jobs={filteredJobs} 
          allJobs={jobs}
          setJobs={setJobs}
          onEdit={(job) => { setEditingJob(job); setIsModalOpen(true); }}
          onDelete={handleDeleteJob}
        />
      </main>
      
      <JobModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingJob(null); }}
        onSave={handleSaveJob}
        editingJob={editingJob}
      />
    </div>
  );
}

export default App;
