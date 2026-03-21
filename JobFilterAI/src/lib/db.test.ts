import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dbLib from './db';
import { openDB } from 'idb';

// Mock idb
vi.mock('idb', () => ({
  openDB: vi.fn()
}));

describe('Database utilities', () => {
  const mockDb = {
    getAll: vi.fn(),
    add: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    objectStoreNames: {
      contains: vi.fn()
    },
    createObjectStore: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (openDB as any).mockResolvedValue(mockDb);
    // @ts-ignore: reset module state for dbPromise
    dbLib.dbPromise = null; 
  });

  const sampleJob = {
    id: '123',
    companyName: 'Test Inc',
    jobTitle: 'Developer',
    status: 'Applied' as any,
    dateApplied: '2026-03-22',
    order: 0
  };

  it('getJobs calls getAll on the store', async () => {
    mockDb.getAll.mockResolvedValue([sampleJob]);
    const jobs = await dbLib.getJobs();
    expect(openDB).toHaveBeenCalled();
    expect(mockDb.getAll).toHaveBeenCalledWith('jobs');
    expect(jobs).toEqual([sampleJob]);
  });

  it('addJob calls add on the store', async () => {
    mockDb.add.mockResolvedValue('123');
    await dbLib.addJob(sampleJob);
    expect(mockDb.add).toHaveBeenCalledWith('jobs', sampleJob);
  });

  it('updateJob calls put on the store', async () => {
    mockDb.put.mockResolvedValue('123');
    await dbLib.updateJob(sampleJob);
    expect(mockDb.put).toHaveBeenCalledWith('jobs', sampleJob);
  });

  it('deleteJob calls delete on the store', async () => {
    await dbLib.deleteJob('123');
    expect(mockDb.delete).toHaveBeenCalledWith('jobs', '123');
  });

  it('clearAllJobs calls clear on the store', async () => {
    await dbLib.clearAllJobs();
    expect(mockDb.clear).toHaveBeenCalledWith('jobs');
  });
});
