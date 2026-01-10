import { cn } from '@/lib/utils';

type StatusType = 'Covered' | 'Partial' | 'Gap' | 'Draft' | 'In Progress' | 'Pending Review' | 'Approved' | 'Locked' | 'Open' | 'Resolved' | 'Critical' | 'High' | 'Medium' | 'Low' | 'Processed' | 'Processing' | 'Failed' | 'Pending';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  Covered: 'bg-emerald-50 text-emerald-700',
  Partial: 'bg-amber-50 text-amber-700',
  Gap: 'bg-red-50 text-red-700',
  Draft: 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-50 text-blue-700',
  'Pending Review': 'bg-violet-50 text-violet-700',
  Approved: 'bg-emerald-50 text-emerald-700',
  Locked: 'bg-gray-100 text-gray-500',
  Open: 'bg-red-50 text-red-700',
  Resolved: 'bg-emerald-50 text-emerald-700',
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-50 text-orange-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-gray-100 text-gray-600',
  Processed: 'bg-emerald-50 text-emerald-700',
  Processing: 'bg-blue-50 text-blue-700',
  Failed: 'bg-red-50 text-red-700',
  Pending: 'bg-amber-50 text-amber-700',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium',
        statusStyles[status] || 'bg-gray-100 text-gray-600',
        className
      )}
      data-testid={`badge-${status.toLowerCase().replace(' ', '-')}`}
    >
      {status}
    </span>
  );
}
