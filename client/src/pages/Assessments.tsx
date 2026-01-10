import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { assessments } from '@/lib/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { 
  Plus, 
  Search, 
  ClipboardCheck,
  ArrowRight,
  Calendar,
  User
} from 'lucide-react';

export default function Assessments() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssessments = assessments.filter(asmt =>
    asmt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asmt.framework.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="page-assessments">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Assessments</h1>
          <p className="text-muted-foreground mt-1">Manage compliance assessments and audits</p>
        </div>
        <Button className="gap-2 shadow-md" data-testid="button-create-assessment">
          <Plus className="w-4 h-4" />
          Create Assessment
        </Button>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold">All Assessments</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-assessments"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Assessment</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Framework</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((asmt) => (
                  <tr 
                    key={asmt.id} 
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                    data-testid={`assessment-row-${asmt.id}`}
                  >
                    <td className="py-4 px-4">
                      <div>
                        <Link href={`/assessments/${asmt.id}`} className="text-sm font-medium hover:text-primary transition-colors">
                          {asmt.name}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">Created: {asmt.createdDate}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{asmt.framework}</td>
                    <td className="py-4 px-4"><StatusBadge status={asmt.status} /></td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <Progress value={asmt.progress} className="h-2 flex-1" />
                        <span className="text-xs font-medium text-muted-foreground w-10">{asmt.progress}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm">{asmt.owner}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{asmt.dueDate}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link href={`/assessments/${asmt.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-view-${asmt.id}`}>
                          View <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAssessments.length === 0 && (
            <div className="text-center py-12">
              <ClipboardCheck className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No assessments found</h3>
              <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your search query</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
