export const STEP_TYPES = [
  'multiple_choice',
  'free_text',
  'crm_prioritization',
  'notification_reaction',
  'email_response',
  'simulated_call',
  'welcome',
  'spreadsheet_edit',
] as const;

export const USER_ROLES = ['owner', 'admin', 'recruiter', 'hiring_manager', 'reviewer', 'viewer'] as const;

export const JOB_STATUSES = ['draft', 'published', 'closed', 'archived'] as const;

export const SIMULATION_STATUSES = ['draft', 'active', 'disabled', 'archived'] as const;

export const SESSION_STATUSES = ['not_started', 'in_progress', 'completed', 'expired', 'abandoned', 'disqualified'] as const;

export const SCORING_STATUSES = ['pending', 'queued', 'processing', 'scored', 'failed', 'manual_review_required'] as const;

export const RECOMMENDATIONS = ['strong_yes', 'yes', 'maybe', 'no', 'review_required'] as const;
