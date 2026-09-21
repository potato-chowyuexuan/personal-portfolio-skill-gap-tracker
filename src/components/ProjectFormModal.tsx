import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, AlertCircle, Info, CheckCircle2, Wand2 } from 'lucide-react';
import { Project, ProjectContext, ProjectSaveInput, SkillDepth, Skill } from '../types';
import { TagInput } from './TagInput';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: ProjectSaveInput) => void;
  initialProject?: Project | null;
  masterSkills: Skill[];
  initialPreselectedSkill?: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 12 }, (_, i) => String(CURRENT_YEAR - i + 2));

const CONTEXTS: ProjectContext[] = [
  'School Coursework',
  'Personal Project',
  'Internship',
  'Hackathon',
  'Team Project',
];

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProject,
  masterSkills,
  initialPreselectedSkill,
}) => {
  const [name, setName] = useState('');
  const [startMonth, setStartMonth] = useState('Jan');
  const [startYear, setStartYear] = useState(String(CURRENT_YEAR));
  const [endMonth, setEndMonth] = useState('May');
  const [endYear, setEndYear] = useState(String(CURRENT_YEAR));
  const [isOngoing, setIsOngoing] = useState(false);
  const [context, setContext] = useState<ProjectContext>('Personal Project');
  const [myRole, setMyRole] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [techUsed, setTechUsed] = useState<string[]>([]);
  const [skillsList, setSkillsList] = useState<Array<{ name: string; depth: SkillDepth }>>([]);
  const [outcome, setOutcome] = useState('');
  const [link, setLink] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  
  // AI generation loading & state
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Classification loading & state
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationNotice, setClassificationNotice] = useState<string | null>(null);

  useEffect(() => {
    if (initialProject) {
      setName(initialProject.name);
      setStartMonth(initialProject.timeframe.startMonth || 'Jan');
      setStartYear(initialProject.timeframe.startYear || String(CURRENT_YEAR));
      setEndMonth(initialProject.timeframe.endMonth || 'May');
      setEndYear(initialProject.timeframe.endYear || String(CURRENT_YEAR));
      setIsOngoing(initialProject.timeframe.isOngoing);
      setContext(initialProject.context);
      setMyRole(initialProject.myRole);
      setRawNotes(initialProject.rawNotes);
      setTechUsed(initialProject.techUsed || []);
      setSkillsList(
        initialProject.skills.map((s) => ({
          name: s.skillName,
          depth: s.depth,
        }))
      );
      setOutcome(initialProject.outcome || '');
      setLink(initialProject.link || '');
      setGeneratedDescription(initialProject.generatedDescription || '');
    } else {
      // Reset form
      setName('');
      setStartMonth('Jan');
      setStartYear(String(CURRENT_YEAR));
      setEndMonth('May');
      setEndYear(String(CURRENT_YEAR));
      setIsOngoing(false);
      setContext('Personal Project');
      setMyRole('');
      setRawNotes('');
      setTechUsed([]);
      
      if (initialPreselectedSkill) {
        setSkillsList([{ name: initialPreselectedSkill, depth: 'Implemented' }]);
      } else {
        setSkillsList([]);
      }

      setOutcome('');
      setLink('');
      setGeneratedDescription('');
    }
    setAiNotice(null);
    setClassificationNotice(null);
    setErrorMessage(null);
  }, [initialProject, isOpen, initialPreselectedSkill]);

  if (!isOpen) return null;

  // Handle skill tag changes
  const handleSkillTagsChange = (tags: string[]) => {
    // Keep existing depths for skills that still exist, default to 'Implemented' for new
    const updated = tags.map((t) => {
      const existing = skillsList.find((s) => s.name.toLowerCase() === t.toLowerCase());
      return {
        name: t,
        depth: existing ? existing.depth : ('Implemented' as SkillDepth),
      };
    });
    setSkillsList(updated);
  };

  const handleDepthChange = (skillIndex: number, depth: SkillDepth) => {
    const updated = [...skillsList];
    updated[skillIndex].depth = depth;
    setSkillsList(updated);
  };

  // AI Description Generator
  const handleGenerateDescription = async () => {
    setAiNotice(null);
    setErrorMessage(null);

    if (!rawNotes.trim() && techUsed.length === 0 && !myRole.trim()) {
      setErrorMessage('Please fill in Raw Notes, Tech Used, or Role before generating.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: name,
          context,
          role: myRole,
          notes: rawNotes,
          techUsed,
        }),
      });

      const data = await response.json();
      if (data.summary) {
        setGeneratedDescription(data.summary);
        if (data.source === 'fallback') {
          setAiNotice(data.note || 'Generated draft summary from your technical inputs.');
        } else {
          setAiNotice('Generated 2-3 sentence summary using Claude. Review and edit before saving.');
        }
      } else if (data.error) {
        setErrorMessage(data.error);
      }
    } catch (err: any) {
      console.error('Failed to generate description:', err);
      // Client-side fallback if server connection issue
      const techText = techUsed.length > 0 ? techUsed.join(', ') : 'modern engineering tools';
      const roleText = myRole ? `as ${myRole}` : 'as key contributor';
      const draft = `Contributed ${roleText} on ${name || 'the project'} (${context}), engineering core deliverables utilizing ${techText}. Addressed implementation requirements detailed in project notes to ensure reliable technical outcomes.`;
      setGeneratedDescription(draft);
      setAiNotice('Generated synthesized description draft. Review before saving.');
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Classification: Role, Tech Stack, and Skills Demonstrated from Raw Notes
  const handleClassifyFromNotes = async () => {
    setClassificationNotice(null);
    setErrorMessage(null);

    if (!rawNotes.trim()) {
      setErrorMessage('Please enter some project notes in "Raw Notes" to classify role, tech, and skills.');
      return;
    }

    setIsClassifying(true);
    try {
      const response = await fetch('/api/classify-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: rawNotes,
          projectName: name,
          currentRole: myRole,
          masterSkills,
        }),
      });

      const data = await response.json();

      if (data.role && !myRole.trim()) {
        setMyRole(data.role);
      } else if (data.role && myRole.trim()) {
        // If role was already filled, update only if user didn't have something very specific or allow easy overwrite
        setMyRole(data.role);
      }

      if (Array.isArray(data.techUsed) && data.techUsed.length > 0) {
        // Merge with existing tech, preventing duplicates case-insensitively
        const existingLower = new Set(techUsed.map((t) => t.toLowerCase()));
        const mergedTech = [...techUsed];
        for (const item of data.techUsed) {
          if (!existingLower.has(item.toLowerCase())) {
            mergedTech.push(item);
            existingLower.add(item.toLowerCase());
          }
        }
        setTechUsed(mergedTech);
      }

      if (Array.isArray(data.skills) && data.skills.length > 0) {
        // Merge skills list with depths
        const updatedSkills = [...skillsList];
        for (const item of data.skills) {
          const existingIdx = updatedSkills.findIndex(
            (s) => s.name.toLowerCase() === item.skillName.toLowerCase()
          );
          const validDepth: SkillDepth =
            item.depth === 'Architected' || item.depth === 'Used' || item.depth === 'Implemented'
              ? item.depth
              : 'Implemented';

          if (existingIdx >= 0) {
            // Upgrade depth if AI identified higher depth
            updatedSkills[existingIdx].depth = validDepth;
          } else {
            updatedSkills.push({
              name: item.skillName,
              depth: validDepth,
            });
          }
        }
        setSkillsList(updatedSkills);
      }

      const countSkills = data.skills?.length || 0;
      const countTech = data.techUsed?.length || 0;
      const roleText = data.role ? `Role set to "${data.role}". ` : '';
      setClassificationNotice(
        `AI successfully classified: ${roleText}Tagged ${countTech} tech tools and ${countSkills} skills with depth levels.`
      );
    } catch (err: any) {
      console.error('Failed to classify from notes:', err);
      setErrorMessage('Could not classify notes. Please check the network connection.');
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Project Name is required.');
      return;
    }

    const finalSkills = skillsList.map((item) => ({
      skillName: item.name.trim(),
      depth: item.depth,
    }));

    onSave({
      id: initialProject?.id,
      name: name.trim(),
      timeframe: {
        startMonth,
        startYear,
        endMonth: isOngoing ? undefined : endMonth,
        endYear: isOngoing ? undefined : endYear,
        isOngoing,
      },
      context,
      myRole: myRole.trim(),
      rawNotes: rawNotes.trim(),
      techUsed,
      skills: finalSkills,
      outcome: outcome.trim() || undefined,
      link: link.trim() || undefined,
      generatedDescription: generatedDescription.trim() || undefined,
    });

    onClose();
  };

  return (
    <div
      id="project-form-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="project-form-modal"
        className="w-full max-w-3xl my-8 bg-[#1E293B] border border-slate-700/80 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/70 bg-slate-900/60">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              {initialProject ? 'Edit Project' : 'Log New Project'}
            </h2>
            <p className="text-xs text-slate-400">
              Record project scope, tech stack, and demonstrated skills.
            </p>
          </div>
          <button
            id="close-project-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Project Name & Context */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="input-project-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                Project Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-project-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Real-Time Collaborative Workspace"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label htmlFor="select-project-context" className="block text-xs font-medium text-slate-300 mb-1.5">
                Context <span className="text-rose-400">*</span>
              </label>
              <select
                id="select-project-context"
                value={context}
                onChange={(e) => setContext(e.target.value as ProjectContext)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/70 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              >
                {CONTEXTS.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-slate-200">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Timeframe & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Timeframe
              </label>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex gap-1.5">
                    <select
                      value={startMonth}
                      onChange={(e) => setStartMonth(e.target.value)}
                      className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/70 text-xs text-slate-200 focus:border-indigo-500"
                    >
                      {MONTHS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={startYear}
                      onChange={(e) => setStartYear(e.target.value)}
                      className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/70 text-xs text-slate-200 focus:border-indigo-500"
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  {!isOngoing ? (
                    <div className="flex gap-1.5">
                      <select
                        value={endMonth}
                        onChange={(e) => setEndMonth(e.target.value)}
                        className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/70 text-xs text-slate-200 focus:border-indigo-500"
                      >
                        {MONTHS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={endYear}
                        onChange={(e) => setEndYear(e.target.value)}
                        className="w-1/2 px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/70 text-xs text-slate-200 focus:border-indigo-500"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center px-3 py-1.5 rounded-lg bg-slate-900/40 border border-slate-700/40 text-xs text-indigo-300 font-medium">
                      Ongoing
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                  <input
                    type="checkbox"
                    checked={isOngoing}
                    onChange={(e) => setIsOngoing(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-xs text-slate-400">Currently ongoing project</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="input-my-role" className="block text-xs font-medium text-slate-300 mb-1.5">
                My Role (Group/Individual)
              </label>
              <input
                id="input-my-role"
                type="text"
                value={myRole}
                onChange={(e) => setMyRole(e.target.value)}
                placeholder="e.g. Frontend Developer, Backend Lead"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Particularly helpful for defining ownership in team projects.
              </p>
            </div>
          </div>

          {/* Raw Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="textarea-raw-notes" className="block text-xs font-medium text-slate-300">
                Raw Notes (Free-form description of what you did)
              </label>
              <span className="text-[11px] text-slate-400">
                AI can auto-classify your role, tech, and skills
              </span>
            </div>
            <textarea
              id="textarea-raw-notes"
              rows={4}
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Jot down notes about what you engineered, challenges overcome, architectural decisions, protocols, algorithms, or responsibilities..."
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900/80 border border-slate-700/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-y"
            />

            {/* AI Classification Action Bar */}
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/40">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs text-slate-300">
                  Extract role, tech stack, and skills demonstrated from notes
                </span>
              </div>

              <button
                id="btn-classify-notes-ai"
                type="button"
                onClick={handleClassifyFromNotes}
                disabled={isClassifying || !rawNotes.trim()}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 transition-colors shadow-xs shrink-0"
              >
                {isClassifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Classifying with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto-Classify from Notes</span>
                  </>
                )}
              </button>
            </div>

            {classificationNotice && (
              <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-200 flex items-start gap-2 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{classificationNotice}</span>
                  <span className="block text-[11px] text-emerald-300/80 mt-0.5">
                    Review and adjust the tagged fields below before saving.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tech/Tools Used */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tech / Tools Used (Multi-select, free text allowed)
            </label>
            <TagInput
              id="tech-used-input"
              tags={techUsed}
              onChange={setTechUsed}
              placeholder="e.g. React, Node.js, Vite, WebSockets, Tailwind..."
              suggestions={['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'GraphQL', 'Python', 'AWS', 'Next.js', 'Express']}
            />
          </div>

          {/* AI Generate Description Section */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">
                  AI Project Summary Generator
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                  Claude Haiku 4.5
                </span>
              </div>

              <button
                id="btn-generate-ai-description"
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Description</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Produces a short 2–3 sentence portfolio-ready summary from your raw notes, tech stack, and role. Never auto-saved without your explicit review.
            </p>

            {aiNotice && (
              <div className="p-2 rounded bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>{aiNotice}</span>
              </div>
            )}

            <div>
              <label htmlFor="textarea-generated-description" className="block text-[11px] font-medium text-slate-400 mb-1">
                Editable Project Summary:
              </label>
              <textarea
                id="textarea-generated-description"
                rows={3}
                value={generatedDescription}
                onChange={(e) => setGeneratedDescription(e.target.value)}
                placeholder="Click 'Generate Description' above or type a 2-3 sentence summary manually..."
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Skills Demonstrated & Depth */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Skills Demonstrated &amp; Depth Level <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Shared across your portfolio master skill list
              </span>
            </div>

            <TagInput
              id="skills-demonstrated-input"
              tags={skillsList.map((s) => s.name)}
              onChange={handleSkillTagsChange}
              placeholder="Type a skill (e.g. React, System Design, REST APIs) and press Enter..."
              suggestions={masterSkills.map((s) => s.name)}
            />

            {/* Depth Selector for Each Tagged Skill */}
            {skillsList.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-medium text-slate-400 px-1">
                  Specify your depth for each tagged skill:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {skillsList.map((item, index) => (
                    <div
                      key={item.name}
                      className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-700/60 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {(['Used', 'Implemented', 'Architected'] as SkillDepth[]).map((depth) => {
                          const isSelected = item.depth === depth;
                          return (
                            <button
                              key={depth}
                              type="button"
                              onClick={() => handleDepthChange(index, depth)}
                              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                                isSelected
                                  ? depth === 'Architected'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : depth === 'Implemented'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                              }`}
                            >
                              {depth}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Outcome & Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-outcome" className="block text-xs font-medium text-slate-300 mb-1.5">
                Outcome / Impact (Optional)
              </label>
              <input
                id="input-outcome"
                type="text"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="e.g. Reduced render latency by 32%, piloted with 350+ users"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label htmlFor="input-link" className="block text-xs font-medium text-slate-300 mb-1.5">
                Link / Repository URL (Optional)
              </label>
              <input
                id="input-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://github.com/your-username/repo"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/70 bg-slate-900/70">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Skills are cross-referenced with your master roles gap analyzer.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="cancel-project-form-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-project-form-btn"
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-sm shadow-indigo-950 transition-colors"
            >
              {initialProject ? 'Save Changes' : 'Add Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
