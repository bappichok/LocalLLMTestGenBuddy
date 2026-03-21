import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export type JobStatus = 'Wishlist' | 'Applied' | 'Follow-up' | 'Interview' | 'Offer' | 'Rejected';

export interface Job {
  id: string;
  companyName: string;
  jobTitle: string;
  url?: string;
  resumeUsed?: string;
  dateApplied: string;
  salaryRange?: string;
  notes?: string;
  status: JobStatus;
  order: number; // for manual ordering within a column
}

interface JobTrackerDB extends DBSchema {
  jobs: {
    value: Job;
    key: string;
    indexes: { 'by-status': string; 'by-date': string };
  };
}

const DB_NAME = 'JobFilterAI_DB';
const STORE_NAME = 'jobs';

let dbPromise: Promise<IDBPDatabase<JobTrackerDB>> | null = null;

function initDB() {
  if (!dbPromise) {
    dbPromise = openDB<JobTrackerDB>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-status', 'status');
          store.createIndex('by-date', 'dateApplied');
        }
      },
    });
  }
  return dbPromise;
}

export async function getJobs(): Promise<Job[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function addJob(job: Job): Promise<string> {
  const db = await initDB();
  return db.add(STORE_NAME, job);
}

export async function updateJob(job: Job): Promise<string> {
  const db = await initDB();
  return db.put(STORE_NAME, job);
}

export async function deleteJob(id: string): Promise<void> {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
}

export async function clearAllJobs(): Promise<void> {
  const db = await initDB();
  return db.clear(STORE_NAME);
}
