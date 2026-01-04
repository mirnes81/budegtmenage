export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string
          password_hash: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          password_hash: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          password_hash?: string
          created_at?: string
          updated_at?: string
        }
      }
      members: {
        Row: {
          id: string
          name: string
          type: 'adult' | 'child' | 'household'
          is_active: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'adult' | 'child' | 'household'
          is_active?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'adult' | 'child' | 'household'
          is_active?: boolean
          order_index?: number
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          name: string
          type: 'bank' | 'card' | 'cash' | 'digital'
          icon: string
          color: string
          is_active: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'bank' | 'card' | 'cash' | 'digital'
          icon?: string
          color?: string
          is_active?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'bank' | 'card' | 'cash' | 'digital'
          icon?: string
          color?: string
          is_active?: boolean
          order_index?: number
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          type: 'expense' | 'income'
          icon: string
          color: string
          parent_id: string | null
          is_active: boolean
          order_index: number
          created_at: string
          group_name: string | null
          is_hidden: boolean
        }
        Insert: {
          id?: string
          name: string
          type: 'expense' | 'income'
          icon?: string
          color?: string
          parent_id?: string | null
          is_active?: boolean
          order_index?: number
          created_at?: string
          group_name?: string | null
          is_hidden?: boolean
        }
        Update: {
          id?: string
          name?: string
          type?: 'expense' | 'income'
          icon?: string
          color?: string
          parent_id?: string | null
          is_active?: boolean
          order_index?: number
          created_at?: string
          group_name?: string | null
          is_hidden?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          date: string
          amount: number
          type: 'expense' | 'income'
          category_id: string
          account_id: string
          member_id: string
          description: string
          notes: string | null
          tags: string[] | null
          is_fixed: boolean
          recurring_expense_id: string | null
          deduction_type: string
          deduction_status: string
          tax_year: number | null
          merchant_name: string | null
          receipt_image_url: string | null
          scanned_at: string | null
          import_source: string
          import_line_hash: string | null
          import_file_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date?: string
          amount: number
          type: 'expense' | 'income'
          category_id: string
          account_id: string
          member_id: string
          description: string
          notes?: string | null
          tags?: string[] | null
          is_fixed?: boolean
          recurring_expense_id?: string | null
          deduction_type?: string
          deduction_status?: string
          tax_year?: number | null
          merchant_name?: string | null
          receipt_image_url?: string | null
          scanned_at?: string | null
          import_source?: string
          import_line_hash?: string | null
          import_file_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          amount?: number
          type?: 'expense' | 'income'
          category_id?: string
          account_id?: string
          member_id?: string
          description?: string
          notes?: string | null
          tags?: string[] | null
          is_fixed?: boolean
          recurring_expense_id?: string | null
          deduction_type?: string
          deduction_status?: string
          tax_year?: number | null
          merchant_name?: string | null
          receipt_image_url?: string | null
          scanned_at?: string | null
          import_source?: string
          import_line_hash?: string | null
          import_file_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recurring_expenses: {
        Row: {
          id: string
          name: string
          amount: number
          frequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual'
          category_id: string
          account_id: string
          member_id: string
          day_of_month: number
          start_date: string
          end_date: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          amount: number
          frequency: 'monthly' | 'quarterly' | 'semi-annual' | 'annual'
          category_id: string
          account_id: string
          member_id: string
          day_of_month: number
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          amount?: number
          frequency?: 'monthly' | 'quarterly' | 'semi-annual' | 'annual'
          category_id?: string
          account_id?: string
          member_id?: string
          day_of_month?: number
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          category_id: string
          member_id: string | null
          amount: number
          period: 'monthly' | 'annual'
          year: number
          month: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          member_id?: string | null
          amount: number
          period: 'monthly' | 'annual'
          year: number
          month?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          member_id?: string | null
          amount?: number
          period?: 'monthly' | 'annual'
          year?: number
          month?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tax_settings: {
        Row: {
          id: string
          postal_code: string | null
          municipality: string | null
          canton: string | null
          marital_status: string
          num_children: number
          church_tax: boolean
          annual_income: number | null
          deductions: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          postal_code?: string | null
          municipality?: string | null
          canton?: string | null
          marital_status?: string
          num_children?: number
          church_tax?: boolean
          annual_income?: number | null
          deductions?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          postal_code?: string | null
          municipality?: string | null
          canton?: string | null
          marital_status?: string
          num_children?: number
          church_tax?: boolean
          annual_income?: number | null
          deductions?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      generated_transactions: {
        Row: {
          id: string
          recurring_expense_id: string
          year: number
          month: number
          transaction_id: string
          generated_at: string
        }
        Insert: {
          id?: string
          recurring_expense_id: string
          year: number
          month: number
          transaction_id: string
          generated_at?: string
        }
        Update: {
          id?: string
          recurring_expense_id?: string
          year?: number
          month?: number
          transaction_id?: string
          generated_at?: string
        }
      }
      deduction_rules: {
        Row: {
          id: string
          category_id: string
          deduction_type: string
          requires_split: boolean
          split_prompt: string | null
          notes: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          deduction_type: string
          requires_split?: boolean
          split_prompt?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          deduction_type?: string
          requires_split?: boolean
          split_prompt?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      merchant_rules: {
        Row: {
          id: string
          merchant_key: string
          merchant_display: string
          category_id: string
          default_account_id: string
          default_member_id: string
          deduction_type: string
          use_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          merchant_key: string
          merchant_display: string
          category_id: string
          default_account_id: string
          default_member_id: string
          deduction_type?: string
          use_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          merchant_key?: string
          merchant_display?: string
          category_id?: string
          default_account_id?: string
          default_member_id?: string
          deduction_type?: string
          use_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      import_files: {
        Row: {
          id: string
          account_id: string
          file_name: string
          file_size: number
          file_hash: string
          rows_total: number
          rows_imported: number
          rows_skipped: number
          preset_used: string | null
          created_at: string
        }
        Insert: {
          id?: string
          account_id: string
          file_name: string
          file_size: number
          file_hash: string
          rows_total?: number
          rows_imported?: number
          rows_skipped?: number
          preset_used?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          file_name?: string
          file_size?: number
          file_hash?: string
          rows_total?: number
          rows_imported?: number
          rows_skipped?: number
          preset_used?: string | null
          created_at?: string
        }
      }
      bank_csv_presets: {
        Row: {
          id: string
          name: string
          match_headers: Json
          delimiter_hint: string
          date_format_hint: string
          decimal_separator_hint: string
          mapping: Json
          is_active: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          match_headers?: Json
          delimiter_hint?: string
          date_format_hint?: string
          decimal_separator_hint?: string
          mapping?: Json
          is_active?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          match_headers?: Json
          delimiter_hint?: string
          date_format_hint?: string
          decimal_separator_hint?: string
          mapping?: Json
          is_active?: boolean
          order_index?: number
          created_at?: string
        }
      }
    }
  }
}
