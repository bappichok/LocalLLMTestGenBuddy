import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Job, JobStatus } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (job: Job) => void;
  editingJob?: Job | null;
}

const STATUSES: JobStatus[] = ['Wishlist', 'Applied', 'Follow-up', 'Interview', 'Offer', 'Rejected'];

export function JobModal({ isOpen, onClose, onSave, editingJob }: JobModalProps) {
  const [formData, setFormData] = useState<Partial<Job>>({});

  useEffect(() => {
    if (isOpen) {
      if (editingJob) {
        setFormData({ ...editingJob });
      } else {
        setFormData({
          id: uuidv4(),
          companyName: '',
          jobTitle: '',
          url: '',
          resumeUsed: '',
          dateApplied: format(new Date(), 'yyyy-MM-dd'),
          salaryRange: '',
          notes: '',
          status: 'Wishlist',
          order: Date.now(),
        });
      }
    }
  }, [isOpen, editingJob]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.jobTitle) return;
    onSave(formData as Job);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            {editingJob ? 'Edit Job' : 'Add New Job'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Company Name *</label>
              <input required type="text" value={formData.companyName || ''} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="e.g. Google" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Job Title/Role *</label>
              <input required type="text" value={formData.jobTitle || ''} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="e.g. Senior Frontend Engineer" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as JobStatus })} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow appearance-none">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Date Applied</label>
              <input type="date" value={formData.dateApplied || ''} onChange={(e) => setFormData({ ...formData, dateApplied: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Salary Range</label>
              <input type="text" value={formData.salaryRange || ''} onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="e.g. $150k - $180k" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">LinkedIn URL</label>
              <input type="url" value={formData.url || ''} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="https://linkedin.com/jobs/view/..." />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Resume Used</label>
              <input type="text" value={formData.resumeUsed || ''} list="resumes" onChange={(e) => setFormData({ ...formData, resumeUsed: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" placeholder="e.g. SDE_Resume_v3" />
              <datalist id="resumes">
                <option value="SDE_Resume_v3" />
                <option value="Frontend_React_CV" />
                <option value="Fullstack_2026" />
              </datalist>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Notes</label>
              <textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-shadow" placeholder="Recruiter's name, referral info, etc." />
            </div>
          </div>

          <div className="pt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 mt-6">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors focus:ring-2 focus:ring-slate-400">Cancel</button>
            <button type="submit" className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full transition-colors shadow-md focus:ring-2 focus:ring-blue-500">Save Job</button>
          </div>
        </form>
      </div>
    </div>
  );
}
