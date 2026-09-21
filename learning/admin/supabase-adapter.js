// Learning Hub v0.7.1 — Supabase draft persistence adapter
// Purpose: replace localStorage persistence with Supabase while preserving the confirmed v0.6.4 UI.
// No screen/layout/field changes.

(()=> {
  const cfg = window.LEARNING_HUB_SUPABASE;
  if (!cfg || !window.supabase) {
    console.error('[Learning Hub] Supabase client/config missing.');
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  window.learningHubDb = {
    client,

    async getSession() {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session;
    },

    async loadAll() {
      const [tracksRes, contentsRes] = await Promise.all([
        client.from('learning_tracks')
          .select('track_code,name,description,sort_order,is_active')
          .order('sort_order'),
        client.from('learning_contents')
          .select('content_code,track_code,title,summary,level,expected_time,status,learning,assets,external_links,flow,sort_order,updated_at')
          .order('sort_order')
      ]);
      if (tracksRes.error) throw tracksRes.error;
      if (contentsRes.error) throw contentsRes.error;

      return {
        schemaVersion: 1,
        updatedAt: null,
        tracks: tracksRes.data.map(t => ({
          num:t.track_code, name:t.name, desc:t.description || '',
          count:contentsRes.data.filter(c=>c.track_code===t.track_code).length
        })),
        contents: contentsRes.data.map(c => ({
          id:c.content_code, track:c.track_code,
          trackName:(tracksRes.data.find(t=>t.track_code===c.track_code)||{}).name || '',
          title:c.title, summary:c.summary || '', level:c.level || '기본',
          time:c.expected_time || '', status:c.status || 'draft',
          learning:c.learning || {learn:'',example:'',check:''},
          assets:c.assets || {prompt:{title:'',body:''},template:{title:'',url:''},app:{title:'',url:''}},
          links:c.external_links || [],
          flow:c.flow || {prev:'',next:''},
          updatedAt:c.updated_at
        }))
      };
    },

    async saveContent(c) {
      const session = await this.getSession();
      if (!session) throw new Error('관리자 로그인이 필요합니다.');

      const row = {
        content_code:c.id,
        track_code:c.track,
        title:c.title,
        summary:c.summary || '',
        level:c.level || '기본',
        expected_time:c.time || '',
        status:c.status || 'draft',
        learning:c.learning || {},
        assets:c.assets || {},
        external_links:c.links || [],
        flow:c.flow || {}
      };

      const { error } = await client.from('learning_contents')
        .upsert(row, { onConflict:'content_code' });
      if (error) throw error;

      const { error: revError } = await client.from('learning_content_revisions')
        .insert({
          content_code:c.id,
          action:'save',
          snapshot:c,
          created_by:session.user.id
        });
      if (revError) throw revError;
    }
  };
})();