// Gerado a partir do schema do Supabase (MCP generate_typescript_types). Não editar à mão.
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
      expense_splits: {
        Row: {
          amount_cents: number
          expense_id: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          expense_id: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          expense_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_splits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string
          description: string
          expense_date: string
          group_id: string
          id: string
          paid_by: string
          split_mode: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by?: string
          description: string
          expense_date?: string
          group_id: string
          id?: string
          paid_by: string
          split_mode: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          group_id?: string
          id?: string
          paid_by?: string
          split_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          emoji: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          emoji?: string
          id?: string
          invite_code?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          emoji?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_hue: number
          created_at: string
          display_name: string | null
          id: string
          pix_key: string | null
          pix_key_type: string | null
        }
        Insert: {
          avatar_hue: number
          created_at?: string
          display_name?: string | null
          id: string
          pix_key?: string | null
          pix_key_type?: string | null
        }
        Update: {
          avatar_hue?: number
          created_at?: string
          display_name?: string | null
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
        }
        Relationships: []
      }
      settlements: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string
          from_user: string
          group_id: string
          id: string
          paid_at: string
          to_user: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by?: string
          from_user: string
          group_id: string
          id?: string
          paid_at?: string
          to_user: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string
          from_user?: string
          group_id?: string
          id?: string
          paid_at?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_to_user_fkey"
            columns: ["to_user"]
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
      gen_invite_code: { Args: never; Returns: string }
      get_my_profile: {
        Args: never
        Returns: {
          avatar_hue: number
          display_name: string
          id: string
          pix_key: string
          pix_key_type: string
        }[]
      }
      get_pix_key: { Args: { creditor: string; gid: string }; Returns: Json }
      is_group_member: { Args: { gid: string }; Returns: boolean }
      join_group: { Args: { code: string }; Returns: string }
      leave_group: { Args: { gid: string }; Returns: undefined }
      member_balance: { Args: { gid: string; uid: string }; Returns: number }
      my_groups_summary: {
        Args: never
        Returns: {
          emoji: string
          expense_count: number
          id: string
          last_activity_at: string
          member_count: number
          my_balance_cents: number
          name: string
          total_cents: number
        }[]
      }
      save_expense: { Args: { payload: Json }; Returns: string }
      shares_group_with: { Args: { other: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
