import { Project, Role, RoleGapAnalysisData, SkillDepth, SkillGapItem } from "../src/types";

export function normalizeSkillName(name: string): string {
  return name.trim().toLowerCase();
}

export function getDepthWeight(depth: SkillDepth): number {
  switch (depth) {
    case "Architected":
      return 3;
    case "Implemented":
      return 2;
    case "Used":
    default:
      return 1;
  }
}

/**
 * Performs gap analysis between a target role's required skills and the
 * user's logged projects. This is the single source of truth for readiness
 * scoring, shared by the single-role and bulk gap-analysis endpoints.
 */
export function computeRoleGapAnalysis(role: Role, projects: Project[]): RoleGapAnalysisData {
  const items: SkillGapItem[] = role.requiredSkillNames.map((reqSkillName) => {
    const normalizedReq = normalizeSkillName(reqSkillName);

    const matched = projects.flatMap((p) => {
      const match = p.skills.find((s) => normalizeSkillName(s.skillName) === normalizedReq);
      if (!match) return [];

      const tf = p.timeframe;
      const start = `${tf.startMonth} ${tf.startYear}`.trim();
      const end = tf.isOngoing ? "Ongoing" : tf.endMonth && tf.endYear ? `${tf.endMonth} ${tf.endYear}` : "";
      const timeframeString = end ? `${start} – ${end}` : start;

      return [
        {
          projectId: p.id,
          projectName: p.name,
          context: p.context,
          timeframeString,
          myRole: p.myRole,
          depth: match.depth,
        },
      ];
    });

    if (matched.length === 0) {
      return {
        skillName: reqSkillName,
        status: "Missing" as const,
        demonstratedProjects: [],
      };
    }

    let highestDepth: SkillDepth = "Used";
    for (const m of matched) {
      if (getDepthWeight(m.depth) > getDepthWeight(highestDepth)) {
        highestDepth = m.depth;
      }
    }

    const status = highestDepth === "Used" ? ("Partial" as const) : ("Covered" as const);

    return {
      skillName: reqSkillName,
      status,
      highestDepth,
      demonstratedProjects: matched,
    };
  });

  const totalRequired = items.length;
  const coveredCount = items.filter((i) => i.status === "Covered").length;
  const partialCount = items.filter((i) => i.status === "Partial").length;
  const missingCount = items.filter((i) => i.status === "Missing").length;

  const coveragePercentage =
    totalRequired === 0 ? 0 : Math.round(((coveredCount + partialCount * 0.5) / totalRequired) * 100);

  return {
    role,
    totalRequired,
    coveredCount,
    partialCount,
    missingCount,
    coveragePercentage,
    items,
  };
}
