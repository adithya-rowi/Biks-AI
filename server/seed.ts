import { storage } from "./storage";

const CIS_IG1_SAFEGUARDS = [
  { cisId: "1.1", name: "Establish and Maintain Detailed Enterprise Asset Inventory", assetType: "Devices", securityFunction: "Identify" },
  { cisId: "1.2", name: "Address Unauthorized Assets", assetType: "Devices", securityFunction: "Respond" },
  { cisId: "2.1", name: "Establish and Maintain a Software Inventory", assetType: "Applications", securityFunction: "Identify" },
  { cisId: "2.2", name: "Ensure Authorized Software is Currently Supported", assetType: "Applications", securityFunction: "Identify" },
  { cisId: "2.3", name: "Address Unauthorized Software", assetType: "Applications", securityFunction: "Respond" },
  { cisId: "4.1", name: "Establish and Maintain a Secure Configuration Process", assetType: "Devices", securityFunction: "Protect" },
  { cisId: "4.2", name: "Establish and Maintain a Secure Configuration Process for Network Infrastructure", assetType: "Network", securityFunction: "Protect" },
  { cisId: "5.1", name: "Establish and Maintain an Inventory of Accounts", assetType: "Users", securityFunction: "Identify" },
  { cisId: "5.2", name: "Use Unique Passwords", assetType: "Users", securityFunction: "Protect" },
  { cisId: "5.3", name: "Disable Dormant Accounts", assetType: "Users", securityFunction: "Protect" },
  { cisId: "5.4", name: "Restrict Administrator Privileges to Dedicated Administrator Accounts", assetType: "Users", securityFunction: "Protect" },
  { cisId: "6.1", name: "Establish an Access Granting Process", assetType: "Data", securityFunction: "Protect" },
  { cisId: "6.2", name: "Establish an Access Revoking Process", assetType: "Data", securityFunction: "Protect" },
  { cisId: "7.1", name: "Establish and Maintain a Data Management Process", assetType: "Data", securityFunction: "Protect" },
  { cisId: "7.2", name: "Establish and Maintain a Data Inventory", assetType: "Data", securityFunction: "Identify" },
  { cisId: "7.3", name: "Establish and Maintain a Data Classification Scheme", assetType: "Data", securityFunction: "Identify" },
  { cisId: "7.4", name: "Establish and Maintain Data Retention", assetType: "Data", securityFunction: "Protect" },
  { cisId: "8.1", name: "Establish and Maintain an Audit Log Management Process", assetType: "Devices", securityFunction: "Detect" },
  { cisId: "8.2", name: "Collect Audit Logs", assetType: "Network", securityFunction: "Detect" },
  { cisId: "8.3", name: "Ensure Adequate Audit Log Storage", assetType: "Devices", securityFunction: "Detect" },
  { cisId: "9.1", name: "Ensure Use of Only Fully Supported Browsers and Email Clients", assetType: "Applications", securityFunction: "Protect" },
  { cisId: "9.2", name: "Use DNS Filtering Services", assetType: "Network", securityFunction: "Protect" },
  { cisId: "9.3", name: "Maintain and Enforce Network-Based URL Filters", assetType: "Network", securityFunction: "Protect" },
  { cisId: "10.1", name: "Deploy and Maintain Anti-Malware Software", assetType: "Devices", securityFunction: "Protect" },
  { cisId: "10.2", name: "Configure Automatic Anti-Malware Signature Updates", assetType: "Devices", securityFunction: "Protect" },
  { cisId: "10.3", name: "Disable Autorun and Autoplay for Removable Media", assetType: "Devices", securityFunction: "Protect" },
  { cisId: "10.4", name: "Configure Automatic Anti-Malware Scanning of Removable Media", assetType: "Devices", securityFunction: "Protect" },
  { cisId: "11.1", name: "Establish and Maintain a Data Recovery Process", assetType: "Data", securityFunction: "Recover" },
  { cisId: "11.2", name: "Perform Automated Backups", assetType: "Data", securityFunction: "Recover" },
  { cisId: "11.3", name: "Protect Recovery Data", assetType: "Data", securityFunction: "Protect" },
  { cisId: "11.4", name: "Establish and Maintain an Isolated Instance of Recovery Data", assetType: "Data", securityFunction: "Recover" },
  { cisId: "12.1", name: "Ensure Network Infrastructure is Up-to-Date", assetType: "Network", securityFunction: "Protect" },
  { cisId: "12.2", name: "Establish and Maintain a Secure Network Architecture", assetType: "Network", securityFunction: "Protect" },
  { cisId: "12.3", name: "Securely Manage Network Infrastructure", assetType: "Network", securityFunction: "Protect" },
  { cisId: "13.1", name: "Centralize Security Event Alerting", assetType: "Network", securityFunction: "Detect" },
  { cisId: "13.2", name: "Deploy a Host-Based Intrusion Detection Solution", assetType: "Devices", securityFunction: "Detect" },
  { cisId: "13.3", name: "Deploy a Network Intrusion Detection Solution", assetType: "Network", securityFunction: "Detect" },
  { cisId: "14.1", name: "Establish and Maintain a Security Awareness Program", assetType: "Users", securityFunction: "Protect" },
  { cisId: "14.2", name: "Train Workforce Members to Recognize Social Engineering Attacks", assetType: "Users", securityFunction: "Protect" },
  { cisId: "14.3", name: "Train Workforce Members on Authentication Best Practices", assetType: "Users", securityFunction: "Protect" },
  { cisId: "14.4", name: "Train Workforce on Data Handling Best Practices", assetType: "Users", securityFunction: "Protect" },
  { cisId: "15.1", name: "Establish and Maintain an Inventory of Service Providers", assetType: "Devices", securityFunction: "Identify" },
  { cisId: "15.2", name: "Establish and Maintain a Service Provider Management Policy", assetType: "Devices", securityFunction: "Protect" },
  { cisId: "16.1", name: "Establish and Maintain a Secure Application Development Process", assetType: "Applications", securityFunction: "Protect" },
  { cisId: "16.2", name: "Establish and Maintain a Process to Accept and Address Software Vulnerabilities", assetType: "Applications", securityFunction: "Respond" },
  { cisId: "16.3", name: "Perform Root Cause Analysis on Security Vulnerabilities", assetType: "Applications", securityFunction: "Respond" },
  { cisId: "16.4", name: "Establish and Manage an Inventory of Third-Party Software Components", assetType: "Applications", securityFunction: "Identify" },
  { cisId: "16.5", name: "Use Up-to-Date and Trusted Third-Party Software Components", assetType: "Applications", securityFunction: "Protect" },
  { cisId: "17.1", name: "Perform a Risk Assessment", assetType: "Devices", securityFunction: "Identify" },
  { cisId: "17.2", name: "Establish and Maintain a Risk Management Program", assetType: "Devices", securityFunction: "Protect" },
  { cisId: "17.3", name: "Remediate Penetration Test Findings", assetType: "Devices", securityFunction: "Respond" },
  { cisId: "18.1", name: "Establish and Maintain a Penetration Testing Program", assetType: "Applications", securityFunction: "Detect" },
  { cisId: "18.2", name: "Perform Periodic External Penetration Tests", assetType: "Network", securityFunction: "Detect" },
  { cisId: "18.3", name: "Remediate Penetration Test Findings", assetType: "Applications", securityFunction: "Respond" },
  { cisId: "18.4", name: "Validate Security Measures", assetType: "Applications", securityFunction: "Detect" },
  { cisId: "18.5", name: "Perform Periodic Internal Penetration Tests", assetType: "Network", securityFunction: "Detect" },
];

const DEFAULT_CRITERIA = [
  "Policy or procedure document exists and is accessible",
  "Process is documented with clear requirements",
  "Implementation evidence is available",
  "Responsible party or owner is assigned",
  "Update frequency or review schedule is defined"
];

export async function seedDatabase() {
  console.log("Seeding database...");

  // Create team members
  const teamMembersData = [
    { name: "Budi Santoso", role: "IT Security Manager", email: "budi.santoso@bank.co.id", avatarColor: "#0F766E" },
    { name: "Siti Rahayu", role: "Compliance Officer", email: "siti.rahayu@bank.co.id", avatarColor: "#7C3AED" },
    { name: "Ahmad Wijaya", role: "Security Auditor", email: "ahmad.wijaya@bank.co.id", avatarColor: "#DC2626" },
    { name: "Dewi Kusuma", role: "IT Infrastructure Lead", email: "dewi.kusuma@bank.co.id", avatarColor: "#EA580C" },
    { name: "Rudi Hartono", role: "Application Security", email: "rudi.hartono@bank.co.id", avatarColor: "#0891B2" },
  ];

  for (const member of teamMembersData) {
    try {
      await storage.createTeamMember(member);
      console.log(`Created team member: ${member.name}`);
    } catch (error) {
      console.log(`Team member ${member.name} may already exist, skipping...`);
    }
  }

  // Create sample assessment
  const assessment = await storage.createAssessment({
    name: "CIS IG1 January 2025",
    framework: "CIS Controls v8 IG1",
    status: "in_progress",
    maturityScore: 62,
    controlsCovered: 18,
    controlsPartial: 22,
    controlsGap: 16,
    totalControls: 56,
    dueDate: "2025-03-31",
  });
  console.log(`Created assessment: ${assessment.name}`);

  // Create sample documents
  const documents = [
    {
      name: "Information Security Policy",
      version: "v3.0",
      type: "policy",
      status: "ready" as const,
      uploadedBy: "Siti Rahayu",
      pageCount: 45,
      fileSize: 2048000,
      referencedBy: [assessment.id],
    },
    {
      name: "Asset Management Procedure",
      version: "v1.2",
      type: "procedure",
      status: "ready" as const,
      uploadedBy: "Ahmad Wijaya",
      pageCount: 18,
      fileSize: 512000,
      referencedBy: [assessment.id],
    },
    {
      name: "Access Control Policy",
      version: "v2.1",
      type: "policy",
      status: "ready" as const,
      uploadedBy: "Budi Santoso",
      pageCount: 32,
      fileSize: 1536000,
      referencedBy: [assessment.id],
    },
  ];

  const createdDocs = [];
  for (const doc of documents) {
    const created = await storage.createDocument(doc);
    createdDocs.push(created);
    console.log(`Created document: ${created.name}`);
  }

  // Create safeguards for the assessment
  for (const sg of CIS_IG1_SAFEGUARDS) {
    const status = Math.random() > 0.7 ? 'covered' : Math.random() > 0.4 ? 'partial' : 'gap';
    const score = status === 'covered' ? 100 : status === 'partial' ? 60 : 20;
    
    const safeguard = await storage.createSafeguard({
      assessmentId: assessment.id,
      cisId: sg.cisId,
      name: sg.name,
      assetType: sg.assetType,
      securityFunction: sg.securityFunction,
      status,
      score,
      owner: teamMembersData[Math.floor(Math.random() * teamMembersData.length)].name,
      dueDate: "2025-02-28",
      remediationStatus: "not_started",
    });

    // Create criteria for first few safeguards
    if (parseFloat(sg.cisId) <= 2.3) {
      for (let i = 0; i < DEFAULT_CRITERIA.length; i++) {
        const criterionStatus = i < 3 ? 'met' : 'not_met';
        const doc = createdDocs[i % createdDocs.length];
        
        await storage.createCriterion({
          safeguardId: safeguard.id,
          text: DEFAULT_CRITERIA[i],
          status: criterionStatus,
          citationDocumentId: criterionStatus === 'met' ? doc.id : null,
          citationPage: criterionStatus === 'met' ? `p${Math.floor(Math.random() * 20) + 1}` : null,
          citationSection: criterionStatus === 'met' ? `§${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 5) + 1}` : null,
          citationExcerpt: criterionStatus === 'met' ? "The organization maintains comprehensive documentation and processes for this requirement." : null,
          citationHighlight: criterionStatus === 'met' ? "maintains comprehensive documentation" : null,
          sortOrder: i,
        });
      }

      // Add some change history
      await storage.createChangeHistory({
        safeguardId: safeguard.id,
        criterionId: null,
        actor: "Ahmad Wijaya",
        action: "Control created from assessment template",
        details: null,
      });
    }

    console.log(`Created safeguard: ${sg.cisId}`);
  }

  // Create sample findings
  const findingsData = [
    {
      assessmentId: assessment.id,
      cisId: "1.1",
      title: "Asset inventory lacks cloud resources",
      severity: "high" as const,
      impact: "Inability to track and secure cloud-based assets exposes organization to unauthorized access",
      recommendation: "Update asset inventory procedures to include cloud infrastructure discovery tools",
      status: "open" as const,
      assignedTo: "Dewi Kusuma",
      dueDate: "2025-02-15",
    },
    {
      assessmentId: assessment.id,
      cisId: "5.2",
      title: "Password policy does not enforce uniqueness",
      severity: "medium" as const,
      impact: "Users may reuse passwords across systems, increasing credential compromise risk",
      recommendation: "Implement password history checking in Active Directory",
      status: "in_progress" as const,
      assignedTo: "Budi Santoso",
      dueDate: "2025-02-20",
    },
  ];

  for (const finding of findingsData) {
    await storage.createFinding(finding);
    console.log(`Created finding: ${finding.title}`);
  }

  console.log("Database seeding completed!");
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
