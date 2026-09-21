import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_USER_ID } from "../src/data/initialData";
import { pool } from "./db";
import { listSkills } from "./repositories/skills";
import { createProject, deleteProject, listProjects, updateProject } from "./repositories/projects";
import { createRole, deleteRole, getRole, listRoles, updateRole } from "./repositories/roles";
import { computeRoleGapAnalysis } from "./gapAnalysis";
import { rankProjectsForRole } from "./projectRanking";
import { resetToDefaults } from "./seed";

export const apiRouter = Router();

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

apiRouter.get("/skills", async (_req, res) => {
  try {
    res.json(await listSkills(DEFAULT_USER_ID));
  } catch (error: any) {
    console.error("Failed to list skills:", error);
    res.status(500).json({ error: error.message || "Failed to list skills." });
  }
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

apiRouter.get("/projects", async (_req, res) => {
  try {
    res.json(await listProjects(DEFAULT_USER_ID));
  } catch (error: any) {
    console.error("Failed to list projects:", error);
    res.status(500).json({ error: error.message || "Failed to list projects." });
  }
});

apiRouter.post("/projects", async (req, res) => {
  const { name, timeframe, context, myRole, rawNotes, techUsed, skills, outcome, link, generatedDescription } =
    req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Project name is required." });
  }

  try {
    const project = await createProject(DEFAULT_USER_ID, {
      name: name.trim(),
      timeframe,
      context,
      myRole: myRole || "",
      rawNotes: rawNotes || "",
      techUsed: Array.isArray(techUsed) ? techUsed : [],
      skills: Array.isArray(skills) ? skills : [],
      outcome,
      link,
      generatedDescription,
    });
    res.status(201).json(project);
  } catch (error: any) {
    console.error("Failed to create project:", error);
    res.status(500).json({ error: error.message || "Failed to create project." });
  }
});

apiRouter.put("/projects/:id", async (req, res) => {
  const { name, timeframe, context, myRole, rawNotes, techUsed, skills, outcome, link, generatedDescription } =
    req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Project name is required." });
  }

  try {
    const project = await updateProject(DEFAULT_USER_ID, req.params.id, {
      name: name.trim(),
      timeframe,
      context,
      myRole: myRole || "",
      rawNotes: rawNotes || "",
      techUsed: Array.isArray(techUsed) ? techUsed : [],
      skills: Array.isArray(skills) ? skills : [],
      outcome,
      link,
      generatedDescription,
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found." });
    }
    res.json(project);
  } catch (error: any) {
    console.error("Failed to update project:", error);
    res.status(500).json({ error: error.message || "Failed to update project." });
  }
});

apiRouter.delete("/projects/:id", async (req, res) => {
  try {
    const deleted = await deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Project not found." });
    }
    res.status(204).end();
  } catch (error: any) {
    console.error("Failed to delete project:", error);
    res.status(500).json({ error: error.message || "Failed to delete project." });
  }
});

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

apiRouter.get("/roles", async (_req, res) => {
  try {
    res.json(await listRoles(DEFAULT_USER_ID));
  } catch (error: any) {
    console.error("Failed to list roles:", error);
    res.status(500).json({ error: error.message || "Failed to list roles." });
  }
});

apiRouter.post("/roles", async (req, res) => {
  const { name, requiredSkillNames, notes, company, applicationStatus, appliedDate, resumeUsed } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Role name is required." });
  }
  if (!Array.isArray(requiredSkillNames) || requiredSkillNames.length === 0) {
    return res.status(400).json({ error: "At least one required skill is needed." });
  }

  try {
    const role = await createRole(DEFAULT_USER_ID, {
      name: name.trim(),
      requiredSkillNames,
      notes,
      company,
      applicationStatus,
      appliedDate,
      resumeUsed,
    });
    res.status(201).json(role);
  } catch (error: any) {
    console.error("Failed to create role:", error);
    res.status(500).json({ error: error.message || "Failed to create role." });
  }
});

apiRouter.put("/roles/:id", async (req, res) => {
  const { name, requiredSkillNames, notes, company, applicationStatus, appliedDate, resumeUsed } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Role name is required." });
  }
  if (!Array.isArray(requiredSkillNames) || requiredSkillNames.length === 0) {
    return res.status(400).json({ error: "At least one required skill is needed." });
  }

  try {
    const role = await updateRole(DEFAULT_USER_ID, req.params.id, {
      name: name.trim(),
      requiredSkillNames,
      notes,
      company,
      applicationStatus,
      appliedDate,
      resumeUsed,
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found." });
    }
    res.json(role);
  } catch (error: any) {
    console.error("Failed to update role:", error);
    res.status(500).json({ error: error.message || "Failed to update role." });
  }
});

apiRouter.delete("/roles/:id", async (req, res) => {
  try {
    const deleted = await deleteRole(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Role not found." });
    }
    res.status(204).end();
  } catch (error: any) {
    console.error("Failed to delete role:", error);
    res.status(500).json({ error: error.message || "Failed to delete role." });
  }
});

// ---------------------------------------------------------------------------
// Gap analysis (server-computed readiness scoring)
// ---------------------------------------------------------------------------

apiRouter.get("/roles/:id/gap-analysis", async (req, res) => {
  try {
    const role = await getRole(req.params.id);
    if (!role) {
      return res.status(404).json({ error: "Role not found." });
    }
    const projects = await listProjects(DEFAULT_USER_ID);
    const analysis = computeRoleGapAnalysis(role, projects);
    const recommendedProjects = rankProjectsForRole(role, projects, analysis);
    res.json({ ...analysis, recommendedProjects });
  } catch (error: any) {
    console.error("Failed to compute gap analysis:", error);
    res.status(500).json({ error: error.message || "Failed to compute gap analysis." });
  }
});

apiRouter.get("/gap-analysis", async (_req, res) => {
  try {
    const [roles, projects] = await Promise.all([listRoles(DEFAULT_USER_ID), listProjects(DEFAULT_USER_ID)]);
    res.json(
      roles.map((role) => {
        const analysis = computeRoleGapAnalysis(role, projects);
        const recommendedProjects = rankProjectsForRole(role, projects, analysis);
        return { ...analysis, recommendedProjects };
      })
    );
  } catch (error: any) {
    console.error("Failed to compute gap analyses:", error);
    res.status(500).json({ error: error.message || "Failed to compute gap analyses." });
  }
});

// ---------------------------------------------------------------------------
// Reset sample data
// ---------------------------------------------------------------------------

apiRouter.post("/reset", async (_req, res) => {
  try {
    await resetToDefaults(DEFAULT_USER_ID);
    const [projects, roles, skills] = await Promise.all([
      listProjects(DEFAULT_USER_ID),
      listRoles(DEFAULT_USER_ID),
      listSkills(DEFAULT_USER_ID),
    ]);
    res.json({ projects, roles, skills });
  } catch (error: any) {
    console.error("Failed to reset data:", error);
    res.status(500).json({ error: error.message || "Failed to reset data." });
  }
});

// ---------------------------------------------------------------------------
// Claude AI helpers
// ---------------------------------------------------------------------------

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

function getClaudeClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "MY_ANTHROPIC_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new Anthropic({ apiKey });
}

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

apiRouter.post("/generate-description", async (req, res) => {
  try {
    const { projectName, role, context, notes, techUsed } = req.body;

    if (!notes && !techUsed?.length && !role) {
      return res.status(400).json({
        error: "Please provide notes, tech stack, or role details to generate a description.",
      });
    }

    const ai = getClaudeClient();

    if (!ai) {
      const techStr = Array.isArray(techUsed) && techUsed.length > 0 ? techUsed.join(", ") : "modern technologies";
      const roleStr = role ? `as a ${role}` : "as lead contributor";
      const projStr = projectName ? `for ${projectName}` : "";
      const contextStr = context ? `(${context})` : "";

      const fallbackSummary = `Developed and delivered ${projStr} ${contextStr} ${roleStr}, leveraging ${techStr}. Synthesized core requirements from project notes into modular, functional deliverables with an emphasis on code quality. ${notes ? notes.slice(0, 140).trim() + "..." : "Demonstrated strong end-to-end execution and technical ownership."}`;

      return res.json({
        summary: fallbackSummary,
        source: "fallback",
        note: "Configured without ANTHROPIC_API_KEY. Add key in Settings > Secrets for Claude AI responses.",
      });
    }

    const prompt = `You are an expert resume writer and technical portfolio editor.
Generate a concise, impactful 2 to 3 sentence summary of a project based on the following input:

Project Name: ${projectName || "Unnamed Project"}
Context: ${context || "Technical Project"}
Role: ${role || "Developer"}
Tech/Tools Used: ${Array.isArray(techUsed) ? techUsed.join(", ") : techUsed || "None specified"}
Raw Notes & Details:
${notes || "No additional notes provided."}

Guidelines:
- Keep the response strictly to 2 or 3 clear, professional, active-voice sentences.
- Highlight the core problem solved, key technologies utilized, and primary outcome or technical responsibility.
- Do NOT use markdown bolding, bullet points, or introductory phrases like "Here is a summary:".
- Output only the plain text summary.`;

    const generatePromise = ai.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Claude API request timed out")), 7000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const text = extractText(response);
    return res.json({ summary: text, source: "claude" });
  } catch (error: any) {
    console.error("Claude generation error:", error);

    const { projectName, role, techUsed, notes } = req.body;
    const techStr = Array.isArray(techUsed) && techUsed.length > 0 ? techUsed.join(", ") : "modern tooling";
    const roleStr = role ? `Served as ${role}` : "Contributed";
    const projStr = projectName ? `to ${projectName}` : "to the project";
    const fallback = `${roleStr} ${projStr}, driving core architectural and development milestones using ${techStr}. Implemented robust features documented in project requirements to deliver reliable outcomes. ${notes ? notes.slice(0, 120).trim() : "Applied proven engineering practices."}`;

    return res.json({
      summary: fallback,
      source: "fallback",
      error: error.message || "Failed to contact Claude API",
    });
  }
});

/**
 * Deterministic rule-based extraction used when the AI is unavailable or
 * offline, and as a resilient fallback if a Claude response can't be parsed.
 */
function fallbackClassify(notes: string, projectName?: string, currentRole?: string) {
  const text = (notes + " " + (projectName || "")).toLowerCase();

  let classifiedRole = currentRole || "Software Engineer";
  if (text.includes("architect") || text.includes("system design") || text.includes("scalability")) {
    classifiedRole = "Software Architect";
  } else if (
    text.includes("devops") ||
    text.includes("docker") ||
    text.includes("ci/cd") ||
    text.includes("pipeline") ||
    text.includes("kubernetes")
  ) {
    classifiedRole = "DevOps / Infrastructure Engineer";
  } else if (
    (text.includes("frontend") || text.includes("ui") || text.includes("react") || text.includes("css")) &&
    (text.includes("backend") || text.includes("node") || text.includes("database") || text.includes("postgres") || text.includes("sql"))
  ) {
    classifiedRole = "Full Stack Engineer";
  } else if (
    text.includes("frontend") ||
    text.includes("react") ||
    text.includes("ui") ||
    text.includes("tailwind") ||
    text.includes("css") ||
    text.includes("vue")
  ) {
    classifiedRole = "Frontend Engineer";
  } else if (
    text.includes("backend") ||
    text.includes("api") ||
    text.includes("database") ||
    text.includes("sql") ||
    text.includes("postgres") ||
    text.includes("node")
  ) {
    classifiedRole = "Backend Engineer";
  } else if (text.includes("data") || text.includes("analytics") || text.includes("machine learning") || text.includes("model")) {
    classifiedRole = "Data / ML Engineer";
  }

  const KNOWN_TECH = [
    { label: "React", rx: /\b(react|react\.js|jsx|tsx)\b/i },
    { label: "TypeScript", rx: /\b(typescript|ts)\b/i },
    { label: "JavaScript", rx: /\b(javascript|js|es6)\b/i },
    { label: "Node.js", rx: /\b(node|node\.js|express)\b/i },
    { label: "Python", rx: /\b(python|django|fastapi|flask)\b/i },
    { label: "PostgreSQL", rx: /\b(postgres|postgresql|psql)\b/i },
    { label: "MongoDB", rx: /\b(mongo|mongodb)\b/i },
    { label: "Docker", rx: /\b(docker|container|containerized)\b/i },
    { label: "Tailwind CSS", rx: /\b(tailwind|tailwind css)\b/i },
    { label: "WebSockets", rx: /\b(websocket|websockets|socket\.io)\b/i },
    { label: "GraphQL", rx: /\b(graphql|apollo)\b/i },
    { label: "REST APIs", rx: /\b(rest|restful|rest api|rest apis|endpoints)\b/i },
    { label: "Jest / Unit Testing", rx: /\b(jest|testing|unit test|unit tests|vitest|cypress)\b/i },
    { label: "CI/CD Pipelines", rx: /\b(ci\/cd|github actions|pipeline|pipelines|deploy)\b/i },
    { label: "Vite", rx: /\b(vite|bundler|webpack)\b/i },
    { label: "Redis", rx: /\b(redis|cache|caching)\b/i },
    { label: "Next.js", rx: /\b(next|next\.js)\b/i },
  ];

  const techUsed: string[] = [];
  for (const tech of KNOWN_TECH) {
    if (tech.rx.test(notes) || (projectName && tech.rx.test(projectName))) {
      techUsed.push(tech.label);
    }
  }

  const skills: Array<{ skillName: string; depth: "Used" | "Implemented" | "Architected" }> = [];

  for (const tech of techUsed) {
    let depth: "Used" | "Implemented" | "Architected" = "Implemented";
    if (text.includes("architect") || text.includes("designed system") || text.includes("lead") || text.includes("scalable")) {
      depth = "Architected";
    } else if (text.includes("integrated") || text.includes("used") || text.includes("assisted")) {
      depth = "Used";
    }
    skills.push({ skillName: tech, depth });
  }

  if (/\b(architecture|system design|scalable|microservices|distributed)\b/i.test(notes)) {
    skills.push({ skillName: "System Design", depth: "Architected" });
  }
  if (/\b(state management|redux|zustand|context)\b/i.test(notes)) {
    skills.push({ skillName: "State Management", depth: "Implemented" });
  }
  if (/\b(rest|endpoint|crud|api design)\b/i.test(notes) && !skills.some((s) => s.skillName === "REST APIs")) {
    skills.push({ skillName: "REST APIs", depth: "Implemented" });
  }

  return {
    role: classifiedRole,
    techUsed: techUsed.length > 0 ? techUsed : ["React", "TypeScript", "Node.js"],
    skills:
      skills.length > 0
        ? skills
        : [
            { skillName: "React", depth: "Implemented" as const },
            { skillName: "TypeScript", depth: "Implemented" as const },
          ],
  };
}

apiRouter.post("/classify-project", async (req, res) => {
  try {
    const { notes, projectName, currentRole, masterSkills } = req.body;

    if (!notes || typeof notes !== "string" || !notes.trim()) {
      return res.status(400).json({ error: "Please provide project raw notes to classify." });
    }

    const ai = getClaudeClient();

    if (!ai) {
      const fallback = fallbackClassify(notes, projectName, currentRole);
      return res.json({
        ...fallback,
        source: "fallback",
        note: "Classified using heuristic engine. Configure ANTHROPIC_API_KEY in Settings for AI classification.",
      });
    }

    const masterSkillsContext =
      Array.isArray(masterSkills) && masterSkills.length > 0
        ? `Existing portfolio skills you can align with: ${masterSkills.map((s: any) => s.name || s).join(", ")}`
        : "";

    const prompt = `You are an elite technical career recruiter and senior engineering director.
Analyze the following engineering project notes and classify the user's role, tech stack, and demonstrated skills.

Project Name: ${projectName || "Unnamed Project"}
Current Role input: ${currentRole || "None specified"}
${masterSkillsContext}

Project Raw Notes:
"""
${notes}
"""

Instructions:
1. Classify the user's most accurate engineering role (e.g., "Full Stack Engineer", "Frontend Developer", "Backend & DevOps Lead", "Systems Engineer", etc.).
2. Extract all distinct technologies, frameworks, languages, databases, and development tools explicitly mentioned or clearly utilized into "techUsed" (array of strings).
3. Identify all demonstrated engineering skills (both technical and architectural/conceptual skills like System Design, REST APIs, State Management, CI/CD Pipelines, Unit Testing) and assign a proficiency depth to each:
   - "Architected": The user designed systems, made key architectural decisions, chose technologies, built protocols, or led technical strategy.
   - "Implemented": The user wrote significant code, built components/features/services, integrated APIs, or resolved complex logic.
   - "Used": The user leveraged the tool, configured minor aspects, assisted, or utilized it under guidance.

Output MUST be strictly valid JSON with no markdown code blocks, backticks, or extra commentary, following this exact schema:
{
  "role": "Role Title Here",
  "techUsed": ["Tech 1", "Tech 2", "Tech 3"],
  "skills": [
    { "skillName": "React", "depth": "Architected" },
    { "skillName": "Node.js", "depth": "Implemented" }
  ],
  "reasoning": "Brief 1-sentence note summarizing the classification rationale."
}`;

    const generatePromise = ai.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Claude classification request timed out")), 8000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);
    let rawText = extractText(response);

    if (rawText.startsWith("```")) {
      rawText = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
    }

    try {
      const parsed = JSON.parse(rawText);
      return res.json({
        role: parsed.role || "Software Engineer",
        techUsed: Array.isArray(parsed.techUsed) ? parsed.techUsed : [],
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        reasoning: parsed.reasoning || "Classified successfully by Claude.",
        source: "claude",
      });
    } catch (parseError) {
      console.warn("JSON parse error from Claude output:", parseError, rawText);
      const fallback = fallbackClassify(notes, projectName, currentRole);
      return res.json({
        ...fallback,
        source: "fallback",
        note: "Parsed heuristic result.",
      });
    }
  } catch (error: any) {
    console.error("Claude classification error:", error);
    const { notes, projectName, currentRole } = req.body;
    const fallback = fallbackClassify(notes || "", projectName, currentRole);
    return res.json({
      ...fallback,
      source: "fallback",
      error: error.message || "Failed to contact Claude API",
    });
  }
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

apiRouter.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error: any) {
    console.error("Health check failed to reach the database:", error);
    res.status(503).json({ status: "error", database: "unreachable", error: error.message });
  }
});
