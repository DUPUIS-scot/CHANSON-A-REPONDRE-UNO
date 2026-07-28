import { getSupabaseAdminClient } from './supabase.js';

const table = 'openai_user_credentials';

export class SupabaseCredentialStore {
  constructor(environment, client) {
    this.client = client || getSupabaseAdminClient(environment);
  }

  async get(userId) {
    const { data, error } = await this.client
      .from(table)
      .select('user_id,encrypted_key,iv,auth_tag,encryption_version,masked_key,updated_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  async put(userId, record) {
    const updatedAt = new Date().toISOString();
    const { error } = await this.client.from(table).upsert({
      user_id: userId,
      encrypted_key: record.ciphertext,
      iv: record.iv,
      auth_tag: record.authTag,
      encryption_version: record.version,
      masked_key: record.maskedKey,
      updated_at: updatedAt,
    }, { onConflict: 'user_id' });
    if (error) throw error;
    return updatedAt;
  }

  async delete(userId) {
    const { error } = await this.client.from(table).delete().eq('user_id', userId);
    if (error) throw error;
  }
}
