import { pool } from "./db";
import { DEFAULT_USER_ID, INITIAL_PROJECTS, INITIAL_ROLES, INITIAL_SKILLS } from "../src/data/initialData";
import { deleteAllSkillsForUser } from "./repositories/skills";
import { deleteAllProjectsForUser, createProject } from "./repositories/projects";
import { deleteAllRolesForUser, createRole } from "./repositories/roles";

async function insertSampleData(userId: string) {
  for (const skill of INITIAL_SKILLS) {
    await pool.query(
      `INSERT INTO skills (id, user_id, name, category, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, lower(name)) DO NOTHING`,
      [skill.id, userId, skill.name, skill.category || null, skill.createdAt]
    );
  }

  for (const project of INITIAL_PROJECTS) {
    await createProject(userId, {
      name: project.name,
      timeframe: project.timeframe,
      context: project.context,
      myRole: project.myRole,
      rawNotes: project.rawNotes,
      techUsed: project.techUsed,
      skills: project.skills.map((s) => ({ skillName: s.skillName, depth: s.depth })),
      outcome: project.outcome,
      link: project.link,
      generatedDescription: project.generatedDescription,
    });
  }

  for (const role of INITIAL_ROLES) {
    await createRole(userId, {
      name: role.name,
      requiredSkillNames: role.requiredSkillNames,
      notes: role.notes,
      company: role.company,
      applicationStatus: role.applicationStatus,
      appliedDate: role.appliedDate,
      resumeUsed: role.resumeUsed,
    });
  }
}

/**
 * Seeds sample data once, the first time the database is empty, so a fresh
 * install has something to look at.
 */
export async function seedIfEmpty(userId: string): Promise<void> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM projects WHERE user_id = $1`,
    [userId]
  );
  if (parseInt(result.rows[0].count, 10) > 0) return;
  await insertSampleData(userId);
}

/**
 * Wipes all of a user's data and reloads the original sample dataset.
 * Backs the "Reset Sample Data" action in the sidebar.
 */
export async function resetToDefaults(userId: string): Promise<void> {
  await deleteAllProjectsForUser(userId);
  await deleteAllRolesForUser(userId);
  await deleteAllSkillsForUser(userId);
  await insertSampleData(userId);
}
