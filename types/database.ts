export type SearchStatus = "pending" | "processing" | "completed" | "failed";
export type TimeRange = "week" | "month" | "year" | "all";
export type SortBy = "relevance" | "upvotes" | "recency";
export type HNTag = "story" | "ask_hn" | "show_hn" | "front_page" | "poll";
export type LogLevel = "info" | "error" | "warn";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          created_at: string
          id: string
          model: string | null
          problem_clusters: Json
          product_ideas: Json
          search_id: string
          summary: string
          tokens_used: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string | null
          problem_clusters: Json
          product_ideas: Json
          search_id: string
          summary: string
          tokens_used?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          model?: string | null
          problem_clusters?: Json
          product_ideas?: Json
          search_id?: string
          summary?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: true
            referencedRelation: "public_search_overview"
            referencedColumns: ["search_id"]
          },
          {
            foreignKeyName: "ai_analyses_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: true
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          created_at: string
          estimated_cost_usd: number | null
          id: string
          search_id: string | null
          service: string
          tokens_used: number | null
        }
        Insert: {
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          search_id?: string | null
          service: string
          tokens_used?: number | null
        }
        Update: {
          created_at?: string
          estimated_cost_usd?: number | null
          id?: string
          search_id?: string | null
          service?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "public_search_overview"
            referencedColumns: ["search_id"]
          },
          {
            foreignKeyName: "api_usage_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
      job_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: number
          level: string
          message: string
          search_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: number
          level?: string
          message: string
          search_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: number
          level?: string
          message?: string
          search_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_logs_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "public_search_overview"
            referencedColumns: ["search_id"]
          },
          {
            foreignKeyName: "job_logs_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
      pain_point_quotes: {
        Row: {
          author_handle: string | null
          id: string
          pain_point_id: string
          permalink: string
          quote_text: string
          upvotes: number
        }
        Insert: {
          author_handle?: string | null
          id?: string
          pain_point_id: string
          permalink: string
          quote_text: string
          upvotes?: number
        }
        Update: {
          author_handle?: string | null
          id?: string
          pain_point_id?: string
          permalink?: string
          quote_text?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "pain_point_quotes_pain_point_id_fkey"
            columns: ["pain_point_id"]
            isOneToOne: false
            referencedRelation: "pain_points"
            referencedColumns: ["id"]
          },
        ]
      }
      pain_points: {
        Row: {
          id: string
          mentions_count: number
          search_id: string
          severity_score: number | null
          subreddit: string
          title: string
        }
        Insert: {
          id?: string
          mentions_count?: number
          search_id: string
          severity_score?: number | null
          subreddit: string
          title: string
        }
        Update: {
          id?: string
          mentions_count?: number
          search_id?: string
          severity_score?: number | null
          subreddit?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pain_points_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "public_search_overview"
            referencedColumns: ["search_id"]
          },
          {
            foreignKeyName: "pain_points_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
      search_results: {
        Row: {
          id: string
          search_id: string
          source_subreddits: string[] | null
          source_tags: string[] | null
          total_comments_considered: number | null
          total_mentions: number | null
          total_posts_considered: number | null
        }
        Insert: {
          id?: string
          search_id: string
          source_subreddits?: string[] | null
          source_tags?: string[] | null
          total_comments_considered?: number | null
          total_mentions?: number | null
          total_posts_considered?: number | null
        }
        Update: {
          id?: string
          search_id?: string
          source_subreddits?: string[] | null
          source_tags?: string[] | null
          total_comments_considered?: number | null
          total_mentions?: number | null
          total_posts_considered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "search_results_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: true
            referencedRelation: "public_search_overview"
            referencedColumns: ["search_id"]
          },
          {
            foreignKeyName: "search_results_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: true
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
      searches: {
        Row: {
          client_fingerprint: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          last_retry_at: string | null
          min_upvotes: number
          next_retry_at: string | null
          retry_count: number
          sort_by: string
          status: string
          subreddits: string[] | null
          time_range: string
          topic: string
        }
        Insert: {
          client_fingerprint?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          min_upvotes?: number
          next_retry_at?: string | null
          retry_count?: number
          sort_by: string
          status?: string
          subreddits?: string[] | null
          time_range: string
          topic: string
        }
        Update: {
          client_fingerprint?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          min_upvotes?: number
          next_retry_at?: string | null
          retry_count?: number
          sort_by?: string
          status?: string
          subreddits?: string[] | null
          time_range?: string
          topic?: string
        }
        Relationships: []
      }
    }
    Views: {
      popular_searches: {
        Row: {
          avg_duration_seconds: number | null
          last_searched: string | null
          search_count: number | null
          topic: string | null
        }
        Relationships: []
      }
      public_search_overview: {
        Row: {
          completed_at: string | null
          created_at: string | null
          min_upvotes: number | null
          pain_point_count: number | null
          search_id: string | null
          sort_by: string | null
          source_tags: string[] | null
          status: string | null
          time_range: string | null
          topic: string | null
          total_comments_considered: number | null
          total_mentions: number | null
          total_posts_considered: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_searches: { Args: { p_days_old?: number }; Returns: number }
      find_similar_search: {
        Args: {
          p_max_age_minutes?: number
          p_min_upvotes: number
          p_sort_by: string
          p_time_range: string
          p_topic: string
        }
        Returns: string
      }
      get_complete_search: { Args: { p_search_id: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type SearchRow = Database["public"]["Tables"]["searches"]["Row"];
export type SearchInsert = Database["public"]["Tables"]["searches"]["Insert"];
export type SearchUpdate = Database["public"]["Tables"]["searches"]["Update"];

export type SearchResultsRow = Database["public"]["Tables"]["search_results"]["Row"];
export type SearchResultsInsert = Database["public"]["Tables"]["search_results"]["Insert"];

export type PainPointRow = Database["public"]["Tables"]["pain_points"]["Row"];
export type PainPointInsert = Database["public"]["Tables"]["pain_points"]["Insert"];

export type PainPointQuoteRow = Database["public"]["Tables"]["pain_point_quotes"]["Row"];
export type PainPointQuoteInsert = Database["public"]["Tables"]["pain_point_quotes"]["Insert"];

export type AiAnalysisRow = Database["public"]["Tables"]["ai_analyses"]["Row"];
export type AiAnalysisInsert = Database["public"]["Tables"]["ai_analyses"]["Insert"];

export type JobLogRow = Database["public"]["Tables"]["job_logs"]["Row"];
export type JobLogInsert = Database["public"]["Tables"]["job_logs"]["Insert"];

export type ApiUsageRow = Database["public"]["Tables"]["api_usage"]["Row"];
export type ApiUsageInsert = Database["public"]["Tables"]["api_usage"]["Insert"];
