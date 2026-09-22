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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      listings: {
        Row: {
          category: string
          condition: Database["public"]["Enums"]["listing_condition"]
          created_at: string
          description: string
          expires_at: string | null
          hostel_area: string
          id: string
          images: string[]
          is_clearance: boolean
          is_featured: boolean
          living_type: Database["public"]["Enums"]["living_type"]
          negotiable: boolean
          plan: Database["public"]["Enums"]["listing_plan"] | null
          price: number
          published_at: string | null
          seller_id: string
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          university: Database["public"]["Enums"]["university"]
          updated_at: string
          views: number
        }
        Insert: {
          category: string
          condition: Database["public"]["Enums"]["listing_condition"]
          created_at?: string
          description: string
          expires_at?: string | null
          hostel_area: string
          id?: string
          images?: string[]
          is_clearance?: boolean
          is_featured?: boolean
          living_type: Database["public"]["Enums"]["living_type"]
          negotiable?: boolean
          plan?: Database["public"]["Enums"]["listing_plan"] | null
          price: number
          published_at?: string | null
          seller_id: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          university: Database["public"]["Enums"]["university"]
          updated_at?: string
          views?: number
        }
        Update: {
          category?: string
          condition?: Database["public"]["Enums"]["listing_condition"]
          created_at?: string
          description?: string
          expires_at?: string | null
          hostel_area?: string
          id?: string
          images?: string[]
          is_clearance?: boolean
          is_featured?: boolean
          living_type?: Database["public"]["Enums"]["living_type"]
          negotiable?: boolean
          plan?: Database["public"]["Enums"]["listing_plan"] | null
          price?: number
          published_at?: string | null
          seller_id?: string
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          university?: Database["public"]["Enums"]["university"]
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          id: string
          listing_id: string | null
          message: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id?: string | null
          message: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string | null
          message?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          amount: number
          buyer_confirmed: boolean
          buyer_id: string
          created_at: string
          deal_confirmed_at: string | null
          id: string
          listing_id: string
          message: string | null
          parent_offer_id: string | null
          seller_confirmed: boolean
          status: Database["public"]["Enums"]["offer_status"]
        }
        Insert: {
          amount: number
          buyer_confirmed?: boolean
          buyer_id: string
          created_at?: string
          deal_confirmed_at?: string | null
          id?: string
          listing_id: string
          message?: string | null
          parent_offer_id?: string | null
          seller_confirmed?: boolean
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Update: {
          amount?: number
          buyer_confirmed?: boolean
          buyer_id?: string
          created_at?: string
          deal_confirmed_at?: string | null
          id?: string
          listing_id?: string
          message?: string | null
          parent_offer_id?: string | null
          seller_confirmed?: boolean
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_parent_offer_id_fkey"
            columns: ["parent_offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          listing_id: string | null
          plan: Database["public"]["Enums"]["listing_plan"]
          provider: string
          provider_response: Json | null
          reference: string
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          listing_id?: string | null
          plan: Database["public"]["Enums"]["listing_plan"]
          provider?: string
          provider_response?: Json | null
          reference: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          listing_id?: string | null
          plan?: Database["public"]["Enums"]["listing_plan"]
          provider?: string
          provider_response?: Json | null
          reference?: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_user_id: string
          referral_code: string
          status: string
          created_at: string
          verified_at: string | null
          qualified_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_user_id: string
          referral_code: string
          status?: string
          created_at?: string
          verified_at?: string | null
          qualified_at?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_user_id?: string
          referral_code?: string
          status?: string
          created_at?: string
          verified_at?: string | null
          qualified_at?: string | null
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          id: string
          referral_id: string
          referrer_id: string
          amount: number
          currency: string
          status: string
          created_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          referral_id: string
          referrer_id: string
          amount: number
          currency?: string
          status?: string
          created_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          referral_id?: string
          referrer_id?: string
          amount?: number
          currency?: string
          status?: string
          created_at?: string
          paid_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          is_blocked: boolean
          level: string | null
          matric_number: string | null
          phone: string | null
          profile_image: string | null
          referral_code: string | null
          university: Database["public"]["Enums"]["university"]
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id: string
          is_blocked?: boolean
          level?: string | null
          matric_number?: string | null
          phone?: string | null
          profile_image?: string | null
          referral_code?: string | null
          university: Database["public"]["Enums"]["university"]
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          is_blocked?: boolean
          level?: string | null
          matric_number?: string | null
          phone?: string | null
          profile_image?: string | null
          referral_code?: string | null
          university?: Database["public"]["Enums"]["university"]
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          listing_id: string | null
          reason: string
          reported_user_id: string | null
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string | null
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string | null
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string | null
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating: number
          reviewed_user_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string | null
          rating?: number
          reviewed_user_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_listings: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verifications: {
        Row: {
          department: string
          full_name: string
          id: string
          level: string
          matric_number: string
          notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["verification_status"]
          student_id_url: string
          submitted_at: string
          university: Database["public"]["Enums"]["university"]
          user_id: string
        }
        Insert: {
          department: string
          full_name: string
          id?: string
          level: string
          matric_number: string
          notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_id_url: string
          submitted_at?: string
          university: Database["public"]["Enums"]["university"]
          user_id: string
        }
        Update: {
          department?: string
          full_name?: string
          id?: string
          level?: string
          matric_number?: string
          notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_id_url?: string
          submitted_at?: string
          university?: Database["public"]["Enums"]["university"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_referral: {
        Args: { p_code: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      listing_condition: "NEW" | "LIKE_NEW" | "GOOD" | "FAIR"
      listing_plan: "FREE" | "BASIC" | "FEATURED" | "CLEARANCE"
      listing_status:
        | "DRAFT"
        | "PAYMENT_PENDING"
        | "ACTIVE"
        | "SOLD"
        | "EXPIRED"
        | "REMOVED"
      living_type: "SCHOOL_HOSTEL" | "OFF_CAMPUS_HOSTEL" | "PRIVATE_APARTMENT"
      offer_status:
        | "PENDING"
        | "ACCEPTED"
        | "REJECTED"
        | "COUNTERED"
        | "WITHDRAWN"
      payment_status: "PENDING" | "SUCCESSFUL" | "FAILED" | "CANCELLED"
      report_status: "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED"
      university: "UNILORIN" | "AL_HIKMAH" | "KWASU" | "UNIOSUN"
      verification_status: "PENDING" | "APPROVED" | "REJECTED"
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
      app_role: ["admin", "user"],
      listing_condition: ["NEW", "LIKE_NEW", "GOOD", "FAIR"],
      listing_plan: ["FREE", "BASIC", "FEATURED", "CLEARANCE"],
      listing_status: [
        "DRAFT",
        "PAYMENT_PENDING",
        "ACTIVE",
        "SOLD",
        "EXPIRED",
        "REMOVED",
      ],
      living_type: ["SCHOOL_HOSTEL", "OFF_CAMPUS_HOSTEL", "PRIVATE_APARTMENT"],
      offer_status: [
        "PENDING",
        "ACCEPTED",
        "REJECTED",
        "COUNTERED",
        "WITHDRAWN",
      ],
      payment_status: ["PENDING", "SUCCESSFUL", "FAILED", "CANCELLED"],
      report_status: ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"],
      university: ["UNILORIN", "AL_HIKMAH", "KWASU", "UNIOSUN"],
      verification_status: ["PENDING", "APPROVED", "REJECTED"],
    },
  },
} as const
