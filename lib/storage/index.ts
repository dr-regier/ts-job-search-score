/**
 * Storage Utilities Index
 *
 * Exports all storage utility functions for easy importing
 */

export {
  getProfile,
  saveProfile,
  deleteProfile,
  hasProfile,
  updateProfile,
} from './profile';

export {
  getJobs,
  saveJobs,
  addJobs,
  updateJobStatus,
  updateJobsWithScores,
  getJobById,
  deleteJob,
  deleteAllJobs,
  updateJobNotes,
  getJobsByStatus,
  getJobsByPriority,
  getScoredJobs,
  getUnsavedJobs,
} from './jobs';
