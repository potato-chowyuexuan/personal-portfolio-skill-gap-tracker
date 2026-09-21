import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Briefcase,
  Layers,
  Menu,
  X,
  Target,
  FolderGit2,
  AlertTriangle
} from 'lucide-react';
import { Project, Role, Skill, ProjectContext, ProjectSaveInput, RoleGapAnalysisData, RoleSaveInput } from './types';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getSkills,
  getAllGapAnalyses,
  resetAllData,
} from './data/api';
import { Sidebar } from './components/Sidebar';
import { ProjectCard } from './components/ProjectCard';
import { ProjectFormModal } from './components/ProjectFormModal';
import { RolesList } from './components/RolesList';
import { RoleGapAnalysis } from './components/RoleGapAnalysis';
import { RoleFormModal } from './components/RoleFormModal';
import { ProjectHeatmap } from './components/ProjectHeatmap';

export default function App() {
  const [activeTab, setActiveTab] = useState<'projects' | 'roles'>('projects');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data State (backed by the Express + SQLite API)
  const [projects, setProjects] = useState<Project[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [masterSkills, setMasterSkills] = useState<Skill[]>([]);
  const [gapAnalyses, setGapAnalyses] = useState<RoleGapAnalysisData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected Role for Gap Analysis view
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Project Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [preselectedSkill, setPreselectedSkill] = useState<string | undefined>(undefined);

  // Role Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Project Filtering & Searching
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedContext, setSelectedContext] = useState<'ALL' | ProjectContext>('ALL');

  // Load initial data from the backend API on mount
  useEffect(() => {
    let cancelled = false;
    Promise.all([getProjects(), getRoles(), getSkills(), getAllGapAnalyses()])
      .then(([loadedProjects, loadedRoles, loadedSkills, loadedAnalyses]) => {
        if (cancelled) return;
        setProjects(loadedProjects);
        setRoles(loadedRoles);
        setMasterSkills(loadedSkills);
        setGapAnalyses(loadedAnalyses);
        setIsLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load data from backend:', err);
        setLoadError('Could not reach the server. Make sure the backend is running and refresh the page.');
        setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-fetches projects, roles, skills, and gap analyses together so every
  // view stays consistent with the database after a mutation.
  const refreshAll = useCallback(async () => {
    const [loadedProjects, loadedRoles, loadedSkills, loadedAnalyses] = await Promise.all([
      getProjects(),
      getRoles(),
      getSkills(),
      getAllGapAnalyses(),
    ]);
    setProjects(loadedProjects);
    setRoles(loadedRoles);
    setMasterSkills(loadedSkills);
    setGapAnalyses(loadedAnalyses);
  }, []);

  // Project Handlers
  const handleSaveProject = async (projectData: ProjectSaveInput) => {
    try {
      if (projectData.id) {
        await updateProject(projectData.id, projectData);
      } else {
        await createProject(projectData);
      }
      await refreshAll();
    } catch (err: any) {
      console.error('Failed to save project:', err);
      window.alert(err.message || 'Failed to save project. Please try again.');
    }
    setEditingProject(null);
    setPreselectedSkill(undefined);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteProject(projectId);
      await refreshAll();
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      window.alert(err.message || 'Failed to delete project. Please try again.');
    }
  };

  const handleOpenAddProject = (initialSkill?: string) => {
    setEditingProject(null);
    setPreselectedSkill(initialSkill);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (project: Project) => {
    setEditingProject(project);
    setPreselectedSkill(undefined);
    setIsProjectModalOpen(true);
  };

  // Role Handlers
  const handleSaveRole = async (roleData: RoleSaveInput) => {
    try {
      if (roleData.id) {
        await updateRole(roleData.id, roleData);
      } else {
        await createRole(roleData);
      }
      await refreshAll();
    } catch (err: any) {
      console.error('Failed to save role:', err);
      window.alert(err.message || 'Failed to save role. Please try again.');
    }
    setEditingRole(null);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this target role?')) return;
    try {
      await deleteRole(roleId);
      await refreshAll();
      if (selectedRoleId === roleId) {
        setSelectedRoleId(null);
      }
    } catch (err: any) {
      console.error('Failed to delete role:', err);
      window.alert(err.message || 'Failed to delete role. Please try again.');
    }
  };

  const handleOpenAddRole = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: Role) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleResetData = async () => {
    try {
      const reset = await resetAllData();
      setProjects(reset.projects);
      setRoles(reset.roles);
      setMasterSkills(reset.skills);
      setSelectedRoleId(null);
      const analyses = await getAllGapAnalyses();
      setGapAnalyses(analyses);
    } catch (err: any) {
      console.error('Failed to reset data:', err);
      window.alert(err.message || 'Failed to reset data. Please try again.');
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    if (selectedContext !== 'ALL' && project.context !== selectedContext) {
      return false;
    }

    if (projectSearch.trim()) {
      const q = projectSearch.toLowerCase();
      const matchName = project.name.toLowerCase().includes(q);
      const matchRole = project.myRole.toLowerCase().includes(q);
      const matchNotes = project.rawNotes.toLowerCase().includes(q);
      const matchDesc = project.generatedDescription?.toLowerCase().includes(q);
      const matchTech = project.techUsed?.some((t) => t.toLowerCase().includes(q));
      const matchSkill = project.skills.some((s) => s.skillName.toLowerCase().includes(q));
      return matchName || matchRole || matchNotes || matchDesc || matchTech || matchSkill;
    }

    return true;
  });

  const CONTEXT_OPTIONS: Array<'ALL' | ProjectContext> = [
    'ALL',
    'School Coursework',
    'Personal Project',
    'Internship',
    'Hackathon',
    'Team Project',
  ];

  const selectedAnalysis = selectedRoleId
    ? gapAnalyses.find((a) => a.role.id === selectedRoleId) || null
    : null;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-slate-400">
        Loading portfolio...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#E2E8F0] flex flex-col md:flex-row antialiased">
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden bg-[#1E293B] border-b border-slate-700/60 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-slate-100">Portfolio &amp; Skill Gap</h1>
            <p className="text-[11px] text-slate-400">
              {activeTab === 'projects' ? 'Projects Tab' : 'Roles Tab'}
            </p>
          </div>
        </div>

        <button
          id="mobile-nav-toggle-btn"
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar (Desktop permanent, Mobile collapsible) */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block shrink-0`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
            if (tab === 'roles') {
              // keep selectedRole or reset
            }
          }}
          projectCount={projects.length}
          roleCount={roles.length}
          skillCount={masterSkills.length}
          onResetData={handleResetData}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {loadError && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-sm text-rose-300 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* TAB 1: PROJECTS */}
        {activeTab === 'projects' && (
          <div id="projects-view" className="space-y-6">
            {/* Top Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
                  <FolderGit2 className="w-6 h-6 text-indigo-400" />
                  <span>Projects</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Log your engineering milestones, tag demonstrated skills, and synthesize summaries.
                </p>
              </div>

              <button
                id="btn-add-project-top"
                type="button"
                onClick={() => handleOpenAddProject()}
                className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-medium flex items-center gap-2 self-start sm:self-auto shadow-sm shadow-indigo-950 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Project</span>
              </button>
            </div>

            {/* Contribution-Style Project Activity Heatmap */}
            <ProjectHeatmap projects={projects} />

            {/* Filter & Search Bar */}
            <div className="bg-[#1E293B] p-3 sm:p-4 rounded-xl border border-slate-700/60 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    id="project-search-input"
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Search by project name, tech stack, role, or skill..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {projectSearch && (
                    <button
                      type="button"
                      onClick={() => setProjectSearch('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 self-center">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    Showing <strong className="text-slate-200">{filteredProjects.length}</strong> of{' '}
                    {projects.length}
                  </span>
                </div>
              </div>

              {/* Context Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1 shrink-0">
                  <Filter className="w-3 h-3" /> Context:
                </span>
                {CONTEXT_OPTIONS.map((ctx) => (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => setSelectedContext(ctx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedContext === ctx
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/70'
                    }`}
                  >
                    {ctx === 'ALL' ? 'All Contexts' : ctx}
                  </button>
                ))}
              </div>
            </div>

            {/* Project List Cards */}
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-[#1E293B] border border-slate-700/60 text-slate-400 space-y-3">
                <FolderGit2 className="w-10 h-10 mx-auto text-slate-500" />
                <h3 className="text-base font-semibold text-slate-200">No Projects Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {projectSearch || selectedContext !== 'ALL'
                    ? 'No projects match your search or filter. Try clearing filters.'
                    : 'Get started by documenting your coursework, personal projects, or internships.'}
                </p>
                {projectSearch || selectedContext !== 'ALL' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setProjectSearch('');
                      setSelectedContext('ALL');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenAddProject()}
                    className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500"
                  >
                    + Add First Project
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleOpenEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ROLES & GAP ANALYSIS */}
        {activeTab === 'roles' && (
          <div id="roles-view">
            {selectedAnalysis ? (
              <RoleGapAnalysis
                analysis={selectedAnalysis}
                onBack={() => setSelectedRoleId(null)}
                onEditRole={handleOpenEditRole}
                onDeleteRole={handleDeleteRole}
                onAddProjectWithSkill={(skillName) => {
                  setActiveTab('projects');
                  handleOpenAddProject(skillName);
                }}
              />
            ) : (
              <RolesList
                roles={roles}
                analyses={gapAnalyses}
                onSelectRole={(role) => setSelectedRoleId(role.id)}
                onAddRole={handleOpenAddRole}
                onEditRole={handleOpenEditRole}
                onDeleteRole={handleDeleteRole}
              />
            )}
          </div>
        )}
      </main>

      {/* Project Form Modal (Add & Edit) */}
      <ProjectFormModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
          setPreselectedSkill(undefined);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject}
        masterSkills={masterSkills}
        initialPreselectedSkill={preselectedSkill}
      />

      {/* Role Form Modal (Add & Edit) */}
      <RoleFormModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setEditingRole(null);
        }}
        onSave={handleSaveRole}
        initialRole={editingRole}
        masterSkills={masterSkills}
      />
    </div>
  );
}
