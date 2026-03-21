import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { JobCard } from './JobCard';
import type { Job, JobStatus } from '../lib/db';

interface ColumnProps {
  status: JobStatus;
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  'Wishlist': 'bg-wishlist',
  'Applied': 'bg-applied',
  'Follow-up': 'bg-followup',
  'Interview': 'bg-interview',
  'Offer': 'bg-offer',
  'Rejected': 'bg-rejected',
};

export function Column({ status, jobs, onEdit, onDelete }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: 'Column', status }
  });

  return (
    <div className="flex flex-col w-full min-w-[320px] max-w-[340px] shrink-0">
      <div className="flex items-center justify-between mb-3 sticky top-0 z-[5] bg-slate-50 dark:bg-slate-950 py-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status] || 'bg-slate-400'}`} />
          <h2 className="font-bold text-slate-700 dark:text-slate-100 tracking-wide uppercase text-sm">{status}</h2>
        </div>
        <span className="px-2.5 py-0.5 text-xs font-bold bg-slate-200 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 rounded-full border border-slate-300 dark:border-slate-800">
          {jobs.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] p-2.5 -mx-2.5 rounded-2xl transition-colors duration-200 ${
          isOver ? 'bg-slate-200/50 dark:bg-slate-800/40 ring-2 ring-slate-300 dark:ring-slate-700 ring-inset' : ''
        }`}
      >
        <SortableContext items={jobs.map(j => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map(job => (
            <JobCard key={job.id} job={job} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
        {jobs.length === 0 && (
          <div className="mt-2 flex items-center justify-center p-8 border-2 border-dashed border-slate-300/60 dark:border-slate-800 rounded-xl">
            <p className="text-sm font-medium text-slate-400 dark:text-slate-600 text-center">No jobs here</p>
          </div>
        )}
      </div>
    </div>
  );
}
