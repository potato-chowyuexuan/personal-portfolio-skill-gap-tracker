import { pool } from "../db";
import { Project, ProjectContext, ProjectSkill, SkillDepth } from "../../src/types";
import { ensureSkill } from "./skills";

interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  start_month: string | null;
  start_year: string | null;
  end_month: string | null;
  end_year: string | null;
  is_ongoing: boolean;
  context: string;
  my_role: string | null;
  raw_notes: string | null;
  tech_used: string;
  outcome: string | null;
  link: string | null;
  generated_description: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectSkillRow {
  project_id: string;
  skill_id: string;
  skill_name: string;
  depth: string;
}

function rowToProject(row: ProjectRow, skills: ProjectSkill[]): Project {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    timeframe: {
      startMonth: row.start_month || "",
      startYear: row.start_year || "",
      endMonth: row.end_month || undefined,
      endYear: row.end_year || undefined,
      isOngoing: !!row.is_ongoing,
    },
    context: row.context as ProjectContext,
    myRole: row.my_role || "",
    rawNotes: row.raw_notes || "",
    techUsed: JSON.parse(row.tech_used || "[]"),
    skills,
    outcome: row.outcome || undefined,
    link: row.link || undefined,
    generatedDescription: row.generated_description || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadSkillsForProjects(projectIds: string[]): Promise<Map<string, ProjectSkill[]>> {
  const map = new Map<string, ProjectSkill[]>();
  if (projectIds.length === 0) return map;

  const result = await pool.query<ProjectSkillRow>(
    `SELECT * FROM project_skills WHERE project_id = ANY($1::text[])`,
    [projectIds]
  );

  for (const row of result.rows) {
    const list = map.get(row.project_id) || [];
    list.push({
      skillId: row.skill_id,
      skillName: row.skill_name,
      depth: row.depth as SkillDepth,
    });
    map.set(row.project_id, list);
  }
  return map;
}

export async function listProjects(userId: string): Promise<Project[]> {
  const result = await pool.query<ProjectRow>(
    `SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  const skillsByProject = await loadSkillsForProjects(result.rows.map((r) => r.id));
  return result.rows.map((row) => rowToProject(row, skillsByProject.get(row.id) || []));
}

export async function getProject(id: string): Promise<Project | null> {
  const result = await pool.query<ProjectRow>(`SELECT * FROM projects WHERE id = $1`, [id]);
  const row = result.rows[0];
  if (!row) return null;
  const skillsByProject = await loadSkillsForProjects([id]);
  return rowToProject(row, skillsByProject.get(id) || []);
}

export interface ProjectInput {
  name: string;
  timeframe: {
    startMonth: string;
    startYear: string;
    endMonth?: string;
    endYear?: string;
    isOngoing: boolean;
  };
  context: ProjectContext;
  myRole: string;
  rawNotes: string;
  techUsed: string[];
  skills: Array<{ skillName: string; depth: SkillDepth }>;
  outcome?: string;
  link?: string;
  generatedDescription?: string;
}

async function writeProjectSkills(userId: string, projectId: string, skills: ProjectInput["skills"]) {
  await pool.query(`DELETE FROM project_skills WHERE project_id = $1`, [projectId]);

  for (const item of skills) {
    const skill = await ensureSkill(userId, item.skillName);
    await pool.query(
      `INSERT INTO project_skills (project_id, skill_id, skill_name, depth) VALUES ($1, $2, $3, $4)`,
      [projectId, skill.id, skill.name, item.depth]
    );
  }
}

export async function createProject(userId: string, input: ProjectInput): Promise<Project> {
  const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  await pool.query(
    `INSERT INTO projects
      (id, user_id, name, start_month, start_year, end_month, end_year, is_ongoing, context, my_role, raw_notes, tech_used, outcome, link, generated_description, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      id,
      userId,
      input.name,
      input.timeframe.startMonth,
      input.timeframe.startYear,
      input.timeframe.endMonth || null,
      input.timeframe.endYear || null,
      input.timeframe.isOngoing,
      input.context,
      input.myRole,
      input.rawNotes,
      JSON.stringify(input.techUsed || []),
      input.outcome || null,
      input.link || null,
      input.generatedDescription || null,
      now,
      now,
    ]
  );

  await writeProjectSkills(userId, id, input.skills || []);

  return (await getProject(id))!;
}

export async function updateProject(userId: string, id: string, input: ProjectInput): Promise<Project | null> {
  const existing = await getProject(id);
  if (!existing) return null;

  const now = new Date().toISOString();

  await pool.query(
    `UPDATE projects SET
      name = $1, start_month = $2, start_year = $3, end_month = $4, end_year = $5, is_ongoing = $6,
      context = $7, my_role = $8, raw_notes = $9, tech_used = $10, outcome = $11, link = $12,
      generated_description = $13, updated_at = $14
     WHERE id = $15`,
    [
      input.name,
      input.timeframe.startMonth,
      input.timeframe.startYear,
      input.timeframe.endMonth || null,
      input.timeframe.endYear || null,
      input.timeframe.isOngoing,
      input.context,
      input.myRole,
      input.rawNotes,
      JSON.stringify(input.techUsed || []),
      input.outcome || null,
      input.link || null,
      input.generatedDescription || null,
      now,
      id,
    ]
  );

  await writeProjectSkills(userId, id, input.skills || []);

  return getProject(id);
}

export async function deleteProject(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM projects WHERE id = $1`, [id]);
  return (result.rowCount || 0) > 0;
}

export async function deleteAllProjectsForUser(userId: string): Promise<void> {
  await pool.query(`DELETE FROM projects WHERE user_id = $1`, [userId]);
}
