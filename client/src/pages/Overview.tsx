import { Link } from 'wouter';
import { dashboardStats, assessments, findings } from '@/lib/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowRight, TrendingUp } from 'lucide-react';

export default function Overview() {
  const { maturityScore, maxScore, openFindings, coverageBreakdown, safeguardsTotal, pendingReview } = dashboardStats;
  const coveredCount = coverageBreakdown.covered;

  const recentFindings = findings.filter(f => f.status !== 'Resolved').slice(0, 5);
  const activeAssessment = assessments.find(a => a.status === 'In Progress');

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
                style={{ width: `${(coverageBreakdown.covered / safeguardsTotal) * 100}%` }}
              />
              <div 
                className="bg-amber-400 transition-all duration-500"
                style={{ width: `${(coverageBreakdown.partial / safeguardsTotal) * 100}%` }}
              />
              <div 
                className="bg-red-400 transition-all duration-500"
                style={{ width: `${(coverageBreakdown.gap / safeguardsTotal) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[12px] text-[#6B7280]">Covered</span>
                <span className="text-[12px] font-semibold text-[#111827]">{coverageBreakdown.covered}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-[12px] text-[#6B7280]">Partial</span>
                <span className="text-[12px] font-semibold text-[#111827]">{coverageBreakdown.partial}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-[12px] text-[#6B7280]">Gap</span>
                <span className="text-[12px] font-semibold text-[#111827]">{coverageBreakdown.gap}</span>
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
              {recentFindings.map((finding) => (
                <div key={finding.id} className="px-5 py-3 flex items-center gap-4 hover:bg-[#F9FAFB] transition-colors" data-testid={`finding-row-${finding.id}`}>
                  <span className="w-12 text-[12px] font-mono font-medium text-[#0F766E]">{finding.safeguardId}</span>
                  <span className="flex-1 text-[13px] text-[#374151] truncate">{finding.title}</span>
                  <StatusBadge status={finding.status} />
                  <span className="w-28 text-[12px] text-[#6B7280] text-right">{finding.owner}</span>
                  <span className="w-24 text-[12px] text-[#9CA3AF] text-right">{finding.dueDate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {activeAssessment && (
            <Link href={`/assessments/${activeAssessment.id}`}>
              <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm hover:border-[#0F766E]/30 transition-colors cursor-pointer" data-testid="card-active-assessment">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold text-[#111827]">Active Assessment</h3>
                  <StatusBadge status={activeAssessment.status} />
                </div>
                
                <p className="text-[14px] font-medium text-[#111827] mb-1">{activeAssessment.name}</p>
                <p className="text-[12px] text-[#6B7280] mb-4">{activeAssessment.framework}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#6B7280]">Progress</span>
                    <span className="font-medium text-[#111827]">{activeAssessment.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                    <div 
                      className="h-full bg-[#0F766E] rounded-full transition-all duration-500"
                      style={{ width: `${activeAssessment.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#F3F4F6]">
                  <span className="text-[11px] text-[#9CA3AF]">Due {activeAssessment.dueDate}</span>
                  <span className="text-[11px] text-[#6B7280]">{activeAssessment.owner}</span>
                </div>
              </div>
            </Link>
          )}

          <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm">
            <h3 className="text-[13px] font-semibold text-[#111827] mb-4">Quick Stats</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Total Safeguards</span>
                <span className="text-[12px] font-semibold text-[#111827]">{safeguardsTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Coverage Rate</span>
                <span className="text-[12px] font-semibold text-[#111827]">{Math.round((coverageBreakdown.covered / safeguardsTotal) * 100)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Critical Findings</span>
                <span className="text-[12px] font-semibold text-red-600">{findings.filter(f => f.priority === 'Critical' && f.status !== 'Resolved').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">High Priority</span>
                <span className="text-[12px] font-semibold text-orange-600">{findings.filter(f => f.priority === 'High' && f.status !== 'Resolved').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
