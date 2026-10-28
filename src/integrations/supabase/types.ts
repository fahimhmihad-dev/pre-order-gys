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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          advance_amount: number
          count_rule: string
          created_at: string
          deadline_at: string | null
          description: string
          est_delivery_at: string | null
          featured: boolean
          id: string
          images: string[]
          max_per_order: number
          price: number
          public_note: string
          slug: string
          start_at: string
          status: Database["public"]["Enums"]["campaign_status"]
          target_qty: number
          title: string
          updated_at: string
          visibility: string
          waitlist_enabled: boolean
        }
        Insert: {
          advance_amount?: number
          count_rule?: string
          created_at?: string
          deadline_at?: string | null
          description?: string
          est_delivery_at?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          max_per_order?: number
          price?: number
          public_note?: string
          slug: string
          start_at?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          target_qty?: number
          title: string
          updated_at?: string
          visibility?: string
          waitlist_enabled?: boolean
        }
        Update: {
          advance_amount?: number
          count_rule?: string
          created_at?: string
          deadline_at?: string | null
          description?: string
          est_delivery_at?: string | null
          featured?: boolean
          id?: string
          images?: string[]
          max_per_order?: number
          price?: number
          public_note?: string
          slug?: string
          start_at?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          target_qty?: number
          title?: string
          updated_at?: string
          visibility?: string
          waitlist_enabled?: boolean
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          admin_note: string
          alt_phone: string
          area: string
          campaign_id: string
          created_at: string
          customer_name: string
          id: string
          note: string
          order_code: string
          payment_method: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          phone: string
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          transaction_id: string
          updated_at: string
        }
        Insert: {
          address: string
          admin_note?: string
          alt_phone?: string
          area?: string
          campaign_id: string
          created_at?: string
          customer_name: string
          id?: string
          note?: string
          order_code?: string
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone: string
          quantity: number
          status?: Database["public"]["Enums"]["order_status"]
          transaction_id?: string
          updated_at?: string
        }
        Update: {
          address?: string
          admin_note?: string
          alt_phone?: string
          area?: string
          campaign_id?: string
          created_at?: string
          customer_name?: string
          id?: string
          note?: string
          order_code?: string
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          data: Json
          id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
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
      waitlist: {
        Row: {
          campaign_id: string
          converted: boolean
          created_at: string
          id: string
          name: string
          phone: string
          quantity: number
          updated_at: string
        }
        Insert: {
          campaign_id: string
          converted?: boolean
          created_at?: string
          id?: string
          name: string
          phone: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          converted?: boolean
          created_at?: string
          id?: string
          name?: string
          phone?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          roles: Database["public"]["Enums"]["app_role"][]
          user_id: string
        }[]
      }
      admin_set_role: {
        Args: {
          _email: string
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      campaign_counted_qty: { Args: { _cid: string }; Returns: number }
      campaign_progress: {
        Args: never
        Returns: {
          campaign_id: string
          counted_qty: number
          percent: number
          remaining: number
          target_qty: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      join_waitlist: {
        Args: {
          _campaign_id: string
          _name: string
          _phone: string
          _quantity: number
        }
        Returns: boolean
      }
      place_order: {
        Args: {
          _address: string
          _alt_phone: string
          _area: string
          _campaign_id: string
          _name: string
          _note: string
          _payment_method: string
          _phone: string
          _quantity: number
          _transaction_id: string
        }
        Returns: string
      }
      track_order: { Args: { _code: string; _phone: string }; Returns: Json }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "staff"
      campaign_status:
        | "collecting"
        | "target_reached"
        | "in_production"
        | "shipped"
        | "delivered"
      order_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "in_production"
        | "shipped"
        | "delivered"
      payment_status: "unpaid" | "partial" | "paid" | "refunded"
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
      app_role: ["super_admin", "admin", "staff"],
      campaign_status: [
        "collecting",
        "target_reached",
        "in_production",
        "shipped",
        "delivered",
      ],
      order_status: [
        "pending",
        "confirmed",
        "cancelled",
        "in_production",
        "shipped",
        "delivered",
      ],
      payment_status: ["unpaid", "partial", "paid", "refunded"],
    },
  },
} as const
