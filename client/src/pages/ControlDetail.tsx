import { useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { assessments, teamMembers } from '@/lib/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { 
  ArrowLeft,
  FileText,
  Lightbulb,
  User,
  Calendar,
  Upload,
  Edit3,
  CheckCircle2,
  XCircle
} from 'lucide-react';
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
  const control = assessment?.controls.find(c => c.id === params.control_id);

  if (!assessment || !control) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground">Control not found</h2>
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

  const metCriteria = control.criteria.filter(c => c.met).length;
  const totalCriteria = control.criteria.length;

  return (
    <div className="space-y-6" data-testid="page-control-detail">
      <div className="flex items-center gap-4">
        <Link href={`/assessments/${assessment.id}`}>
          <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
            Back to Assessment
          </Button>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-lg font-semibold text-primary">{control.code}</span>
            <StatusBadge status={control.status} />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{control.name}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">{control.description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2" data-testid="button-edit">
            <Edit3 className="w-4 h-4" />
            Edit Control
          </Button>
          <Button className="gap-2 shadow-md" data-testid="button-save">
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-md border-0" data-testid="card-criteria">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span>Criteria Checklist</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {metCriteria} / {totalCriteria} met
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {control.criteria.map((criterion, index) => (
                  <div 
                    key={criterion.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                      criterion.met 
                        ? 'bg-emerald-50/50 border-emerald-200' 
                        : 'bg-white border-border hover:border-primary/30'
                    }`}
                    data-testid={`criterion-${criterion.id}`}
                  >
                    <Checkbox 
                      checked={criterion.met} 
                      className="mt-0.5"
                      data-testid={`checkbox-criterion-${criterion.id}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Criterion {index + 1}</span>
                        {criterion.met ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <p className="text-sm mt-1">{criterion.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0" data-testid="card-evidence">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Evidence
                </span>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-upload-evidence">
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {control.evidence.length > 0 ? (
                <div className="space-y-2">
                  {control.evidence.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                      data-testid={`evidence-${index}`}
                    >
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium flex-1">{file}</span>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No evidence uploaded yet</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Evidence
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {control.suggestedFix && (
            <Card className="shadow-md border-0 bg-amber-50/50 border-amber-200" data-testid="card-suggested-fix">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-800">
                  <Lightbulb className="w-5 h-5" />
                  Suggested Remediation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-900">{control.suggestedFix}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-md border-0" data-testid="card-assignment">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Owner
                </label>
                <Select defaultValue={control.owner}>
                  <SelectTrigger data-testid="select-owner">
                    <SelectValue placeholder="Assign owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.name}>
                        <div className="flex items-center gap-2">
                          <span>{member.name}</span>
                          <span className="text-xs text-muted-foreground">({member.role})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </label>
                <div className="p-3 bg-muted rounded-lg text-sm font-medium">
                  {control.dueDate}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0" data-testid="card-status-info">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Status</span>
                  <StatusBadge status={control.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Criteria Met</span>
                  <span className="text-sm font-medium">{metCriteria} / {totalCriteria}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Evidence Files</span>
                  <span className="text-sm font-medium">{control.evidence.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0 bg-primary/5" data-testid="card-assessment-context">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Assessment Context</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href={`/assessments/${assessment.id}`} className="text-sm font-medium text-primary hover:underline">
                {assessment.name}
              </Link>
              <p className="text-xs text-muted-foreground mt-1">{assessment.framework}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
