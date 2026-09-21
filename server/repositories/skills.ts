import { pool } from "../db";
import { Skill } from "../../src/types";

interface SkillRow {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  created_at: string;
}

function rowToSkill(row: SkillRow): Skill {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    category: row.category || undefined,
    createdAt: row.created_at,
  };
}

export async function listSkills(userId: string): Promise<Skill[]> {
  const result = await pool.query<SkillRow>(
    `SELECT * FROM skills WHERE user_id = $1 ORDER BY created_at ASC`,
    [userId]
  );
  return result.rows.map(rowToSkill);
}

/**
 * Ensures a skill exists in the master pool for this user, matching
 * case-insensitively on name. Returns the existing or newly created skill.
 */
export async function ensureSkill(userId: string, rawName: string, category?: string): Promise<Skill> {
  const trimmed = rawName.trim();

  const existing = await pool.query<SkillRow>(
    `SELECT * FROM skills WHERE user_id = $1 AND lower(name) = lower($2)`,
    [userId, trimmed]
  );

  if (existing.rows.length > 0) {
    return rowToSkill(existing.rows[0]);
  }

  const id = `sk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = new Date().toISOString();

  try {
    await pool.query(
      `INSERT INTO skills (id, user_id, name, category, created_at) VALUES ($1, $2, $3, $4, $5)`,
      [id, userId, trimmed, category || null, createdAt]
    );
  } catch (err: any) {
    // Unique violation: another request registered the same skill name
    // concurrently. Fall through and re-read the winner below.
    if (err.code !== "23505") throw err;
  }

  const winner = await pool.query<SkillRow>(
    `SELECT * FROM skills WHERE user_id = $1 AND lower(name) = lower($2)`,
    [userId, trimmed]
  );
  return rowToSkill(winner.rows[0]);
}

export async function deleteAllSkillsForUser(userId: string): Promise<void> {
  await pool.query(`DELETE FROM skills WHERE user_id = $1`, [userId]);
}
