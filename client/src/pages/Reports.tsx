import { Button } from '@/components/ui/button';
import { 
  FileBarChart, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  TrendingUp,
  AlertCircle,
  Shield
} from 'lucide-react';

const reportTypes = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    description: 'High-level security posture overview for leadership',
    icon: TrendingUp,
    formats: ['PDF', 'PPTX']
  },
  {
    id: 'full-assessment',
    title: 'Full Assessment Report',
    description: 'Complete CIS IG1 assessment with all safeguards',
    icon: FileBarChart,
    formats: ['PDF', 'DOCX']
  },
  {
    id: 'findings-report',
    title: 'Findings Report',
    description: 'All findings with remediation recommendations',
    icon: AlertCircle,
    formats: ['PDF', 'XLSX']
  },
  {
    id: 'gap-analysis',
    title: 'Gap Analysis',
    description: 'Prioritized remediation roadmap',
    icon: Shield,
    formats: ['PDF', 'XLSX']
  },
  {
    id: 'safeguard-matrix',
    title: 'Safeguard Matrix',
    description: 'Complete matrix with status and ownership',
    icon: FileSpreadsheet,
    formats: ['XLSX', 'CSV']
  }
];

const getFormatStyles = (format: string) => {
  switch (format) {
    case 'PDF':
      return 'bg-red-50 text-red-700 hover:bg-red-100';
    case 'XLSX':
    case 'CSV':
      return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
    case 'DOCX':
      return 'bg-blue-50 text-blue-700 hover:bg-blue-100';
    case 'PPTX':
      return 'bg-orange-50 text-orange-700 hover:bg-orange-100';
    default:
      return 'bg-gray-50 text-gray-700 hover:bg-gray-100';
  }
};

export default function Reports() {
  return (
    <div className="max-w-[1000px] mx-auto space-y-6" data-testid="page-reports">
      <div>
        <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight">Reports</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">Generate and export assessment reports</p>
      </div>

      <div className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm" data-testid="quick-export">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#0F766E]/10 flex items-center justify-center flex-shrink-0">
            <FileBarChart className="w-5 h-5 text-[#0F766E]" strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold text-[#111827]">Quick Export</h3>
            <p className="text-[13px] text-[#6B7280] mt-0.5">Generate a comprehensive report of your current security posture</p>
          </div>
          <Button size="sm" className="h-8 gap-1.5 text-[13px] shadow-sm" data-testid="button-quick-export">
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div 
              key={report.id} 
              className="bg-white rounded-[14px] border border-[#E5E7EB] p-5 shadow-sm"
              data-testid={`report-card-${report.id}`}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-[18px] h-[18px] text-[#6B7280]" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-semibold text-[#111827]">{report.title}</h4>
                  <p className="text-[12px] text-[#6B7280] mt-0.5">{report.description}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {report.formats.map((format) => (
                  <button 
                    key={format}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors ${getFormatStyles(format)}`}
                    data-testid={`button-export-${report.id}-${format.toLowerCase()}`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-[14px] border border-[#E5E7EB] shadow-sm">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-[13px] font-semibold text-[#111827]">Recent Exports</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Report</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Format</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Generated By</th>
              <th className="text-left py-3 px-5 text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">Date</th>
              <th className="w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F6]">
            <tr className="hover:bg-[#F9FAFB] transition-colors" data-testid="export-row-1">
              <td className="py-3 px-5 text-[13px] font-medium text-[#374151]">Executive Summary</td>
              <td className="py-3 px-5">
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700">PDF</span>
              </td>
              <td className="py-3 px-5 text-[13px] text-[#374151]">Ahmad Wijaya</td>
              <td className="py-3 px-5 text-[13px] text-[#6B7280]">2025-01-18</td>
              <td className="py-3 px-5">
                <button className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors">
                  <Download className="w-4 h-4 text-[#6B7280]" strokeWidth={1.75} />
                </button>
              </td>
            </tr>
            <tr className="hover:bg-[#F9FAFB] transition-colors" data-testid="export-row-2">
              <td className="py-3 px-5 text-[13px] font-medium text-[#374151]">Safeguard Matrix</td>
              <td className="py-3 px-5">
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">XLSX</span>
              </td>
              <td className="py-3 px-5 text-[13px] text-[#374151]">Siti Rahayu</td>
              <td className="py-3 px-5 text-[13px] text-[#6B7280]">2025-01-17</td>
              <td className="py-3 px-5">
                <button className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors">
                  <Download className="w-4 h-4 text-[#6B7280]" strokeWidth={1.75} />
                </button>
              </td>
            </tr>
            <tr className="hover:bg-[#F9FAFB] transition-colors" data-testid="export-row-3">
              <td className="py-3 px-5 text-[13px] font-medium text-[#374151]">Findings Report</td>
              <td className="py-3 px-5">
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700">PDF</span>
              </td>
              <td className="py-3 px-5 text-[13px] text-[#374151]">Budi Santoso</td>
              <td className="py-3 px-5 text-[13px] text-[#6B7280]">2025-01-15</td>
              <td className="py-3 px-5">
                <button className="p-1.5 hover:bg-[#F3F4F6] rounded-md transition-colors">
                  <Download className="w-4 h-4 text-[#6B7280]" strokeWidth={1.75} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
