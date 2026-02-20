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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      atendimento_humano: {
        Row: {
          data_transferencia: string
          id: number
          id_usuario: string | null
          motivo_transferencia: string | null
          nome: string | null
          telefone: string | null
        }
        Insert: {
          data_transferencia?: string
          id?: number
          id_usuario?: string | null
          motivo_transferencia?: string | null
          nome?: string | null
          telefone?: string | null
        }
        Update: {
          data_transferencia?: string
          id?: number
          id_usuario?: string | null
          motivo_transferencia?: string | null
          nome?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transf_human_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checklists: {
        Row: {
          completed_at: string | null
          id: string
          is_completed: boolean | null
          target_date: string | null
          task_block: string | null
          task_name: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          target_date?: string | null
          task_block?: string | null
          task_name: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          target_date?: string | null
          task_block?: string | null
          task_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      interacoes: {
        Row: {
          agente_autor: string | null
          created_at: string
          execution_id: string | null
          id: string
          mensagem_usuario: string | null
          resposta_agente: string | null
          tool_called: string | null
          user_id: string
        }
        Insert: {
          agente_autor?: string | null
          created_at?: string
          execution_id?: string | null
          id?: string
          mensagem_usuario?: string | null
          resposta_agente?: string | null
          tool_called?: string | null
          user_id: string
        }
        Update: {
          agente_autor?: string | null
          created_at?: string
          execution_id?: string | null
          id?: string
          mensagem_usuario?: string | null
          resposta_agente?: string | null
          tool_called?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_actions: {
        Row: {
          action_metadata: Json | null
          action_type: string | null
          created_at: string | null
          id: string
          lead_id: string | null
          user_id: string | null
        }
        Insert: {
          action_metadata?: Json | null
          action_type?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_metadata?: Json | null
          action_type?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_actions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          cash_value: number | null
          created_at: string | null
          email: string | null
          faturamento: string | null
          id: string
          instagram: string | null
          last_action_at: string | null
          maior_dificuldade: string | null
          meeting_datetime: string | null
          meeting_owner: string | null
          next_followup_date: string | null
          nome: string
          notes: string | null
          origem: Database["public"]["Enums"]["lead_origin"] | null
          profissao: string | null
          quem_investe: string | null
          renda_familiar: string | null
          sale_status: Database["public"]["Enums"]["sale_status"] | null
          sale_value: number | null
          status: Database["public"]["Enums"]["lead_status"] | null
          webinar_date_tag: string | null
          whatsapp: string | null
        }
        Insert: {
          assigned_to?: string | null
          cash_value?: number | null
          created_at?: string | null
          email?: string | null
          faturamento?: string | null
          id?: string
          instagram?: string | null
          last_action_at?: string | null
          maior_dificuldade?: string | null
          meeting_datetime?: string | null
          meeting_owner?: string | null
          next_followup_date?: string | null
          nome: string
          notes?: string | null
          origem?: Database["public"]["Enums"]["lead_origin"] | null
          profissao?: string | null
          quem_investe?: string | null
          renda_familiar?: string | null
          sale_status?: Database["public"]["Enums"]["sale_status"] | null
          sale_value?: number | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          webinar_date_tag?: string | null
          whatsapp?: string | null
        }
        Update: {
          assigned_to?: string | null
          cash_value?: number | null
          created_at?: string | null
          email?: string | null
          faturamento?: string | null
          id?: string
          instagram?: string | null
          last_action_at?: string | null
          maior_dificuldade?: string | null
          meeting_datetime?: string | null
          meeting_owner?: string | null
          next_followup_date?: string | null
          nome?: string
          notes?: string | null
          origem?: Database["public"]["Enums"]["lead_origin"] | null
          profissao?: string | null
          quem_investe?: string | null
          renda_familiar?: string | null
          sale_status?: Database["public"]["Enums"]["sale_status"] | null
          sale_value?: number | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          webinar_date_tag?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_meeting_owner_fkey"
            columns: ["meeting_owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          clicks: number
          created_at: string
          id: string
          is_active: boolean
          original_url: string
          short_code: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          id?: string
          is_active?: boolean
          original_url: string
          short_code: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clicks?: number
          created_at?: string
          id?: string
          is_active?: boolean
          original_url?: string
          short_code?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      reminder_logs: {
        Row: {
          block_name: string
          error_message: string | null
          id: string
          message_sent: string
          sent_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          block_name: string
          error_message?: string | null
          id?: string
          message_sent: string
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          block_name?: string
          error_message?: string | null
          id?: string
          message_sent?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_reminder_config: {
        Row: {
          block_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          message_template: string
          reminder_time: string
          updated_at: string | null
        }
        Insert: {
          block_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_template: string
          reminder_time: string
          updated_at?: string | null
        }
        Update: {
          block_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_template?: string
          reminder_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          status: string | null
          telefone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          status?: string | null
          telefone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          status?: string | null
          telefone?: string
        }
        Relationships: []
      }
      usuarios_upviral: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          status: string | null
          telefone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          status?: string | null
          telefone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          status?: string | null
          telefone?: string
        }
        Relationships: []
      }
      webinar_metrics: {
        Row: {
          attendees: number
          created_at: string
          id: string
          notes: string | null
          stayed_until_pitch: number
          updated_at: string
          webinar_tag: string
        }
        Insert: {
          attendees?: number
          created_at?: string
          id?: string
          notes?: string | null
          stayed_until_pitch?: number
          updated_at?: string
          webinar_tag: string
        }
        Update: {
          attendees?: number
          created_at?: string
          id?: string
          notes?: string | null
          stayed_until_pitch?: number
          updated_at?: string
          webinar_tag?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      try_collect_lead: {
        Args: { p_lead_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      lead_origin: "webinar" | "bio" | "social" | "lista"
      lead_status:
        | "novo"
        | "contato_1_feito"
        | "nao_respondeu_d0"
        | "nao_respondeu_d1"
        | "agendado"
        | "no_show"
        | "reuniao_realizada"
        | "proposta_enviada"
        | "aguardando_decisao"
        | "follow_up"
        | "fechado_call"
        | "fechado_followup"
        | "perdido"
      sale_status: "none" | "won_call" | "won_followup" | "lost"
      user_role: "ADMIN" | "VENDEDORA" | "SDR" | "SOCIAL_SELLER"
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
    Enums: {
      lead_origin: ["webinar", "bio", "social", "lista"],
      lead_status: [
        "novo",
        "contato_1_feito",
        "nao_respondeu_d0",
        "nao_respondeu_d1",
        "agendado",
        "no_show",
        "reuniao_realizada",
        "proposta_enviada",
        "aguardando_decisao",
        "follow_up",
        "fechado_call",
        "fechado_followup",
        "perdido",
      ],
      sale_status: ["none", "won_call", "won_followup", "lost"],
      user_role: ["ADMIN", "VENDEDORA", "SDR", "SOCIAL_SELLER"],
    },
  },
} as const
