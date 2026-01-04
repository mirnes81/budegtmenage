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
    }
  }
}
