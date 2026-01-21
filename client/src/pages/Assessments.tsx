import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import { Plus, Search, ArrowRight } from 'lucide-react';

export default function Assessments() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: assessments = [] } = useQuery({
    queryKey: ['assessments'],
    queryFn: api.assessments.getAll,
  });

  const filteredAssessments = assessments.filter(asmt =>
    asmt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asmt.framework.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'archived': return 'Archived';
      default: return status;
    }
  };

  const calculateProgress = (asmt: typeof assessments[0]) => {
    if (asmt.totalControls === 0) return 0;
    return Math.round(((asmt.controlsCovered + asmt.controlsPartial * 0.5) / asmt.totalControls) * 100);
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6" data-testid="page-assessments">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight">Assessments</h1>
          <p className="text-[13px] text-[#6B7280] mt-1">CIS Controls IG1 assessments</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5 text-[13px] font-medium shadow-sm" data-testid="button-create-assessment">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          New Assessment
        </Button>
      </div>

      <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-sm">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" strokeWidth={1.75} />
            <Input
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-[13px] border-[#E5E7EB] bg-[#F9FAFB] focus:bg-white"
              data-testid="input-search-assessments"
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Assessment</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Progress</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Score</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Due Date</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {filteredAssessments.map((asmt) => {
              const progress = calculateProgress(asmt);
              return (
                <tr 
                  key={asmt.id} 
                  className="hover:bg-[#F9FAFB] transition-colors"
                  data-testid={`assessment-row-${asmt.id}`}
                >
                  <td className="py-4 px-5">
                    <Link href={`/assessments/${asmt.id}`} className="block">
                      <span className="text-[13px] font-medium text-[#111827] hover:text-[#0F766E] transition-colors">
                        {asmt.name}
                      </span>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">{asmt.framework}</p>
                    </Link>
                  </td>
                  <td className="py-4 px-5"><StatusBadge status={asmt.status === 'in_progress' ? 'Partial' : asmt.status === 'completed' ? 'Covered' : 'Gap'} /></td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3 w-32">
                      <div className="flex-1 h-1.5 rounded-full bg-[#F3F4F6] overflow-hidden">
                        <div 
                          className="h-full bg-[#0F766E] rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[12px] font-medium text-[#6B7280] w-8">{progress}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-[13px] text-[#374151]">{asmt.maturityScore}%</td>
                  <td className="py-4 px-5 text-[13px] text-[#6B7280]">{asmt.dueDate || '—'}</td>
                  <td className="py-4 px-5">
                    <Link href={`/assessments/${asmt.id}`}>
                      <button className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors" data-testid={`button-view-${asmt.id}`}>
                        <ArrowRight className="w-4 h-4 text-[#9CA3AF]" strokeWidth={1.75} />
                      </button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredAssessments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[13px] text-[#6B7280]">No assessments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
