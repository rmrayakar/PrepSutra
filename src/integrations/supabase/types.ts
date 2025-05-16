export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      bookmarks: {
        Row: {
          article_id: string | null;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          article_id?: string | null;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          article_id?: string | null;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookmarks_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "news_articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      essays: {
        Row: {
          content: string;
          created_at: string;
          feedback: string | null;
          id: string;
          score: number | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          feedback?: string | null;
          id?: string;
          score?: number | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          feedback?: string | null;
          id?: string;
          score?: number | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "essays_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      news_articles: {
        Row: {
          categories: string[] | null;
          content: string;
          created_at: string;
          gs_paper: string | null;
          id: string;
          published_date: string | null;
          source: string;
          summary: string | null;
          title: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          categories?: string[] | null;
          content: string;
          created_at?: string;
          gs_paper?: string | null;
          id?: string;
          published_date?: string | null;
          source: string;
          summary?: string | null;
          title: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          categories?: string[] | null;
          content?: string;
          created_at?: string;
          gs_paper?: string | null;
          id?: string;
          published_date?: string | null;
          source?: string;
          summary?: string | null;
          title?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      previous_year_questions: {
        Row: {
          created_at: string;
          exam_type: string;
          id: string;
          paper: string | null;
          question: string;
          subject: string | null;
          topics: string[] | null;
          updated_at: string;
          year: number;
        };
        Insert: {
          created_at?: string;
          exam_type: string;
          id?: string;
          paper?: string | null;
          question: string;
          subject?: string | null;
          topics?: string[] | null;
          updated_at?: string;
          year: number;
        };
        Update: {
          created_at?: string;
          exam_type?: string;
          id?: string;
          paper?: string | null;
          question?: string;
          subject?: string | null;
          topics?: string[] | null;
          updated_at?: string;
          year?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          created_at: string;
          study_plan_count: number;
          notes_count: number;
          quiz_count: number;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          study_plan_count?: number;
          notes_count?: number;
          quiz_count?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          study_plan_count?: number;
          notes_count?: number;
          quiz_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      study_plans: {
        Row: {
          created_at: string;
          description: string | null;
          end_date: string | null;
          id: string;
          start_date: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          start_date: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          start_date?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      study_tasks: {
        Row: {
          created_at: string;
          description: string | null;
          due_date: string | null;
          id: string;
          plan_id: string;
          priority: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          plan_id: string;
          priority?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          plan_id?: string;
          priority?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_tasks_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "study_plans";
            referencedColumns: ["id"];
          }
        ];
      };
      exam_questions: {
        Row: {
          id: string;
          question_text: string;
          year: number;
          subject: string;
          exam_type: string;
          keywords: string[];
          options?: string[] | null;
          correct_answer?: string | null;
          explanation?: string | null;
          question_type?: string | null;
          marks: number;
          user_id?: string | null;
          is_database_question: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_text: string;
          year: number;
          subject: string;
          exam_type: string;
          keywords: string[];
          options?: string[] | null;
          correct_answer?: string | null;
          explanation?: string | null;
          question_type?: string | null;
          marks?: number;
          user_id?: string | null;
          is_database_question?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_text?: string;
          year?: number;
          subject?: string;
          exam_type?: string;
          keywords?: string[];
          options?: string[] | null;
          correct_answer?: string | null;
          explanation?: string | null;
          question_type?: string | null;
          marks?: number;
          user_id?: string | null;
          is_database_question?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exam_questions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      question_answers: {
        Row: {
          id: string;
          question_id: string;
          user_id: string;
          answer_text: string;
          similarity_score?: number | null;
          awarded_marks?: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          user_id: string;
          answer_text: string;
          similarity_score?: number | null;
          awarded_marks?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          user_id?: string;
          answer_text?: string;
          similarity_score?: number | null;
          awarded_marks?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "question_answers_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "exam_questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_answers_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      files: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          file_path: string;
          file_type: string;
          file_size: number;
          user_id: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          file_path: string;
          file_type: string;
          file_size: number;
          user_id: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          file_path?: string;
          file_type?: string;
          file_size?: number;
          user_id?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "files_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
