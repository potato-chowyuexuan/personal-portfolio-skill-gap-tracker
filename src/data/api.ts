import { Project, ProjectSaveInput, Role, RoleGapAnalysisData, RoleSaveInput, Skill } from '../types';

// In local dev, the frontend and backend share an origin (Vite's dev
// middleware runs inside the same Express process), so a relative '/api'
// path is enough. In production the two are deployed separately (Vercel +
// Render), so VITE_API_BASE_URL points at the deployed backend. It's read
// at build time and baked into the static bundle — set it in Vercel's
// project settings before building, not at runtime.
const API_ROOT = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const BASE = `${API_ROOT}/api`;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // response had no JSON body; keep the generic message
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

// Skills -----------------------------------------------------------------

export function getSkills(): Promise<Skill[]> {
  return request(`${BASE}/skills`);
}

// Projects -----------------------------------------------------------------

export function getProjects(): Promise<Project[]> {
  return request(`${BASE}/projects`);
}

export function createProject(data: ProjectSaveInput): Promise<Project> {
  return request(`${BASE}/projects`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateProject(id: string, data: ProjectSaveInput): Promise<Project> {
  return request(`${BASE}/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteProject(id: string): Promise<void> {
  return request(`${BASE}/projects/${id}`, { method: 'DELETE' });
}

// Roles ----------------------------------------------------------------------

export function getRoles(): Promise<Role[]> {
  return request(`${BASE}/roles`);
}

export function createRole(data: RoleSaveInput): Promise<Role> {
  return request(`${BASE}/roles`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateRole(id: string, data: RoleSaveInput): Promise<Role> {
  return request(`${BASE}/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteRole(id: string): Promise<void> {
  return request(`${BASE}/roles/${id}`, { method: 'DELETE' });
}

// Gap analysis (computed server-side) -----------------------------------------

export function getAllGapAnalyses(): Promise<RoleGapAnalysisData[]> {
  return request(`${BASE}/gap-analysis`);
}

export function getGapAnalysisForRole(roleId: string): Promise<RoleGapAnalysisData> {
  return request(`${BASE}/roles/${roleId}/gap-analysis`);
}

// Reset ------------------------------------------------------------------------

export function resetAllData(): Promise<{ projects: Project[]; roles: Role[]; skills: Skill[] }> {
  return request(`${BASE}/reset`, { method: 'POST' });
}
