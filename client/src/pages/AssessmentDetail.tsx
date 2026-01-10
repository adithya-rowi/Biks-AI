import { useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { assessments } from '@/lib/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  FileText
} from 'lucide-react';

export default function AssessmentDetail() {
  const params = useParams<{ id: string }>();
  const assessment = assessments.find(a => a.id === params.id);

  if (!assessment) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Assessment not found</h2>
          <Link href="/assessments">
            <Button variant="outline" className="mt-4 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Assessments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const groupedControls = {
    Gap: assessment.controls.filter(c => c.status === 'Gap'),
    Partial: assessment.controls.filter(c => c.status === 'Partial'),
    Covered: assessment.controls.filter(c => c.status === 'Covered'),
  };

  const statusConfig = {
    Gap: { 
      icon: XCircle, 
      color: 'text-red-600', 
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Gap Controls'
    },
    Partial: { 
      icon: AlertCircle, 
      color: 'text-amber-600', 
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      label: 'Partial Controls'
    },
    Covered: { 
      icon: CheckCircle2, 
      color: 'text-emerald-600', 
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      label: 'Covered Controls'
    },
  };

  return (
    <div className="space-y-6" data-testid="page-assessment-detail">
      <div className="flex items-center gap-4">
        <Link href="/assessments">
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-foreground">{assessment.name}</h1>
            <StatusBadge status={assessment.status} />
          </div>
          <p className="text-muted-foreground">{assessment.framework}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" data-testid="button-export">
            <FileText className="w-4 h-4" />
            Export Report
          </Button>
          <Button className="gap-2 shadow-md" data-testid="button-continue-assessment">
            Continue Assessment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Progress value={assessment.progress} className="w-6 h-6 hidden" />
                <span className="text-sm font-bold text-primary">{assessment.progress}%</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="font-semibold">{assessment.progress}% Complete</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner</p>
                <p className="font-semibold">{assessment.owner}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-semibold">{assessment.dueDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Controls</p>
                <p className="font-semibold">{assessment.controls.length} Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-border">
        <div className="flex-1">
          <Progress value={assessment.progress} className="h-3" />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            {groupedControls.Covered.length} Covered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            {groupedControls.Partial.length} Partial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            {groupedControls.Gap.length} Gap
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {(['Gap', 'Partial', 'Covered'] as const).map((status) => {
          const controls = groupedControls[status];
          const config = statusConfig[status];
          const Icon = config.icon;

          if (controls.length === 0) return null;

          return (
            <Card key={status} className={`shadow-md border-0 ${config.bgColor}`} data-testid={`section-${status.toLowerCase()}`}>
              <CardHeader className={`border-b ${config.borderColor}`}>
                <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${config.color}`}>
                  <Icon className="w-5 h-5" />
                  {config.label}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">({controls.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {controls.map((control) => (
                    <Link key={control.id} href={`/assessments/${assessment.id}/controls/${control.id}`}>
                      <div 
                        className="p-4 bg-white rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                        data-testid={`control-item-${control.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm font-medium text-primary">{control.code}</span>
                              <span className="text-sm font-medium">{control.name}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{control.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Owner</p>
                              <p className="text-sm">{control.owner}</p>
                            </div>
                            <StatusBadge status={control.status} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
