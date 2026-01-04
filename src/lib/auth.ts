import bcrypt from 'bcryptjs';
import { supabase } from './supabase';

export async function verifyPassword(inputPassword: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabase
      .from('app_users')
      .select('password_hash')
      .maybeSingle();

    if (error || !user) {
      console.error('Erreur récupération utilisateur:', error);
      return false;
    }

    return await bcrypt.compare(inputPassword, user.password_hash);
  } catch (error) {
    console.error('Erreur vérification mot de passe:', error);
    return false;
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
  try {
    const isValid = await verifyPassword(currentPassword);
    if (!isValid) {
      return false;
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    const { data: user } = await supabase
      .from('app_users')
      .select('id')
      .maybeSingle();

    if (!user) {
      return false;
    }

    const { error } = await supabase
      .from('app_users')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    return !error;
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    return false;
  }
}
