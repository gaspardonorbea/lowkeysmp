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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          image_url: string | null
          pinned: boolean
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          pinned?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          pinned?: boolean
          title?: string
        }
        Relationships: []
      }
      content_comments: {
        Row: {
          announcement_id: string | null
          body: string
          created_at: string
          delete_token: string
          display_name: string
          id: string
          trailer_id: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          announcement_id?: string | null
          body: string
          created_at?: string
          delete_token?: string
          display_name: string
          id?: string
          trailer_id?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          announcement_id?: string | null
          body?: string
          created_at?: string
          delete_token?: string
          display_name?: string
          id?: string
          trailer_id?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_trailer_id_fkey"
            columns: ["trailer_id"]
            isOneToOne: false
            referencedRelation: "trailers"
            referencedColumns: ["id"]
          },
        ]
      }
      content_likes: {
        Row: {
          announcement_id: string | null
          created_at: string
          id: string
          trailer_id: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          announcement_id?: string | null
          created_at?: string
          id?: string
          trailer_id?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          announcement_id?: string | null
          created_at?: string
          id?: string
          trailer_id?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_likes_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_likes_trailer_id_fkey"
            columns: ["trailer_id"]
            isOneToOne: false
            referencedRelation: "trailers"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          id: string
          ign: string
          irl_name: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          ign: string
          irl_name?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          ign?: string
          irl_name?: string
        }
        Relationships: []
      }
      opening_hours: {
        Row: {
          day: string
          hours: string
          id: string
          sort: number
        }
        Insert: {
          day: string
          hours: string
          id?: string
          sort?: number
        }
        Update: {
          day?: string
          hours?: string
          id?: string
          sort?: number
        }
        Relationships: []
      }
      players: {
        Row: {
          created_at: string
          death_cause: string | null
          death_location: string | null
          died_at: string | null
          revived_at: string | null
          main_died_at: string | null
          main_death_cause: string | null
          island_died_at: string | null
          island_death_cause: string | null
          id: string
          is_dead: boolean
          name: string
          role: string
          team: string | null
        }
        Insert: {
          created_at?: string
          death_cause?: string | null
          death_location?: string | null
          died_at?: string | null
          revived_at?: string | null
          main_died_at?: string | null
          main_death_cause?: string | null
          island_died_at?: string | null
          island_death_cause?: string | null
          id?: string
          is_dead?: boolean
          name: string
          role?: string
          team?: string | null
        }
        Update: {
          created_at?: string
          death_cause?: string | null
          death_location?: string | null
          died_at?: string | null
          revived_at?: string | null
          main_died_at?: string | null
          main_death_cause?: string | null
          island_died_at?: string | null
          island_death_cause?: string | null
          id?: string
          is_dead?: boolean
          name?: string
          role?: string
          team?: string | null
        }
        Relationships: []
      }
ng
          is_dead?: boolean
          name?: string
          role?: string
          team?: string | null
        }
        Relationships: []
      }
      site_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          visitor_id?: string
        }
        Relationships: []
      }
      trailers: {
        Row: {
          created_at: string
          id: string
          released_at: string
          title: string
          video_url: string | null
          youtube_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          released_at?: string
          title: string
          video_url?: string | null
          youtube_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          released_at?: string
          title?: string
          video_url?: string | null
          youtube_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whitelist_requests: {
        Row: {
          created_at: string
          id: string
          irl_name: string
          mc_name: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          irl_name: string
          mc_name: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          irl_name?: string
          mc_name?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
