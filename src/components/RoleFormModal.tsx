import React, { useState, useEffect } from 'react';
import { X, Target, Info, AlertCircle, Building2, FileText, Calendar, Send } from 'lucide-react';
import { Role, RoleSaveInput, Skill, ApplicationStatus } from '../types';
import { TagInput } from './TagInput';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: RoleSaveInput) => void;
  initialRole?: Role | null;
  masterSkills: Skill[];
}

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'Not Applied',
  'Applied',
  'Interviewing',
  'Offered',
  'Rejected',
];

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRole,
  masterSkills,
}) => {
  const [name, setName] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [company, setCompany] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>('Not Applied');
  const [appliedDate, setAppliedDate] = useState('');
  const [resumeUsed, setResumeUsed] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialRole) {
      setName(initialRole.name);
      setRequiredSkills(initialRole.requiredSkillNames || []);
      setNotes(initialRole.notes || '');
      setCompany(initialRole.company || '');
      setApplicationStatus(initialRole.applicationStatus || 'Not Applied');
      setAppliedDate(initialRole.appliedDate || '');
      setResumeUsed(initialRole.resumeUsed || '');
    } else {
      setName('');
      setRequiredSkills([]);
      setNotes('');
      setCompany('');
      setApplicationStatus('Not Applied');
      setAppliedDate('');
      setResumeUsed('');
    }
    setErrorMessage(null);
  }, [initialRole, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Role name is required (e.g. Frontend Intern).');
      return;
    }

    if (requiredSkills.length === 0) {
      setErrorMessage('Please add at least one required skill for gap auditing.');
      return;
    }

    onSave({
      id: initialRole?.id,
      name: name.trim(),
      requiredSkillNames: requiredSkills,
      notes: notes.trim() || undefined,
      company: company.trim() || undefined,
      applicationStatus,
      appliedDate: applicationStatus !== 'Not Applied' ? appliedDate || undefined : undefined,
      resumeUsed: resumeUsed.trim() || undefined,
    });

    onClose();
  };

  return (
    <div
      id="role-form-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="role-form-modal"
        className="w-full max-w-xl my-8 bg-[#1E293B] border border-slate-700/80 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/70 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {initialRole ? 'Edit Target Role & Application' : 'Add Target Role & Application'}
              </h2>
              <p className="text-xs text-slate-400">
                Specify requirements, company target, and track your application status.
              </p>
            </div>
          </div>
          <button
            id="close-role-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Role Title and Target Company Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-role-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                Role Title <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-role-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Frontend Intern, Full Stack SWE"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            <div>
              <label htmlFor="input-role-company" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Company</span>
              </label>
              <input
                id="input-role-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe, Figma, Google, Startup"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>
          </div>

          {/* Application Tracking Section */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/70 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                <span>Application Tracker</span>
              </div>
              <span className="text-[11px] text-slate-400">Track stage and application date</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Application Status */}
              <div>
                <label htmlFor="select-application-status" className="block text-[11px] font-medium text-slate-300 mb-1">
                  Application Status
                </label>
                <select
                  id="select-application-status"
                  value={applicationStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value as ApplicationStatus;
                    setApplicationStatus(newStatus);
                    if (newStatus !== 'Not Applied' && !appliedDate) {
                      setAppliedDate(new Date().toISOString().split('T')[0]);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Applied */}
              <div>
                <label htmlFor="input-applied-date" className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Date Applied</span>
                  {applicationStatus === 'Not Applied' && (
                    <span className="text-slate-500 text-[10px] font-normal">(optional)</span>
                  )}
                </label>
                <input
                  id="input-applied-date"
                  type="date"
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Resume Used */}
            <div>
              <label htmlFor="input-resume-used" className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Resume Used / Tailored Version</span>
              </label>
              <input
                id="input-resume-used"
                type="text"
                value={resumeUsed}
                onChange={(e) => setResumeUsed(e.target.value)}
                placeholder="e.g. Frontend_SWE_Resume_v3.pdf, React_Tailored_2026.pdf"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                Record which resume variation you submitted for this company role.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Required Skills <span className="text-rose-400">*</span>
            </label>
            <TagInput
              id="role-required-skills-input"
              tags={requiredSkills}
              onChange={setRequiredSkills}
              placeholder="Type required skill (e.g. React, SQL, TypeScript) and press Enter..."
              suggestions={masterSkills.map((s) => s.name)}
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Matched against your logged projects to measure Covered, Partial, or Missing gaps.
            </p>
          </div>

          <div>
            <label htmlFor="textarea-role-notes" className="block text-xs font-medium text-slate-300 mb-1.5">
              Notes or Job Description Focus (Optional)
            </label>
            <textarea
              id="textarea-role-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on clean UI systems, state architecture, and unit testing requirements..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/70 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/70 bg-slate-900/70">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Target role details and application history are stored locally.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="cancel-role-form-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-role-form-btn"
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-sm shadow-indigo-950 transition-colors"
            >
              {initialRole ? 'Save Changes' : 'Create Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
