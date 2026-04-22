export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      bids: {
        Row: {
          amount_cents: number;
          captured_at: string | null;
          created_at: string;
          experience_id: string;
          id: string;
          payment_intent_id: string;
          pitch: string;
          bidder_id: string;
          refunded_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          amount_cents: number;
          captured_at?: string | null;
          created_at?: string;
          experience_id: string;
          id?: string;
          payment_intent_id: string;
          pitch: string;
          bidder_id: string;
          refunded_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bids"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey";
            columns: ["bidder_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bids_experience_id_fkey";
            columns: ["experience_id"];
            isOneToOne: false;
            referencedRelation: "experiences";
            referencedColumns: ["id"];
          },
        ];
      };
      blocks: {
        Row: {
          blocked_id: string;
          blocker_id: string;
          created_at: string;
          id: string;
        };
        Insert: {
          blocked_id: string;
          blocker_id: string;
          created_at?: string;
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["blocks"]["Insert"]>;
        Relationships: [];
      };
      experiences: {
        Row: {
          budget_max_cents: number | null;
          budget_min_cents: number | null;
          chat_unlocked_at: string | null;
          created_at: string;
          date_window_end: string | null;
          date_window_start: string | null;
          description: string;
          expires_at: string | null;
          id: string;
          location: string;
          safety_preferences: string[];
          selected_bid_id: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
          vibe_summary: string | null;
          winner_user_id: string | null;
        };
        Insert: {
          budget_max_cents?: number | null;
          budget_min_cents?: number | null;
          chat_unlocked_at?: string | null;
          created_at?: string;
          date_window_end?: string | null;
          date_window_start?: string | null;
          description: string;
          expires_at?: string | null;
          id?: string;
          location: string;
          safety_preferences?: string[];
          selected_bid_id?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
          vibe_summary?: string | null;
          winner_user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["experiences"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "experiences_selected_bid_id_fkey";
            columns: ["selected_bid_id"];
            isOneToOne: false;
            referencedRelation: "bids";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "experiences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          sender_id: string;
          thread_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          sender_id: string;
          thread_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [];
      };
      moderation_queue: {
        Row: {
          assigned_to: string | null;
          created_at: string;
          id: string;
          priority: string;
          report_id: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string;
          id?: string;
          priority?: string;
          report_id: string;
          status?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["moderation_queue"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          age: number | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          is_verified: boolean;
          location: string | null;
          photo_urls: string[];
          quality_score: number;
          stripe_connect_account_id: string | null;
          stripe_customer_id: string | null;
          updated_at: string;
        };
        Insert: {
          age?: number | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          is_verified?: boolean;
          location?: string | null;
          photo_urls?: string[];
          quality_score?: number;
          stripe_connect_account_id?: string | null;
          stripe_customer_id?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          bid_id: string | null;
          created_at: string;
          details: string | null;
          experience_id: string | null;
          id: string;
          reason: string;
          reported_user_id: string | null;
          reporter_id: string;
          status: string;
        };
        Insert: {
          bid_id?: string | null;
          created_at?: string;
          details?: string | null;
          experience_id?: string | null;
          id?: string;
          reason: string;
          reported_user_id?: string | null;
          reporter_id: string;
          status?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      threads: {
        Row: {
          bidder_id: string;
          created_at: string;
          experience_id: string;
          id: string;
          poster_id: string;
          unlocked_at: string;
        };
        Insert: {
          bidder_id: string;
          created_at?: string;
          experience_id: string;
          id?: string;
          poster_id: string;
          unlocked_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["threads"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      bid_status: "active" | "selected" | "refunded" | "capture_failed";
      experience_status: "open" | "closed" | "completed" | "cancelled";
      moderation_priority: "low" | "normal" | "high";
      moderation_status: "queued" | "reviewing" | "resolved";
      report_status: "open" | "reviewed" | "actioned";
    };
    CompositeTypes: Record<string, never>;
  };
};
