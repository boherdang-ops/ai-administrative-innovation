// Learning Hub v0.7.7 — Supabase persistence + asset upload adapter
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



    async restoreBackup(backup) {
      const session = await this.getSession();
      if (!session) throw new Error('관리자 로그인이 필요합니다.');
      if (!backup || backup.backupVersion !== 1 || !backup.tables) {
        throw new Error('호환되는 Learning Hub 백업 파일이 아닙니다.');
      }

      const tracks = backup.tables.learning_tracks;
      const contents = backup.tables.learning_contents;
      if (!Array.isArray(tracks) || !Array.isArray(contents)) {
        throw new Error('백업 파일의 Track/Content 데이터가 올바르지 않습니다.');
      }
      if (!tracks.length) throw new Error('백업 파일에 Track 데이터가 없습니다.');

      const trackRows = tracks.map(t => ({
        track_code:t.track_code,
        name:t.name,
        description:t.description || '',
        sort_order:t.sort_order ?? (parseInt(t.track_code,10) || 0),
        is_active:t.is_active !== false
      }));
      const contentRows = contents.map(c => ({
        content_code:c.content_code,
        track_code:c.track_code,
        title:c.title,
        summary:c.summary || '',
        level:c.level || '기본',
        expected_time:c.expected_time || '',
        status:c.status || 'draft',
        learning:c.learning || {},
        assets:c.assets || {},
        external_links:c.external_links || [],
        flow:c.flow || {},
        sort_order:c.sort_order ?? 0,
        published_at:c.published_at || null
      }));

      const trackCodes = new Set(trackRows.map(x=>x.track_code));
      for (const c of contentRows) {
        if (!trackCodes.has(c.track_code)) {
          throw new Error(`백업 파일에서 콘텐츠 ${c.content_code}의 Track ${c.track_code}을 찾을 수 없습니다.`);
        }
      }

      const [currentTracksRes, currentContentsRes] = await Promise.all([
        client.from('learning_tracks').select('track_code'),
        client.from('learning_contents').select('content_code')
      ]);
      if (currentTracksRes.error) throw currentTracksRes.error;
      if (currentContentsRes.error) throw currentContentsRes.error;

      const keepContentCodes = new Set(contentRows.map(x=>x.content_code));
      const extraContentCodes = (currentContentsRes.data || [])
        .map(x=>x.content_code).filter(code=>!keepContentCodes.has(code));
      if (extraContentCodes.length) {
        const { error } = await client.from('learning_contents').delete().in('content_code', extraContentCodes);
        if (error) throw error;
      }

      const keepTrackCodes = new Set(trackRows.map(x=>x.track_code));
      const extraTrackCodes = (currentTracksRes.data || [])
        .map(x=>x.track_code).filter(code=>!keepTrackCodes.has(code));
      if (extraTrackCodes.length) {
        const { error } = await client.from('learning_tracks').delete().in('track_code', extraTrackCodes);
        if (error) throw error;
      }

      const { error: trackError } = await client.from('learning_tracks')
        .upsert(trackRows, { onConflict:'track_code' });
      if (trackError) throw trackError;

      if (contentRows.length) {
        const { error: contentError } = await client.from('learning_contents')
          .upsert(contentRows, { onConflict:'content_code' });
        if (contentError) throw contentError;

        const restoreRows = contentRows.map(c => ({
          content_code:c.content_code,
          action:'restore',
          snapshot:c,
          created_by:session.user.id
        }));
        const { error: revisionError } = await client.from('learning_content_revisions')
          .insert(restoreRows);
        if (revisionError) throw revisionError;
      }

      return { tracks:trackRows.length, contents:contentRows.length };
    },

    async uploadAsset(file, contentCode) {
      const session = await this.getSession();
      if (!session) throw new Error('관리자 로그인이 필요합니다.');
      if (!file) throw new Error('업로드할 파일을 선택하세요.');

      const code = String(contentCode || 'unassigned').replace(/[^0-9A-Za-z_-]/g, '-');
      const safeName = String(file.name || 'file')
        .normalize('NFKC')
        .replace(/[\\/?#%:]+/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'file';
      const path = `learning/${code}/${Date.now()}-${safeName}`;

      const { error } = await client.storage.from('site-assets')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined
        });
      if (error) throw error;

      const { data } = client.storage.from('site-assets').getPublicUrl(path);
      if (!data || !data.publicUrl) throw new Error('업로드된 파일의 공개 URL을 만들 수 없습니다.');

      return {
        bucket: 'site-assets',
        path,
        publicUrl: data.publicUrl,
        name: file.name || safeName,
        type: file.type || '',
        size: file.size || 0
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