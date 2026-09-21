import {
  Project,
  ProjectRecommendation,
  ProjectRecommendationSkill,
  Role,
  RoleGapAnalysisData,
  SkillGapStatus,
} from "../src/types";
import { getDepthWeight, normalizeSkillName } from "./gapAnalysis";

const MONTH_INDEX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/**
 * A small, deterministic boost for context that reads as closer to
 * "industry experience" on a resume. Capped well below the value of a
 * single additional skill (min depth weight is 1) so it can only ever
 * break ties among otherwise-equal projects, never outrank a project that
 * genuinely covers one more required skill.
 */
const CONTEXT_BOOST: Partial<Record<Project["context"], number>> = {
  Internship: 0.5,
};

/**
 * Sortable "recency key" for a project: its end date, or its start date if
 * still ongoing (there is no end date to use). Higher = more recent.
 */
function recencyKey(project: Project): number {
  const tf = project.timeframe;
  const useEnd = !tf.isOngoing && !!tf.endYear;
  const year = parseInt((useEnd ? tf.endYear : tf.startYear) || "0", 10) || 0;
  const month = MONTH_INDEX[(useEnd ? tf.endMonth : tf.startMonth) || ""] ?? 0;
  return year * 12 + month;
}

function buildReason(
  overlapCount: number,
  totalRequired: number,
  gapSkills: ProjectRecommendationSkill[],
  topSkill: ProjectRecommendationSkill | undefined
): string {
  const base = `Covers ${overlapCount} of ${totalRequired} required skill${totalRequired === 1 ? "" : "s"}`;

  if (gapSkills.length > 0) {
    const names = gapSkills.slice(0, 2).map((s) => s.skillName).join(", ");
    const verb = gapSkills.length === 1 ? "is" : "are";
    const noun = gapSkills.length === 1 ? "a gap" : "gaps";
    return `${base}, including ${names} — which ${verb} currently ${noun} for this role.`;
  }

  if (topSkill) {
    return `${base}, including ${topSkill.skillName} at ${topSkill.depth} level.`;
  }

  return `${base}.`;
}

/**
 * Ranks and tiers logged projects by relevance to a target role. Pure
 * function of (role, projects, gapAnalysis) — no I/O, no dependency on the
 * gap-analysis computation itself beyond reading its per-skill statuses, so
 * it can be tested standalone and never mutates or duplicates that logic.
 *
 * Scoring: score = sum of depth weights (Architected=3, Implemented=2,
 * Used=1) over the project's skills that overlap the role's requirements,
 * plus a small context boost. Ties are broken first by raw overlap count,
 * then by recency (end date, or start date if ongoing).
 *
 * Tiering (fixed, explainable thresholds — not a score percentile):
 * - Tier 1 ("Must include"): covers a skill still Missing/Partial for this
 *   role, OR covers at least half of the role's required skills.
 * - Tier 2 ("Include if space allows"): covers 2+ required skills, all
 *   already well-covered by other projects too.
 * - Tier 3 ("Optional / cut first"): covers exactly 1 required skill,
 *   already well-covered elsewhere.
 * Projects with zero overlap are left out entirely — they have nothing to
 * contribute to this specific application.
 */
export function rankProjectsForRole(
  role: Role,
  projects: Project[],
  gapAnalysis: RoleGapAnalysisData
): ProjectRecommendation[] {
  const totalRequired = role.requiredSkillNames.length;
  if (totalRequired === 0) return [];

  const statusBySkill = new Map<string, SkillGapStatus>();
  for (const item of gapAnalysis.items) {
    statusBySkill.set(normalizeSkillName(item.skillName), item.status);
  }

  const requiredSet = new Set(role.requiredSkillNames.map(normalizeSkillName));

  const scored = projects.map((project) => {
    const seen = new Set<string>();
    const contributingSkills: ProjectRecommendationSkill[] = [];
    let depthSum = 0;

    for (const s of project.skills) {
      const normalized = normalizeSkillName(s.skillName);
      if (!requiredSet.has(normalized) || seen.has(normalized)) continue;
      seen.add(normalized);
      depthSum += getDepthWeight(s.depth);
      contributingSkills.push({
        skillName: s.skillName,
        depth: s.depth,
        status: statusBySkill.get(normalized) || "Missing",
      });
    }

    const overlapCount = contributingSkills.length;
    const score = depthSum + (CONTEXT_BOOST[project.context] || 0);

    return { project, overlapCount, score, contributingSkills };
  });

  const relevant = scored.filter((p) => p.overlapCount > 0);

  relevant.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.overlapCount !== a.overlapCount) return b.overlapCount - a.overlapCount;
    return recencyKey(b.project) - recencyKey(a.project);
  });

  const highOverlapThreshold = Math.ceil(totalRequired / 2);

  return relevant.map(({ project, overlapCount, score, contributingSkills }) => {
    const gapSkills = contributingSkills.filter((s) => s.status !== "Covered");
    const coversGap = gapSkills.length > 0;
    const highOverlap = overlapCount >= highOverlapThreshold;

    const tier = coversGap || highOverlap ? "Tier 1" : overlapCount >= 2 ? "Tier 2" : "Tier 3";

    const topSkill = [...contributingSkills].sort(
      (a, b) => getDepthWeight(b.depth) - getDepthWeight(a.depth)
    )[0];

    return {
      projectId: project.id,
      projectName: project.name,
      tier,
      score,
      overlapCount,
      reason: buildReason(overlapCount, totalRequired, gapSkills, topSkill),
      contributingSkills,
    };
  });
}
