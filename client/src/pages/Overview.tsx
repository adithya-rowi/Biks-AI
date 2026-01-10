import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { dashboardStats, assessments, findings } from '@/lib/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { Link } from 'wouter';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowRight
} from 'lucide-react';

export default function Overview() {
  const { maturityScore, maxScore, openFindings, complianceBreakdown } = dashboardStats;
  const scorePercentage = (maturityScore / maxScore) * 100;
  const totalControls = complianceBreakdown.covered + complianceBreakdown.partial + complianceBreakdown.gap;

  const recentFindings = findings.filter(f => f.status !== 'Resolved').slice(0, 4);
  const activeAssessments = assessments.filter(a => ['In Progress', 'Pending Review'].includes(a.status)).slice(0, 3);

  return (
    <div className="space-y-6" data-testid="page-overview">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's your compliance snapshot.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md border-0" data-testid="card-maturity-score">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Maturity Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-primary">{maturityScore}</span>
              <span className="text-lg text-muted-foreground mb-1">/ {maxScore}</span>
            </div>
            <Progress value={scorePercentage} className="h-2 mt-3" />
            <p className="text-xs text-muted-foreground mt-2">
              +0.3 from last assessment
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0" data-testid="card-open-findings">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Open Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-red-600">{openFindings}</span>
              <span className="text-lg text-muted-foreground mb-1">findings</span>
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <span className="text-red-600">1 Critical</span>
              <span className="text-orange-600">3 High</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0" data-testid="card-controls-covered">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Controls Covered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-emerald-600">{complianceBreakdown.covered}</span>
              <span className="text-lg text-muted-foreground mb-1">/ {totalControls}</span>
            </div>
            <Progress value={(complianceBreakdown.covered / totalControls) * 100} className="h-2 mt-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round((complianceBreakdown.covered / totalControls) * 100)}% compliance rate
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0" data-testid="card-pending-review">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-purple-600">{dashboardStats.pendingReview}</span>
              <span className="text-lg text-muted-foreground mb-1">assessments</span>
            </div>
            <p className="text-xs text-muted-foreground mt-5">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-md border-0 lg:col-span-2" data-testid="card-compliance-breakdown">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Compliance Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-emerald-700">Covered</div>
                <div className="flex-1">
                  <div className="h-8 bg-emerald-100 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-lg transition-all duration-500"
                      style={{ width: `${(complianceBreakdown.covered / totalControls) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right font-semibold text-emerald-700">
                  {complianceBreakdown.covered}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-amber-700">Partial</div>
                <div className="flex-1">
                  <div className="h-8 bg-amber-100 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-lg transition-all duration-500"
                      style={{ width: `${(complianceBreakdown.partial / totalControls) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right font-semibold text-amber-700">
                  {complianceBreakdown.partial}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium text-red-700">Gap</div>
                <div className="flex-1">
                  <div className="h-8 bg-red-100 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-lg transition-all duration-500"
                      style={{ width: `${(complianceBreakdown.gap / totalControls) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right font-semibold text-red-700">
                  {complianceBreakdown.gap}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Controls Assessed</span>
                <span className="font-semibold">{totalControls}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md border-0" data-testid="card-active-assessments">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Active Assessments</CardTitle>
            <Link href="/assessments" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeAssessments.map((assessment) => (
              <Link key={assessment.id} href={`/assessments/${assessment.id}`}>
                <div className="p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/50 transition-all cursor-pointer" data-testid={`assessment-item-${assessment.id}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-medium line-clamp-1">{assessment.name}</h4>
                    <StatusBadge status={assessment.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={assessment.progress} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground">{assessment.progress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Due: {assessment.dueDate}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-0" data-testid="card-recent-findings">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Findings</CardTitle>
          <Link href="/findings" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Finding</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Control</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {recentFindings.map((finding) => (
                  <tr key={finding.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors" data-testid={`finding-row-${finding.id}`}>
                    <td className="py-3 px-4 text-sm font-medium">{finding.title}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{finding.controlCode}</td>
                    <td className="py-3 px-4"><StatusBadge status={finding.priority} /></td>
                    <td className="py-3 px-4"><StatusBadge status={finding.status} /></td>
                    <td className="py-3 px-4 text-sm">{finding.owner}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{finding.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
