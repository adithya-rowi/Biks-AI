import { cn } from '@/lib/utils';

type StatusType = 'Covered' | 'Partial' | 'Gap' | 'Draft' | 'In Progress' | 'Pending Review' | 'Approved' | 'Locked' | 'Open' | 'Resolved' | 'Critical' | 'High' | 'Medium' | 'Low' | 'Processed' | 'Processing' | 'Failed' | 'Pending';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  Covered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Partial: 'bg-amber-50 text-amber-700 border-amber-200',
  Gap: 'bg-red-50 text-red-700 border-red-200',
  Draft: 'bg-slate-50 text-slate-600 border-slate-200',
  'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
  'Pending Review': 'bg-purple-50 text-purple-700 border-purple-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Locked: 'bg-slate-100 text-slate-500 border-slate-300',
  Open: 'bg-red-50 text-red-700 border-red-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Critical: 'bg-red-100 text-red-800 border-red-300',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-slate-50 text-slate-600 border-slate-200',
  Processed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Processing: 'bg-blue-50 text-blue-700 border-blue-200',
  Failed: 'bg-red-50 text-red-700 border-red-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status] || 'bg-slate-50 text-slate-600 border-slate-200',
        className
      )}
      data-testid={`badge-${status.toLowerCase().replace(' ', '-')}`}
    >
      {status}
    </span>
  );
}
