import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { findings, teamMembers } from '@/lib/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { Search, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Findings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = 
      finding.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.safeguardId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || finding.status === statusFilter;
    const matchesOwner = ownerFilter === 'all' || finding.owner === ownerFilter;
    return matchesSearch && matchesStatus && matchesOwner;
  });

  const openCount = findings.filter(f => f.status === 'Open').length;
  const inProgressCount = findings.filter(f => f.status === 'In Progress').length;
  const resolvedCount = findings.filter(f => f.status === 'Resolved').length;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setOwnerFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || ownerFilter !== 'all';

  return (
    <div className="max-w-[1200px] mx-auto space-y-6" data-testid="page-findings">
      <div>
        <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight">Findings</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">Security gaps and remediation tracking</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-6 px-4 py-2.5 bg-white rounded-[10px] border border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-[12px] text-[#6B7280]">Open</span>
            <span className="text-[12px] font-semibold text-[#111827]">{openCount}</span>
          </div>
          <div className="w-px h-4 bg-[#E5E7EB]" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-[12px] text-[#6B7280]">In Progress</span>
            <span className="text-[12px] font-semibold text-[#111827]">{inProgressCount}</span>
          </div>
          <div className="w-px h-4 bg-[#E5E7EB]" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[12px] text-[#6B7280]">Resolved</span>
            <span className="text-[12px] font-semibold text-[#111827]">{resolvedCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-sm">
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" strokeWidth={1.75} />
            <Input
              placeholder="Search findings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-[13px] border-[#E5E7EB] bg-[#F9FAFB] focus:bg-white"
              data-testid="input-search-findings"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-[13px]" data-testid="filter-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[13px]">All Status</SelectItem>
              <SelectItem value="Open" className="text-[13px]">Open</SelectItem>
              <SelectItem value="In Progress" className="text-[13px]">In Progress</SelectItem>
              <SelectItem value="Resolved" className="text-[13px]">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-[160px] h-9 text-[13px]" data-testid="filter-owner">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-[13px]">All Owners</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.name} className="text-[13px]">
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1 text-[13px] text-[#6B7280]" data-testid="button-clear-filters">
              <X className="w-3 h-3" strokeWidth={2} />
              Clear
            </Button>
          )}
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider w-16">ID</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Finding</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Priority</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Owner</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            {filteredFindings.map((finding) => (
              <tr 
                key={finding.id} 
                className="hover:bg-[#F9FAFB] transition-colors"
                data-testid={`finding-row-${finding.id}`}
              >
                <td className="py-3 px-5">
                  <span className="text-[12px] font-mono font-semibold text-[#0F766E]">{finding.safeguardId}</span>
                </td>
                <td className="py-3 px-5">
                  <span className="text-[13px] text-[#374151]">{finding.title}</span>
                </td>
                <td className="py-3 px-5"><StatusBadge status={finding.priority} /></td>
                <td className="py-3 px-5"><StatusBadge status={finding.status} /></td>
                <td className="py-3 px-5 text-[13px] text-[#374151]">{finding.owner}</td>
                <td className="py-3 px-5 text-[13px] text-[#6B7280]">{finding.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredFindings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[13px] text-[#6B7280]">No findings match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
