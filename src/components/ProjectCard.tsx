import React, { useState } from 'react';
import { ExternalLink, Calendar, User, ChevronDown, ChevronUp, Edit3, Trash2, Award, Wrench } from 'lucide-react';
import { Project, SkillDepth } from '../types';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete }) => {
  const [showRawNotes, setShowRawNotes] = useState(false);

  // Format timeframe
  const tf = project.timeframe;
  const startStr = `${tf.startMonth} ${tf.startYear}`.trim();
  const endStr = tf.isOngoing ? 'Ongoing' : (tf.endMonth && tf.endYear ? `${tf.endMonth} ${tf.endYear}` : '');
  const timeframeDisplay = endStr ? `${startStr} – ${endStr}` : startStr;

  // Context pill colors
  const getContextBadgeClass = (ctx: string) => {
    switch (ctx) {
      case 'Internship':
        return 'bg-purple-950/60 text-purple-300 border-purple-800/50';
      case 'Personal Project':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50';
      case 'School Coursework':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/50';
      case 'Hackathon':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/50';
      case 'Team Project':
      default:
        return 'bg-teal-950/60 text-teal-300 border-teal-800/50';
    }
  };

  const getDepthBadge = (depth: SkillDepth) => {
    switch (depth) {
      case 'Architected':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
            Architected
          </span>
        );
      case 'Implemented':
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            Implemented
          </span>
        );
      case 'Used':
      default:
        return (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-950/80 text-amber-300 border border-amber-800/60">
            Used
          </span>
        );
    }
  };

  return (
    <article
      id={`project-card-${project.id}`}
      className="bg-[#1E293B] border border-slate-700/60 hover:border-slate-600/80 rounded-xl p-5 md:p-6 transition-all shadow-sm"
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-700/40">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${getContextBadgeClass(
                project.context
              )}`}
            >
              {project.context}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{timeframeDisplay}</span>
            </div>
            {project.myRole && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-300">
                <User className="w-3.5 h-3.5" />
                <span>{project.myRole}</span>
              </div>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-slate-100 flex items-center gap-2">
            <span>{project.name}</span>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-indigo-400 transition-colors"
                title="Open Project Link / Repo"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </h3>
        </div>

        {/* Card Actions */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <button
            id={`btn-edit-project-${project.id}`}
            type="button"
            onClick={() => onEdit(project)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
            title="Edit Project"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            id={`btn-delete-project-${project.id}`}
            type="button"
            onClick={() => onDelete(project.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Project Description (Summary) */}
      {project.generatedDescription ? (
        <div className="mt-3.5 text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-3.5 rounded-lg border border-slate-700/30">
          <p>{project.generatedDescription}</p>
        </div>
      ) : project.rawNotes ? (
        <div className="mt-3.5 text-sm text-slate-300 leading-relaxed">
          <p>{project.rawNotes}</p>
        </div>
      ) : null}

      {/* Outcome / Impact */}
      {project.outcome && (
        <div className="mt-3 flex items-start gap-2 text-xs text-emerald-300/90 bg-emerald-950/30 border border-emerald-800/30 px-3 py-2 rounded-lg">
          <Award className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>
            <strong className="font-semibold text-emerald-300">Outcome:</strong> {project.outcome}
          </span>
        </div>
      )}

      {/* Demonstrated Skills with Depth */}
      <div className="mt-4">
        <div className="text-xs font-semibold text-slate-400 mb-2">
          Demonstrated Skills ({project.skills.length})
        </div>
        <div className="flex flex-wrap gap-2">
          {project.skills.map((s, idx) => (
            <div
              key={`${s.skillName}-${idx}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-900/80 border border-slate-700/60 text-slate-200"
            >
              <span>{s.skillName}</span>
              {getDepthBadge(s.depth)}
            </div>
          ))}
        </div>
      </div>

      {/* Tech / Tools Used */}
      {project.techUsed && project.techUsed.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Wrench className="w-3 h-3 text-slate-500" />
            <span>Tech &amp; Tools</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {project.techUsed.map((tech, idx) => (
              <span
                key={`${tech}-${idx}`}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/40"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible Raw Notes (if generatedDescription exists) */}
      {project.generatedDescription && project.rawNotes && (
        <div className="mt-4 pt-3 border-t border-slate-700/40">
          <button
            type="button"
            onClick={() => setShowRawNotes(!showRawNotes)}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
          >
            <span>{showRawNotes ? 'Hide Raw Notes' : 'View Raw Notes'}</span>
            {showRawNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showRawNotes && (
            <div className="mt-2 p-3 rounded-lg bg-slate-900/80 border border-slate-700/50 text-xs text-slate-300 font-mono whitespace-pre-wrap">
              {project.rawNotes}
            </div>
          )}
        </div>
      )}
    </article>
  );
};
