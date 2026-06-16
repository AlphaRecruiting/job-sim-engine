import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-recruiting' },
    update: {},
    create: {
      name: 'Acme Recruiting',
      slug: 'acme-recruiting',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'admin@acme.com',
      name: 'Admin User',
      role: 'admin',
    },
  });

  const job = await prisma.jobPosting.create({
    data: {
      organizationId: org.id,
      title: 'Account Executive - Mid-Market',
      description: `We are looking for a driven Account Executive to join our growing sales team.
You will own the full sales cycle from prospecting to close for mid-market accounts ($50k-$200k ARR).

Responsibilities:
- Manage a pipeline of 50+ opportunities
- Run discovery calls and product demos
- Handle objections and negotiate contracts
- Collaborate with SDRs, CS, and SE teams
- Maintain CRM hygiene and accurate forecasting

Requirements:
- 3+ years B2B SaaS sales experience
- Proven track record of quota attainment
- Strong discovery and objection handling skills
- Experience with CRM tools (Salesforce, HubSpot)`,
      department: 'Sales',
      seniority: 'mid',
      employmentType: 'full_time',
      remotePolicy: 'hybrid',
      status: 'published',
      createdByUserId: admin.id,
    },
  });

  const simulation = await prisma.simulation.create({
    data: {
      organizationId: org.id,
      jobPostingId: job.id,
      title: 'AE Sales Simulation',
      description: 'A realistic work simulation for Account Executive candidates covering CRM management, communication, and live discovery call skills.',
      estimatedDurationMinutes: 45,
      status: 'draft',
      createdByUserId: admin.id,
    },
  });

  await prisma.simulationStep.createMany({
    data: [
      {
        organizationId: org.id,
        simulationId: simulation.id,
        orderIndex: 0,
        type: 'crm_prioritization',
        title: 'Prioritize Your Pipeline',
        instructions: 'You have just started your Monday morning. Review your CRM pipeline and rank the top 5 accounts you should focus on today. Explain your reasoning.',
        timeLimitSeconds: 600,
        config: {
          scenarioContext: 'It is Monday morning at 9am. You have 8 active opportunities in your pipeline. You need to decide where to focus your energy today.',
          taskPrompt: 'Rank the top 5 accounts by priority for today. Explain why you chose this order.',
          records: [
            { id: 'opp-1', displayName: 'Northstar Logistics', company: 'Northstar Logistics', value: 85000, stage: 'Proposal', lastActivityAt: '2024-01-08', healthScore: 72, visibleSignals: ['Demo completed last week', 'Champion engaged', 'RFP received'], hiddenPriorityScore: 95, hiddenRationale: 'High value, late stage, active champion - close this week' },
            { id: 'opp-2', displayName: 'BluePeak Tech', company: 'BluePeak Tech', value: 45000, stage: 'Discovery', lastActivityAt: '2024-01-05', healthScore: 40, visibleSignals: ['Initial call done', 'Follow-up email sent, no reply', '2 weeks since last contact'], hiddenPriorityScore: 30, hiddenRationale: 'Going cold - needs a break-up email or final push' },
            { id: 'opp-3', displayName: 'Meridian Health', company: 'Meridian Health', value: 120000, stage: 'Negotiation', lastActivityAt: '2024-01-09', healthScore: 88, visibleSignals: ['Legal review in progress', 'Contract sent', 'Close date: this Friday'], hiddenPriorityScore: 99, hiddenRationale: 'About to close, legal is the last hurdle - call legal today' },
            { id: 'opp-4', displayName: 'GreenPath Logistics', company: 'GreenPath Logistics', value: 25000, stage: 'Prospecting', lastActivityAt: '2023-12-20', healthScore: 20, visibleSignals: ['Cold outreach only', 'No replies yet'], hiddenPriorityScore: 10, hiddenRationale: 'Too early and too cold - deprioritize' },
            { id: 'opp-5', displayName: 'Cascade Systems', company: 'Cascade Systems', value: 65000, stage: 'Demo Scheduled', lastActivityAt: '2024-01-09', healthScore: 75, visibleSignals: ['Demo tomorrow at 2pm', 'VP Sales attending', 'Pre-read sent'], hiddenPriorityScore: 85, hiddenRationale: 'Demo tomorrow - must prepare today' },
            { id: 'opp-6', displayName: 'Apex Manufacturing', company: 'Apex Manufacturing', value: 180000, stage: 'Proposal', lastActivityAt: '2024-01-03', healthScore: 55, visibleSignals: ['Proposal sent 1 week ago', 'No response yet', 'Evaluating 3 vendors'], hiddenPriorityScore: 70, hiddenRationale: 'High value but competitive situation - follow up today' },
            { id: 'opp-7', displayName: 'SilverLine Media', company: 'SilverLine Media', value: 30000, stage: 'Discovery', lastActivityAt: '2024-01-08', healthScore: 65, visibleSignals: ['Good discovery call', 'Budget confirmed', 'Timeline: Q2'], hiddenPriorityScore: 45, hiddenRationale: 'Qualified but Q2 timeline means less urgency today' },
            { id: 'opp-8', displayName: 'Frontier Capital', company: 'Frontier Capital', value: 95000, stage: 'Demo Scheduled', lastActivityAt: '2024-01-07', healthScore: 80, visibleSignals: ['Demo in 3 days', 'CFO and VP Ops attending', 'Security questionnaire pending'], hiddenPriorityScore: 78, hiddenRationale: 'Important demo this week - send security questionnaire today' },
          ],
          maxRankedItems: 5,
          requiredExplanation: true,
          expectedTopRecordIds: ['opp-3', 'opp-1', 'opp-5', 'opp-6', 'opp-8'],
          scoringWeights: { topChoiceAccuracy: 0.35, rankingQuality: 0.30, explanationQuality: 0.25, riskAwareness: 0.10 },
        },
        scoringConfig: {
          mode: 'hybrid',
          deterministicWeight: 0.6,
          aiWeight: 0.4,
        },
        skillMapping: [
          { skill: 'Pipeline Management', weight: 0.5 },
          { skill: 'Business Judgment', weight: 0.3 },
          { skill: 'Communication', weight: 0.2 },
        ],
      },
      {
        organizationId: org.id,
        simulationId: simulation.id,
        orderIndex: 1,
        type: 'notification_reaction',
        title: 'Handle Incoming Messages',
        instructions: 'You have 10 minutes to handle these incoming messages from various stakeholders. Choose the best action for each and draft any replies needed.',
        timeLimitSeconds: 600,
        config: {
          scenarioContext: 'It is 10am Monday. You are mid-way through your morning call prep when these messages arrive simultaneously.',
          taskPrompt: 'Handle each message appropriately. Some require immediate action, some can wait.',
          notifications: [
            { id: 'n-1', senderName: 'Sarah Chen', senderRole: 'Champion at Meridian Health', channel: 'slack', timestampOffsetMinutes: 0, message: 'Hey! Just heard from legal - they have one more question about data residency before they can sign. Can we jump on a call today?', visibleMetadata: {}, hiddenUrgency: 98, hiddenImportance: 99, expectedActionTypes: ['reply', 'schedule_followup'], hiddenRationale: 'This is a deal-blocking question from your champion on a closing deal - respond immediately' },
            { id: 'n-2', senderName: 'Your Manager', senderRole: 'Sales Manager', channel: 'slack', timestampOffsetMinutes: 2, message: 'Quick reminder - forecast call is at 3pm. Please update your opportunities in Salesforce before then.', visibleMetadata: {}, hiddenUrgency: 60, hiddenImportance: 70, expectedActionTypes: ['create_task', 'reply'], hiddenRationale: 'Important but not urgent right now - schedule it for before 3pm' },
            { id: 'n-3', senderName: 'Newsletter Bot', senderRole: 'Marketing Automation', channel: 'email', timestampOffsetMinutes: 5, message: 'Your weekly digest: 3 new blog posts, upcoming webinar, and product updates.', visibleMetadata: {}, hiddenUrgency: 2, hiddenImportance: 5, expectedActionTypes: ['ignore'], hiddenRationale: 'Noise - ignore entirely' },
            { id: 'n-4', senderName: 'Michael Torres', senderRole: 'VP Sales at Cascade Systems', channel: 'email', timestampOffsetMinutes: 8, message: 'Looking forward to our demo tomorrow. Quick question - can you include a slide on how you handle multi-region deployments? We have offices in 3 countries.', visibleMetadata: {}, hiddenUrgency: 85, hiddenImportance: 90, expectedActionTypes: ['reply', 'create_task'], hiddenRationale: 'Demo prep request from a key stakeholder attending tomorrow - must respond and update demo' },
            { id: 'n-5', senderName: 'HR Team', senderRole: 'Internal HR', channel: 'email', timestampOffsetMinutes: 10, message: 'Please complete your mandatory compliance training by end of quarter.', visibleMetadata: {}, hiddenUrgency: 10, hiddenImportance: 30, expectedActionTypes: ['create_task', 'ignore'], hiddenRationale: 'Quarter is not ending this week - schedule for later' },
          ],
          allowedActions: ['reply', 'ignore', 'escalate', 'schedule_followup', 'create_task', 'ask_clarification'],
          scoringWeights: { actionChoice: 0.4, prioritization: 0.3, communication: 0.2, escalationJudgment: 0.1 },
        },
        skillMapping: [
          { skill: 'Prioritization', weight: 0.4 },
          { skill: 'Communication', weight: 0.4 },
          { skill: 'Judgment', weight: 0.2 },
        ],
      },
      {
        organizationId: org.id,
        simulationId: simulation.id,
        orderIndex: 2,
        type: 'email_response',
        title: 'Write a Follow-Up Email',
        instructions: 'Read the email thread below and write a professional follow-up response.',
        timeLimitSeconds: 900,
        config: {
          scenarioContext: 'You are following up after a discovery call with a prospect who seemed interested but had several concerns.',
          emailThread: [
            { id: 'e-1', from: 'alex.morgan@apexmfg.com', to: ['you@acmecrm.com'], timestamp: '2024-01-08T14:30:00Z', subject: 'Re: AcmeCRM - Follow Up', body: 'Thanks for the demo last week. The product looks interesting but we have a few concerns:\n\n1. We tried a CRM migration 2 years ago and it was a disaster - 6 months of bad data\n2. Our sales team is resistant to new tools\n3. Budget is tight right now - our CFO is scrutinizing every new software purchase\n\nWe are also looking at SalesPro which is cheaper. What makes you different?\n\nAlex Morgan\nVP Sales, Apex Manufacturing' },
          ],
          taskPrompt: 'Write a reply to Alex that addresses their concerns, differentiates from the competitor, and proposes a clear next step.',
          expectedSignals: ['Acknowledges migration concern', 'Addresses user adoption', 'ROI/business case for CFO', 'Competitive differentiation', 'Clear next step', 'Empathetic tone'],
          redFlags: ['Dismisses concerns', 'Aggressive close', 'Discounts immediately', 'No next step', 'Generic response that ignores their specific concerns'],
          rubric: [
            { key: 'concern_acknowledgment', label: 'Concern acknowledgment', maxScore: 20, description: 'Does the candidate acknowledge each concern specifically rather than generically?' },
            { key: 'migration_risk', label: 'Migration risk handling', maxScore: 20, description: 'Does the candidate address the migration risk with a concrete solution?' },
            { key: 'roi_articulation', label: 'ROI and CFO framing', maxScore: 20, description: 'Does the candidate help Alex build a business case for the CFO?' },
            { key: 'competitive_response', label: 'Competitive differentiation', maxScore: 15, description: 'Does the candidate differentiate from SalesPro without being disparaging?' },
            { key: 'next_step', label: 'Clear next step', maxScore: 15, description: 'Does the candidate propose a specific, low-friction next step?' },
            { key: 'tone', label: 'Tone and professionalism', maxScore: 10, description: 'Is the tone empathetic, confident, and professional?' },
          ],
        },
        skillMapping: [
          { skill: 'Written Communication', weight: 0.4 },
          { skill: 'Objection Handling', weight: 0.4 },
          { skill: 'Customer Empathy', weight: 0.2 },
        ],
      },
      {
        organizationId: org.id,
        simulationId: simulation.id,
        orderIndex: 3,
        type: 'simulated_call',
        title: 'Discovery Call with Jordan',
        instructions: 'You will speak with Jordan, VP Sales at Northstar Logistics, who booked a call after downloading a guide about sales pipeline visibility. Your goal is to understand their situation, qualify the opportunity, handle concerns, and agree on a next step. You have 12 minutes.',
        timeLimitSeconds: 720,
        config: {
          callType: 'sales_discovery',
          title: 'Discovery Call - Northstar Logistics',
          publicCandidateBrief: 'You are an Account Executive at AcmeCRM. You are speaking with Jordan, VP Sales at Northstar Logistics. Jordan booked a call after downloading a guide about improving sales pipeline visibility. Your goal is to understand their situation, qualify the opportunity, handle concerns, and agree on the next best step. You have 12 minutes.',
          estimatedDurationSeconds: 720,
          maxDurationSeconds: 780,
          aiPersona: {
            name: 'Jordan',
            role: 'VP Sales',
            company: 'Northstar Logistics',
            personality: 'Professional, direct, busy. Skeptical of sales pitches but open if the value is clear. Gets impatient with generic questions.',
            communicationStyle: 'Concise. Prefers specifics over generalities. Will ask "so what?" if value is not clear.',
            baselineMood: 'skeptical',
          },
          publicBusinessContext: {
            candidateCompany: 'AcmeCRM',
            productOrService: 'CRM and sales pipeline management software',
            valueProposition: 'Helps sales teams close deals faster with better pipeline visibility, forecasting, and automation',
            knownContext: ['Jordan downloaded a guide on pipeline visibility', 'Northstar Logistics is a mid-size logistics company', 'Jordan leads a sales team'],
          },
          hiddenBuyerState: {
            initialInterestLevel: 45,
            initialTrustLevel: 30,
            initialUrgencyLevel: 25,
            hiddenObjections: [
              { id: 'obj-1', type: 'trust', description: 'Had a bad CRM migration experience 2 years ago - lost data and productivity for 6 months', revealCondition: 'Candidate asks about current CRM or past technology experience', resolutionCondition: 'Candidate acknowledges the risk and explains migration support process', severity: 'high' },
              { id: 'obj-2', type: 'budget', description: 'CFO is blocking new software spend unless clear ROI is demonstrated', revealCondition: 'Candidate asks about budget or decision process', resolutionCondition: 'Candidate helps Jordan articulate a business case with measurable ROI', severity: 'high' },
              { id: 'obj-3', type: 'internal_resistance', description: 'Sales team resists new tools - they hated the last CRM switch', revealCondition: 'Candidate asks about the team or adoption challenges', resolutionCondition: 'Candidate addresses change management and adoption support', severity: 'medium' },
              { id: 'obj-4', type: 'competition', description: 'Also evaluating a cheaper competitor (SalesPro)', revealCondition: 'Candidate asks if they are evaluating other solutions', resolutionCondition: 'Candidate differentiates on value rather than just features or price', severity: 'medium' },
            ],
            buyingCriteria: [
              { id: 'bc-1', criterion: 'Easy migration with no data loss', importance: 'critical' },
              { id: 'bc-2', criterion: 'Clear ROI to present to CFO', importance: 'critical' },
              { id: 'bc-3', criterion: 'Team adoption and ease of use', importance: 'high' },
              { id: 'bc-4', criterion: 'Pipeline visibility and forecasting accuracy', importance: 'high' },
            ],
            dealBreakers: ['Candidate dismisses migration risk', 'Candidate cannot explain ROI clearly', 'Candidate pressures for immediate commitment'],
          },
          allowedOutcomes: ['no_next_step', 'send_information', 'schedule_follow_up', 'schedule_demo', 'introduce_stakeholder'],
          guardrails: {
            doNotRevealHiddenObjectionsDirectly: true,
            requireCandidateDiscoveryBeforeRevealingObjections: true,
            preventEasyAgreement: true,
            stayInPersona: true,
            refuseOutOfScenarioRequests: true,
            maxBuyerTalkRatio: 0.35,
          },
          scoringRubric: [
            { key: 'discovery_quality', label: 'Discovery quality', maxScore: 15, description: 'Did the candidate ask open, insightful discovery questions?' },
            { key: 'active_listening', label: 'Active listening', maxScore: 10, description: 'Did the candidate listen and build on what Jordan said?' },
            { key: 'pain_identification', label: 'Business pain identification', maxScore: 15, description: 'Did the candidate identify and quantify business pain?' },
            { key: 'qualification', label: 'Qualification', maxScore: 10, description: 'Did the candidate qualify budget, authority, need, and timeline?' },
            { key: 'objection_handling', label: 'Objection handling', maxScore: 20, description: 'How well did the candidate handle revealed concerns?' },
            { key: 'value_articulation', label: 'Value articulation', maxScore: 15, description: 'Did the candidate link product value to Jordan\'s specific needs?' },
            { key: 'next_step', label: 'Next-step closing', maxScore: 10, description: 'Did the candidate secure a clear, agreed next step?' },
            { key: 'professionalism', label: 'Professionalism', maxScore: 5, description: 'Was the candidate professional, respectful, and concise?' },
          ],
        },
        skillMapping: [
          { skill: 'Discovery', weight: 0.25 },
          { skill: 'Objection Handling', weight: 0.25 },
          { skill: 'Active Listening', weight: 0.2 },
          { skill: 'Value Articulation', weight: 0.2 },
          { skill: 'Closing', weight: 0.1 },
        ],
      },
    ],
  });

  console.log('Seed complete:', { org: org.slug, job: job.title, simulation: simulation.title });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
