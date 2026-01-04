import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Tables = Database['public']['Tables'];

export function useMembers() {
  const [members, setMembers] = useState<Tables['members']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return { members, loading, error, refetch: fetchMembers };
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Tables['accounts']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return { accounts, loading, error, refetch: fetchAccounts };
}

export function useCategories() {
  const [categories, setCategories] = useState<Tables['categories']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .eq('is_hidden', false)
        .order('order_index');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  return { categories, loading, error, refetch: fetchCategories };
}
