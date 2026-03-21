import React, { useState } from 'react';
import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { Column } from './Column';
import { JobCard } from './JobCard';
import { updateJob } from '../lib/db';
import type { Job } from '../lib/db';
import { arrayMove } from '@dnd-kit/sortable';

interface KanbanBoardProps {
  jobs: Job[];
  allJobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  onEdit: (job: Job) => void;
  onDelete: (id: string) => void;
}

const STATUSES = ['Wishlist', 'Applied', 'Follow-up', 'Interview', 'Offer', 'Rejected'] as const;

export function KanbanBoard({ jobs, allJobs, setJobs, onEdit, onDelete }: KanbanBoardProps) {
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const job = allJobs.find(j => j.id === active.id);
    if (job) setActiveJob(job);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Job';
    const isOverTask = over.data.current?.type === 'Job';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    setJobs(prevJobs => {
      const activeIndex = prevJobs.findIndex(j => j.id === activeId);
      const overIndex = prevJobs.findIndex(j => j.id === overId);

      if (isOverTask) {
        if (prevJobs[activeIndex].status !== prevJobs[overIndex].status) {
          const newJobs = [...prevJobs];
          newJobs[activeIndex].status = newJobs[overIndex].status;
          return arrayMove(newJobs, activeIndex, overIndex);
        }
        return arrayMove(prevJobs, activeIndex, overIndex);
      }

      if (isOverColumn) {
        const newStatus = over.data.current?.status;
        if (prevJobs[activeIndex].status !== newStatus) {
          const newJobs = [...prevJobs];
          newJobs[activeIndex].status = newStatus;
          return [...newJobs];
        }
      }

      return prevJobs;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveJob(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    
    // We already optimistically updated the state in dragOver.
    // Now we must persist the final state of the dragged job to IndexedDB.
    setJobs(prevJobs => {
      const finalJob = prevJobs.find(j => j.id === activeId);
      if (finalJob) {
        updateJob(finalJob).catch(console.error);
      }
      // Re-assign order based on new array for all tasks in the same column (optional depending on UX strictness)
      return prevJobs;
    });
  };

  return (
    <div className="h-full w-full overflow-x-auto overflow-y-hidden custom-scrollbar bg-slate-100 dark:bg-slate-950 p-6 flex items-start">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-row gap-6 h-full min-h-[70vh]">
          {STATUSES.map(status => (
            <Column
              key={status}
              status={status}
              jobs={jobs.filter(j => j.status === status)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
        <DragOverlay>
          {activeJob ? <JobCard job={activeJob} onEdit={() => {}} onDelete={() => {}} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
