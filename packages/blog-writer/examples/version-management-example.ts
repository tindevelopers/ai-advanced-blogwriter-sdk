/**
 * Version Management Example
 * Demonstrates comprehensive version control with branching and merging
 */

import { PrismaClient } from '@prisma/client';
import { VersionManager, ContentManagementService } from '@ai-sdk/blog-writer';

async function versionManagementExample() {
  const prisma = new PrismaClient();
  const versionManager = new VersionManager(prisma);
  const contentManager = new ContentManagementService(prisma);

  console.log('=== Version Management Example ===');

  // Create initial blog post
  const blogPost = await contentManager.createBlogPost({
    title: 'Getting Started with TypeScript',
    content: `
      # Getting Started with TypeScript

      TypeScript is a powerful superset of JavaScript that adds static typing to the language.

      ## Why TypeScript?

      - Better code quality
      - Enhanced developer experience
      - Improved refactoring capabilities

      ## Installation

      \`\`\`bash
      npm install -g typescript
      \`\`\`
    `,
    excerpt:
      'Learn how to get started with TypeScript for better JavaScript development.',
    authorId: 'author-123',
  });

  console.log('Created initial blog post:', blogPost.blogPost.id);

  // ===== CREATING VERSIONS =====
  console.log('\n--- Creating Versions ---');

  // Create a version with improvements
  const v2 = await versionManager.createVersion(
    blogPost.blogPost.id,
    {
      title: 'Getting Started with TypeScript: A Complete Guide',
      content:
        blogPost.blogPost.content +
        `
      
      ## Basic Types

      TypeScript provides several basic types:

      \`\`\`typescript
      let name: string = "John";
      let age: number = 30;
      let isStudent: boolean = false;
      \`\`\`
      `,
      excerpt:
        'A complete guide to getting started with TypeScript, including basic types and setup.',
    },
    {
      changeSummary: 'Added basic types section and improved title',
    },
  );

  console.log('Created version 2:', v2.version);

  // ===== BRANCHING =====
  console.log('\n--- Branch Management ---');

  // Create a feature branch for advanced topics
  const advancedBranch = await contentManager.createBranch(
    blogPost.blogPost.id,
    'feature/advanced-topics',
    v2.id,
  );

  console.log('Created branch:', advancedBranch.name);

  // Create version in the branch
  const branchVersion = await versionManager.createVersion(
    blogPost.blogPost.id,
    {
      title: 'TypeScript Mastery: From Basics to Advanced',
      content:
        v2.content +
        `

      ## Advanced Features

      ### Generics

      Generics provide a way to create reusable code:

      \`\`\`typescript
      function identity<T>(arg: T): T {
        return arg;
      }
      \`\`\`

      ### Interfaces

      Define contracts for object shapes:

      \`\`\`typescript
      interface User {
        name: string;
        age: number;
        email?: string;
      }
      \`\`\`

      ### Union Types

      Allow multiple types:

      \`\`\`typescript
      let id: string | number = "123";
      id = 123; // Also valid
      \`\`\`
      `,
      excerpt:
        'Master TypeScript from basic concepts to advanced features like generics and interfaces.',
    },
    {
      branchName: 'feature/advanced-topics',
      changeSummary: 'Added advanced TypeScript features section',
    },
  );

  console.log('Created branch version:', branchVersion.version);

  // Create another branch for SEO improvements
  const seoBranch = await contentManager.createBranch(
    blogPost.blogPost.id,
    'feature/seo-optimization',
    v2.id,
  );

  const seoVersion = await versionManager.createVersion(
    blogPost.blogPost.id,
    {
      title: 'Getting Started with TypeScript: Complete 2024 Guide',
      content:
        v2.content +
        `

      ## Benefits of Using TypeScript

      ### 1. Early Error Detection
      Catch errors at compile-time rather than runtime.

      ### 2. Better IDE Support
      Enhanced autocompletion, refactoring, and navigation.

      ### 3. Improved Team Collaboration
      Type definitions serve as documentation.

      ## Common Use Cases

      - Large-scale applications
      - Team projects
      - API development
      - React/Angular projects
      `,
      excerpt:
        'Complete 2024 guide to TypeScript with benefits, use cases, and practical examples.',
      focusKeyword: 'TypeScript guide',
      keywords: ['TypeScript', 'JavaScript', '2024 guide', 'programming'],
    },
    {
      branchName: 'feature/seo-optimization',
      changeSummary:
        'SEO optimization with keyword targeting and benefits section',
    },
  );

  console.log('Created SEO version:', seoVersion.version);

  // ===== VERSION COMPARISON =====
  console.log('\n--- Version Comparison ---');

  // Compare original version with v2
  const comparison1 = await versionManager.compareVersions(
    blogPost.version.id,
    v2.id,
  );

  console.log('Comparison (v1 vs v2):');
  console.log('- Added words:', comparison1.addedWords);
  console.log('- Modified words:', comparison1.modifiedWords);
  console.log('- Changed fields:', comparison1.changedFields);
  console.log(
    '- Similarity:',
    (comparison1.similarityScore * 100).toFixed(1) + '%',
  );

  // Compare branch versions
  const comparison2 = await versionManager.compareVersions(
    branchVersion.id,
    seoVersion.id,
  );

  console.log('\nComparison (Advanced vs SEO branches):');
  console.log('- Added words:', comparison2.addedWords);
  console.log('- Removed words:', comparison2.removedWords);
  console.log('- Changed fields:', comparison2.changedFields);
  console.log(
    '- Similarity:',
    (comparison2.similarityScore * 100).toFixed(1) + '%',
  );

  // ===== BRANCH MERGING =====
  console.log('\n--- Branch Merging ---');

  // Get main branch
  const mainBranch = await prisma.versionBranch.findFirst({
    where: {
      blogPostId: blogPost.blogPost.id,
      name: 'main',
    },
  });

  if (!mainBranch) {
    // Create main branch if it doesn't exist
    const mainBranchCreated = await contentManager.createBranch(
      blogPost.blogPost.id,
      'main',
    );

    // Merge SEO branch into main
    const mergeResult = await versionManager.mergeBranches({
      sourceBranch: seoBranch.id,
      targetBranch: mainBranchCreated.id,
      strategy: 'merge-commit',
      message: 'Merge SEO improvements into main branch',
    });

    console.log('Merged SEO branch into main:', mergeResult.version);
  }

  // ===== ROLLBACK DEMONSTRATION =====
  console.log('\n--- Rollback Example ---');

  // Create a problematic version
  const problematicVersion = await versionManager.createVersion(
    blogPost.blogPost.id,
    {
      title: 'TypeScript Tutorial', // Simplified title (worse)
      content: 'TypeScript is good.', // Very short content (much worse)
      excerpt: 'Short intro.',
    },
    {
      changeSummary: 'Simplified content (this is bad!)',
    },
  );

  console.log('Created problematic version:', problematicVersion.version);

  // Rollback to SEO version
  const rollbackResult = await versionManager.rollbackToVersion(
    blogPost.blogPost.id,
    seoVersion.id,
    {
      createBranch: true,
      branchName: 'rollback/restore-seo-version',
      preserveCurrent: false,
    },
  );

  console.log(
    'Rolled back to SEO version. New version:',
    rollbackResult.version,
  );

  // ===== VERSION HISTORY =====
  console.log('\n--- Version History ---');

  const allVersions = await versionManager.getVersions(blogPost.blogPost.id);

  console.log('All versions:');
  allVersions.forEach((version, index) => {
    console.log(`${index + 1}. ${version.version} - "${version.title}"`);
    console.log(`   Created: ${version.createdAt.toISOString()}`);
    console.log(
      `   Words: ${version.wordCount}, SEO Score: ${version.seoScore?.toFixed(1) || 'N/A'}`,
    );
    console.log(`   Summary: ${version.changeSummary || 'No summary'}`);
    console.log();
  });

  // ===== BRANCH VISUALIZATION =====
  console.log('\n--- Branch Structure ---');

  const branches = await prisma.versionBranch.findMany({
    where: { blogPostId: blogPost.blogPost.id },
    include: {
      versions: {
        select: { id: true, version: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  console.log('Branch structure:');
  branches.forEach(branch => {
    console.log(`📁 ${branch.name} (${branch.isMain ? 'main' : 'feature'})`);
    console.log(`   ${branch.isActive ? '✅ Active' : '❌ Inactive'}`);
    console.log(`   Versions: ${branch.versions.length}`);

    branch.versions.forEach(version => {
      console.log(
        `   └── ${version.version} (${version.createdAt.toISOString()})`,
      );
    });

    if (branch.mergedAt) {
      console.log(`   🔀 Merged: ${branch.mergedAt.toISOString()}`);
    }
    console.log();
  });

  // ===== COLLABORATIVE WORKFLOW SIMULATION =====
  console.log('\n--- Collaborative Workflow ---');

  // Simulate multiple authors working on different branches
  const collaborativeBranches = [
    {
      name: 'feature/examples-section',
      author: 'developer-456',
      changes: 'Added practical examples section',
    },
    {
      name: 'hotfix/typo-fixes',
      author: 'editor-789',
      changes: 'Fixed grammatical errors and typos',
    },
  ];

  for (const branchInfo of collaborativeBranches) {
    const branch = await contentManager.createBranch(
      blogPost.blogPost.id,
      branchInfo.name,
      seoVersion.id,
    );

    const version = await versionManager.createVersion(
      blogPost.blogPost.id,
      {
        title: seoVersion.title,
        content:
          seoVersion.content + `\n\n<!-- Changes by ${branchInfo.author} -->`,
        excerpt: seoVersion.excerpt,
      },
      {
        branchName: branchInfo.name,
        changeSummary: branchInfo.changes,
      },
    );

    console.log(
      `Created collaborative branch: ${branchInfo.name} by ${branchInfo.author}`,
    );
  }

  // ===== CLEANUP =====
  await prisma.$disconnect();

  console.log('\n=== Version Management Example Completed ===');
}

// Run the example
if (require.main === module) {
  versionManagementExample()
    .then(() => {
      console.log('Version management example completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error running version management example:', error);
      process.exit(1);
    });
}

export { versionManagementExample };
