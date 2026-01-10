export type ControlStatus = 'Covered' | 'Partial' | 'Gap';
export type WorkflowStatus = 'Draft' | 'In Progress' | 'Pending Review' | 'Approved' | 'Locked';
export type FindingPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type DocumentStatus = 'Processed' | 'Processing' | 'Failed' | 'Pending';

export interface Document {
  id: string;
  filename: string;
  type: string;
  status: DocumentStatus;
  uploadedDate: string;
  uploadedBy: string;
  size: string;
}

export interface Control {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ControlStatus;
  criteria: {
    id: string;
    text: string;
    met: boolean;
  }[];
  evidence: string[];
  suggestedFix: string;
  owner: string;
  dueDate: string;
}

export interface Assessment {
  id: string;
  name: string;
  framework: string;
  status: WorkflowStatus;
  progress: number;
  createdDate: string;
  dueDate: string;
  owner: string;
  controls: Control[];
}

export interface Finding {
  id: string;
  title: string;
  controlCode: string;
  assessmentName: string;
  priority: FindingPriority;
  status: 'Open' | 'In Progress' | 'Resolved';
  owner: string;
  dueDate: string;
  createdDate: string;
}

export const documents: Document[] = [
  {
    id: 'doc-1',
    filename: 'IT_Security_Policy_2024.pdf',
    type: 'Policy Document',
    status: 'Processed',
    uploadedDate: '2024-01-15',
    uploadedBy: 'Ahmad Wijaya',
    size: '2.4 MB'
  },
  {
    id: 'doc-2',
    filename: 'Risk_Assessment_Q4_2023.xlsx',
    type: 'Risk Assessment',
    status: 'Processed',
    uploadedDate: '2024-01-12',
    uploadedBy: 'Siti Rahayu',
    size: '1.8 MB'
  },
  {
    id: 'doc-3',
    filename: 'Access_Control_Procedures.docx',
    type: 'Procedure',
    status: 'Processing',
    uploadedDate: '2024-01-18',
    uploadedBy: 'Budi Santoso',
    size: '856 KB'
  },
  {
    id: 'doc-4',
    filename: 'Incident_Response_Plan.pdf',
    type: 'Policy Document',
    status: 'Processed',
    uploadedDate: '2024-01-10',
    uploadedBy: 'Dewi Lestari',
    size: '3.1 MB'
  },
  {
    id: 'doc-5',
    filename: 'Data_Classification_Matrix.xlsx',
    type: 'Matrix',
    status: 'Pending',
    uploadedDate: '2024-01-19',
    uploadedBy: 'Eko Prasetyo',
    size: '542 KB'
  },
  {
    id: 'doc-6',
    filename: 'Network_Architecture_Diagram.pdf',
    type: 'Technical Document',
    status: 'Processed',
    uploadedDate: '2024-01-08',
    uploadedBy: 'Fajar Nugroho',
    size: '4.7 MB'
  },
  {
    id: 'doc-7',
    filename: 'Vendor_Risk_Assessment_2024.pdf',
    type: 'Risk Assessment',
    status: 'Failed',
    uploadedDate: '2024-01-17',
    uploadedBy: 'Gita Permata',
    size: '1.2 MB'
  }
];

export const controls: Control[] = [
  {
    id: 'ctrl-1',
    code: 'AC-1',
    name: 'Access Control Policy',
    description: 'The organization develops, documents, and disseminates an access control policy.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Access control policy is documented', met: true },
      { id: 'c2', text: 'Policy is reviewed annually', met: true },
      { id: 'c3', text: 'Policy is disseminated to stakeholders', met: true }
    ],
    evidence: ['IT_Security_Policy_2024.pdf', 'Access_Control_Procedures.docx'],
    suggestedFix: '',
    owner: 'Ahmad Wijaya',
    dueDate: '2024-02-15'
  },
  {
    id: 'ctrl-2',
    code: 'AC-2',
    name: 'Account Management',
    description: 'The organization manages information system accounts.',
    status: 'Partial',
    criteria: [
      { id: 'c1', text: 'Account creation process is defined', met: true },
      { id: 'c2', text: 'Account review is performed quarterly', met: false },
      { id: 'c3', text: 'Inactive accounts are disabled within 30 days', met: true },
      { id: 'c4', text: 'Privileged accounts are monitored', met: false }
    ],
    evidence: ['Access_Control_Procedures.docx'],
    suggestedFix: 'Implement quarterly account reviews and privileged account monitoring using PAM solution.',
    owner: 'Budi Santoso',
    dueDate: '2024-02-28'
  },
  {
    id: 'ctrl-3',
    code: 'AC-3',
    name: 'Access Enforcement',
    description: 'The system enforces approved authorizations for logical access.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Role-based access control is implemented', met: true },
      { id: 'c2', text: 'Access permissions are enforced by the system', met: true }
    ],
    evidence: ['Network_Architecture_Diagram.pdf', 'IT_Security_Policy_2024.pdf'],
    suggestedFix: '',
    owner: 'Fajar Nugroho',
    dueDate: '2024-02-15'
  },
  {
    id: 'ctrl-4',
    code: 'IR-1',
    name: 'Incident Response Policy',
    description: 'The organization develops and maintains an incident response capability.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Incident response policy exists', met: true },
      { id: 'c2', text: 'Incident response team is defined', met: true },
      { id: 'c3', text: 'Escalation procedures are documented', met: true }
    ],
    evidence: ['Incident_Response_Plan.pdf'],
    suggestedFix: '',
    owner: 'Dewi Lestari',
    dueDate: '2024-02-20'
  },
  {
    id: 'ctrl-5',
    code: 'IR-4',
    name: 'Incident Handling',
    description: 'The organization implements an incident handling capability.',
    status: 'Gap',
    criteria: [
      { id: 'c1', text: 'Incident tracking system is in place', met: false },
      { id: 'c2', text: 'Incidents are categorized by severity', met: false },
      { id: 'c3', text: 'Post-incident reviews are conducted', met: false }
    ],
    evidence: [],
    suggestedFix: 'Deploy SIEM solution and establish incident tracking procedures. Define severity classification matrix and implement mandatory post-incident review process.',
    owner: 'Dewi Lestari',
    dueDate: '2024-03-15'
  },
  {
    id: 'ctrl-6',
    code: 'RA-3',
    name: 'Risk Assessment',
    description: 'The organization conducts risk assessments.',
    status: 'Partial',
    criteria: [
      { id: 'c1', text: 'Risk assessment methodology is defined', met: true },
      { id: 'c2', text: 'Risk assessments are conducted annually', met: true },
      { id: 'c3', text: 'Risk register is maintained', met: false },
      { id: 'c4', text: 'Risk treatment plans are documented', met: false }
    ],
    evidence: ['Risk_Assessment_Q4_2023.xlsx'],
    suggestedFix: 'Establish formal risk register and develop risk treatment plans for identified risks.',
    owner: 'Siti Rahayu',
    dueDate: '2024-03-01'
  },
  {
    id: 'ctrl-7',
    code: 'SA-9',
    name: 'External System Services',
    description: 'The organization requires third-party providers to comply with security requirements.',
    status: 'Gap',
    criteria: [
      { id: 'c1', text: 'Vendor security assessments are performed', met: false },
      { id: 'c2', text: 'Security requirements are in contracts', met: false },
      { id: 'c3', text: 'Vendor compliance is monitored', met: false }
    ],
    evidence: [],
    suggestedFix: 'Develop vendor security assessment program. Update contract templates to include security requirements. Implement ongoing vendor monitoring process.',
    owner: 'Gita Permata',
    dueDate: '2024-03-30'
  },
  {
    id: 'ctrl-8',
    code: 'SC-7',
    name: 'Boundary Protection',
    description: 'The system monitors and controls communications at external boundaries.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Firewalls are deployed at network boundaries', met: true },
      { id: 'c2', text: 'IDS/IPS is implemented', met: true },
      { id: 'c3', text: 'DMZ architecture is in place', met: true }
    ],
    evidence: ['Network_Architecture_Diagram.pdf'],
    suggestedFix: '',
    owner: 'Fajar Nugroho',
    dueDate: '2024-02-15'
  }
];

export const assessments: Assessment[] = [
  {
    id: 'asmt-1',
    name: 'OJK POJK 38 Assessment 2024',
    framework: 'POJK 38/POJK.03/2016',
    status: 'In Progress',
    progress: 65,
    createdDate: '2024-01-05',
    dueDate: '2024-03-31',
    owner: 'Ahmad Wijaya',
    controls: controls
  },
  {
    id: 'asmt-2',
    name: 'ISO 27001 Gap Analysis',
    framework: 'ISO 27001:2022',
    status: 'Pending Review',
    progress: 100,
    createdDate: '2023-11-15',
    dueDate: '2024-02-28',
    owner: 'Siti Rahayu',
    controls: controls.slice(0, 5)
  },
  {
    id: 'asmt-3',
    name: 'PBI Cybersecurity Assessment',
    framework: 'PBI 9/15/PBI/2007',
    status: 'Draft',
    progress: 20,
    createdDate: '2024-01-18',
    dueDate: '2024-04-30',
    owner: 'Budi Santoso',
    controls: controls.slice(0, 3)
  },
  {
    id: 'asmt-4',
    name: 'SWIFT CSP Assessment 2023',
    framework: 'SWIFT CSCF v2023',
    status: 'Approved',
    progress: 100,
    createdDate: '2023-09-01',
    dueDate: '2023-12-15',
    owner: 'Dewi Lestari',
    controls: controls.slice(2, 6)
  },
  {
    id: 'asmt-5',
    name: 'Internal Security Audit Q4',
    framework: 'Internal Framework',
    status: 'Locked',
    progress: 100,
    createdDate: '2023-10-01',
    dueDate: '2023-12-31',
    owner: 'Eko Prasetyo',
    controls: controls.slice(0, 4)
  }
];

export const findings: Finding[] = [
  {
    id: 'find-1',
    title: 'Missing privileged account monitoring',
    controlCode: 'AC-2',
    assessmentName: 'OJK POJK 38 Assessment 2024',
    priority: 'High',
    status: 'Open',
    owner: 'Budi Santoso',
    dueDate: '2024-02-28',
    createdDate: '2024-01-20'
  },
  {
    id: 'find-2',
    title: 'No incident tracking system deployed',
    controlCode: 'IR-4',
    assessmentName: 'OJK POJK 38 Assessment 2024',
    priority: 'Critical',
    status: 'In Progress',
    owner: 'Dewi Lestari',
    dueDate: '2024-03-15',
    createdDate: '2024-01-18'
  },
  {
    id: 'find-3',
    title: 'Risk register not maintained',
    controlCode: 'RA-3',
    assessmentName: 'OJK POJK 38 Assessment 2024',
    priority: 'Medium',
    status: 'Open',
    owner: 'Siti Rahayu',
    dueDate: '2024-03-01',
    createdDate: '2024-01-15'
  },
  {
    id: 'find-4',
    title: 'Vendor security assessments not performed',
    controlCode: 'SA-9',
    assessmentName: 'OJK POJK 38 Assessment 2024',
    priority: 'High',
    status: 'Open',
    owner: 'Gita Permata',
    dueDate: '2024-03-30',
    createdDate: '2024-01-22'
  },
  {
    id: 'find-5',
    title: 'Quarterly account reviews missing',
    controlCode: 'AC-2',
    assessmentName: 'ISO 27001 Gap Analysis',
    priority: 'Medium',
    status: 'Resolved',
    owner: 'Budi Santoso',
    dueDate: '2024-02-15',
    createdDate: '2023-12-10'
  },
  {
    id: 'find-6',
    title: 'Security clauses missing from vendor contracts',
    controlCode: 'SA-9',
    assessmentName: 'OJK POJK 38 Assessment 2024',
    priority: 'High',
    status: 'In Progress',
    owner: 'Gita Permata',
    dueDate: '2024-03-15',
    createdDate: '2024-01-22'
  }
];

export const dashboardStats = {
  maturityScore: 3.8,
  maxScore: 5.0,
  openFindings: findings.filter(f => f.status === 'Open').length,
  totalFindings: findings.length,
  complianceBreakdown: {
    covered: controls.filter(c => c.status === 'Covered').length,
    partial: controls.filter(c => c.status === 'Partial').length,
    gap: controls.filter(c => c.status === 'Gap').length
  },
  activeAssessments: assessments.filter(a => a.status === 'In Progress').length,
  pendingReview: assessments.filter(a => a.status === 'Pending Review').length
};

export const teamMembers = [
  { id: 'user-1', name: 'Ahmad Wijaya', role: 'Compliance Manager', avatar: 'AW' },
  { id: 'user-2', name: 'Siti Rahayu', role: 'Risk Analyst', avatar: 'SR' },
  { id: 'user-3', name: 'Budi Santoso', role: 'IT Security Lead', avatar: 'BS' },
  { id: 'user-4', name: 'Dewi Lestari', role: 'Incident Manager', avatar: 'DL' },
  { id: 'user-5', name: 'Eko Prasetyo', role: 'Internal Auditor', avatar: 'EP' },
  { id: 'user-6', name: 'Fajar Nugroho', role: 'Network Security', avatar: 'FN' },
  { id: 'user-7', name: 'Gita Permata', role: 'Vendor Manager', avatar: 'GP' }
];
