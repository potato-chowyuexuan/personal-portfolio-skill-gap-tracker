import React, { useState } from 'react';
import {
  Target,
  Plus,
  ChevronRight,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Calendar,
  FileText,
  Clock,
  CheckCheck,
  Send,
  Filter
} from 'lucide-react';
import { Role, RoleGapAnalysisData, ApplicationStatus } from '../types';

interface RolesListProps {
  roles: Role[];
  analyses: RoleGapAnalysisData[];
  onSelectRole: (role: Role) => void;
  onAddRole: () => void;
  onEditRole: (role: Role) => void;
  onDeleteRole: (roleId: string) => void;
}

export const getApplicationStatusBadge = (status?: ApplicationStatus) => {
  const current = status || 'Not Applied';
  switch (current) {
    case 'Applied':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-950/70 text-blue-300 border border-blue-800/60">
          <Send className="w-3 h-3" />
          <span>Applied</span>
        </span>
      );
    case 'Interviewing':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/70 text-amber-300 border border-amber-800/60">
          <Clock className="w-3 h-3" />
          <span>Interviewing</span>
        </span>
      );
    case 'Offered':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
          <CheckCheck className="w-3 h-3" />
          <span>Offered</span>
        </span>
      );
    case 'Rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
          <XCircle className="w-3 h-3" />
          <span>Rejected</span>
        </span>
      );
    case 'Not Applied':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-900/90 text-slate-400 border border-slate-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <span>Not Applied</span>
        </span>
      );
  }
};

const EMPTY_ANALYSIS = {
  totalRequired: 0,
  coveredCount: 0,
  partialCount: 0,
  missingCount: 0,
  coveragePercentage: 0,
};

export const RolesList: React.FC<RolesListProps> = ({
  roles,
  analyses,
  onSelectRole,
  onAddRole,
  onEditRole,
  onDeleteRole,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApplicationStatus>('ALL');

  const filteredRoles = roles.filter((role) => {
    if (statusFilter === 'ALL') return true;
    const roleStatus = role.applicationStatus || 'Not Applied';
    return roleStatus === statusFilter;
  });

  const appliedCount = roles.filter((r) => r.applicationStatus && r.applicationStatus !== 'Not Applied').length;

  return (
    <div id="roles-list-container" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Target className="w-6 h-6 text-indigo-400" />
            <span>Target Roles & Applications</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track job applications by company, submission date, and resume used, while auditing skill gaps against your project history.
          </p>
        </div>

        <button
          id="btn-add-role-main"
          type="button"
          onClick={onAddRole}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-medium flex items-center gap-2 self-start sm:self-auto shadow-sm shadow-indigo-950 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Target Role</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      {roles.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1E293B] p-3 rounded-xl border border-slate-700/60 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300 font-medium">Application Status:</span>
            <div className="flex flex-wrap gap-1.5">
              {(['ALL', 'Not Applied', 'Applied', 'Interviewing', 'Offered', 'Rejected'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {st}
                  {st === 'ALL' && ` (${roles.length})`}
                </button>
              ))}
            </div>
          </div>

          <div className="text-slate-400 text-[11px]">
            <span className="font-semibold text-slate-200">{appliedCount}</span> of {roles.length} active applications submitted
          </div>
        </div>
      )}

      {/* Roles Grid / List */}
      {roles.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[#1E293B] border border-slate-700/60 text-slate-400 space-y-3">
          <Target className="w-10 h-10 mx-auto text-slate-500" />
          <h3 className="text-base font-semibold text-slate-200">No Target Roles Defined</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add a target role such as "Frontend Intern at Stripe" to track application status, resume version, and audit skill requirements against your project portfolio.
          </p>
          <button
            type="button"
            onClick={onAddRole}
            className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors"
          >
            + Add First Role
          </button>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#1E293B] border border-slate-700/60 text-slate-400 space-y-2">
          <p className="text-sm text-slate-300">No roles matching status "{statusFilter}"</p>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"
          >
            Show All Roles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRoles.map((role) => {
            const analysis = analyses.find((a) => a.role.id === role.id) || EMPTY_ANALYSIS;

            return (
              <div
                key={role.id}
                id={`role-card-${role.id}`}
                className="bg-[#1E293B] border border-slate-700/60 hover:border-slate-600/80 rounded-xl p-5 flex flex-col justify-between gap-4 transition-all shadow-sm group"
              >
                <div>
                  {/* Company & Status Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {role.company ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/90 text-indigo-300 border border-slate-700 text-xs font-medium truncate">
                          <Building2 className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">{role.company}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No company assigned</span>
                      )}
                    </div>
                    {getApplicationStatusBadge(role.applicationStatus)}
                  </div>

                  {/* Title and Top Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {role.name}
                      </h3>
                      {role.notes && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {role.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        id={`btn-edit-role-${role.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRole(role);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
                        title="Edit Role & Application Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        id={`btn-delete-role-${role.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRole(role.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Application Details Strip: Date Applied & Resume Used */}
                  {(role.appliedDate || role.resumeUsed) && (
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-slate-300">
                      {role.appliedDate && (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-400">Applied:</span>
                          <span className="font-medium text-slate-200">{role.appliedDate}</span>
                        </div>
                      )}
                      {role.resumeUsed && (
                        <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-400 shrink-0">Resume:</span>
                          <span className="font-medium text-indigo-300 truncate" title={role.resumeUsed}>
                            {role.resumeUsed}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Readiness Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Readiness Index</span>
                      <span className="font-semibold text-slate-200">
                        {analysis.coveragePercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-2 transition-all duration-500"
                        style={{
                          width: `${(analysis.coveredCount / (analysis.totalRequired || 1)) * 100}%`,
                        }}
                        title={`Covered: ${analysis.coveredCount}`}
                      />
                      <div
                        className="bg-amber-500 h-2 transition-all duration-500"
                        style={{
                          width: `${(analysis.partialCount / (analysis.totalRequired || 1)) * 100}%`,
                        }}
                        title={`Partial: ${analysis.partialCount}`}
                      />
                      <div
                        className="bg-rose-500/60 h-2 transition-all duration-500"
                        style={{
                          width: `${(analysis.missingCount / (analysis.totalRequired || 1)) * 100}%`,
                        }}
                        title={`Missing: ${analysis.missingCount}`}
                      />
                    </div>
                  </div>

                  {/* Breakdown Pills */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" />
                      {analysis.coveredCount} Covered
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40 text-[11px]">
                      <AlertTriangle className="w-3 h-3" />
                      {analysis.partialCount} Partial
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 border border-rose-800/40 text-[11px]">
                      <XCircle className="w-3 h-3" />
                      {analysis.missingCount} Missing
                    </span>
                    <span className="text-[11px] text-slate-400 ml-auto">
                      {analysis.totalRequired} Required Skills
                    </span>
                  </div>

                  {/* Skills Snapshot */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {role.requiredSkillNames.slice(0, 5).map((skillName) => (
                      <span
                        key={skillName}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-700/50"
                      >
                        {skillName}
                      </span>
                    ))}
                    {role.requiredSkillNames.length > 5 && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900/40 text-slate-500 border border-slate-700/30">
                        +{role.requiredSkillNames.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* View Gap Analysis Button */}
                <button
                  id={`btn-open-gap-analysis-${role.id}`}
                  type="button"
                  onClick={() => onSelectRole(role)}
                  className="w-full mt-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-700/70 hover:border-indigo-500/40 text-xs font-medium flex items-center justify-between transition-all"
                >
                  <span>View Gap Analysis</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
