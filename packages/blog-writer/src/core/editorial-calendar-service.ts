
/**
 * Editorial Calendar & Content Planning Service
 * Comprehensive content scheduling and planning workflows
 */

import {
  EditorialCalendar,
  EditorialCalendarEntry,
  CalendarMilestone,
  TimeTrackingEntry,
  EditorialCalendarRequest,
  EditorialCalendarResponse,
  CalendarEntryStatus,
  Priority,
  ActivityType,
  TopicResearch
} from '../types/strategy-engine';

import { LanguageModel } from 'ai';
import { PrismaClient } from '../generated/prisma-client';

export interface EditorialCalendarConfig {
  model: LanguageModel;
  prisma?: PrismaClient;
  defaultCalendarId?: string;
  autoAssignment?: boolean;
  reminderSettings?: ReminderSettings;
}

export interface ReminderSettings {
  deadlineWarning: number; // days before deadline
  milestoneReminder: number; // days before milestone
  overdueCheck: number; // hours to check for overdue items
}

export interface CalendarAnalytics {
  productivity: {
    completionRate: number;
    averageTimeToComplete: number;
    onTimeDelivery: number;
  };
  workload: {
    totalEntries: number;
    byStatus: Record<CalendarEntryStatus, number>;
    byPriority: Record<Priority, number>;
    upcomingDeadlines: number;
  };
  team: {
    assignments: Record<string, number>;
    utilization: Record<string, number>;
    efficiency: Record<string, number>;
  };
}

export class EditorialCalendarService {
  private model: LanguageModel;
  private prisma?: PrismaClient;
  private defaultCalendarId?: string;
  private autoAssignment: boolean;
  private reminderSettings: ReminderSettings;

  constructor(config: EditorialCalendarConfig) {
    this.model = config.model;
    this.prisma = config.prisma;
    this.defaultCalendarId = config.defaultCalendarId;
    this.autoAssignment = config.autoAssignment ?? true;
    this.reminderSettings = config.reminderSettings ?? {
      deadlineWarning: 3,
      milestoneReminder: 1,
      overdueCheck: 24
    };
  }

  /**
   * Create or get editorial calendar
   */
  async createCalendar(name: string, description?: string): Promise<EditorialCalendar> {
    if (!this.prisma) {
      throw new Error('Database connection required for calendar operations');
    }

    try {
      const calendar = await this.prisma.editorialCalendar.create({
        data: {
          name,
          description,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          entries: {
            include: {
              topic: true,
              blogPost: true,
              contentBrief: true,
              milestones: true,
              timeTracking: true
            }
          }
        }
      });

      return this.mapPrismaCalendarToType(calendar);

    } catch (error) {
      console.error('Error creating calendar:', error);
      throw new Error(`Calendar creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate editorial calendar based on topics and strategy
   */
  async generateCalendar(request: EditorialCalendarRequest): Promise<EditorialCalendarResponse> {
    const prompt = this.buildCalendarGenerationPrompt(request);

    try {
      const result = await this.model.generateObject({
        schema: {
          type: 'object',
          properties: {
            entries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  plannedDate: { type: 'string', format: 'date-time' },
                  publishDate: { type: 'string', format: 'date-time' },
                  dueDate: { type: 'string', format: 'date-time' },
                  contentType: { type: 'string' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                  targetWordCount: { type: 'number' },
                  estimatedHours: { type: 'number' },
                  tags: { type: 'array', items: { type: 'string' } },
                  categories: { type: 'array', items: { type: 'string' } },
                  assignedTo: { type: 'string' },
                  reviewerIds: { type: 'array', items: { type: 'string' } },
                  milestones: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        dueDate: { type: 'string', format: 'date-time' }
                      },
                      required: ['name', 'dueDate']
                    }
                  }
                },
                required: ['title', 'plannedDate', 'contentType', 'priority']
              }
            },
            strategy: {
              type: 'object',
              properties: {
                themes: { type: 'array', items: { type: 'string' } },
                frequency: { type: 'string' },
                distribution: { type: 'object' },
                reasoning: { type: 'string' }
              },
              required: ['themes', 'frequency', 'reasoning']
            }
          },
          required: ['entries', 'strategy']
        },
        prompt
      });

      // Create calendar if needed
      const calendar = await this.getOrCreateDefaultCalendar();
      
      // Create calendar entries
      const entries = await Promise.all(
        result.object.entries.map(entryData => this.createCalendarEntry({
          ...entryData,
          calendarId: calendar.id,
          status: 'planned' as CalendarEntryStatus,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      );

      // Generate summary
      const summary = this.generateCalendarSummary(entries);

      const response: EditorialCalendarResponse = {
        calendar,
        entries,
        summary
      };

      return response;

    } catch (error) {
      console.error('Error generating calendar:', error);
      throw new Error(`Calendar generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add entry to editorial calendar
   */
  async addEntry(entryData: Partial<EditorialCalendarEntry>): Promise<EditorialCalendarEntry> {
    if (!this.prisma) {
      throw new Error('Database connection required for calendar operations');
    }

    try {
      const calendar = await this.getOrCreateDefaultCalendar();

      const entry = await this.prisma.editorialCalendarEntry.create({
        data: {
          calendarId: entryData.calendarId || calendar.id,
          title: entryData.title || 'Untitled Entry',
          description: entryData.description,
          plannedDate: entryData.plannedDate || new Date(),
          publishDate: entryData.publishDate,
          dueDate: entryData.dueDate,
          contentType: entryData.contentType || 'BLOG',
          status: entryData.status || 'planned',
          priority: entryData.priority || 'medium',
          assignedTo: entryData.assignedTo,
          reviewerIds: entryData.reviewerIds || [],
          targetWordCount: entryData.targetWordCount,
          estimatedHours: entryData.estimatedHours,
          tags: entryData.tags || [],
          categories: entryData.categories || [],
          topicId: entryData.topicId,
          blogPostId: entryData.blogPostId,
          contentBriefId: entryData.contentBriefId,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          calendar: true,
          topic: true,
          blogPost: true,
          contentBrief: true,
          milestones: true,
          timeTracking: true
        }
      });

      // Create default milestones if not provided
      if (entryData.milestones?.length) {
        await Promise.all(
          entryData.milestones.map(milestone =>
            this.addMilestone(entry.id, milestone)
          )
        );
      } else {
        await this.createDefaultMilestones(entry.id, entryData);
      }

      return this.mapPrismaEntryToType(entry);

    } catch (error) {
      console.error('Error adding calendar entry:', error);
      throw new Error(`Calendar entry creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update calendar entry status and progress
   */
  async updateEntry(entryId: string, updates: Partial<EditorialCalendarEntry>): Promise<EditorialCalendarEntry> {
    if (!this.prisma) {
      throw new Error('Database connection required for calendar operations');
    }

    try {
      const entry = await this.prisma.editorialCalendarEntry.update({
        where: { id: entryId },
        data: {
          ...updates,
          updatedAt: new Date()
        },
        include: {
          calendar: true,
          topic: true,
          blogPost: true,
          contentBrief: true,
          milestones: true,
          timeTracking: true
        }
      });

      // Auto-update milestones based on status changes
      if (updates.status) {
        await this.updateMilestonesForStatus(entryId, updates.status);
      }

      return this.mapPrismaEntryToType(entry);

    } catch (error) {
      console.error('Error updating calendar entry:', error);
      throw new Error(`Calendar entry update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add milestone to calendar entry
   */
  async addMilestone(entryId: string, milestone: Partial<CalendarMilestone>): Promise<CalendarMilestone> {
    if (!this.prisma) {
      throw new Error('Database connection required for milestone operations');
    }

    try {
      const created = await this.prisma.calendarMilestone.create({
        data: {
          entryId,
          name: milestone.name || 'Milestone',
          description: milestone.description,
          dueDate: milestone.dueDate || new Date(),
          isCompleted: milestone.isCompleted || false,
          completedAt: milestone.completedAt,
          completedBy: milestone.completedBy
        },
        include: {
          entry: true
        }
      });

      return this.mapPrismaMilestoneToType(created);

    } catch (error) {
      console.error('Error adding milestone:', error);
      throw new Error(`Milestone creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Track time spent on calendar entry
   */
  async trackTime(
    entryId: string, 
    userId: string, 
    activity: ActivityType, 
    duration: number, 
    description?: string
  ): Promise<TimeTrackingEntry> {
    if (!this.prisma) {
      throw new Error('Database connection required for time tracking');
    }

    try {
      const timeEntry = await this.prisma.timeTrackingEntry.create({
        data: {
          entryId,
          userId,
          activity,
          duration,
          description,
          trackedAt: new Date()
        },
        include: {
          calendarEntry: true
        }
      });

      return this.mapPrismaTimeEntryToType(timeEntry);

    } catch (error) {
      console.error('Error tracking time:', error);
      throw new Error(`Time tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get calendar with entries for date range
   */
  async getCalendarEntries(
    calendarId: string,
    startDate: Date,
    endDate: Date,
    filters?: {
      status?: CalendarEntryStatus[];
      priority?: Priority[];
      assignedTo?: string;
      contentType?: string[];
    }
  ): Promise<EditorialCalendarEntry[]> {
    if (!this.prisma) {
      throw new Error('Database connection required for calendar operations');
    }

    try {
      const entries = await this.prisma.editorialCalendarEntry.findMany({
        where: {
          calendarId,
          plannedDate: {
            gte: startDate,
            lte: endDate
          },
          ...(filters?.status && { status: { in: filters.status } }),
          ...(filters?.priority && { priority: { in: filters.priority } }),
          ...(filters?.assignedTo && { assignedTo: filters.assignedTo }),
          ...(filters?.contentType && { contentType: { in: filters.contentType } })
        },
        include: {
          calendar: true,
          topic: true,
          blogPost: true,
          contentBrief: true,
          milestones: true,
          timeTracking: true
        },
        orderBy: {
          plannedDate: 'asc'
        }
      });

      return entries.map(entry => this.mapPrismaEntryToType(entry));

    } catch (error) {
      console.error('Error getting calendar entries:', error);
      throw new Error(`Calendar retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get upcoming deadlines and overdue items
   */
  async getUpcomingDeadlines(days: number = 7): Promise<{
    upcoming: EditorialCalendarEntry[];
    overdue: EditorialCalendarEntry[];
    milestones: CalendarMilestone[];
  }> {
    if (!this.prisma) {
      throw new Error('Database connection required for deadline tracking');
    }

    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const [upcoming, overdue, milestones] = await Promise.all([
        // Upcoming deadlines
        this.prisma.editorialCalendarEntry.findMany({
          where: {
            dueDate: {
              gte: now,
              lte: futureDate
            },
            status: {
              notIn: ['published', 'cancelled']
            }
          },
          include: {
            calendar: true,
            topic: true,
            blogPost: true,
            contentBrief: true,
            milestones: true,
            timeTracking: true
          },
          orderBy: {
            dueDate: 'asc'
          }
        }),

        // Overdue items
        this.prisma.editorialCalendarEntry.findMany({
          where: {
            dueDate: {
              lt: now
            },
            status: {
              notIn: ['published', 'cancelled']
            }
          },
          include: {
            calendar: true,
            topic: true,
            blogPost: true,
            contentBrief: true,
            milestones: true,
            timeTracking: true
          },
          orderBy: {
            dueDate: 'asc'
          }
        }),

        // Upcoming milestones
        this.prisma.calendarMilestone.findMany({
          where: {
            dueDate: {
              gte: now,
              lte: futureDate
            },
            isCompleted: false
          },
          include: {
            entry: true
          },
          orderBy: {
            dueDate: 'asc'
          }
        })
      ]);

      return {
        upcoming: upcoming.map(entry => this.mapPrismaEntryToType(entry)),
        overdue: overdue.map(entry => this.mapPrismaEntryToType(entry)),
        milestones: milestones.map(milestone => this.mapPrismaMilestoneToType(milestone))
      };

    } catch (error) {
      console.error('Error getting deadlines:', error);
      throw new Error(`Deadline retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate calendar analytics
   */
  async getCalendarAnalytics(calendarId: string, dateRange?: { start: Date; end: Date }): Promise<CalendarAnalytics> {
    if (!this.prisma) {
      throw new Error('Database connection required for analytics');
    }

    try {
      const whereClause = {
        calendarId,
        ...(dateRange && {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        })
      };

      const [entries, timeEntries] = await Promise.all([
        this.prisma.editorialCalendarEntry.findMany({
          where: whereClause,
          include: {
            timeTracking: true,
            milestones: true
          }
        }),
        this.prisma.timeTrackingEntry.findMany({
          where: {
            calendarEntry: whereClause
          }
        })
      ]);

      // Calculate analytics
      const totalEntries = entries.length;
      const completedEntries = entries.filter(e => e.status === 'published').length;
      const onTimeEntries = entries.filter(e => 
        e.status === 'published' && 
        e.publishDate && 
        e.dueDate && 
        e.publishDate <= e.dueDate
      ).length;

      const statusCounts = entries.reduce((acc, entry) => {
        acc[entry.status as CalendarEntryStatus] = (acc[entry.status as CalendarEntryStatus] || 0) + 1;
        return acc;
      }, {} as Record<CalendarEntryStatus, number>);

      const priorityCounts = entries.reduce((acc, entry) => {
        acc[entry.priority as Priority] = (acc[entry.priority as Priority] || 0) + 1;
        return acc;
      }, {} as Record<Priority, number>);

      const assignmentCounts = entries.reduce((acc, entry) => {
        if (entry.assignedTo) {
          acc[entry.assignedTo] = (acc[entry.assignedTo] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate average completion time
      const completedWithTime = entries.filter(e => 
        e.status === 'published' && 
        e.createdAt && 
        e.publishDate
      );
      const avgCompletionTime = completedWithTime.length > 0 
        ? completedWithTime.reduce((sum, e) => 
            sum + (e.publishDate!.getTime() - e.createdAt.getTime()), 0
          ) / completedWithTime.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      const analytics: CalendarAnalytics = {
        productivity: {
          completionRate: totalEntries > 0 ? completedEntries / totalEntries : 0,
          averageTimeToComplete: avgCompletionTime,
          onTimeDelivery: completedEntries > 0 ? onTimeEntries / completedEntries : 0
        },
        workload: {
          totalEntries,
          byStatus: statusCounts,
          byPriority: priorityCounts,
          upcomingDeadlines: entries.filter(e => 
            e.dueDate && 
            e.dueDate > new Date() && 
            e.dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          ).length
        },
        team: {
          assignments: assignmentCounts,
          utilization: {}, // Would calculate based on working hours
          efficiency: {} // Would calculate based on time tracking vs estimates
        }
      };

      return analytics;

    } catch (error) {
      console.error('Error generating analytics:', error);
      throw new Error(`Analytics generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods

  private buildCalendarGenerationPrompt(request: EditorialCalendarRequest): string {
    const dateRange = `${request.startDate.toISOString()} to ${request.endDate.toISOString()}`;
    const topics = request.topics?.join(', ') || 'Any relevant topics';
    const contentTypes = request.contentTypes?.join(', ') || 'Blog posts, articles';

    return `
      Generate an editorial calendar for the date range: ${dateRange}
      
      Requirements:
      - Topics to cover: ${topics}
      - Content types: ${contentTypes}
      - Priority level: ${request.priority || 'medium'}
      - Assigned to: ${request.assignedTo || 'TBD'}
      
      Create a strategic content calendar that:
      1. Distributes content evenly across the time period
      2. Varies content types and topics for engagement
      3. Considers seasonal relevance and trends
      4. Includes realistic timelines and milestones
      5. Balances workload and priorities
      6. Sets up content series and thematic clusters
      
      For each entry, provide:
      - Compelling title and description
      - Appropriate content type and priority
      - Realistic word count and time estimates
      - Relevant tags and categories
      - Key milestones (research, draft, review, publish)
      - Assignment recommendations
      
      Focus on creating a cohesive content strategy that builds authority and engages the target audience.
    `;
  }

  private async getOrCreateDefaultCalendar(): Promise<EditorialCalendar> {
    if (!this.prisma) {
      throw new Error('Database connection required');
    }

    if (this.defaultCalendarId) {
      const existing = await this.prisma.editorialCalendar.findUnique({
        where: { id: this.defaultCalendarId },
        include: { entries: true }
      });
      if (existing) {
        return this.mapPrismaCalendarToType(existing);
      }
    }

    // Create default calendar
    const calendar = await this.prisma.editorialCalendar.create({
      data: {
        name: 'Default Calendar',
        description: 'Default editorial calendar',
        isDefault: true,
        isActive: true
      },
      include: { entries: true }
    });

    this.defaultCalendarId = calendar.id;
    return this.mapPrismaCalendarToType(calendar);
  }

  private async createCalendarEntry(entryData: any): Promise<EditorialCalendarEntry> {
    if (!this.prisma) {
      throw new Error('Database connection required');
    }

    const entry = await this.prisma.editorialCalendarEntry.create({
      data: entryData,
      include: {
        calendar: true,
        topic: true,
        blogPost: true,
        contentBrief: true,
        milestones: true,
        timeTracking: true
      }
    });

    // Create milestones if provided
    if (entryData.milestones?.length) {
      await Promise.all(
        entryData.milestones.map(milestone =>
          this.prisma!.calendarMilestone.create({
            data: {
              entryId: entry.id,
              name: milestone.name,
              description: milestone.description,
              dueDate: new Date(milestone.dueDate)
            }
          })
        )
      );
    }

    return this.mapPrismaEntryToType(entry);
  }

  private async createDefaultMilestones(entryId: string, entryData: any): Promise<void> {
    if (!this.prisma) return;

    const plannedDate = new Date(entryData.plannedDate);
    const publishDate = entryData.publishDate ? new Date(entryData.publishDate) : 
      new Date(plannedDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

    const milestones = [
      {
        name: 'Research Complete',
        description: 'Complete topic research and gather sources',
        dueDate: new Date(plannedDate.getTime() + 1 * 24 * 60 * 60 * 1000) // 1 day
      },
      {
        name: 'First Draft',
        description: 'Complete initial draft of content',
        dueDate: new Date(plannedDate.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days
      },
      {
        name: 'Review Complete',
        description: 'Content reviewed and approved',
        dueDate: new Date(plannedDate.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 days
      },
      {
        name: 'Ready to Publish',
        description: 'Content finalized and scheduled',
        dueDate: new Date(publishDate.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day before publish
      }
    ];

    await Promise.all(
      milestones.map(milestone =>
        this.prisma!.calendarMilestone.create({
          data: {
            entryId,
            ...milestone
          }
        })
      )
    );
  }

  private async updateMilestonesForStatus(entryId: string, status: CalendarEntryStatus): Promise<void> {
    if (!this.prisma) return;

    const statusMilestoneMap: Record<CalendarEntryStatus, string[]> = {
      'planned': [],
      'research': ['Research Complete'],
      'writing': ['Research Complete', 'First Draft'],
      'review': ['Research Complete', 'First Draft'],
      'ready': ['Research Complete', 'First Draft', 'Review Complete'],
      'published': ['Research Complete', 'First Draft', 'Review Complete', 'Ready to Publish'],
      'cancelled': []
    };

    const milestonesToComplete = statusMilestoneMap[status] || [];

    if (milestonesToComplete.length > 0) {
      await this.prisma.calendarMilestone.updateMany({
        where: {
          entryId,
          name: { in: milestonesToComplete },
          isCompleted: false
        },
        data: {
          isCompleted: true,
          completedAt: new Date()
        }
      });
    }
  }

  private generateCalendarSummary(entries: EditorialCalendarEntry[]): EditorialCalendarResponse['summary'] {
    const totalEntries = entries.length;
    
    const byStatus = entries.reduce((acc, entry) => {
      acc[entry.status] = (acc[entry.status] || 0) + 1;
      return acc;
    }, {} as Record<CalendarEntryStatus, number>);

    const byPriority = entries.reduce((acc, entry) => {
      acc[entry.priority] = (acc[entry.priority] || 0) + 1;
      return acc;
    }, {} as Record<Priority, number>);

    const now = new Date();
    const upcomingDeadlines = entries.filter(entry => 
      entry.dueDate && 
      entry.dueDate > now && 
      entry.dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    );

    return {
      totalEntries,
      byStatus,
      byPriority,
      upcomingDeadlines
    };
  }

  // Mapping functions to convert Prisma types to our types
  private mapPrismaCalendarToType(prismaCalendar: any): EditorialCalendar {
    return {
      id: prismaCalendar.id,
      name: prismaCalendar.name,
      description: prismaCalendar.description,
      isDefault: prismaCalendar.isDefault,
      isActive: prismaCalendar.isActive,
      createdAt: prismaCalendar.createdAt,
      updatedAt: prismaCalendar.updatedAt,
      entries: prismaCalendar.entries?.map(entry => this.mapPrismaEntryToType(entry)) || []
    };
  }

  private mapPrismaEntryToType(prismaEntry: any): EditorialCalendarEntry {
    return {
      id: prismaEntry.id,
      calendarId: prismaEntry.calendarId,
      title: prismaEntry.title,
      description: prismaEntry.description,
      plannedDate: prismaEntry.plannedDate,
      publishDate: prismaEntry.publishDate,
      dueDate: prismaEntry.dueDate,
      contentType: prismaEntry.contentType,
      status: prismaEntry.status,
      priority: prismaEntry.priority,
      assignedTo: prismaEntry.assignedTo,
      reviewerIds: prismaEntry.reviewerIds,
      targetWordCount: prismaEntry.targetWordCount,
      estimatedHours: prismaEntry.estimatedHours,
      tags: prismaEntry.tags,
      categories: prismaEntry.categories,
      topicId: prismaEntry.topicId,
      topic: prismaEntry.topic,
      blogPostId: prismaEntry.blogPostId,
      blogPost: prismaEntry.blogPost,
      contentBriefId: prismaEntry.contentBriefId,
      contentBrief: prismaEntry.contentBrief,
      calendar: this.mapPrismaCalendarToType(prismaEntry.calendar),
      milestones: prismaEntry.milestones?.map(m => this.mapPrismaMilestoneToType(m)) || [],
      timeTracking: prismaEntry.timeTracking?.map(t => this.mapPrismaTimeEntryToType(t)) || [],
      createdAt: prismaEntry.createdAt,
      updatedAt: prismaEntry.updatedAt
    };
  }

  private mapPrismaMilestoneToType(prismaMilestone: any): CalendarMilestone {
    return {
      id: prismaMilestone.id,
      entryId: prismaMilestone.entryId,
      name: prismaMilestone.name,
      description: prismaMilestone.description,
      dueDate: prismaMilestone.dueDate,
      isCompleted: prismaMilestone.isCompleted,
      completedAt: prismaMilestone.completedAt,
      completedBy: prismaMilestone.completedBy,
      entry: prismaMilestone.entry // This would be mapped if needed
    };
  }

  private mapPrismaTimeEntryToType(prismaTimeEntry: any): TimeTrackingEntry {
    return {
      id: prismaTimeEntry.id,
      entryId: prismaTimeEntry.entryId,
      userId: prismaTimeEntry.userId,
      activity: prismaTimeEntry.activity,
      duration: prismaTimeEntry.duration,
      description: prismaTimeEntry.description,
      trackedAt: prismaTimeEntry.trackedAt,
      calendarEntry: prismaTimeEntry.calendarEntry // This would be mapped if needed
    };
  }
}
