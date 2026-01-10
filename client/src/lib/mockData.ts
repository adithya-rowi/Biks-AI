export type SafeguardStatus = 'Covered' | 'Partial' | 'Gap';
export type WorkflowStatus = 'Draft' | 'In Progress' | 'Pending Review' | 'Approved' | 'Locked';
export type FindingPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type DocumentStatus = 'Ready' | 'Indexing' | 'Parsing' | 'Failed';

export interface Document {
  id: string;
  filename: string;
  type: string;
  version: string;
  status: DocumentStatus;
  uploadedDate: string;
  uploadedBy: string;
  size: string;
  usedInAssessment: boolean;
}

export interface Safeguard {
  id: string;
  cisId: string;
  name: string;
  description: string;
  status: SafeguardStatus;
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
  safeguards: Safeguard[];
}

export interface Finding {
  id: string;
  title: string;
  safeguardId: string;
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
    filename: 'Information Security Policy.pdf',
    type: 'Policy',
    version: 'v3.0',
    status: 'Ready',
    uploadedDate: '2025-01-05',
    uploadedBy: 'Ahmad Wijaya',
    size: '2.4 MB',
    usedInAssessment: true
  },
  {
    id: 'doc-2',
    filename: 'Asset Management Procedure.docx',
    type: 'Procedure',
    version: 'v1.2',
    status: 'Ready',
    uploadedDate: '2025-01-06',
    uploadedBy: 'Siti Rahayu',
    size: '1.8 MB',
    usedInAssessment: true
  },
  {
    id: 'doc-3',
    filename: 'Access Control Policy.pdf',
    type: 'Policy',
    version: 'v2.1',
    status: 'Indexing',
    uploadedDate: '2025-01-10',
    uploadedBy: 'Budi Santoso',
    size: '856 KB',
    usedInAssessment: false
  },
  {
    id: 'doc-4',
    filename: 'Incident Response Plan.docx',
    type: 'Procedure',
    version: 'v1.0',
    status: 'Parsing',
    uploadedDate: '2025-01-10',
    uploadedBy: 'Dewi Lestari',
    size: '3.1 MB',
    usedInAssessment: false
  },
  {
    id: 'doc-5',
    filename: 'Data Classification Standard.pdf',
    type: 'Standard',
    version: 'v2.0',
    status: 'Ready',
    uploadedDate: '2025-01-08',
    uploadedBy: 'Eko Prasetyo',
    size: '542 KB',
    usedInAssessment: true
  },
  {
    id: 'doc-6',
    filename: 'Network Security Architecture.pdf',
    type: 'Architecture',
    version: 'v1.5',
    status: 'Ready',
    uploadedDate: '2025-01-04',
    uploadedBy: 'Fajar Nugroho',
    size: '4.7 MB',
    usedInAssessment: true
  },
  {
    id: 'doc-7',
    filename: 'Vulnerability Scan Report Q4.xlsx',
    type: 'Report',
    version: 'v1.0',
    status: 'Failed',
    uploadedDate: '2025-01-09',
    uploadedBy: 'Gita Permata',
    size: '1.2 MB',
    usedInAssessment: false
  }
];

export const safeguards: Safeguard[] = [
  {
    id: 'sg-1',
    cisId: '1.1',
    name: 'Establish and Maintain Detailed Enterprise Asset Inventory',
    description: 'Establish and maintain an accurate, detailed, and up-to-date inventory of all enterprise assets with the potential to store or process data.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Asset inventory is documented and maintained', met: true },
      { id: 'c2', text: 'Inventory includes all hardware assets', met: true },
      { id: 'c3', text: 'Inventory is updated at least quarterly', met: true }
    ],
    evidence: ['Asset_Inventory_2025.xlsx'],
    suggestedFix: '',
    owner: 'Ahmad Wijaya',
    dueDate: '2025-02-15'
  },
  {
    id: 'sg-2',
    cisId: '1.2',
    name: 'Address Unauthorized Assets',
    description: 'Ensure that a process exists to address unauthorized assets on a weekly basis.',
    status: 'Partial',
    criteria: [
      { id: 'c1', text: 'Process for identifying unauthorized assets exists', met: true },
      { id: 'c2', text: 'Weekly review is conducted', met: false },
      { id: 'c3', text: 'Unauthorized assets are remediated within SLA', met: false }
    ],
    evidence: ['Asset_Inventory_2025.xlsx'],
    suggestedFix: 'Implement automated asset discovery and establish weekly review cadence with IT operations.',
    owner: 'Budi Santoso',
    dueDate: '2025-02-28'
  },
  {
    id: 'sg-3',
    cisId: '2.1',
    name: 'Establish and Maintain a Software Inventory',
    description: 'Establish and maintain a detailed inventory of all licensed software installed on enterprise assets.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Software inventory is documented', met: true },
      { id: 'c2', text: 'All licensed software is tracked', met: true }
    ],
    evidence: ['Asset_Inventory_2025.xlsx'],
    suggestedFix: '',
    owner: 'Fajar Nugroho',
    dueDate: '2025-02-15'
  },
  {
    id: 'sg-4',
    cisId: '2.2',
    name: 'Ensure Authorized Software is Currently Supported',
    description: 'Ensure that only currently supported software is designated as authorized.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Software support status is tracked', met: true },
      { id: 'c2', text: 'Unsupported software is identified', met: true },
      { id: 'c3', text: 'Remediation plan exists for unsupported software', met: true }
    ],
    evidence: ['Asset_Inventory_2025.xlsx'],
    suggestedFix: '',
    owner: 'Dewi Lestari',
    dueDate: '2025-02-20'
  },
  {
    id: 'sg-5',
    cisId: '3.1',
    name: 'Establish and Maintain a Data Management Process',
    description: 'Establish and maintain a data management process.',
    status: 'Gap',
    criteria: [
      { id: 'c1', text: 'Data classification scheme is defined', met: false },
      { id: 'c2', text: 'Data handling procedures exist', met: false },
      { id: 'c3', text: 'Data owners are assigned', met: false }
    ],
    evidence: [],
    suggestedFix: 'Define data classification scheme (Public, Internal, Confidential, Restricted). Assign data owners for critical systems.',
    owner: 'Siti Rahayu',
    dueDate: '2025-03-15'
  },
  {
    id: 'sg-6',
    cisId: '3.4',
    name: 'Enforce Data Retention',
    description: 'Retain data according to the enterprise data management process.',
    status: 'Partial',
    criteria: [
      { id: 'c1', text: 'Data retention policy exists', met: true },
      { id: 'c2', text: 'Retention schedules are defined', met: true },
      { id: 'c3', text: 'Automated enforcement is in place', met: false }
    ],
    evidence: ['Data_Protection_Policy.pdf'],
    suggestedFix: 'Implement automated data lifecycle management for email and file storage systems.',
    owner: 'Siti Rahayu',
    dueDate: '2025-03-01'
  },
  {
    id: 'sg-7',
    cisId: '4.1',
    name: 'Establish and Maintain a Secure Configuration Process',
    description: 'Establish and maintain a secure configuration process for enterprise assets.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Secure configuration baselines are defined', met: true },
      { id: 'c2', text: 'Configuration standards are documented', met: true },
      { id: 'c3', text: 'Process for maintaining configurations exists', met: true }
    ],
    evidence: ['Secure_Configuration_Standards.pdf'],
    suggestedFix: '',
    owner: 'Fajar Nugroho',
    dueDate: '2025-02-15'
  },
  {
    id: 'sg-8',
    cisId: '4.7',
    name: 'Manage Default Accounts on Enterprise Assets and Software',
    description: 'Manage default accounts on enterprise assets and software.',
    status: 'Partial',
    criteria: [
      { id: 'c1', text: 'Default account inventory exists', met: true },
      { id: 'c2', text: 'Default passwords are changed', met: true },
      { id: 'c3', text: 'Unnecessary default accounts are disabled', met: false }
    ],
    evidence: ['Access_Control_Procedures.docx'],
    suggestedFix: 'Complete audit of default accounts across all systems and disable unnecessary accounts.',
    owner: 'Budi Santoso',
    dueDate: '2025-02-28'
  },
  {
    id: 'sg-9',
    cisId: '5.1',
    name: 'Establish and Maintain an Inventory of Accounts',
    description: 'Establish and maintain an inventory of all accounts managed in the enterprise.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Account inventory is maintained', met: true },
      { id: 'c2', text: 'Service accounts are documented', met: true }
    ],
    evidence: ['Access_Control_Procedures.docx'],
    suggestedFix: '',
    owner: 'Budi Santoso',
    dueDate: '2025-02-15'
  },
  {
    id: 'sg-10',
    cisId: '5.2',
    name: 'Use Unique Passwords',
    description: 'Use unique passwords for all enterprise assets.',
    status: 'Gap',
    criteria: [
      { id: 'c1', text: 'Password policy enforces uniqueness', met: false },
      { id: 'c2', text: 'Password manager is deployed', met: false },
      { id: 'c3', text: 'Shared passwords are eliminated', met: false }
    ],
    evidence: [],
    suggestedFix: 'Deploy enterprise password manager. Update password policy to require unique passwords per system.',
    owner: 'Budi Santoso',
    dueDate: '2025-03-30'
  },
  {
    id: 'sg-11',
    cisId: '5.3',
    name: 'Disable Dormant Accounts',
    description: 'Delete or disable any dormant accounts after a period of 45 days of inactivity.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Automated dormant account detection', met: true },
      { id: 'c2', text: 'Accounts disabled after 45 days inactivity', met: true }
    ],
    evidence: ['Access_Control_Procedures.docx'],
    suggestedFix: '',
    owner: 'Budi Santoso',
    dueDate: '2025-02-15'
  },
  {
    id: 'sg-12',
    cisId: '6.1',
    name: 'Establish an Access Granting Process',
    description: 'Establish and follow a process, preferably automated, for granting access to enterprise assets.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Access request process is documented', met: true },
      { id: 'c2', text: 'Approval workflow exists', met: true },
      { id: 'c3', text: 'Access is provisioned based on role', met: true }
    ],
    evidence: ['Access_Control_Procedures.docx'],
    suggestedFix: '',
    owner: 'Budi Santoso',
    dueDate: '2025-02-15'
  },
  {
    id: 'sg-13',
    cisId: '6.2',
    name: 'Establish an Access Revoking Process',
    description: 'Establish and follow a process, preferably automated, for revoking access to enterprise assets.',
    status: 'Partial',
    criteria: [
      { id: 'c1', text: 'Offboarding process includes access revocation', met: true },
      { id: 'c2', text: 'Access revoked within 24 hours of termination', met: false },
      { id: 'c3', text: 'Automated integration with HR systems', met: false }
    ],
    evidence: ['Access_Control_Procedures.docx'],
    suggestedFix: 'Integrate IAM system with HR for automated offboarding. Establish 24-hour SLA for access revocation.',
    owner: 'Budi Santoso',
    dueDate: '2025-03-15'
  },
  {
    id: 'sg-14',
    cisId: '7.1',
    name: 'Establish and Maintain a Vulnerability Management Process',
    description: 'Establish and maintain a documented vulnerability management process for enterprise assets.',
    status: 'Gap',
    criteria: [
      { id: 'c1', text: 'Vulnerability scanning is performed regularly', met: false },
      { id: 'c2', text: 'Remediation SLAs are defined', met: false },
      { id: 'c3', text: 'Vulnerability tracking system exists', met: false }
    ],
    evidence: [],
    suggestedFix: 'Deploy vulnerability scanner. Define remediation SLAs by severity (Critical: 7 days, High: 30 days).',
    owner: 'Eko Prasetyo',
    dueDate: '2025-03-30'
  },
  {
    id: 'sg-15',
    cisId: '8.1',
    name: 'Establish and Maintain an Audit Log Management Process',
    description: 'Establish and maintain an audit log management process.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Logging standards are defined', met: true },
      { id: 'c2', text: 'Log retention requirements are documented', met: true },
      { id: 'c3', text: 'Centralized log management exists', met: true }
    ],
    evidence: ['Secure_Configuration_Standards.pdf'],
    suggestedFix: '',
    owner: 'Eko Prasetyo',
    dueDate: '2025-02-15'
  },
  {
    id: 'sg-16',
    cisId: '8.2',
    name: 'Collect Audit Logs',
    description: 'Collect audit logs from enterprise assets.',
    status: 'Covered',
    criteria: [
      { id: 'c1', text: 'Audit logs collected from critical systems', met: true },
      { id: 'c2', text: 'SIEM or log aggregator deployed', met: true }
    ],
    evidence: ['Secure_Configuration_Standards.pdf'],
    suggestedFix: '',
    owner: 'Eko Prasetyo',
    dueDate: '2025-02-15'
  },
  {
    id: 'sg-17',
    cisId: '14.1',
    name: 'Establish and Maintain a Security Awareness Program',
    description: 'Establish and maintain a security awareness program.',
    status: 'Partial',
    criteria: [
      { id: 'c1', text: 'Security awareness program exists', met: true },
      { id: 'c2', text: 'Training is conducted annually', met: true },
      { id: 'c3', text: 'Training completion is tracked', met: false },
      { id: 'c4', text: 'New hire training within 30 days', met: false }
    ],
    evidence: ['Security_Awareness_Training.pdf'],
    suggestedFix: 'Implement LMS to track training completion. Add security training to onboarding checklist.',
    owner: 'Gita Permata',
    dueDate: '2025-03-15'
  },
  {
    id: 'sg-18',
    cisId: '14.2',
    name: 'Train Workforce Members to Recognize Social Engineering Attacks',
    description: 'Train workforce members to recognize social engineering attacks.',
    status: 'Gap',
    criteria: [
      { id: 'c1', text: 'Phishing simulation program exists', met: false },
      { id: 'c2', text: 'Social engineering training is conducted', met: false }
    ],
    evidence: [],
    suggestedFix: 'Deploy phishing simulation platform. Conduct quarterly simulations with remedial training.',
    owner: 'Gita Permata',
    dueDate: '2025-04-15'
  }
];

export const assessments: Assessment[] = [
  {
    id: 'asmt-1',
    name: 'CIS IG1 Assessment - January 2025',
    framework: 'CIS Controls v8 - IG1',
    status: 'In Progress',
    progress: 65,
    createdDate: '2025-01-05',
    dueDate: '2025-03-31',
    owner: 'Ahmad Wijaya',
    safeguards: safeguards
  },
  {
    id: 'asmt-2',
    name: 'CIS IG1 Assessment - Q4 2024',
    framework: 'CIS Controls v8 - IG1',
    status: 'Approved',
    progress: 100,
    createdDate: '2024-10-01',
    dueDate: '2024-12-31',
    owner: 'Siti Rahayu',
    safeguards: safeguards.slice(0, 10)
  },
  {
    id: 'asmt-3',
    name: 'CIS IG1 Assessment - Q2 2025 (Draft)',
    framework: 'CIS Controls v8 - IG1',
    status: 'Draft',
    progress: 0,
    createdDate: '2025-01-18',
    dueDate: '2025-06-30',
    owner: 'Ahmad Wijaya',
    safeguards: []
  },
  {
    id: 'asmt-4',
    name: 'CIS IG1 Assessment - Q3 2024',
    framework: 'CIS Controls v8 - IG1',
    status: 'Locked',
    progress: 100,
    createdDate: '2024-07-01',
    dueDate: '2024-09-30',
    owner: 'Dewi Lestari',
    safeguards: safeguards.slice(0, 12)
  }
];

export const findings: Finding[] = [
  {
    id: 'find-1',
    title: 'Weekly unauthorized asset review not conducted',
    safeguardId: '1.2',
    assessmentName: 'CIS IG1 Assessment - January 2025',
    priority: 'Medium',
    status: 'Open',
    owner: 'Budi Santoso',
    dueDate: '2025-02-28',
    createdDate: '2025-01-20'
  },
  {
    id: 'find-2',
    title: 'Data classification scheme not defined',
    safeguardId: '3.1',
    assessmentName: 'CIS IG1 Assessment - January 2025',
    priority: 'High',
    status: 'In Progress',
    owner: 'Siti Rahayu',
    dueDate: '2025-03-15',
    createdDate: '2025-01-18'
  },
  {
    id: 'find-3',
    title: 'Automated data retention not enforced',
    safeguardId: '3.4',
    assessmentName: 'CIS IG1 Assessment - January 2025',
    priority: 'Medium',
    status: 'Open',
    owner: 'Siti Rahayu',
    dueDate: '2025-03-01',
    createdDate: '2025-01-15'
  },
  {
    id: 'find-4',
    title: 'Default accounts not fully disabled',
    safeguardId: '4.7',
    assessmentName: 'CIS IG1 Assessment - January 2025',
    priority: 'High',
    status: 'Open',
    owner: 'Budi Santoso',
    dueDate: '2025-02-28',
    createdDate: '2025-01-22'
  },
  {
    id: 'find-5',
    title: 'No enterprise password manager deployed',
    safeguardId: '5.2',
    assessmentName: 'CIS IG1 Assessment - January 2025',
    priority: 'Critical',
    status: 'Open',
    owner: 'Budi Santoso',
    dueDate: '2025-03-30',
    createdDate: '2025-01-10'
  },
  {
    id: 'find-6',
    title: 'Access revocation exceeds 24-hour SLA',
    safeguardId: '6.2',
    assessmentName: 'CIS IG1 Assessment - January 2025',
    priority: 'High',
    status: 'In Progress',
    owner: 'Budi Santoso',
    dueDate: '2025-03-15',
    createdDate: '2025-01-22'
  },
  {
    id: 'find-7',
    title: 'Vulnerability management process not established',
    safeguardId: '7.1',
    assessmentName: 'CIS IG1 Assessment - January 2025',
    priority: 'Critical',
    status: 'Open',
    owner: 'Eko Prasetyo',
    dueDate: '2025-03-30',
    createdDate: '2025-01-20'
  },
  {
    id: 'find-8',
    title: 'Training completion not tracked in LMS',
    safeguardId: '14.1',
    assessmentName: 'CIS IG1 Assessment - January 2025',
    priority: 'Medium',
    status: 'Open',
    owner: 'Gita Permata',
    dueDate: '2025-03-15',
    createdDate: '2025-01-18'
  },
  {
    id: 'find-9',
    title: 'No phishing simulation program',
    safeguardId: '14.2',
    assessmentName: 'CIS IG1 Assessment - January 2025',
    priority: 'High',
    status: 'Open',
    owner: 'Gita Permata',
    dueDate: '2025-04-15',
    createdDate: '2025-01-20'
  },
  {
    id: 'find-10',
    title: 'Quarterly access review incomplete',
    safeguardId: '5.1',
    assessmentName: 'CIS IG1 Assessment - Q4 2024',
    priority: 'Medium',
    status: 'Resolved',
    owner: 'Budi Santoso',
    dueDate: '2024-12-15',
    createdDate: '2024-10-10'
  },
  {
    id: 'find-11',
    title: 'Software inventory outdated',
    safeguardId: '2.1',
    assessmentName: 'CIS IG1 Assessment - Q4 2024',
    priority: 'Low',
    status: 'Resolved',
    owner: 'Fajar Nugroho',
    dueDate: '2024-11-30',
    createdDate: '2024-10-05'
  },
  {
    id: 'find-12',
    title: 'Audit log retention policy not enforced',
    safeguardId: '8.1',
    assessmentName: 'CIS IG1 Assessment - January 2025',
    priority: 'Medium',
    status: 'Open',
    owner: 'Eko Prasetyo',
    dueDate: '2025-02-28',
    createdDate: '2025-01-22'
  }
];

export const dashboardStats = {
  maturityScore: 3.8,
  maxScore: 5.0,
  openFindings: findings.filter(f => f.status === 'Open').length,
  totalFindings: findings.length,
  safeguardsTotal: 56,
  coverageBreakdown: {
    covered: 32,
    partial: 13,
    gap: 11
  },
  pendingReview: assessments.filter(a => a.status === 'Pending Review').length + 2
};

export const teamMembers = [
  { id: 'user-1', name: 'Ahmad Wijaya', role: 'Security Manager', avatar: 'AW' },
  { id: 'user-2', name: 'Siti Rahayu', role: 'Data Protection Officer', avatar: 'SR' },
  { id: 'user-3', name: 'Budi Santoso', role: 'IAM Lead', avatar: 'BS' },
  { id: 'user-4', name: 'Dewi Lestari', role: 'Security Analyst', avatar: 'DL' },
  { id: 'user-5', name: 'Eko Prasetyo', role: 'Security Engineer', avatar: 'EP' },
  { id: 'user-6', name: 'Fajar Nugroho', role: 'Infrastructure Lead', avatar: 'FN' },
  { id: 'user-7', name: 'Gita Permata', role: 'Training Coordinator', avatar: 'GP' }
];
