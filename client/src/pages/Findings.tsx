import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { findings, teamMembers } from '@/lib/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { 
  Search, 
  AlertTriangle,
  Filter,
  X
} from 'lucide-react';
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
      finding.controlCode.toLowerCase().includes(searchQuery.toLowerCase());
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
    <div className="space-y-6" data-testid="page-findings">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Findings</h1>
        <p className="text-muted-foreground mt-1">Track and manage compliance gaps and remediation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-0 bg-red-50" data-testid="stat-open">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Open</p>
                <p className="text-3xl font-bold text-red-700">{openCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-blue-50" data-testid="stat-in-progress">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">In Progress</p>
                <p className="text-3xl font-bold text-blue-700">{inProgressCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-emerald-50" data-testid="stat-resolved">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Resolved</p>
                <p className="text-3xl font-bold text-emerald-700">{resolvedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-semibold">All Findings</CardTitle>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search findings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-findings"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filters:</span>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]" data-testid="filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-[180px]" data-testid="filter-owner">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1" data-testid="button-clear-filters">
                  <X className="w-3 h-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Finding</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Control</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Assessment</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.map((finding) => (
                  <tr 
                    key={finding.id} 
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer"
                    data-testid={`finding-row-${finding.id}`}
                  >
                    <td className="py-4 px-4">
                      <div>
                        <span className="text-sm font-medium">{finding.title}</span>
                        <p className="text-xs text-muted-foreground mt-0.5">Created: {finding.createdDate}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-sm text-primary">{finding.controlCode}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground max-w-[200px] truncate">{finding.assessmentName}</td>
                    <td className="py-4 px-4"><StatusBadge status={finding.priority} /></td>
                    <td className="py-4 px-4"><StatusBadge status={finding.status} /></td>
                    <td className="py-4 px-4 text-sm">{finding.owner}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{finding.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredFindings.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No findings found</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
