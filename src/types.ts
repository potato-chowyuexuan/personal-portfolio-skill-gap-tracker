export type ProjectContext =
  | 'School Coursework'
  | 'Personal Project'
  | 'Internship'
  | 'Hackathon'
  | 'Team Project';

export type SkillDepth = 'Used' | 'Implemented' | 'Architected';

export interface Skill {
  id: string;
  user_id: string;
  name: string;
  category?: string;
  createdAt: string;
}

export interface ProjectSkill {
  skillId: string;
  skillName: string;
  depth: SkillDepth;
}

export interface ProjectTimeframe {
  startMonth: string;
  startYear: string;
  endMonth?: string;
  endYear?: string;
  isOngoing: boolean;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  timeframe: ProjectTimeframe;
  context: ProjectContext;
  myRole: string;
  rawNotes: string;
  techUsed: string[];
  skills: ProjectSkill[];
  outcome?: string;
  link?: string;
  generatedDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 'Not Applied' | 'Applied' | 'Interviewing' | 'Offered' | 'Rejected';

export interface Role {
  id: string;
  user_id: string;
  name: string;
  requiredSkillNames: string[];
  notes?: string;
  // Application tracker fields
  company?: string;
  applicationStatus?: ApplicationStatus;
  appliedDate?: string; // YYYY-MM-DD format or ISO
  resumeUsed?: string; // e.g. "FullStack_Resume_v2.pdf", "Frontend-Specialized-2026"
  createdAt: string;
  updatedAt: string;
}

export type SkillGapStatus = 'Covered' | 'Partial' | 'Missing';

export interface SkillGapItem {
  skillName: string;
  status: SkillGapStatus;
  highestDepth?: SkillDepth;
  demonstratedProjects: Array<{
    projectId: string;
    projectName: string;
    context: ProjectContext;
    timeframeString: string;
    myRole: string;
    depth: SkillDepth;
  }>;
}

export interface RoleGapAnalysisData {
  role: Role;
  totalRequired: number;
  coveredCount: number;
  partialCount: number;
  missingCount: number;
  coveragePercentage: number;
  items: SkillGapItem[];
  /** Populated by the separate project-ranking module; absent only if not requested. */
  recommendedProjects?: ProjectRecommendation[];
}

export type ProjectRecommendationTier = 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface ProjectRecommendationSkill {
  skillName: string;
  depth: SkillDepth;
  /** This skill's overall gap-analysis status for the role (not just this project). */
  status: SkillGapStatus;
}

export interface ProjectRecommendation {
  projectId: string;
  projectName: string;
  tier: ProjectRecommendationTier;
  score: number;
  overlapCount: number;
  reason: string;
  contributingSkills: ProjectRecommendationSkill[];
}

/** Payload sent to the backend when creating or updating a project. */
export interface ProjectSaveInput {
  id?: string;
  name: string;
  timeframe: ProjectTimeframe;
  context: ProjectContext;
  myRole: string;
  rawNotes: string;
  techUsed: string[];
  skills: Array<{ skillName: string; depth: SkillDepth }>;
  outcome?: string;
  link?: string;
  generatedDescription?: string;
}

/** Payload sent to the backend when creating or updating a role. */
export interface RoleSaveInput {
  id?: string;
  name: string;
  requiredSkillNames: string[];
  notes?: string;
  company?: string;
  applicationStatus?: ApplicationStatus;
  appliedDate?: string;
  resumeUsed?: string;
}
