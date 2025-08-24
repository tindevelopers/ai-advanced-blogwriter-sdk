/**
 * Workflow Automation Example
 * Demonstrates comprehensive workflow management with approvals and automation
 */

import { PrismaClient } from '@prisma/client';
import {
  WorkflowManager,
  ContentManagementService,
  NotificationManager,
} from '@ai-sdk/blog-writer';

async function workflowAutomationExample() {
  const prisma = new PrismaClient();

  // Configure comprehensive workflow
  const workflowConfig = {
    requireApproval: true,
    approvalMatrix: {
      technical: ['tech-lead-123', 'senior-dev-456'],
      marketing: ['marketing-manager-789', 'content-director-012'],
      general: ['editor-345'],
    },
    autoAssignment: true,
    notifications: {
      onSubmission: true,
      onApproval: true,
      onRejection: true,
      onPublish: true,
      reminderDays: [1, 3, 7],
    },
    deadlines: {
      reviewDays: 2,
      approvalDays: 1,
      escalationDays: 5,
    },
  };

  const workflowManager = new WorkflowManager(prisma, workflowConfig);
  const contentManager = new ContentManagementService(prisma, workflowConfig);
  const notificationManager = new NotificationManager(prisma);

  console.log('=== Workflow Automation Example ===');

  // ===== SETUP: CREATE SAMPLE CONTENT =====
  console.log('\n--- Setting Up Sample Content ---');

  const techPost = await contentManager.createBlogPost({
    title: 'Advanced React Hooks: Performance Optimization Techniques',
    content: `
      # Advanced React Hooks: Performance Optimization Techniques

      React Hooks have revolutionized how we write React components, but with great power comes great responsibility. In this comprehensive guide, we'll explore advanced techniques for optimizing performance using React Hooks.

      ## useMemo for Expensive Calculations

      The useMemo hook helps prevent expensive recalculations on every render:

      \`\`\`javascript
      const expensiveValue = useMemo(() => {
        return heavyCalculation(data);
      }, [data]);
      \`\`\`

      ## useCallback for Function Memoization

      Prevent unnecessary re-renders of child components by memoizing callbacks:

      \`\`\`javascript
      const handleClick = useCallback((id) => {
        setItems(items => items.filter(item => item.id !== id));
      }, []);
      \`\`\`

      ## Custom Hooks for Reusable Logic

      Create custom hooks to encapsulate and reuse stateful logic across components.
    `,
    excerpt:
      'Master advanced React Hooks patterns for optimal performance in your applications.',
    customMetadata: {
      content_type: 'technical',
      difficulty_level: 'Advanced',
      estimated_read_time: '12',
    },
    authorId: 'dev-author-123',
  });

  console.log('Created technical blog post:', techPost.blogPost.id);

  // ===== WORKFLOW SUBMISSION =====
  console.log('\n--- Workflow Submission Process ---');

  // Submit for review with comprehensive options
  const submissionResult = await contentManager.submitForReview(
    techPost.blogPost.id,
    'dev-author-123',
    {
      reviewers: ['tech-lead-123', 'senior-dev-456'], // Technical reviewers
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      priority: 'high',
      message: `Technical article about React Hooks optimization. Please review for:
        - Technical accuracy
        - Code example quality  
        - Performance recommendations
        - Clarity for advanced developers`,
      attachments: ['performance-benchmarks.pdf', 'code-examples.zip'],
    },
  );

  console.log('Submission Details:');
  console.log('- Workflow ID:', submissionResult.workflow.id);
  console.log('- Total approval steps:', submissionResult.workflow.totalSteps);
  console.log('- Current step:', submissionResult.workflow.currentStep);
  console.log('- Due date:', submissionResult.workflow.dueDate?.toISOString());

  if (submissionResult.seoAnalysis) {
    console.log(
      '- SEO Score:',
      submissionResult.seoAnalysis.overallScore.toFixed(1),
    );
  }

  // ===== APPROVAL PROCESS SIMULATION =====
  console.log('\n--- Approval Process ---');

  // First reviewer: Tech Lead
  console.log('\n1. Tech Lead Review:');

  const techLeadApproval = await workflowManager.processApproval(
    submissionResult.workflow.id,
    1,
    'tech-lead-123',
    {
      action: 'approve',
      comment: `Excellent technical content! The performance optimization techniques are spot-on. 
        Code examples are clear and practical. Minor suggestions:
        - Add a note about React DevTools Profiler
        - Consider mentioning React.memo for component optimization
        
        Approved for next review step.`,
      metadata: {
        reviewTime: 45, // minutes
        technicalAccuracy: 9.5,
        codeQuality: 9.0,
        clarity: 8.5,
      },
    },
  );

  console.log(
    'Tech Lead approval status:',
    techLeadApproval.currentStep,
    'of',
    techLeadApproval.totalSteps,
  );

  // Second reviewer: Senior Developer
  console.log('\n2. Senior Developer Review:');

  const seniorDevApproval = await workflowManager.processApproval(
    submissionResult.workflow.id,
    2,
    'senior-dev-456',
    {
      action: 'approve',
      comment: `Great article! I particularly like the practical examples. 
        The performance implications are well explained. 
        
        One suggestion: Maybe add a section about useEffect cleanup patterns for performance.
        
        Overall excellent work - approved for publication!`,
      metadata: {
        reviewTime: 30,
        practicalValue: 9.0,
        completeness: 8.5,
        readability: 9.0,
      },
    },
  );

  console.log('Senior Developer approval completed!');
  console.log(
    'Workflow status:',
    seniorDevApproval.isComplete ? 'Completed' : 'In Progress',
  );
  console.log(
    'Final approval:',
    seniorDevApproval.isApproved ? 'Approved' : 'Pending',
  );

  // ===== WORKFLOW WITH REJECTION EXAMPLE =====
  console.log('\n--- Workflow with Rejection Example ---');

  // Create another post that will be rejected
  const marketingPost = await contentManager.createBlogPost({
    title: 'Revolutionary Marketing Strategy',
    content: `
      # Revolutionary Marketing Strategy
      
      This is a new marketing approach that will change everything.
      
      Marketing is important for business success.
    `,
    excerpt: 'A new approach to marketing.',
    customMetadata: {
      content_type: 'marketing',
      difficulty_level: 'Beginner',
    },
    authorId: 'marketing-author-789',
  });

  const rejectionSubmission = await contentManager.submitForReview(
    marketingPost.blogPost.id,
    'marketing-author-789',
    {
      reviewers: ['marketing-manager-789'],
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      priority: 'medium',
      message: 'Please review this marketing strategy article.',
    },
  );

  // Reject with detailed feedback
  const rejection = await workflowManager.processApproval(
    rejectionSubmission.workflow.id,
    1,
    'marketing-manager-789',
    {
      action: 'request_changes',
      comment: `This article needs significant improvement before publication:

        Issues identified:
        - Content is too vague and lacks specific examples
        - Missing data or research to support claims
        - Title promises "revolutionary" but content is basic
        - No actionable takeaways for readers
        - Very short for a strategy article (needs 1000+ words)

        Required changes:
        1. Add specific case studies or examples
        2. Include data/statistics to support points
        3. Provide step-by-step implementation guidance
        4. Expand content significantly
        5. Tone down the title or beef up the content

        Please revise and resubmit.`,
      assignBackTo: 'marketing-author-789',
      metadata: {
        contentQuality: 3.0,
        marketingValue: 2.5,
        completeness: 2.0,
      },
    },
  );

  console.log(
    'Marketing post rejected - status:',
    rejection.isComplete ? 'Workflow Complete' : 'Returned for Changes',
  );

  // ===== SCHEDULING AND PUBLICATION =====
  console.log('\n--- Scheduling and Publication ---');

  // Schedule the approved technical post
  await contentManager.publishBlogPost(techPost.blogPost.id, 'dev-author-123', {
    scheduleOptions: {
      scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      timezone: 'America/New_York',
      autoPromote: true,
      promotionChannels: ['twitter', 'linkedin', 'dev.to', 'hackernews'],
      notifySubscribers: true,
    },
    createRelationships: true,
    notifySubscribers: true,
  });

  console.log(
    'Technical post scheduled for publication next week with multi-channel promotion',
  );

  // ===== WORKFLOW ANALYTICS =====
  console.log('\n--- Workflow Analytics ---');

  // Get workflow history
  const workflowHistory = await workflowManager.getWorkflowHistory(
    techPost.blogPost.id,
  );

  console.log('Workflow History for Technical Post:');
  workflowHistory.forEach((entry, index) => {
    console.log(
      `${index + 1}. ${entry.action} - ${entry.fromStatus || 'N/A'} → ${entry.toStatus}`,
    );
    console.log(`   By: ${entry.performedBy || 'System'}`);
    console.log(`   Date: ${entry.performedAt.toISOString()}`);
    console.log(`   Comment: ${entry.comment || 'No comment'}`);
    if (entry.assignedTo) {
      console.log(`   Assigned to: ${entry.assignedTo}`);
    }
    console.log();
  });

  // Get pending approvals for reviewers
  const techLeadPendingApprovals =
    await workflowManager.getPendingApprovals('tech-lead-123');
  const seniorDevPendingApprovals =
    await workflowManager.getPendingApprovals('senior-dev-456');

  console.log('Pending Approvals:');
  console.log('- Tech Lead:', techLeadPendingApprovals.length, 'pending');
  console.log('- Senior Dev:', seniorDevPendingApprovals.length, 'pending');

  // ===== AUTOMATED SCHEDULING PROCESSING =====
  console.log('\n--- Automated Publishing System ---');

  // Simulate cron job processing
  console.log('Processing scheduled publications...');
  await workflowManager.processScheduledPublications();

  // ===== NOTIFICATION MANAGEMENT =====
  console.log('\n--- Notification System ---');

  // Get notifications for different users
  const authorNotifications =
    await notificationManager.getUserNotifications('dev-author-123');
  const reviewerNotifications =
    await notificationManager.getUserNotifications('tech-lead-123');

  console.log('Author Notifications:');
  authorNotifications.slice(0, 3).forEach((notification, index) => {
    console.log(
      `${index + 1}. [${notification.type.toUpperCase()}] ${notification.title}`,
    );
    console.log(`   ${notification.message}`);
    console.log(
      `   Priority: ${notification.priority}, Read: ${notification.isRead ? 'Yes' : 'No'}`,
    );
    console.log();
  });

  console.log('Reviewer Notifications:');
  reviewerNotifications.slice(0, 3).forEach((notification, index) => {
    console.log(
      `${index + 1}. [${notification.type.toUpperCase()}] ${notification.title}`,
    );
    console.log(`   ${notification.message}`);
    console.log(
      `   Priority: ${notification.priority}, Read: ${notification.isRead ? 'Yes' : 'No'}`,
    );
    console.log();
  });

  // ===== WORKFLOW METRICS =====
  console.log('\n--- Workflow Performance Metrics ---');

  // Calculate workflow metrics
  const allWorkflows = await prisma.approvalWorkflow.findMany({
    include: {
      approvals: true,
      blogPost: true,
    },
  });

  const completedWorkflows = allWorkflows.filter(w => w.isComplete);
  const averageApprovalTime =
    completedWorkflows.length > 0
      ? completedWorkflows.reduce((sum, w) => {
          const startTime = w.createdAt.getTime();
          const endTime = w.completedAt?.getTime() || Date.now();
          return sum + (endTime - startTime);
        }, 0) /
        completedWorkflows.length /
        (1000 * 60 * 60) // Convert to hours
      : 0;

  const approvalRate =
    allWorkflows.length > 0
      ? (completedWorkflows.filter(w => w.isApproved).length /
          allWorkflows.length) *
        100
      : 0;

  console.log('Workflow Metrics:');
  console.log('- Total workflows:', allWorkflows.length);
  console.log('- Completed workflows:', completedWorkflows.length);
  console.log(
    '- Average approval time:',
    averageApprovalTime.toFixed(2),
    'hours',
  );
  console.log('- Approval rate:', approvalRate.toFixed(1), '%');
  console.log(
    '- Pending workflows:',
    allWorkflows.filter(w => !w.isComplete).length,
  );

  // ===== ADVANCED WORKFLOW AUTOMATION =====
  console.log('\n--- Advanced Automation Features ---');

  // Demonstrate deadline reminders
  await notificationManager.createDeadlineReminder(
    'tech-lead-123',
    techPost.blogPost.id,
    new Date(Date.now() + 24 * 60 * 60 * 1000),
    'approaching',
  );

  console.log('Created deadline reminder notification');

  // Bulk notification example
  const bulkResult = await notificationManager.sendBulkNotifications(
    ['dev-author-123', 'marketing-author-789', 'editor-345'],
    {
      type: 'system',
      title: 'New Workflow Guidelines',
      message:
        'Please review the updated content workflow guidelines in the team handbook.',
      priority: 'medium',
      actionUrl: '/guidelines/workflow',
    },
  );

  console.log('Bulk notifications sent:');
  console.log('- Successful:', bulkResult.sentCount);
  console.log('- Failed:', bulkResult.failedCount);

  // ===== CLEANUP =====
  await prisma.$disconnect();

  console.log('\n=== Workflow Automation Example Completed ===');
}

// Run the example
if (require.main === module) {
  workflowAutomationExample()
    .then(() => {
      console.log('Workflow automation example completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error running workflow automation example:', error);
      process.exit(1);
    });
}

export { workflowAutomationExample };
