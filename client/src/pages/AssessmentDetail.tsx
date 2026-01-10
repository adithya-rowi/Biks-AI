import { useParams, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { assessments } from '@/lib/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function AssessmentDetail() {
  const params = useParams<{ id: string }>();
  const assessment = assessments.find(a => a.id === params.id);

  if (!assessment) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-[15px] text-[#6B7280]">Assessment not found</p>
          <Link href="/assessments">
            <Button variant="outline" size="sm" className="mt-4 gap-2 text-[13px]">
              <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
              Back
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const groupedSafeguards = {
    Gap: assessment.safeguards.filter(s => s.status === 'Gap'),
    Partial: assessment.safeguards.filter(s => s.status === 'Partial'),
    Covered: assessment.safeguards.filter(s => s.status === 'Covered'),
  };

  const statusConfig = {
    Gap: { icon: XCircle, label: 'Gap', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
    Partial: { icon: AlertCircle, label: 'Partial', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    Covered: { icon: CheckCircle2, label: 'Covered', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6" data-testid="page-assessment-detail">
      <div className="flex items-center gap-4">
        <Link href="/assessments">
          <button className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 text-[#6B7280]" strokeWidth={1.75} />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-semibold text-[#111827] tracking-tight">{assessment.name}</h1>
            <StatusBadge status={assessment.status} />
          </div>
          <p className="text-[13px] text-[#6B7280] mt-0.5">{assessment.framework}</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[13px]" data-testid="button-export">
          <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
          Export
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 shadow-sm">
          <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">Progress</span>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
              <div className="h-full bg-[#0F766E] rounded-full" style={{ width: `${assessment.progress}%` }} />
            </div>
            <span className="text-[14px] font-semibold text-[#111827]">{assessment.progress}%</span>
          </div>
        </div>
        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 shadow-sm">
          <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">Owner</span>
          <p className="mt-2 text-[14px] font-medium text-[#111827]">{assessment.owner}</p>
        </div>
        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 shadow-sm">
          <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">Due Date</span>
          <p className="mt-2 text-[14px] font-medium text-[#111827]">{assessment.dueDate}</p>
        </div>
        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-4 shadow-sm">
          <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">Safeguards</span>
          <p className="mt-2 text-[14px] font-medium text-[#111827]">{assessment.safeguards.length} Total</p>
        </div>
      </div>

      <div className="flex items-center gap-6 px-4 py-3 bg-white rounded-[14px] border border-[#E5E7EB] shadow-sm">
        <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-[#F3F4F6]">
          <div className="bg-emerald-500" style={{ width: `${(groupedSafeguards.Covered.length / assessment.safeguards.length) * 100}%` }} />
          <div className="bg-amber-400" style={{ width: `${(groupedSafeguards.Partial.length / assessment.safeguards.length) * 100}%` }} />
          <div className="bg-red-400" style={{ width: `${(groupedSafeguards.Gap.length / assessment.safeguards.length) * 100}%` }} />
        </div>
        <div className="flex items-center gap-4 text-[12px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[#6B7280]">Covered</span>
            <span className="font-semibold text-[#111827]">{groupedSafeguards.Covered.length}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[#6B7280]">Partial</span>
            <span className="font-semibold text-[#111827]">{groupedSafeguards.Partial.length}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[#6B7280]">Gap</span>
            <span className="font-semibold text-[#111827]">{groupedSafeguards.Gap.length}</span>
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {(['Gap', 'Partial', 'Covered'] as const).map((status) => {
          const safeguards = groupedSafeguards[status];
          const config = statusConfig[status];
          const Icon = config.icon;

          if (safeguards.length === 0) return null;

          return (
            <div key={status} data-testid={`section-${status.toLowerCase()}`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${config.color}`} strokeWidth={1.75} />
                <h3 className={`text-[13px] font-semibold ${config.color}`}>{config.label}</h3>
                <span className="text-[12px] text-[#9CA3AF]">({safeguards.length})</span>
              </div>
              
              <div className="space-y-2">
                {safeguards.map((safeguard) => (
                  <Link key={safeguard.id} href={`/assessments/${assessment.id}/controls/${safeguard.id}`}>
                    <div 
                      className={`p-4 bg-white rounded-[12px] border ${config.border} hover:border-[#0F766E]/30 transition-all cursor-pointer`}
                      data-testid={`safeguard-item-${safeguard.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-mono font-semibold text-[#0F766E]">{safeguard.cisId}</span>
                            <span className="text-[13px] font-medium text-[#111827]">{safeguard.name}</span>
                          </div>
                          <p className="text-[12px] text-[#6B7280] mt-1 line-clamp-1">{safeguard.description}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className="text-[11px] text-[#9CA3AF]">{safeguard.owner}</span>
                          <StatusBadge status={safeguard.status} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
