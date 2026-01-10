import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { assessments, teamMembers } from '@/lib/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { 
  ArrowLeft, 
  ChevronRight, 
  Check, 
  X, 
  Minus, 
  HelpCircle,
  FileText,
  Copy,
  Lock,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface CriterionData {
  id: string;
  text: string;
  status: 'met' | 'partial' | 'not_met' | 'insufficient';
  citation: {
    document: string;
    version: string;
    page: string;
    section: string;
    excerpt: string;
  } | null;
}

const mockCriteria: CriterionData[] = [
  {
    id: 'crit-1',
    text: 'Asset inventory exists and is documented',
    status: 'met',
    citation: {
      document: 'Information Security Policy',
      version: 'v3.0',
      page: 'p12',
      section: '§3.1',
      excerpt: 'The organization shall maintain a comprehensive inventory of all information assets, including hardware, software, and data assets. This inventory shall be reviewed and updated on a quarterly basis.'
    }
  },
  {
    id: 'crit-2',
    text: 'Inventory includes hardware assets',
    status: 'met',
    citation: {
      document: 'Asset Management Procedure',
      version: 'v1.2',
      page: 'p4',
      section: '§2.1',
      excerpt: 'All physical hardware assets including servers, workstations, network devices, and mobile devices shall be recorded in the asset management system within 24 hours of deployment.'
    }
  },
  {
    id: 'crit-3',
    text: 'Inventory includes virtual/cloud assets',
    status: 'partial',
    citation: {
      document: 'Information Security Policy',
      version: 'v3.0',
      page: 'p15',
      section: '§3.4',
      excerpt: 'Cloud-based assets and virtual machines should be tracked. Note: Current process covers IaaS but PaaS/SaaS tracking is incomplete.'
    }
  },
  {
    id: 'crit-4',
    text: 'Update frequency is defined',
    status: 'met',
    citation: {
      document: 'Asset Management Procedure',
      version: 'v1.2',
      page: 'p8',
      section: '§4.2',
      excerpt: 'Asset inventory shall be reviewed weekly for unauthorized additions and comprehensively audited quarterly. Automated discovery scans run daily.'
    }
  },
  {
    id: 'crit-5',
    text: 'Owner/responsible party assigned',
    status: 'not_met',
    citation: null
  }
];

const mockChangeHistory = [
  { timestamp: '2025-01-10 14:32', actor: 'Ahmad Wijaya', change: 'Updated criterion 3 status from Not Met to Partial' },
  { timestamp: '2025-01-10 14:28', actor: 'Ahmad Wijaya', change: 'Added citation for criterion 4' },
  { timestamp: '2025-01-08 09:15', actor: 'Siti Rahayu', change: 'Assigned control to Ahmad Wijaya' },
  { timestamp: '2025-01-05 11:00', actor: 'System', change: 'Control created from assessment template' }
];

export default function ControlDetail() {
  const params = useParams<{ id: string; control_id: string }>();
  const assessment = assessments.find(a => a.id === params.id);
  const safeguard = assessment?.safeguards.find(s => s.id === params.control_id);

  const [criteria, setCriteria] = useState<CriterionData[]>(mockCriteria);
  const [selectedCriterion, setSelectedCriterion] = useState<CriterionData | null>(null);
  const [showEvidencePanel, setShowEvidencePanel] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideCriterion, setOverrideCriterion] = useState<CriterionData | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideStatus, setOverrideStatus] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy] = useState({ name: 'Ahmad Wijaya', date: '2025-01-10' });
  const [remediationStatus, setRemediationStatus] = useState('not_started');
  const [reviewerNotes, setReviewerNotes] = useState('');

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

  const metCount = criteria.filter(c => c.status === 'met').length;
  const totalCount = criteria.length;
  const score = Math.round((metCount / totalCount) * 100);

  const computedStatus = score >= 80 ? 'Covered' : score >= 40 ? 'Partial' : 'Gap';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'met':
        return <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="w-3 h-3 text-emerald-600" strokeWidth={2.5} /></div>;
      case 'partial':
        return <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center"><Minus className="w-3 h-3 text-amber-600" strokeWidth={2.5} /></div>;
      case 'not_met':
        return <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center"><X className="w-3 h-3 text-red-600" strokeWidth={2.5} /></div>;
      case 'insufficient':
        return <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center"><HelpCircle className="w-3 h-3 text-gray-500" strokeWidth={2} /></div>;
      default:
        return null;
    }
  };

  const handleOpenExcerpt = (criterion: CriterionData) => {
    setSelectedCriterion(criterion);
    setShowEvidencePanel(true);
  };

  const handleOverride = (criterion: CriterionData) => {
    setOverrideCriterion(criterion);
    setOverrideStatus(criterion.status);
    setOverrideReason('');
    setShowOverrideDialog(true);
  };

  const confirmOverride = () => {
    if (overrideCriterion && overrideReason.trim()) {
      setCriteria(prev => prev.map(c => 
        c.id === overrideCriterion.id 
          ? { ...c, status: overrideStatus as CriterionData['status'] }
          : c
      ));
      setShowOverrideDialog(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6" data-testid="page-control-detail">
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-[10px] px-4 py-3 flex items-center gap-3" data-testid="locked-banner">
          <Lock className="w-4 h-4 text-amber-600" strokeWidth={1.75} />
          <span className="text-[13px] text-amber-800">
            Locked by {lockedBy.name} on {lockedBy.date}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 text-[12px] text-[#6B7280]" data-testid="breadcrumb">
        <Link href="/assessments" className="hover:text-[#0F766E]">Assessments</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href={`/assessments/${assessment.id}`} className="hover:text-[#0F766E]">{assessment.name}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#374151] font-medium">Control {safeguard.cisId}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[20px] font-semibold text-[#111827] tracking-tight">
              {safeguard.cisId} — {safeguard.name}
            </h1>
            <StatusBadge status={computedStatus} />
          </div>
          <div className="flex items-center gap-6 text-[12px] text-[#6B7280]">
            <span className="font-medium text-[#111827]">{score}%</span>
            <span>{metCount} of {totalCount} criteria met</span>
            <span>Last assessed: 2025-01-10</span>
            <span>Reviewer: {safeguard.owner}</span>
            <span>{safeguard.evidence.length} documents</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-sm" data-testid="section-criteria">
            <div className="px-5 py-4 border-b border-[#E5E7EB]">
              <h3 className="text-[13px] font-semibold text-[#111827]">Policy Criteria</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider w-16">Status</th>
                  <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Criterion</th>
                  <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Citation</th>
                  <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {criteria.map((criterion) => (
                  <tr key={criterion.id} className="hover:bg-[#F9FAFB]" data-testid={`criterion-row-${criterion.id}`}>
                    <td className="py-3 px-5">
                      {getStatusIcon(criterion.status)}
                    </td>
                    <td className="py-3 px-5 text-[13px] text-[#374151]">
                      {criterion.text}
                    </td>
                    <td className="py-3 px-5">
                      {criterion.citation ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-[#6B7280]">
                            {criterion.citation.document} {criterion.citation.version} · {criterion.citation.page} · {criterion.citation.section}
                          </span>
                          <button
                            onClick={() => handleOpenExcerpt(criterion)}
                            className="text-[11px] text-[#0F766E] hover:underline"
                            disabled={isLocked}
                            data-testid={`open-excerpt-${criterion.id}`}
                          >
                            Open excerpt
                          </button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#9CA3AF] italic">No evidence found</span>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <button
                        onClick={() => handleOverride(criterion)}
                        className="text-[12px] text-[#6B7280] hover:text-[#0F766E] disabled:opacity-50"
                        disabled={isLocked}
                        data-testid={`override-${criterion.id}`}
                      >
                        Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showEvidencePanel && selectedCriterion?.citation && (
            <div className="bg-[#F9FAFB] rounded-[14px] border border-[#E5E7EB] p-5" data-testid="evidence-panel">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-[#0F766E]" strokeWidth={1.75} />
                    <span className="text-[13px] font-medium text-[#111827]">
                      {selectedCriterion.citation.document} {selectedCriterion.citation.version}
                    </span>
                  </div>
                  <span className="text-[12px] text-[#6B7280]">
                    {selectedCriterion.citation.page} · {selectedCriterion.citation.section}
                  </span>
                </div>
                <button
                  onClick={() => setShowEvidencePanel(false)}
                  className="text-[12px] text-[#6B7280] hover:text-[#111827]"
                >
                  Close
                </button>
              </div>
              <div className="bg-white rounded-lg border border-[#E5E7EB] p-4 mb-4">
                <p className="text-[13px] text-[#374151] leading-relaxed italic">
                  "{selectedCriterion.citation.excerpt}"
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[12px]" data-testid="button-open-document">
                  <ExternalLink className="w-3 h-3" strokeWidth={2} />
                  Open in document
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 gap-1.5 text-[12px]"
                  onClick={() => copyToClipboard(`${selectedCriterion.citation!.document} ${selectedCriterion.citation!.version} · ${selectedCriterion.citation!.page} · ${selectedCriterion.citation!.section}`)}
                  data-testid="button-copy-citation"
                >
                  <Copy className="w-3 h-3" strokeWidth={2} />
                  Copy citation
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {(computedStatus === 'Gap' || computedStatus === 'Partial') && (
            <div className="bg-amber-50 rounded-[14px] border border-amber-100 p-5" data-testid="section-recommendations">
              <h3 className="text-[13px] font-semibold text-amber-800 mb-3">Recommended Actions</h3>
              <p className="text-[12px] text-amber-700 mb-3">
                Address gaps in asset inventory coverage to achieve full compliance with CIS Control 1.1.
              </p>
              <ul className="space-y-2 text-[12px] text-amber-700 mb-3">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">1.</span>
                  Extend inventory to include PaaS and SaaS assets
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">2.</span>
                  Assign asset owners for all documented assets
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">3.</span>
                  Update Asset Management Procedure to v1.3
                </li>
              </ul>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 gap-1.5 text-[12px] border-amber-200 text-amber-700 hover:bg-amber-100"
                onClick={() => copyToClipboard('1. Extend inventory to include PaaS and SaaS assets\n2. Assign asset owners for all documented assets\n3. Update Asset Management Procedure to v1.3')}
                data-testid="button-copy-recommendations"
              >
                <Copy className="w-3 h-3" strokeWidth={2} />
                Copy
              </Button>
            </div>
          )}

          <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm" data-testid="section-remediation">
            <h3 className="text-[13px] font-semibold text-[#111827] mb-4">Remediation Assignment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-2 block">Owner</label>
                <Select defaultValue={safeguard.owner} disabled={isLocked}>
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

              <div>
                <label className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-2 block">Status</label>
                <Select value={remediationStatus} onValueChange={setRemediationStatus} disabled={isLocked}>
                  <SelectTrigger className="h-9 text-[13px]" data-testid="select-remediation-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started" className="text-[13px]">Not Started</SelectItem>
                    <SelectItem value="in_progress" className="text-[13px]">In Progress</SelectItem>
                    <SelectItem value="blocked" className="text-[13px]">Blocked</SelectItem>
                    <SelectItem value="implemented" className="text-[13px]">Implemented</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-2 block">Reviewer Notes</label>
                <Textarea 
                  placeholder="Add notes for the reviewer..."
                  className="text-[13px] min-h-[80px] resize-none"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  disabled={isLocked}
                  data-testid="textarea-notes"
                />
                <p className="text-[11px] text-[#9CA3AF] mt-1">Changes tracked in history</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-sm" data-testid="section-history">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors"
            >
              <h3 className="text-[13px] font-semibold text-[#111827]">Change History</h3>
              {showHistory ? (
                <ChevronUp className="w-4 h-4 text-[#9CA3AF]" strokeWidth={1.75} />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#9CA3AF]" strokeWidth={1.75} />
              )}
            </button>
            
            {showHistory && (
              <div className="px-5 pb-4 space-y-3 border-t border-[#E5E7EB] pt-4">
                {mockChangeHistory.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3" data-testid={`history-entry-${index}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D1D5DB] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-[12px] text-[#374151]">{entry.change}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{entry.actor} · {entry.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-9 text-[13px]"
          disabled={isLocked}
          data-testid="button-override-status"
        >
          Override Control Status
        </Button>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 text-[13px]"
            onClick={() => setIsLocked(!isLocked)}
            data-testid="button-lock"
          >
            <Lock className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
            {isLocked ? 'Unlock Control' : 'Lock Control'}
          </Button>
          <Button 
            size="sm" 
            className="h-9 text-[13px] shadow-sm"
            disabled={isLocked}
            data-testid="button-save"
          >
            {isLocked ? 'Export' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Override Criterion Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-[13px] text-[#374151] mb-3">{overrideCriterion?.text}</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-2 block">New Status</label>
              <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="met" className="text-[13px]">Met</SelectItem>
                  <SelectItem value="partial" className="text-[13px]">Partial</SelectItem>
                  <SelectItem value="not_met" className="text-[13px]">Not Met</SelectItem>
                  <SelectItem value="insufficient" className="text-[13px]">Insufficient Evidence</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-2 block">
                Reason <span className="text-red-500">*</span>
              </label>
              <Textarea 
                placeholder="Provide justification for this override..."
                className="text-[13px] min-h-[100px] resize-none"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                data-testid="textarea-override-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowOverrideDialog(false)} className="text-[13px]">
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={confirmOverride} 
              disabled={!overrideReason.trim()}
              className="text-[13px]"
              data-testid="button-confirm-override"
            >
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
