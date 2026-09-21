import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Edit3,
  Trash2,
  Plus,
  Briefcase,
  Layers,
  Calendar,
  User,
  Info,
  Building2,
  FileText,
  Star,
  Circle
} from 'lucide-react';
import { Role, RoleGapAnalysisData, SkillGapStatus, SkillDepth, ProjectRecommendationTier } from '../types';
import { getApplicationStatusBadge } from './RolesList';

const getTierMeta = (tier: ProjectRecommendationTier) => {
  switch (tier) {
    case 'Tier 1':
      return {
        label: 'Tier 1 — Must include',
        icon: <Star className="w-3.5 h-3.5" />,
        classes: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60',
      };
    case 'Tier 2':
      return {
        label: 'Tier 2 — Include if space allows',
        icon: <Layers className="w-3.5 h-3.5" />,
        classes: 'bg-amber-950/70 text-amber-400 border-amber-800/60',
      };
    case 'Tier 3':
    default:
      return {
        label: 'Tier 3 — Optional / cut first',
        icon: <Circle className="w-3.5 h-3.5" />,
        classes: 'bg-slate-800/70 text-slate-400 border-slate-700/60',
      };
  }
};

const getSkillChipClasses = (status: SkillGapStatus) => {
  switch (status) {
    case 'Covered':
      return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50';
    case 'Partial':
      return 'bg-amber-950/60 text-amber-300 border-amber-800/50';
    case 'Missing':
    default:
      return 'bg-rose-950/60 text-rose-300 border-rose-800/50';
  }
};

interface RoleGapAnalysisProps {
  analysis: RoleGapAnalysisData;
  onBack: () => void;
  onEditRole: (role: Role) => void;
  onDeleteRole: (roleId: string) => void;
  onAddProjectWithSkill: (skillName: string) => void;
}

export const RoleGapAnalysis: React.FC<RoleGapAnalysisProps> = ({
  analysis,
  onBack,
  onEditRole,
  onDeleteRole,
  onAddProjectWithSkill,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | SkillGapStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const role = analysis.role;
  const recommendedProjects = analysis.recommendedProjects || [];

  // Filter skills by status and search
  const filteredItems = analysis.items.filter((item) => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      return item.skillName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getStatusBadge = (status: SkillGapStatus) => {
    switch (status) {
      case 'Covered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Covered</span>
          </span>
        );
      case 'Partial':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/70 text-amber-400 border border-amber-800/60">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Partial</span>
          </span>
        );
      case 'Missing':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/70 text-rose-400 border border-rose-800/60">
            <XCircle className="w-3.5 h-3.5" />
            <span>Missing</span>
          </span>
        );
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
    <div id="role-gap-analysis-view" className="space-y-6">
      {/* Top Navigation & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-roles"
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            title="Back to all roles"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100">{role.name}</h2>
              {role.company && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-indigo-300 border border-slate-700">
                  <Building2 className="w-3 h-3 text-indigo-400" />
                  <span>{role.company}</span>
                </span>
              )}
              {getApplicationStatusBadge(role.applicationStatus)}
            </div>

            {/* Application Date & Resume Used subline */}
            {(role.appliedDate || role.resumeUsed) && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                {role.appliedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Applied on: <strong className="text-slate-200 font-medium">{role.appliedDate}</strong></span>
                  </span>
                )}
                {role.resumeUsed && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Resume: <strong className="text-indigo-300 font-medium">{role.resumeUsed}</strong></span>
                  </span>
                )}
              </div>
            )}

            {role.notes && (
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">{role.notes}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            id="btn-edit-current-role"
            type="button"
            onClick={() => onEditRole(role)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Skills</span>
          </button>
          <button
            id="btn-delete-current-role"
            type="button"
            onClick={() => onDeleteRole(role.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/60 hover:border-rose-800/60 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Role</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Readiness % */}
        <div className="p-4 rounded-xl bg-[#1E293B] border border-slate-700/60">
          <div className="text-xs text-slate-400 font-medium">Readiness Index</div>
          <div className="mt-1 text-2xl font-bold text-slate-100 flex items-baseline gap-1">
            <span>{analysis.coveragePercentage}%</span>
            <span className="text-xs font-normal text-slate-400">weighted</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(analysis.coveragePercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Covered Count */}
        <div className="p-4 rounded-xl bg-[#1E293B] border border-emerald-900/40">
          <div className="text-xs text-emerald-400/90 font-medium flex items-center justify-between">
            <span>Covered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-300">
            {analysis.coveredCount}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              / {analysis.totalRequired}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Demonstrated in projects</p>
        </div>

        {/* Partial Count */}
        <div className="p-4 rounded-xl bg-[#1E293B] border border-amber-900/40">
          <div className="text-xs text-amber-400/90 font-medium flex items-center justify-between">
            <span>Partial</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-300">
            {analysis.partialCount}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              / {analysis.totalRequired}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Exposure at "Used" depth</p>
        </div>

        {/* Missing Count */}
        <div className="p-4 rounded-xl bg-[#1E293B] border border-rose-900/40">
          <div className="text-xs text-rose-400/90 font-medium flex items-center justify-between">
            <span>Missing</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-1 text-2xl font-bold text-rose-300">
            {analysis.missingCount}
            <span className="text-xs font-normal text-slate-400 ml-1.5">
              / {analysis.totalRequired}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Zero project records</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1E293B] p-2.5 rounded-xl border border-slate-700/60">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Skills ({analysis.totalRequired})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Covered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filterStatus === 'Covered'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Covered ({analysis.coveredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Partial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filterStatus === 'Partial'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Partial ({analysis.partialCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('Missing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filterStatus === 'Missing'
                ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Missing ({analysis.missingCount})
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter required skills..."
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 sm:w-56"
        />
      </div>

      {/* Gap Analysis Skills List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#1E293B] border border-slate-700/60 text-slate-400">
            <p className="text-sm">No skills found matching your filter criteria.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.skillName}
              id={`gap-item-${item.skillName.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-[#1E293B] border border-slate-700/60 rounded-xl p-4 sm:p-5 transition-colors"
            >
              {/* Skill Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-700/40">
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-slate-100">
                    {item.skillName}
                  </span>
                  {getStatusBadge(item.status)}
                  {item.highestDepth && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      Highest depth: {getDepthBadge(item.highestDepth)}
                    </span>
                  )}
                </div>

                {item.status === 'Missing' && (
                  <button
                    type="button"
                    onClick={() => onAddProjectWithSkill(item.skillName)}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Project with this Skill</span>
                  </button>
                )}
              </div>

              {/* Projects Demonstrating This Skill */}
              <div className="mt-3">
                {item.demonstratedProjects.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[11px] font-medium text-slate-400">
                      Demonstrated in {item.demonstratedProjects.length}{' '}
                      {item.demonstratedProjects.length === 1 ? 'project' : 'projects'}:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.demonstratedProjects.map((p) => (
                        <div
                          key={p.projectId}
                          className="p-3 rounded-lg bg-slate-900/70 border border-slate-700/50 flex flex-col justify-between gap-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200 leading-snug">
                              {p.projectName}
                            </span>
                            {getDepthBadge(p.depth)}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/40">
                              {p.context}
                            </span>
                            {p.myRole && (
                              <span className="flex items-center gap-1 text-slate-400">
                                <User className="w-3 h-3 text-indigo-400" />
                                <span>{p.myRole}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-slate-400">
                              <Calendar className="w-3 h-3" />
                              <span>{p.timeframeString}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-2 flex items-center gap-2 text-xs text-rose-300/80 bg-rose-950/20 px-3 rounded-lg border border-rose-900/30">
                    <Info className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>
                      Not demonstrated in any portfolio project yet. Consider targeting this skill in an upcoming coursework or personal project.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recommended Projects for This Application */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-1">
          <Star className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-slate-100">Recommended projects for this application</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Ranked by skill overlap, depth, and recency against {role.name}&apos;s requirements.
        </p>

        {recommendedProjects.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-[#1E293B] border border-slate-700/60 text-slate-400 text-xs">
            None of your logged projects tag any of this role&apos;s required skills yet.
          </div>
        ) : (
          <div className="space-y-5">
            {(['Tier 1', 'Tier 2', 'Tier 3'] as const).map((tier) => {
              const inTier = recommendedProjects.filter((p) => p.tier === tier);
              if (inTier.length === 0) return null;
              const meta = getTierMeta(tier);

              return (
                <div key={tier}>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border mb-2.5 ${meta.classes}`}
                  >
                    {meta.icon}
                    <span>{meta.label}</span>
                  </span>
                  <div className="space-y-2.5 mt-2.5">
                    {inTier.map((p) => (
                      <div
                        key={p.projectId}
                        id={`recommended-project-${p.projectId}`}
                        className="bg-[#1E293B] border border-slate-700/60 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-100">{p.projectName}</span>
                          <span className="text-[11px] text-slate-500 shrink-0" title="Weighted relevance score">
                            Score: {p.score}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">{p.reason}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {p.contributingSkills.map((s) => (
                            <span
                              key={s.skillName}
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${getSkillChipClasses(s.status)}`}
                            >
                              {s.skillName} · {s.depth}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
