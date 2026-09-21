import React from 'react';
import { FolderGit2, Target, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { DEFAULT_USER_ID } from '../data/initialData';

interface SidebarProps {
  activeTab: 'projects' | 'roles';
  setActiveTab: (tab: 'projects' | 'roles') => void;
  projectCount: number;
  roleCount: number;
  skillCount: number;
  onResetData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  projectCount,
  roleCount,
  skillCount,
  onResetData,
}) => {
  return (
    <aside
      id="app-sidebar"
      className="w-full md:w-64 lg:w-72 bg-[#1E293B] border-b md:border-b-0 md:border-r border-slate-700/60 flex flex-col justify-between shrink-0 select-none"
    >
      {/* Top Branding */}
      <div className="p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-100 text-sm md:text-base leading-snug">
              Portfolio &amp; Skill Gap
            </h1>
            <p className="text-xs text-slate-400">Personal Career Tracker</p>
          </div>
        </div>

        {/* User Identity / Multi-tenant Notice */}
        <div className="mt-4 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/40 text-xs flex items-center justify-between text-slate-400">
          <span className="truncate">User: <code className="text-indigo-300 font-mono text-[11px]">{DEFAULT_USER_ID.slice(0, 11)}...</code></span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 text-[10px] font-medium border border-indigo-800/50">
            MVP
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-6 space-y-1.5" aria-label="Main Navigation">
          <button
            id="tab-projects-btn"
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'projects'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                : 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderGit2 className="w-4 h-4 shrink-0" />
              <span>Projects</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activeTab === 'projects'
                  ? 'bg-indigo-700/70 text-indigo-100'
                  : 'bg-slate-800 text-slate-400 border border-slate-700/50'
              }`}
            >
              {projectCount}
            </span>
          </button>

          <button
            id="tab-roles-btn"
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'roles'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950'
                : 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 shrink-0" />
              <span>Roles &amp; Gaps</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                activeTab === 'roles'
                  ? 'bg-indigo-700/70 text-indigo-100'
                  : 'bg-slate-800 text-slate-400 border border-slate-700/50'
              }`}
            >
              {roleCount}
            </span>
          </button>
        </nav>
      </div>

      {/* Bottom Master Skills Summary & Reset */}
      <div className="p-5 border-t border-slate-700/60 bg-slate-900/40">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Shared Master Skills</span>
          </div>
          <span className="font-semibold text-slate-200">{skillCount}</span>
        </div>

        <button
          id="btn-reset-sample-data"
          type="button"
          onClick={() => {
            if (window.confirm('Reset portfolio and roles to sample demonstration data?')) {
              onResetData();
            }
          }}
          className="w-full text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 py-2 rounded-md hover:bg-slate-800/80 transition-colors border border-slate-700/30"
          title="Restore original sample projects and target roles"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Sample Data</span>
        </button>
      </div>
    </aside>
  );
};
