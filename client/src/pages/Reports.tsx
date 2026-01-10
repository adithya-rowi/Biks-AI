import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileBarChart, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';

const reportTypes = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    description: 'High-level overview of compliance status, maturity score, and key findings for leadership.',
    icon: TrendingUp,
    formats: ['PDF', 'PPTX'],
    lastGenerated: '2024-01-18'
  },
  {
    id: 'full-assessment',
    title: 'Full Assessment Report',
    description: 'Comprehensive report with all controls, evidence, and detailed findings.',
    icon: FileBarChart,
    formats: ['PDF', 'DOCX'],
    lastGenerated: '2024-01-15'
  },
  {
    id: 'findings-report',
    title: 'Findings Report',
    description: 'Detailed list of all findings with remediation recommendations and timelines.',
    icon: AlertTriangle,
    formats: ['PDF', 'XLSX'],
    lastGenerated: '2024-01-20'
  },
  {
    id: 'gap-analysis',
    title: 'Gap Analysis',
    description: 'Analysis of compliance gaps with prioritized remediation roadmap.',
    icon: FileText,
    formats: ['PDF', 'XLSX'],
    lastGenerated: '2024-01-12'
  },
  {
    id: 'control-matrix',
    title: 'Control Matrix',
    description: 'Complete matrix of controls with status, ownership, and evidence mapping.',
    icon: FileSpreadsheet,
    formats: ['XLSX', 'CSV'],
    lastGenerated: '2024-01-19'
  },
  {
    id: 'audit-trail',
    title: 'Audit Trail',
    description: 'Chronological log of all assessment activities and changes.',
    icon: Clock,
    formats: ['PDF', 'CSV'],
    lastGenerated: '2024-01-20'
  }
];

const getFormatIcon = (format: string) => {
  switch (format) {
    case 'PDF':
      return <FileText className="w-4 h-4 text-red-500" />;
    case 'XLSX':
    case 'CSV':
      return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
    case 'DOCX':
      return <FileText className="w-4 h-4 text-blue-600" />;
    case 'PPTX':
      return <FileBarChart className="w-4 h-4 text-orange-500" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

export default function Reports() {
  return (
    <div className="space-y-6" data-testid="page-reports">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-1">Generate and export compliance reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm border-0 bg-primary/5" data-testid="quick-action-generate">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileBarChart className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Quick Export</h3>
                <p className="text-sm text-muted-foreground mt-1">Generate a comprehensive report of your current compliance status.</p>
                <Button className="mt-4 gap-2" data-testid="button-quick-export">
                  <Download className="w-4 h-4" />
                  Generate Full Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 bg-emerald-50" data-testid="quick-action-schedule">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900">Scheduled Reports</h3>
                <p className="text-sm text-emerald-700 mt-1">Set up automated report generation on a recurring schedule.</p>
                <Button variant="outline" className="mt-4 gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100" data-testid="button-schedule-reports">
                  <Clock className="w-4 h-4" />
                  Configure Schedule
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Available Reports</CardTitle>
          <CardDescription>Choose a report type and export format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <Card 
                  key={report.id} 
                  className="border border-border hover:border-primary/30 hover:shadow-md transition-all"
                  data-testid={`report-card-${report.id}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{report.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Last generated: {report.lastGenerated}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {report.formats.map((format) => (
                        <Button 
                          key={format} 
                          variant="outline" 
                          size="sm" 
                          className="gap-1.5 h-8 text-xs"
                          data-testid={`button-export-${report.id}-${format.toLowerCase()}`}
                        >
                          {getFormatIcon(format)}
                          {format}
                          <Download className="w-3 h-3 ml-1" />
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Report</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Format</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Generated By</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50 hover:bg-accent/30 transition-colors" data-testid="export-row-1">
                  <td className="py-3 px-4 text-sm font-medium">Executive Summary</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {getFormatIcon('PDF')}
                      <span className="text-sm">PDF</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">Ahmad Wijaya</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">2024-01-18 14:30</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </td>
                </tr>
                <tr className="border-b border-border/50 hover:bg-accent/30 transition-colors" data-testid="export-row-2">
                  <td className="py-3 px-4 text-sm font-medium">Control Matrix</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {getFormatIcon('XLSX')}
                      <span className="text-sm">XLSX</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">Siti Rahayu</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">2024-01-17 09:15</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </td>
                </tr>
                <tr className="border-b border-border/50 hover:bg-accent/30 transition-colors" data-testid="export-row-3">
                  <td className="py-3 px-4 text-sm font-medium">Findings Report</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {getFormatIcon('PDF')}
                      <span className="text-sm">PDF</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm">Budi Santoso</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">2024-01-15 16:45</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
