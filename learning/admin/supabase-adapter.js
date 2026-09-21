// Learning Hub v0.7.5 — Supabase persistence adapter
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



    async createBackup() {
      const session = await this.getSession();
      if (!session) throw new Error('관리자 로그인이 필요합니다.');

      const [tracksRes, contentsRes, revisionsRes] = await Promise.all([
        client.from('learning_tracks').select('*').order('sort_order'),
        client.from('learning_contents').select('*').order('sort_order'),
        client.from('learning_content_revisions').select('*').order('created_at')
      ]);
      if (tracksRes.error) throw tracksRes.error;
      if (contentsRes.error) throw contentsRes.error;
      if (revisionsRes.error) throw revisionsRes.error;

      return {
        backupVersion: 1,
        schemaVersion: 1,
        createdAt: new Date().toISOString(),
        source: 'supabase',
        scope: 'learning-hub',
        tables: {
          learning_tracks: tracksRes.data || [],
          learning_contents: contentsRes.data || [],
          learning_content_revisions: revisionsRes.data || []
        }
      };
    },

    async saveTrack(t) {
      const session = await this.getSession();
      if (!session) throw new Error('관리자 로그인이 필요합니다.');

      const row = {
        track_code:t.num,
        name:t.name,
        description:t.desc || '',
        sort_order:parseInt(t.num,10) || 0,
        is_active:true
      };

      const { error } = await client.from('learning_tracks')
        .upsert(row, { onConflict:'track_code' });
      if (error) throw error;
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
    },

    async publishContent(c) {
      const session = await this.getSession();
      if (!session) throw new Error('관리자 로그인이 필요합니다.');

      const publishedAt = new Date().toISOString();
      const row = {
        content_code:c.id,
        track_code:c.track,
        title:c.title,
        summary:c.summary || '',
        level:c.level || '기본',
        expected_time:c.time || '',
        status:'public',
        learning:c.learning || {},
        assets:c.assets || {},
        external_links:c.links || [],
        flow:c.flow || {},
        published_at:publishedAt
      };

      const { error } = await client.from('learning_contents')
        .upsert(row, { onConflict:'content_code' });
      if (error) throw error;

      const snapshot = Object.assign({}, c, {status:'public', publishedAt});
      const { error: revError } = await client.from('learning_content_revisions')
        .insert({
          content_code:c.id,
          action:'publish',
          snapshot,
          created_by:session.user.id
        });
      if (revError) throw revError;
    }
  };
})();