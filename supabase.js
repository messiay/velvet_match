// ─── SUPABASE INITIALIZATION ───
// This file initializes the Supabase client using the keys from config.js

const { createClient } = supabase;

const sb = createClient(SB_CONFIG.url, SB_CONFIG.key);

// Global wrapper for easier data operations
const db = {
  // ─── Events ───
  async getEvent() {
    const { data, error } = await sb
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') console.error('Error fetching event:', error);
    return data;
  },

  async saveEvent(ev) {
    // We keep it simple: always update the first row or insert if empty
    // In a multi-event system, you'd use a specific ID.
    const current = await this.getEvent();
    if (current) {
      const { data, error } = await sb
        .from('events')
        .update(ev)
        .eq('id', current.id);
      return { data, error };
    } else {
      const { data, error } = await sb
        .from('events')
        .insert([ev]);
      return { data, error };
    }
  },

  async deleteEvent() {
    const current = await this.getEvent();
    if (current) {
      return await sb.from('events').delete().eq('id', current.id);
    }
  },

  // ─── Waitlist ───
  async joinWaitlist(guest) {
    return await sb.from('waitlist').insert([guest]);
  },

  async getWaitlist() {
    const { data, error } = await sb
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },
  
  async checkRegistration(email) {
    const { data, error } = await sb
      .from('waitlist')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    return data;
  }
};
