export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      balance_wheel_scores: {
        Row: {
          createdAt: string
          domainId: string
          id: string
          note: string | null
          score: number
          userId: string
        }
        Insert: {
          createdAt?: string
          domainId: string
          id?: string
          note?: string | null
          score: number
          userId: string
        }
        Update: {
          createdAt?: string
          domainId?: string
          id?: string
          note?: string | null
          score?: number
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_wheel_scores_domainId_fkey"
            columns: ["domainId"]
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "balance_wheel_scores_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_pillars: {
        Row: {
          createdAt: string
          description: string | null
          id: string
          isMock: boolean
          name: string
          order: number
          profileId: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id?: string
          isMock?: boolean
          name: string
          order?: number
          profileId: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: string
          isMock?: boolean
          name?: string
          order?: number
          profileId?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_pillars_profileId_fkey"
            columns: ["profileId"]
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_pillars_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          createdAt: string
          id: string
          isMock: boolean
          mission: string | null
          personaTags: string | null
          positioning: string | null
          slogan: string | null
          targetAudience: string | null
          toneOfVoice: string | null
          updatedAt: string
          userId: string
          visualNotes: string | null
        }
        Insert: {
          createdAt?: string
          id?: string
          isMock?: boolean
          mission?: string | null
          personaTags?: string | null
          positioning?: string | null
          slogan?: string | null
          targetAudience?: string | null
          toneOfVoice?: string | null
          updatedAt: string
          userId: string
          visualNotes?: string | null
        }
        Update: {
          createdAt?: string
          id?: string
          isMock?: boolean
          mission?: string | null
          personaTags?: string | null
          positioning?: string | null
          slogan?: string | null
          targetAudience?: string | null
          toneOfVoice?: string | null
          updatedAt?: string
          userId?: string
          visualNotes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          contactFreq: string | null
          createdAt: string
          domainId: string | null
          id: string
          lastContact: string | null
          name: string
          notes: string | null
          relation: string | null
          tags: string | null
          title: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          company?: string | null
          contactFreq?: string | null
          createdAt?: string
          domainId?: string | null
          id?: string
          lastContact?: string | null
          name: string
          notes?: string | null
          relation?: string | null
          tags?: string | null
          title?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          company?: string | null
          contactFreq?: string | null
          createdAt?: string
          domainId?: string | null
          id?: string
          lastContact?: string | null
          name?: string
          notes?: string | null
          relation?: string | null
          tags?: string | null
          title?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_domainId_fkey"
            columns: ["domainId"]
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_distributions: {
        Row: {
          adaptedTitle: string | null
          channelId: string
          comments: number | null
          contentId: string
          createdAt: string
          id: string
          isMock: boolean
          likes: number | null
          note: string | null
          publishedAt: string | null
          shares: number | null
          status: string
          updatedAt: string
          url: string | null
          userId: string
          views: number | null
        }
        Insert: {
          adaptedTitle?: string | null
          channelId: string
          comments?: number | null
          contentId: string
          createdAt?: string
          id?: string
          isMock?: boolean
          likes?: number | null
          note?: string | null
          publishedAt?: string | null
          shares?: number | null
          status?: string
          updatedAt: string
          url?: string | null
          userId: string
          views?: number | null
        }
        Update: {
          adaptedTitle?: string | null
          channelId?: string
          comments?: number | null
          contentId?: string
          createdAt?: string
          id?: string
          isMock?: boolean
          likes?: number | null
          note?: string | null
          publishedAt?: string | null
          shares?: number | null
          status?: string
          updatedAt?: string
          url?: string | null
          userId?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_distributions_channelId_fkey"
            columns: ["channelId"]
            referencedRelation: "platform_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_distributions_contentId_fkey"
            columns: ["contentId"]
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_distributions_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          coreMessage: string | null
          createdAt: string
          id: string
          isMock: boolean
          order: number
          outline: string | null
          pillarId: string | null
          priority: string
          publishDue: string | null
          publishedAt: string | null
          reviewNote: string | null
          status: string
          tags: string | null
          title: string
          topicId: string | null
          type: string
          updatedAt: string
          userId: string
        }
        Insert: {
          coreMessage?: string | null
          createdAt?: string
          id?: string
          isMock?: boolean
          order?: number
          outline?: string | null
          pillarId?: string | null
          priority?: string
          publishDue?: string | null
          publishedAt?: string | null
          reviewNote?: string | null
          status?: string
          tags?: string | null
          title: string
          topicId?: string | null
          type?: string
          updatedAt: string
          userId: string
        }
        Update: {
          coreMessage?: string | null
          createdAt?: string
          id?: string
          isMock?: boolean
          order?: number
          outline?: string | null
          pillarId?: string | null
          priority?: string
          publishDue?: string | null
          publishedAt?: string | null
          reviewNote?: string | null
          status?: string
          tags?: string | null
          title?: string
          topicId?: string | null
          type?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_pillarId_fkey"
            columns: ["pillarId"]
            referencedRelation: "brand_pillars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_topicId_fkey"
            columns: ["topicId"]
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      domains: {
        Row: {
          createdAt: string
          description: string | null
          icon: string | null
          id: string
          identifier: string
          name: string
          order: number
          updatedAt: string
          userId: string
          weight: number
        }
        Insert: {
          createdAt?: string
          description?: string | null
          icon?: string | null
          id?: string
          identifier: string
          name: string
          order?: number
          updatedAt: string
          userId: string
          weight?: number
        }
        Update: {
          createdAt?: string
          description?: string | null
          icon?: string | null
          id?: string
          identifier?: string
          name?: string
          order?: number
          updatedAt?: string
          userId?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "domains_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          createdAt: string
          description: string | null
          domainId: string
          endDate: string | null
          id: string
          order: number
          priority: string
          startDate: string | null
          status: string
          title: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          domainId: string
          endDate?: string | null
          id?: string
          order?: number
          priority?: string
          startDate?: string | null
          status?: string
          title: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          domainId?: string
          endDate?: string | null
          id?: string
          order?: number
          priority?: string
          startDate?: string | null
          status?: string
          title?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_domainId_fkey"
            columns: ["domainId"]
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          createdAt: string
          date: string
          habitId: string
          id: string
          note: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          date: string
          habitId: string
          id?: string
          note?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          date?: string
          habitId?: string
          id?: string
          note?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habitId_fkey"
            columns: ["habitId"]
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          color: string | null
          createdAt: string
          description: string | null
          domainId: string | null
          frequency: string
          goalId: string | null
          id: string
          isActive: boolean
          order: number
          targetPerWeek: number | null
          title: string
          updatedAt: string
          userId: string
        }
        Insert: {
          color?: string | null
          createdAt?: string
          description?: string | null
          domainId?: string | null
          frequency?: string
          goalId?: string | null
          id?: string
          isActive?: boolean
          order?: number
          targetPerWeek?: number | null
          title: string
          updatedAt: string
          userId: string
        }
        Update: {
          color?: string | null
          createdAt?: string
          description?: string | null
          domainId?: string | null
          frequency?: string
          goalId?: string | null
          id?: string
          isActive?: boolean
          order?: number
          targetPerWeek?: number | null
          title?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "habits_domainId_fkey"
            columns: ["domainId"]
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_goalId_fkey"
            columns: ["goalId"]
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habits_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          createdAt: string
          id: string
          note: string | null
          recordedAt: string
          type: string
          unit: string
          userId: string
          value: number
        }
        Insert: {
          createdAt?: string
          id?: string
          note?: string | null
          recordedAt?: string
          type: string
          unit: string
          userId: string
          value: number
        }
        Update: {
          createdAt?: string
          id?: string
          note?: string | null
          recordedAt?: string
          type?: string
          unit?: string
          userId?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "health_records_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_notes: {
        Row: {
          category: string | null
          content: string
          createdAt: string
          id: string
          tags: string | null
          title: string
          topicId: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          category?: string | null
          content: string
          createdAt?: string
          id?: string
          tags?: string | null
          title: string
          topicId?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          category?: string | null
          content?: string
          createdAt?: string
          id?: string
          tags?: string | null
          title?: string
          topicId?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "insight_notes_topicId_fkey"
            columns: ["topicId"]
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insight_notes_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          createdAt: string
          currentValue: number
          endDate: string | null
          goalId: string
          id: string
          order: number
          startDate: string | null
          targetValue: number
          title: string
          unit: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          currentValue?: number
          endDate?: string | null
          goalId: string
          id?: string
          order?: number
          startDate?: string | null
          targetValue: number
          title: string
          unit: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          currentValue?: number
          endDate?: string | null
          goalId?: string
          id?: string
          order?: number
          startDate?: string | null
          targetValue?: number
          title?: string
          unit?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "key_results_goalId_fkey"
            columns: ["goalId"]
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      melog_entries: {
        Row: {
          actor: string | null
          category: string
          content: string | null
          createdAt: string
          externalId: string | null
          id: string
          occurredAt: string
          payload: Json | null
          sourceId: string
          tags: string | null
          title: string
          type: string
          userId: string
        }
        Insert: {
          actor?: string | null
          category: string
          content?: string | null
          createdAt?: string
          externalId?: string | null
          id?: string
          occurredAt: string
          payload?: Json | null
          sourceId: string
          tags?: string | null
          title: string
          type: string
          userId: string
        }
        Update: {
          actor?: string | null
          category?: string
          content?: string | null
          createdAt?: string
          externalId?: string | null
          id?: string
          occurredAt?: string
          payload?: Json | null
          sourceId?: string
          tags?: string | null
          title?: string
          type?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "melog_entries_sourceId_fkey"
            columns: ["sourceId"]
            referencedRelation: "melog_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "melog_entries_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      melog_runs: {
        Row: {
          createdAt: string
          entryIds: Json | null
          id: string
          periodEnd: string | null
          periodStart: string | null
          result: string | null
          skillId: string
          stats: Json | null
          status: string
          summary: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          entryIds?: Json | null
          id?: string
          periodEnd?: string | null
          periodStart?: string | null
          result?: string | null
          skillId: string
          stats?: Json | null
          status?: string
          summary?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          entryIds?: Json | null
          id?: string
          periodEnd?: string | null
          periodStart?: string | null
          result?: string | null
          skillId?: string
          stats?: Json | null
          status?: string
          summary?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "melog_runs_skillId_fkey"
            columns: ["skillId"]
            referencedRelation: "melog_skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "melog_runs_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      melog_schedules: {
        Row: {
          createdAt: string
          dailyAt: string | null
          enabled: boolean
          id: string
          intervalHours: number | null
          kind: string
          lastRunAt: string | null
          nextRunAt: string | null
          skillId: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          dailyAt?: string | null
          enabled?: boolean
          id?: string
          intervalHours?: number | null
          kind?: string
          lastRunAt?: string | null
          nextRunAt?: string | null
          skillId: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          dailyAt?: string | null
          enabled?: boolean
          id?: string
          intervalHours?: number | null
          kind?: string
          lastRunAt?: string | null
          nextRunAt?: string | null
          skillId?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "melog_schedules_skillId_fkey"
            columns: ["skillId"]
            referencedRelation: "melog_skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "melog_schedules_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      melog_skills: {
        Row: {
          config: Json | null
          createdAt: string
          description: string | null
          id: string
          isActive: boolean
          lastRunAt: string | null
          name: string
          slug: string
          source: string
          updatedAt: string
          userId: string
          version: string
        }
        Insert: {
          config?: Json | null
          createdAt?: string
          description?: string | null
          id?: string
          isActive?: boolean
          lastRunAt?: string | null
          name: string
          slug: string
          source?: string
          updatedAt: string
          userId: string
          version?: string
        }
        Update: {
          config?: Json | null
          createdAt?: string
          description?: string | null
          id?: string
          isActive?: boolean
          lastRunAt?: string | null
          name?: string
          slug?: string
          source?: string
          updatedAt?: string
          userId?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "melog_skills_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      melog_sources: {
        Row: {
          adapter: string
          category: string
          config: Json | null
          createdAt: string
          endpoint: string | null
          entryCount: number
          id: string
          isActive: boolean
          lastSyncAt: string | null
          name: string
          status: string
          syncCursor: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          adapter: string
          category: string
          config?: Json | null
          createdAt?: string
          endpoint?: string | null
          entryCount?: number
          id?: string
          isActive?: boolean
          lastSyncAt?: string | null
          name: string
          status?: string
          syncCursor?: string | null
          updatedAt: string
          userId: string
        }
        Update: {
          adapter?: string
          category?: string
          config?: Json | null
          createdAt?: string
          endpoint?: string | null
          entryCount?: number
          id?: string
          isActive?: boolean
          lastSyncAt?: string | null
          name?: string
          status?: string
          syncCursor?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "melog_sources_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_snapshots: {
        Row: {
          channelId: string
          comments: number | null
          createdAt: string
          followers: number
          id: string
          isMock: boolean
          likes: number | null
          note: string | null
          recordedAt: string
          revenue: number | null
          shares: number | null
          userId: string
          views: number | null
        }
        Insert: {
          channelId: string
          comments?: number | null
          createdAt?: string
          followers: number
          id?: string
          isMock?: boolean
          likes?: number | null
          note?: string | null
          recordedAt?: string
          revenue?: number | null
          shares?: number | null
          userId: string
          views?: number | null
        }
        Update: {
          channelId?: string
          comments?: number | null
          createdAt?: string
          followers?: number
          id?: string
          isMock?: boolean
          likes?: number | null
          note?: string | null
          recordedAt?: string
          revenue?: number | null
          shares?: number | null
          userId?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "metric_snapshots_channelId_fkey"
            columns: ["channelId"]
            referencedRelation: "platform_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metric_snapshots_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mindset_slogans: {
        Row: {
          category: string
          content: string
          createdAt: string
          domainId: string | null
          id: string
          order: number
          updatedAt: string
          userId: string
        }
        Insert: {
          category: string
          content: string
          createdAt?: string
          domainId?: string | null
          id?: string
          order?: number
          updatedAt: string
          userId: string
        }
        Update: {
          category?: string
          content?: string
          createdAt?: string
          domainId?: string | null
          id?: string
          order?: number
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "mindset_slogans_domainId_fkey"
            columns: ["domainId"]
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mindset_slogans_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_usages: {
        Row: {
          id: string
          month: number
          notes: string | null
          recordedAt: string
          subscriptionId: string
          userId: string
          year: number
        }
        Insert: {
          id?: string
          month: number
          notes?: string | null
          recordedAt?: string
          subscriptionId: string
          userId: string
          year: number
        }
        Update: {
          id?: string
          month?: number
          notes?: string | null
          recordedAt?: string
          subscriptionId?: string
          userId?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_usages_subscriptionId_fkey"
            columns: ["subscriptionId"]
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      periodic_reviews: {
        Row: {
          achievements: string | null
          challenges: string | null
          createdAt: string
          dataSummary: Json | null
          endDate: string
          id: string
          insights: string | null
          nextFocus: string | null
          period: string
          startDate: string
          updatedAt: string
          userId: string
        }
        Insert: {
          achievements?: string | null
          challenges?: string | null
          createdAt?: string
          dataSummary?: Json | null
          endDate: string
          id?: string
          insights?: string | null
          nextFocus?: string | null
          period: string
          startDate: string
          updatedAt: string
          userId: string
        }
        Update: {
          achievements?: string | null
          challenges?: string | null
          createdAt?: string
          dataSummary?: Json | null
          endDate?: string
          id?: string
          insights?: string | null
          nextFocus?: string | null
          period?: string
          startDate?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodic_reviews_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_channels: {
        Row: {
          cadence: string | null
          createdAt: string
          handle: string | null
          id: string
          isMock: boolean
          name: string
          order: number
          platform: string
          positioning: string | null
          status: string
          updatedAt: string
          url: string | null
          userId: string
        }
        Insert: {
          cadence?: string | null
          createdAt?: string
          handle?: string | null
          id?: string
          isMock?: boolean
          name: string
          order?: number
          platform: string
          positioning?: string | null
          status?: string
          updatedAt: string
          url?: string | null
          userId: string
        }
        Update: {
          cadence?: string | null
          createdAt?: string
          handle?: string | null
          id?: string
          isMock?: boolean
          name?: string
          order?: number
          platform?: string
          positioning?: string | null
          status?: string
          updatedAt?: string
          url?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_channels_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quota_definitions: {
        Row: {
          createdAt: string
          criticalThreshold: number
          id: string
          monthlyLimit: number
          name: string
          order: number
          quotaType: string
          subscriptionId: string
          unit: string
          updatedAt: string
          userId: string
          warningThreshold: number
        }
        Insert: {
          createdAt?: string
          criticalThreshold?: number
          id?: string
          monthlyLimit: number
          name: string
          order?: number
          quotaType?: string
          subscriptionId: string
          unit: string
          updatedAt: string
          userId: string
          warningThreshold?: number
        }
        Update: {
          createdAt?: string
          criticalThreshold?: number
          id?: string
          monthlyLimit?: number
          name?: string
          order?: number
          quotaType?: string
          subscriptionId?: string
          unit?: string
          updatedAt?: string
          userId?: string
          warningThreshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "quota_definitions_subscriptionId_fkey"
            columns: ["subscriptionId"]
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      quota_usages: {
        Row: {
          createdAt: string
          id: string
          monthlyUsageId: string
          quotaDefinitionId: string
          updatedAt: string
          usedAmount: number
          userId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          monthlyUsageId: string
          quotaDefinitionId: string
          updatedAt: string
          usedAmount: number
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          monthlyUsageId?: string
          quotaDefinitionId?: string
          updatedAt?: string
          usedAmount?: number
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "quota_usages_monthlyUsageId_fkey"
            columns: ["monthlyUsageId"]
            referencedRelation: "monthly_usages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quota_usages_quotaDefinitionId_fkey"
            columns: ["quotaDefinitionId"]
            referencedRelation: "quota_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_items: {
        Row: {
          author: string | null
          createdAt: string
          endDate: string | null
          id: string
          note: string | null
          rating: number | null
          startDate: string | null
          status: string
          title: string
          topicId: string | null
          type: string
          updatedAt: string
          url: string | null
          userId: string
        }
        Insert: {
          author?: string | null
          createdAt?: string
          endDate?: string | null
          id?: string
          note?: string | null
          rating?: number | null
          startDate?: string | null
          status?: string
          title: string
          topicId?: string | null
          type?: string
          updatedAt: string
          url?: string | null
          userId: string
        }
        Update: {
          author?: string | null
          createdAt?: string
          endDate?: string | null
          id?: string
          note?: string | null
          rating?: number | null
          startDate?: string | null
          status?: string
          title?: string
          topicId?: string | null
          type?: string
          updatedAt?: string
          url?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_items_topicId_fkey"
            columns: ["topicId"]
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_items_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reflections: {
        Row: {
          celebrations: string | null
          content: string | null
          createdAt: string
          date: string
          domainId: string | null
          id: string
          improvements: string | null
          mood: string | null
          tags: string | null
          tomorrow: string | null
          type: string
          updatedAt: string
          userId: string
        }
        Insert: {
          celebrations?: string | null
          content?: string | null
          createdAt?: string
          date?: string
          domainId?: string | null
          id?: string
          improvements?: string | null
          mood?: string | null
          tags?: string | null
          tomorrow?: string | null
          type?: string
          updatedAt: string
          userId: string
        }
        Update: {
          celebrations?: string | null
          content?: string | null
          createdAt?: string
          date?: string
          domainId?: string | null
          id?: string
          improvements?: string | null
          mood?: string | null
          tags?: string | null
          tomorrow?: string | null
          type?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflections_domainId_fkey"
            columns: ["domainId"]
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reflections_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          autoRenew: boolean
          billingCycle: string
          config: Json | null
          costPerCycle: number
          createdAt: string
          currency: string
          endDate: string | null
          id: string
          isActive: boolean
          name: string
          notes: string | null
          provider: string
          startDate: string
          updatedAt: string
          userId: string
          websiteUrl: string | null
        }
        Insert: {
          autoRenew?: boolean
          billingCycle: string
          config?: Json | null
          costPerCycle: number
          createdAt?: string
          currency?: string
          endDate?: string | null
          id?: string
          isActive?: boolean
          name: string
          notes?: string | null
          provider: string
          startDate: string
          updatedAt: string
          userId: string
          websiteUrl?: string | null
        }
        Update: {
          autoRenew?: boolean
          billingCycle?: string
          config?: Json | null
          costPerCycle?: number
          createdAt?: string
          currency?: string
          endDate?: string | null
          id?: string
          isActive?: boolean
          name?: string
          notes?: string | null
          provider?: string
          startDate?: string
          updatedAt?: string
          userId?: string
          websiteUrl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          completedAt: string | null
          createdAt: string
          description: string | null
          domainId: string | null
          dueDate: string | null
          energy: string | null
          estimatedMinutes: number | null
          goalId: string | null
          id: string
          order: number
          priority: string
          source: string
          status: string
          title: string
          updatedAt: string
          userId: string
        }
        Insert: {
          completedAt?: string | null
          createdAt?: string
          description?: string | null
          domainId?: string | null
          dueDate?: string | null
          energy?: string | null
          estimatedMinutes?: number | null
          goalId?: string | null
          id?: string
          order?: number
          priority?: string
          source?: string
          status?: string
          title: string
          updatedAt: string
          userId: string
        }
        Update: {
          completedAt?: string | null
          createdAt?: string
          description?: string | null
          domainId?: string | null
          dueDate?: string | null
          energy?: string | null
          estimatedMinutes?: number | null
          goalId?: string | null
          id?: string
          order?: number
          priority?: string
          source?: string
          status?: string
          title?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_domainId_fkey"
            columns: ["domainId"]
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_goalId_fkey"
            columns: ["goalId"]
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_notes: {
        Row: {
          content: string
          createdAt: string
          id: string
          noteType: string
          topicId: string
          userId: string
        }
        Insert: {
          content: string
          createdAt?: string
          id?: string
          noteType?: string
          topicId: string
          userId: string
        }
        Update: {
          content?: string
          createdAt?: string
          id?: string
          noteType?: string
          topicId?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_notes_topicId_fkey"
            columns: ["topicId"]
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_notes_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          actionPlan: string | null
          category: string
          createdAt: string
          currentUnderstanding: string | null
          description: string | null
          goalId: string | null
          id: string
          isMock: boolean
          order: number
          priority: string
          relatedDomainId: string | null
          status: string
          title: string
          updatedAt: string
          userId: string
        }
        Insert: {
          actionPlan?: string | null
          category?: string
          createdAt?: string
          currentUnderstanding?: string | null
          description?: string | null
          goalId?: string | null
          id?: string
          isMock?: boolean
          order?: number
          priority?: string
          relatedDomainId?: string | null
          status?: string
          title: string
          updatedAt: string
          userId: string
        }
        Update: {
          actionPlan?: string | null
          category?: string
          createdAt?: string
          currentUnderstanding?: string | null
          description?: string | null
          goalId?: string | null
          id?: string
          isMock?: boolean
          order?: number
          priority?: string
          relatedDomainId?: string | null
          status?: string
          title?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_goalId_fkey"
            columns: ["goalId"]
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          createdAt: string
          email: string
          id: string
          name: string
          password: string | null
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          email: string
          id?: string
          name: string
          password?: string | null
          updatedAt: string
        }
        Update: {
          createdAt?: string
          email?: string
          id?: string
          name?: string
          password?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      visions: {
        Row: {
          content: string
          createdAt: string
          id: string
          isActive: boolean
          updatedAt: string
          userId: string
          version: number
        }
        Insert: {
          content: string
          createdAt?: string
          id?: string
          isActive?: boolean
          updatedAt: string
          userId: string
          version?: number
        }
        Update: {
          content?: string
          createdAt?: string
          id?: string
          isActive?: boolean
          updatedAt?: string
          userId?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "visions_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_connections: {
        Row: {
          createdAt: string
          id: string
          sourceHandle: string
          sourceStepId: string
          targetHandle: string
          targetStepId: string
          userId: string
          workflowId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          sourceHandle?: string
          sourceStepId: string
          targetHandle?: string
          targetStepId: string
          userId: string
          workflowId: string
        }
        Update: {
          createdAt?: string
          id?: string
          sourceHandle?: string
          sourceStepId?: string
          targetHandle?: string
          targetStepId?: string
          userId?: string
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_connections_sourceStepId_fkey"
            columns: ["sourceStepId"]
            referencedRelation: "workflow_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_connections_targetStepId_fkey"
            columns: ["targetStepId"]
            referencedRelation: "workflow_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_connections_workflowId_fkey"
            columns: ["workflowId"]
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          createdAt: string
          entityId: string
          entityType: string
          height: number
          id: string
          label: string
          positionX: number
          positionY: number
          userId: string
          width: number
          workflowId: string
        }
        Insert: {
          createdAt?: string
          entityId: string
          entityType: string
          height?: number
          id?: string
          label: string
          positionX?: number
          positionY?: number
          userId: string
          width?: number
          workflowId: string
        }
        Update: {
          createdAt?: string
          entityId?: string
          entityType?: string
          height?: number
          id?: string
          label?: string
          positionX?: number
          positionY?: number
          userId?: string
          width?: number
          workflowId?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflowId_fkey"
            columns: ["workflowId"]
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          createdAt: string
          description: string | null
          id: string
          name: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id?: string
          name: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: string
          name?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          createdAt: string
          description: string | null
          id: string
          isMock: boolean
          launchedAt: string | null
          name: string
          order: number
          progress: string | null
          status: string
          type: string
          updatedAt: string
          url: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id?: string
          isMock?: boolean
          launchedAt?: string | null
          name: string
          order?: number
          progress?: string | null
          status?: string
          type?: string
          updatedAt: string
          url?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: string
          isMock?: boolean
          launchedAt?: string | null
          name?: string
          order?: number
          progress?: string | null
          status?: string
          type?: string
          updatedAt?: string
          url?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "works_userId_fkey"
            columns: ["userId"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
