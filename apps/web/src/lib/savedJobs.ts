const KEY = 'mansio_saved_jobs';

export type SavedJob = {
  id: string;
  title: string;
  organization: { name: string };
  location?: string;
  remotePolicy?: string;
  department?: string;
  employmentType?: string;
  activeSimulationVersionId?: string;
};

export function getSavedJobs(): SavedJob[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

export function isJobSaved(id: string): boolean {
  return getSavedJobs().some(j => j.id === id);
}

export function toggleSavedJob(job: SavedJob): boolean {
  const saved = getSavedJobs();
  const exists = saved.some(j => j.id === job.id);
  if (exists) {
    localStorage.setItem(KEY, JSON.stringify(saved.filter(j => j.id !== job.id)));
    return false;
  }
  localStorage.setItem(KEY, JSON.stringify([...saved, job]));
  return true;
}

export function removeSavedJob(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(getSavedJobs().filter(j => j.id !== id)));
}
