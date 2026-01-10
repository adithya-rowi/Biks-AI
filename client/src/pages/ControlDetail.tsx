import { useParams, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { assessments, teamMembers } from '@/lib/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, FileText, Lightbulb, Upload, CheckCircle2, Circle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ControlDetail() {
  const params = useParams<{ id: string; control_id: string }>();
  const assessment = assessments.find(a => a.id === params.id);
  const safeguard = assessment?.safeguards.find(s => s.id === params.control_id);

  if (!assessment || !safeguard) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-[15px] text-[#6B7280]">Safeguard not found</p>
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

  const metCriteria = safeguard.criteria.filter(c => c.met).length;
  const totalCriteria = safeguard.criteria.length;

  return (
    <div className="max-w-[1000px] mx-auto space-y-6" data-testid="page-control-detail">
      <div className="flex items-center gap-4">
        <Link href={`/assessments/${assessment.id}`}>
          <button className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 text-[#6B7280]" strokeWidth={1.75} />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-mono font-semibold text-[#0F766E]">{safeguard.cisId}</span>
            <StatusBadge status={safeguard.status} />
          </div>
          <h1 className="text-[18px] font-semibold text-[#111827] tracking-tight mt-1">{safeguard.name}</h1>
        </div>
        <Button size="sm" className="h-8 text-[13px] shadow-sm" data-testid="button-save">
          Save Changes
        </Button>
      </div>

      <p className="text-[13px] text-[#6B7280] leading-relaxed">{safeguard.description}</p>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-sm" data-testid="card-criteria">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-[#111827]">Criteria</h3>
              <span className="text-[12px] text-[#6B7280]">{metCriteria} / {totalCriteria} met</span>
            </div>
            <div className="divide-y divide-[#F3F4F6]">
              {safeguard.criteria.map((criterion, index) => (
                <div 
                  key={criterion.id}
                  className="px-5 py-3.5 flex items-start gap-3"
                  data-testid={`criterion-${criterion.id}`}
                >
                  <Checkbox 
                    checked={criterion.met} 
                    className="mt-0.5"
                    data-testid={`checkbox-criterion-${criterion.id}`}
                  />
                  <div className="flex-1">
                    <p className="text-[13px] text-[#374151]">{criterion.text}</p>
                  </div>
                  {criterion.met ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" strokeWidth={1.75} />
                  ) : (
                    <Circle className="w-4 h-4 text-[#D1D5DB] flex-shrink-0" strokeWidth={1.75} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-sm" data-testid="card-evidence">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-[#111827]">Evidence</h3>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[12px]" data-testid="button-upload-evidence">
                <Upload className="w-3 h-3" strokeWidth={2} />
                Upload
              </Button>
            </div>
            {safeguard.evidence.length > 0 ? (
              <div className="divide-y divide-[#F3F4F6]">
                {safeguard.evidence.map((file, index) => (
                  <div 
                    key={index}
                    className="px-5 py-3 flex items-center gap-3"
                    data-testid={`evidence-${index}`}
                  >
                    <FileText className="w-4 h-4 text-[#0F766E]" strokeWidth={1.75} />
                    <span className="text-[13px] text-[#374151] flex-1">{file}</span>
                    <button className="text-[12px] text-[#6B7280] hover:text-[#0F766E]">View</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <FileText className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-[12px] text-[#9CA3AF]">No evidence uploaded</p>
              </div>
            )}
          </div>

          {safeguard.suggestedFix && (
            <div className="bg-amber-50 rounded-[14px] border border-amber-100 p-5" data-testid="card-suggested-fix">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
                <div>
                  <h3 className="text-[13px] font-semibold text-amber-800 mb-1">Suggested Remediation</h3>
                  <p className="text-[13px] text-amber-700 leading-relaxed">{safeguard.suggestedFix}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm" data-testid="card-assignment">
            <h3 className="text-[13px] font-semibold text-[#111827] mb-4">Assignment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-2 block">Owner</label>
                <Select defaultValue={safeguard.owner}>
                  <SelectTrigger className="h-9 text-[13px]" data-testid="select-owner">
                    <SelectValue placeholder="Assign owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.name} className="text-[13px]">
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-2 block">Due Date</label>
                <div className="h-9 px-3 flex items-center bg-[#F9FAFB] rounded-md border border-[#E5E7EB] text-[13px] text-[#374151]">
                  {safeguard.dueDate}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm" data-testid="card-status-summary">
            <h3 className="text-[13px] font-semibold text-[#111827] mb-4">Status</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Current</span>
                <StatusBadge status={safeguard.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Criteria Met</span>
                <span className="text-[12px] font-medium text-[#111827]">{metCriteria} / {totalCriteria}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6B7280]">Evidence</span>
                <span className="text-[12px] font-medium text-[#111827]">{safeguard.evidence.length} files</span>
              </div>
            </div>
          </div>

          <div className="bg-[#F9FAFB] rounded-[14px] border border-[#E5E7EB] p-4" data-testid="card-assessment-context">
            <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide">Assessment</span>
            <Link href={`/assessments/${assessment.id}`} className="block mt-1 text-[13px] font-medium text-[#0F766E] hover:underline">
              {assessment.name}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
