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
      ai_match_feed_status: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          investor_id: string
          startup_id: string
          status: string
          updated_at: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          investor_id: string
          startup_id: string
          status: string
          updated_at?: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          investor_id?: string
          startup_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_match_feed_status_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "ai_persona_chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_match_feed_status_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_match_feed_status_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_persona_chats: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          investor_id: string
          match_score: number | null
          startup_id: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          investor_id: string
          match_score?: number | null
          startup_id: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          investor_id?: string
          match_score?: number | null
          startup_id?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_persona_chats_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_persona_chats_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_persona_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          metadata: Json | null
          sender_type: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender_type: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_persona_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "ai_persona_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_ai_searches: {
        Row: {
          created_at: string
          id: string
          investor_id: string
          query: string
          results: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          investor_id: string
          query: string
          results?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          investor_id?: string
          query?: string
          results?: Json | null
        }
        Relationships: []
      }
      investor_matches: {
        Row: {
          created_at: string | null
          id: string
          investor_id: string | null
          match_score: number | null
          startup_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          investor_id?: string | null
          match_score?: number | null
          startup_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          investor_id?: string | null
          match_score?: number | null
          startup_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_matches_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_matches_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          market_updates: boolean | null
          max_investment: string | null
          min_investment: string | null
          new_matches: boolean | null
          preferred_sectors: string[] | null
          preferred_stages: string[] | null
          push_notifications: boolean | null
          updated_at: string | null
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          market_updates?: boolean | null
          max_investment?: string | null
          min_investment?: string | null
          new_matches?: boolean | null
          preferred_sectors?: string[] | null
          preferred_stages?: string[] | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          market_updates?: boolean | null
          max_investment?: string | null
          min_investment?: string | null
          new_matches?: boolean | null
          preferred_sectors?: string[] | null
          preferred_stages?: string[] | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          id: string
          read_at: string | null
          recipient_id: string | null
          sender_id: string | null
          sent_at: string | null
        }
        Insert: {
          content: string
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          sent_at?: string | null
        }
        Update: {
          content?: string
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          hashtags: string[]
          id: string
          image_url: string | null
          likes: number
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          hashtags?: string[]
          id?: string
          image_url?: string | null
          likes?: number
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          image_url?: string | null
          likes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_completion_tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          startup_id: string | null
          task_name: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          startup_id?: string | null
          task_name: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          startup_id?: string | null
          task_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_completion_tasks_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_views: {
        Row: {
          id: string
          startup_id: string | null
          viewed_at: string | null
          viewer_id: string | null
        }
        Insert: {
          id?: string
          startup_id?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Update: {
          id?: string
          startup_id?: string | null
          viewed_at?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          position: string | null
          user_type: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          position?: string | null
          user_type: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          position?: string | null
          user_type?: string
        }
        Relationships: []
      }
      startup_metrics: {
        Row: {
          growth: string | null
          id: string
          mrr: string | null
          partnerships: string | null
          updated_at: string | null
          users: string | null
        }
        Insert: {
          growth?: string | null
          id: string
          mrr?: string | null
          partnerships?: string | null
          updated_at?: string | null
          users?: string | null
        }
        Update: {
          growth?: string | null
          id?: string
          mrr?: string | null
          partnerships?: string | null
          updated_at?: string | null
          users?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_metrics_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_notification_settings: {
        Row: {
          created_at: string | null
          email_funding_updates: boolean | null
          email_messages: boolean | null
          email_new_match: boolean | null
          email_newsletters: boolean | null
          email_profile_views: boolean | null
          id: string
          push_matches: boolean | null
          push_messages: boolean | null
          push_reminders: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_funding_updates?: boolean | null
          email_messages?: boolean | null
          email_new_match?: boolean | null
          email_newsletters?: boolean | null
          email_profile_views?: boolean | null
          id?: string
          push_matches?: boolean | null
          push_messages?: boolean | null
          push_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_funding_updates?: boolean | null
          email_messages?: boolean | null
          email_new_match?: boolean | null
          email_newsletters?: boolean | null
          email_profile_views?: boolean | null
          id?: string
          push_matches?: boolean | null
          push_messages?: boolean | null
          push_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      startup_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          demo_url: string | null
          demo_video: string | null
          employees: string | null
          equity_offered: string | null
          founded: string | null
          id: string
          industry: string | null
          location: string | null
          looking_for_design_partner: boolean | null
          looking_for_funding: boolean | null
          min_investment: string | null
          name: string | null
          raised_amount: string | null
          stage: string | null
          tagline: string | null
          target_amount: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          demo_url?: string | null
          demo_video?: string | null
          employees?: string | null
          equity_offered?: string | null
          founded?: string | null
          id: string
          industry?: string | null
          location?: string | null
          looking_for_design_partner?: boolean | null
          looking_for_funding?: boolean | null
          min_investment?: string | null
          name?: string | null
          raised_amount?: string | null
          stage?: string | null
          tagline?: string | null
          target_amount?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          demo_url?: string | null
          demo_video?: string | null
          employees?: string | null
          equity_offered?: string | null
          founded?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          looking_for_design_partner?: boolean | null
          looking_for_funding?: boolean | null
          min_investment?: string | null
          name?: string | null
          raised_amount?: string | null
          stage?: string | null
          tagline?: string | null
          target_amount?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_team_members: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          name: string
          role: string | null
          startup_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string
          name: string
          role?: string | null
          startup_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          name?: string
          role?: string | null
          startup_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_team_members_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_profile: {
        Args: {
          profile_id: string
          profile_user_type: string
          profile_name: string
          profile_email: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
