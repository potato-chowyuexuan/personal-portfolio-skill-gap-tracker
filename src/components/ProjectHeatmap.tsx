import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { Calendar, Info, Sparkles } from 'lucide-react';

interface ProjectHeatmapProps {
  projects: Project[];
  onSelectProject?: (project: Project) => void;
}

interface DayCell {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sun, 1 = Mon ...
  month: number; // 0-11
  year: number;
  activeProjects: Project[];
  intensity: number; // 0 = 0 projects, 1 = 1, 2 = 2, 3 = 3, 4 = 4+
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function parseMonth(monthStr: string | undefined): number {
  if (!monthStr) return 0;
  const cleaned = monthStr.trim().toLowerCase();
  if (MONTH_MAP[cleaned] !== undefined) {
    return MONTH_MAP[cleaned];
  }
  const num = parseInt(monthStr, 10);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return num - 1;
  }
  return 0;
}

interface ProjectInterval {
  project: Project;
  startDate: Date;
  endDate: Date;
}

export const ProjectHeatmap: React.FC<ProjectHeatmapProps> = ({ projects }) => {
  const [hoveredCell, setHoveredCell] = useState<DayCell | null>(null);
  const [selectedCell, setSelectedCell] = useState<DayCell | null>(null);

  // Anchor the "last year" window to today
  const today = useMemo(() => new Date(), []);

  // Precompute start and end Date for each project
  const projectIntervals = useMemo<ProjectInterval[]>(() => {
    return projects.map((p) => {
      const tf = p.timeframe;
      const sYear = parseInt(tf.startYear, 10) || (p.createdAt ? new Date(p.createdAt).getFullYear() : today.getFullYear());
      const sMonth = parseMonth(tf.startMonth);
      const startDate = new Date(sYear, sMonth, 1, 0, 0, 0);

      let endDate: Date;
      if (tf.isOngoing) {
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      } else if (tf.endYear) {
        const eYear = parseInt(tf.endYear, 10);
        const eMonth = parseMonth(tf.endMonth || tf.startMonth);
        // last day of that month
        endDate = new Date(eYear, eMonth + 1, 0, 23, 59, 59);
      } else if (p.createdAt) {
        const cDate = new Date(p.createdAt);
        endDate = new Date(cDate.getFullYear(), cDate.getMonth() + 1, 0, 23, 59, 59);
      } else {
        // Fallback: 1 month interval
        endDate = new Date(sYear, sMonth + 1, 0, 23, 59, 59);
      }

      return {
        project: p,
        startDate,
        endDate,
      };
    });
  }, [projects, today]);

  // Generate 53 weeks (or 52 weeks) ending on current week's Saturday
  const { weeks, monthLabels, totalActiveDays, maxSimultaneous } = useMemo(() => {
    const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
    // End date is this week's Saturday
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - dayOfWeek));
    endDate.setHours(23, 59, 59, 999);

    // Start date is 52 weeks (364 days) before this week's Sunday
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (53 * 7 - 1));
    startDate.setHours(0, 0, 0, 0);

    const generatedWeeks: DayCell[][] = [];
    let cur = new Date(startDate);
    let activeDaysCount = 0;
    let maxSim = 0;

    const monthHeaders: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < 53; w++) {
      const weekDays: DayCell[] = [];

      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(cur);
        const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
        
        // Find projects active on this day
        const active: Project[] = [];
        const cellTime = cellDate.getTime();

        for (const interval of projectIntervals) {
          if (cellTime >= interval.startDate.getTime() && cellTime <= interval.endDate.getTime()) {
            active.push(interval.project);
          }
        }

        const count = active.length;
        if (count > 0 && cellDate <= today) {
          activeDaysCount++;
        }
        if (count > maxSim) {
          maxSim = count;
        }

        let intensity = 0;
        if (count === 1) intensity = 1;
        else if (count === 2) intensity = 2;
        else if (count === 3) intensity = 3;
        else if (count >= 4) intensity = 4;

        weekDays.push({
          date: cellDate,
          dateStr,
          dayOfWeek: d,
          month: cellDate.getMonth(),
          year: cellDate.getFullYear(),
          activeProjects: active,
          intensity,
        });

        // Track month label when month changes (giving at least 2 weeks spacing)
        const m = cellDate.getMonth();
        if (m !== lastMonth) {
          const prevWeek = monthHeaders[monthHeaders.length - 1]?.weekIndex ?? -10;
          if (w - prevWeek >= 2 && w < 51) {
            monthHeaders.push({ label: MONTH_NAMES[m], weekIndex: w });
          }
          lastMonth = m;
        }

        cur.setDate(cur.getDate() + 1);
      }

      generatedWeeks.push(weekDays);
    }

    return {
      weeks: generatedWeeks,
      monthLabels: monthHeaders,
      totalActiveDays: activeDaysCount,
      maxSimultaneous: maxSim,
    };
  }, [today, projectIntervals]);

  // Intensity color styling matching the dark slate theme
  const getCellColorClass = (cell: DayCell): string => {
    const isFuture = cell.date > today;
    if (isFuture) {
      return 'bg-slate-800/20 border border-slate-800/30 opacity-40 cursor-default';
    }

    switch (cell.intensity) {
      case 1:
        return 'bg-indigo-950 border border-indigo-800/60 hover:border-indigo-400 hover:ring-1 hover:ring-indigo-400';
      case 2:
        return 'bg-indigo-700 border border-indigo-600 hover:border-indigo-300 hover:ring-1 hover:ring-indigo-300';
      case 3:
        return 'bg-indigo-500 border border-indigo-400 hover:border-white hover:ring-1 hover:ring-white';
      case 4:
        return 'bg-emerald-400 border border-emerald-300 hover:border-white hover:ring-1 hover:ring-white';
      case 0:
      default:
        return 'bg-slate-800/70 border border-slate-750/50 hover:border-slate-500 hover:bg-slate-700/60';
    }
  };

  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const activeInspectCell = selectedCell || hoveredCell;

  return (
    <div
      id="project-activity-heatmap"
      className="bg-[#1E293B] rounded-xl border border-slate-700/60 p-4 sm:p-5 text-slate-200 transition-all shadow-sm"
    >
      {/* Header Summary Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/50 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">Project Activity &amp; Cadence</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                Last 12 Months
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Visualizing active development timelines and concurrent engineering efforts.
            </p>
          </div>
        </div>

        {/* Quick Activity Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="bg-slate-800/70 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400">Active Days: </span>
            <strong className="text-indigo-400 font-semibold">{totalActiveDays}</strong>
          </div>
          <div className="bg-slate-800/70 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <span className="text-slate-400">Peak Concurrency: </span>
            <strong className="text-slate-200 font-semibold">{maxSimultaneous} {maxSimultaneous === 1 ? 'project' : 'projects'}</strong>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Container with horizontal scroll */}
      <div className="overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div className="min-w-[720px]">
          {/* Month Labels Header */}
          <div className="relative h-4 mb-1.5 ml-7 text-[10px] text-slate-400 font-medium">
            {monthLabels.map((m) => (
              <span
                key={`${m.label}-${m.weekIndex}`}
                className="absolute whitespace-nowrap"
                style={{ left: `${m.weekIndex * 15}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid: 7 rows (Sun -> Sat) x 53 columns (weeks) */}
          <div className="flex">
            {/* Day of Week Labels */}
            <div className="flex flex-col justify-between text-[9px] text-slate-400 font-medium pr-2 w-7 shrink-0 select-none py-[1px]">
              <span className="h-[12px] leading-[12px]">Sun</span>
              <span className="h-[12px] leading-[12px]">Mon</span>
              <span className="h-[12px] leading-[12px]">Tue</span>
              <span className="h-[12px] leading-[12px]">Wed</span>
              <span className="h-[12px] leading-[12px]">Thu</span>
              <span className="h-[12px] leading-[12px]">Fri</span>
              <span className="h-[12px] leading-[12px]">Sat</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-[3px]">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[3px] shrink-0">
                  {week.map((cell) => {
                    const isFuture = cell.date > today;
                    const isSelected = selectedCell?.dateStr === cell.dateStr;
                    return (
                      <button
                        key={cell.dateStr}
                        type="button"
                        id={`heatmap-cell-${cell.dateStr}`}
                        disabled={isFuture}
                        onClick={() => {
                          if (isFuture) return;
                          setSelectedCell(selectedCell?.dateStr === cell.dateStr ? null : cell);
                        }}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-[12px] h-[12px] rounded-[2.5px] transition-transform duration-75 focus:outline-none ${
                          isSelected ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-900 scale-125 z-10' : ''
                        } ${getCellColorClass(cell)}`}
                        aria-label={`${formatDateDisplay(cell.date)}: ${cell.activeProjects.length} active projects`}
                        title={`${formatDateDisplay(cell.date)}: ${
                          cell.activeProjects.length === 0
                            ? 'No active projects'
                            : `${cell.activeProjects.length} active (${cell.activeProjects.map((p) => p.name).join(', ')})`
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Legend */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-700/40">
            <div className="flex items-center gap-1 text-[11px]">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Click or hover any date cell to view active projects.</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400">Less</span>
              <span className="w-[11px] h-[11px] rounded-[2px] bg-slate-800/70 border border-slate-750/50 inline-block" title="0 active" />
              <span className="w-[11px] h-[11px] rounded-[2px] bg-indigo-950 border border-indigo-800/60 inline-block" title="1 active project" />
              <span className="w-[11px] h-[11px] rounded-[2px] bg-indigo-700 border border-indigo-600 inline-block" title="2 active projects" />
              <span className="w-[11px] h-[11px] rounded-[2px] bg-indigo-500 border border-indigo-400 inline-block" title="3 active projects" />
              <span className="w-[11px] h-[11px] rounded-[2px] bg-emerald-400 border border-emerald-300 inline-block" title="4+ active projects" />
              <span className="text-[10px] text-slate-400">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Detail Inspector Box */}
      {activeInspectCell && (
        <div
          id="heatmap-cell-inspector"
          className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100">
                {formatDateDisplay(activeInspectCell.date)}
              </span>
              <span className="text-slate-400 text-[11px]">
                ({activeInspectCell.activeProjects.length}{' '}
                {activeInspectCell.activeProjects.length === 1 ? 'project active' : 'projects active'})
              </span>
              {selectedCell?.dateStr === activeInspectCell.dateStr && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Pinned
                </span>
              )}
            </div>

            {activeInspectCell.activeProjects.length === 0 ? (
              <p className="text-slate-400 text-[11px]">
                No documented projects active during this date window.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {activeInspectCell.activeProjects.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span className="font-medium text-slate-100">{p.name}</span>
                    <span className="text-slate-400">({p.context})</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {selectedCell && (
            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline self-start sm:self-auto shrink-0"
            >
              Clear Pin
            </button>
          )}
        </div>
      )}
    </div>
  );
};
