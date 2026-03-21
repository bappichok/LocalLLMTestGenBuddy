import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Job } from '../lib/db';
import { Pencil, Trash2, Linkedin, Calendar, Building2, GripVertical, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  'Wishlist': 'border-wishlist bg-wishlist/5',
  'Applied': 'border-applied bg-applied/5',
  'Follow-up': 'border-followup bg-followup/5',
  'Interview': 'border-interview bg-interview/5',
  'Offer': 'border-offer bg-offer/5',
  'Rejected': 'border-rejected bg-rejected/5 hover:bg-rejected/10',
};

export function JobCard({ job, onEdit, onDelete }: JobCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    data: { type: 'Job', job }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const daysApplied = job.dateApplied 
    ? formatDistanceToNow(new Date(job.dateApplied), { addSuffix: true })
    : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative p-4 mb-3 rounded-xl border-l-4 border-y border-r border-y-slate-200 border-r-slate-200 dark:border-y-slate-800 dark:border-r-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all ${statusColors[job.status] || ''} ${isDragging ? 'ring-2 ring-blue-500 z-10' : ''}`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <div className="flex gap-2 w-full pr-8">
          <div {...attributes} {...listeners} className="text-slate-300 dark:text-slate-600 hover:text-slate-500 cursor-grab active:cursor-grabbing -ml-2 -mt-1 pt-1 pb-2 pl-1 pr-1">
            <GripVertical size={16} />
          </div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">{job.jobTitle}</h3>
        </div>
        
        {/* Action Buttons */}
        <div className="flex bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100 absolute top-3 right-3 gap-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 p-0.5 z-10">
          <button onPointerDown={(e) => { e.stopPropagation(); onEdit(job); }} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-md transition-colors">
            <Pencil size={14} />
          </button>
          <button onPointerDown={(e) => { e.stopPropagation(); onDelete(job.id); }} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 rounded-md transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium pl-6">
        <span className="truncate max-w-full">{job.companyName}</span>
      </div>

      <div className="flex flex-wrap gap-2 text-xs mb-4 pl-6">
        {job.salaryRange && (
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold tracking-wide border border-emerald-100 dark:border-emerald-800/30">
            {job.salaryRange}
          </span>
        )}
        {job.resumeUsed && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
            <FileText size={12} />
            {job.resumeUsed}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/60 pl-6">
        <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 gap-1.5 font-medium">
          <Calendar size={13} />
          {daysApplied}
        </div>
        
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onPointerDown={(e) => e.stopPropagation()}
            className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors p-1"
          >
            <Linkedin size={18} />
          </a>
        )}
      </div>
    </div>
  );
}
