import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowRight, TrendingUp } from 'lucide-react';

export default function Overview() {
  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: api.assessments.getAll,
  });

  const { data: findings = [] } = useQuery({
    queryKey: ['findings'],
    queryFn: async () => {
      if (assessments.length === 0) return [];
      return api.findings.getByAssessment(assessments[0].id);
    },
    enabled: assessments.length > 0,
  });

  const activeAssessment = assessments.find(a => a.status === 'in_progress');
  const maturityScore = activeAssessment?.maturityScore || 0;
  const maxScore = 100;
  const openFindings = findings.filter(f => f.status === 'open' || f.status === 'in_progress').length;
  const safeguardsTotal = activeAssessment?.totalControls || 56;
  const coveredCount = activeAssessment?.controlsCovered || 0;
  const partialCount = activeAssessment?.controlsPartial || 0;
  const gapCount = activeAssessment?.controlsGap || 0;
  const pendingReview = 0;

  const recentFindings = findings.filter(f => f.status !== 'resolved').slice(0, 5);

  return (
    <div className="max-w-[1200px] mx-auto space-y-8" data-testid="page-overview">
      <div>
        <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight">Overview</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">Security posture at a glance</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm" data-testid="card-maturity-score">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide">Maturity Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" strokeWidth={2} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[32px] font-semibold text-[#111827] tracking-tight">{maturityScore}</span>
            <span className="text-[15px] text-[#9CA3AF] font-medium">/ {maxScore}</span>
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm" data-testid="card-open-findings">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide">Open Findings</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[32px] font-semibold text-[#111827] tracking-tight">{openFindings}</span>
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm" data-testid="card-safeguards-covered">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide">Safeguards Covered</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[32px] font-semibold text-[#111827] tracking-tight">{coveredCount}</span>
            <span className="text-[15px] text-[#9CA3AF] font-medium">/ {safeguardsTotal}</span>
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm" data-testid="card-pending-review">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide">Pending Review</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[32px] font-semibold text-[#111827] tracking-tight">{pendingReview}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm" data-testid="card-coverage-breakdown">
            <h3 className="text-[13px] font-semibold text-[#111827] mb-5">Coverage Breakdown</h3>
            
            <div className="flex h-3 rounded-full overflow-hidden bg-[#F3F4F6]">
              <div 
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${(coveredCount / safeguardsTotal) * 100}%` }}
              />
              <div 
                className="bg-amber-400 transition-all duration-500"
                style={{ width: `${(partialCount / safeguardsTotal) * 100}%` }}
              />
              <div 
                className="bg-red-400 transition-all duration-500"
                style={{ width: `${(gapCount / safeguardsTotal) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[12px] text-[#6B7280]">Covered</span>
                <span className="text-[12px] font-semibold text-[#111827]">{coveredCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-[12px] text-[#6B7280]">Partial</span>
                <span className="text-[12px] font-semibold text-[#111827]">{partialCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-[12px] text-[#6B7280]">Gap</span>
                <span className="text-[12px] font-semibold text-[#111827]">{gapCount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-sm" data-testid="card-recent-findings">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-[13px] font-semibold text-[#111827]">Recent Findings</h3>
              <Link href="/findings" className="text-[12px] font-medium text-[#0F766E] hover:text-[#0D9488] flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" strokeWidth={2} />
              </Link>
            </div>
            
            <div className="divide-y divide-[#F3F4F6]">
              {recentFindings.length > 0 ? (
                recentFindings.map((finding) => (
                  <div key={finding.id} className="px-5 py-3 flex items-center gap-4 hover:bg-[#F9FAFB] transition-colors" data-testid={`finding-row-${finding.id}`}>
                    <span className="w-12 text-[12px] font-mono font-medium text-[#0F766E]">{finding.cisId}</span>
                    <span className="flex-1 text-[13px] text-[#374151] truncate">{finding.title}</span>
                    <StatusBadge status={finding.status === 'open' ? 'Gap' : finding.status === 'in_progress' ? 'Partial' : 'Covered'} />
                    <span className="w-28 text-[12px] text-[#6B7280] text-right">{finding.assignedTo || 'Unassigned'}</span>
                    <span className="w-24 text-[12px] text-[#9CA3AF] text-right">{finding.dueDate || '—'}</span>
                  </div>
                ))
              ) : (
                <div className="px-5 py-8 text-center text-[13px] text-[#9CA3AF]">
                  No findings yet
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {activeAssessment && (
            <Link href={`/assessments/${activeAssessment.id}`}>
              <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm hover:border-[#0F766E]/30 transition-colors cursor-pointer" data-testid="card-active-assessment">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold text-[#111827]">Active Assessment</h3>
                  <StatusBadge status={activeAssessment.status === 'in_progress' ? 'Partial' : 'Covered'} />
                </div>
                <p className="text-[15px] text-[#374151] font-medium mb-2">{activeAssessment.name}</p>
                <p className="text-[12px] text-[#6B7280] mb-4">{activeAssessment.framework}</p>
                <div className="flex items-center justify-between text-[11px] text-[#9CA3AF]">
                  <span>Due {activeAssessment.dueDate}</span>
                  <ArrowRight className="w-3 h-3 text-[#0F766E]" strokeWidth={2} />
                </div>
              </div>
            </Link>
          )}

          <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm" data-testid="card-quick-actions">
            <h3 className="text-[13px] font-semibold text-[#111827] mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link href="/documents">
                <button className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                  Upload Evidence
                </button>
              </Link>
              <Link href="/assessments">
                <button className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                  View Assessments
                </button>
              </Link>
              <Link href="/findings">
                <button className="w-full text-left px-3 py-2 rounded-lg text-[13px] text-[#374151] hover:bg-[#F9FAFB] transition-colors">
                  Review Findings
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
