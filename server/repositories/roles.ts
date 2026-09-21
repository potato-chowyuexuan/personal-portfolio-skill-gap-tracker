import { pool } from "../db";
import { ApplicationStatus, Role } from "../../src/types";
import { ensureSkill } from "./skills";

interface RoleRow {
  id: string;
  user_id: string;
  name: string;
  notes: string | null;
  company: string | null;
  application_status: string;
  applied_date: string | null;
  resume_used: string | null;
  created_at: string;
  updated_at: string;
}

interface RequiredSkillRow {
  role_id: string;
  skill_name: string;
  position: number;
}

function rowToRole(row: RoleRow, requiredSkillNames: string[]): Role {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    requiredSkillNames,
    notes: row.notes || undefined,
    company: row.company || undefined,
    applicationStatus: (row.application_status as ApplicationStatus) || "Not Applied",
    appliedDate: row.applied_date || undefined,
    resumeUsed: row.resume_used || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadRequiredSkills(roleIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (roleIds.length === 0) return map;

  const result = await pool.query<RequiredSkillRow>(
    `SELECT * FROM role_required_skills WHERE role_id = ANY($1::text[]) ORDER BY position ASC`,
    [roleIds]
  );

  for (const row of result.rows) {
    const list = map.get(row.role_id) || [];
    list.push(row.skill_name);
    map.set(row.role_id, list);
  }
  return map;
}

export async function listRoles(userId: string): Promise<Role[]> {
  const result = await pool.query<RoleRow>(
    `SELECT * FROM roles WHERE user_id = $1 ORDER BY created_at ASC`,
    [userId]
  );

  const skillsByRole = await loadRequiredSkills(result.rows.map((r) => r.id));
  return result.rows.map((row) => rowToRole(row, skillsByRole.get(row.id) || []));
}

export async function getRole(id: string): Promise<Role | null> {
  const result = await pool.query<RoleRow>(`SELECT * FROM roles WHERE id = $1`, [id]);
  const row = result.rows[0];
  if (!row) return null;
  const skillsByRole = await loadRequiredSkills([id]);
  return rowToRole(row, skillsByRole.get(id) || []);
}

export interface RoleInput {
  name: string;
  requiredSkillNames: string[];
  notes?: string;
  company?: string;
  applicationStatus?: ApplicationStatus;
  appliedDate?: string;
  resumeUsed?: string;
}

async function writeRequiredSkills(userId: string, roleId: string, skillNames: string[]) {
  await pool.query(`DELETE FROM role_required_skills WHERE role_id = $1`, [roleId]);

  let position = 0;
  for (const rawName of skillNames) {
    const skill = await ensureSkill(userId, rawName);
    await pool.query(
      `INSERT INTO role_required_skills (role_id, skill_name, position) VALUES ($1, $2, $3)`,
      [roleId, skill.name, position]
    );
    position += 1;
  }
}

export async function createRole(userId: string, input: RoleInput): Promise<Role> {
  const id = `role_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  await pool.query(
    `INSERT INTO roles
      (id, user_id, name, notes, company, application_status, applied_date, resume_used, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      id,
      userId,
      input.name,
      input.notes || null,
      input.company || null,
      input.applicationStatus || "Not Applied",
      input.appliedDate || null,
      input.resumeUsed || null,
      now,
      now,
    ]
  );

  await writeRequiredSkills(userId, id, input.requiredSkillNames || []);

  return (await getRole(id))!;
}

export async function updateRole(userId: string, id: string, input: RoleInput): Promise<Role | null> {
  const existing = await getRole(id);
  if (!existing) return null;

  const now = new Date().toISOString();

  await pool.query(
    `UPDATE roles SET
      name = $1, notes = $2, company = $3, application_status = $4, applied_date = $5, resume_used = $6, updated_at = $7
     WHERE id = $8`,
    [
      input.name,
      input.notes || null,
      input.company || null,
      input.applicationStatus || "Not Applied",
      input.appliedDate || null,
      input.resumeUsed || null,
      now,
      id,
    ]
  );

  await writeRequiredSkills(userId, id, input.requiredSkillNames || []);

  return getRole(id);
}

export async function deleteRole(id: string): Promise<boolean> {
  const result = await pool.query(`DELETE FROM roles WHERE id = $1`, [id]);
  return (result.rowCount || 0) > 0;
}

export async function deleteAllRolesForUser(userId: string): Promise<void> {
  await pool.query(`DELETE FROM roles WHERE user_id = $1`, [userId]);
}
