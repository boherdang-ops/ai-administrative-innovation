(function () {
  'use strict';

  let client = null;

  function cfg() {
    const c = window.SUPABASE_CONFIG || {};
    return {
      url: String(c.url || '').trim().replace(/\/$/, ''),
      anonKey: String(c.anonKey || '').trim()
    };
  }

  function saveConfig(config) {
    const next = {
      url: String(config?.url || '').trim().replace(/\/$/, ''),
      anonKey: String(config?.anonKey || '').trim()
    };

    window.SUPABASE_CONFIG = next;

    try {
      localStorage.setItem('V12_SUPABASE_CONFIG', JSON.stringify(next));
    } catch (e) {
      console.warn('Supabase config could not be saved locally.', e);
    }

    client = null;
    return next;
  }

  function ready() {
    const c = cfg();
    return Boolean(c.url && c.anonKey);
  }

  function getClient() {
    if (client) return client;

    if (!ready()) {
      throw new Error('Supabase URL과 Anon public key가 설정되지 않았습니다.');
    }

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase JavaScript SDK가 로드되지 않았습니다.');
    }

    const c = cfg();

    client = window.supabase.createClient(c.url, c.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    return client;
  }

  async function checkAdmin(session) {
    if (!session?.user?.email) {
      throw new Error('로그인 세션을 확인할 수 없습니다.');
    }

    const sb = getClient();

    const { data, error } = await sb
      .from('cms_admins')
      .select('email')
      .eq('email', session.user.email)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      await sb.auth.signOut();
      throw new Error('CMS 관리자 권한이 등록되지 않은 계정입니다.');
    }

    return true;
  }

  async function signIn(email, password) {
    const sb = getClient();

    const { data, error } = await sb.auth.signInWithPassword({
      email: String(email || '').trim(),
      password: String(password || '')
    });

    if (error) throw error;

    if (!data?.session) {
      throw new Error('로그인 세션을 생성하지 못했습니다.');
    }

    await checkAdmin(data.session);

    return data.session;
  }

  async function signOut() {
    const sb = getClient();
    const { error } = await sb.auth.signOut();

    if (error) throw error;

    return true;
  }

  async function restoreSession() {
    const sb = getClient();

    const { data, error } = await sb.auth.getSession();

    if (error) throw error;

    const session = data?.session || null;

    if (!session) return null;

    try {
      await checkAdmin(session);
      return session;
    } catch (e) {
      return null;
    }
  }

  async function getDraft() {
    const sb = getClient();

    const { data, error } = await sb
      .from('site_drafts')
      .select('content, updated_at, updated_by')
      .eq('id', 'main')
      .maybeSingle();

    if (error) throw error;

    return data?.content || null;
  }

  async function saveDraft(content, userId) {
    const sb = getClient();

    const { data, error } = await sb
      .from('site_drafts')
      .update({
        content: content || {},
        updated_at: new Date().toISOString(),
        updated_by: userId || null
      })
      .eq('id', 'main')
      .select('content, updated_at, updated_by')
      .single();

    if (error) throw error;

    return data;
  }

  async function getPublished() {
    const sb = getClient();

    const { data, error } = await sb
      .from('site_published')
      .select('content, updated_at, updated_by')
      .eq('id', 'main')
      .maybeSingle();

    if (error) throw error;

    return data?.content || null;
  }

  async function publish(content, summary, userId) {
    const sb = getClient();

    const payload = content || {};
    const uid = userId || null;

    const { error: publishError } = await sb
      .from('site_published')
      .update({
        content: payload,
        updated_at: new Date().toISOString(),
        updated_by: uid
      })
      .eq('id', 'main');

    if (publishError) throw publishError;

    const { error: revisionError } = await sb
      .from('site_revisions')
      .insert({
        site_id: 'main',
        content: payload,
        published_by: uid,
        summary: summary || {}
      });

    if (revisionError) throw revisionError;

    const { error: draftError } = await sb
      .from('site_drafts')
      .update({
        content: payload,
        updated_at: new Date().toISOString(),
        updated_by: uid
      })
      .eq('id', 'main');

    if (draftError) throw draftError;

    return true;
  }

  async function revisions(limit = 30) {
    const sb = getClient();

    const safeLimit = Number.isFinite(Number(limit))
      ? Math.max(1, Math.min(Number(limit), 100))
      : 30;

    const { data, error } = await sb
      .from('site_revisions')
      .select('id, site_id, content, published_at, published_by, summary')
      .eq('site_id', 'main')
      .order('published_at', { ascending: false })
      .limit(safeLimit);

    if (error) throw error;

    return Array.isArray(data) ? data : [];
  }

  async function restoreRevision(id, userId) {
    const sb = getClient();

    const { data: revision, error: readError } = await sb
      .from('site_revisions')
      .select('id, content')
      .eq('id', id)
      .eq('site_id', 'main')
      .single();

    if (readError) throw readError;

    const content = revision?.content || {};

    await saveDraft(content, userId);

    return content;
  }

  async function uploadImage(file, folder = 'uploads') {
    if (!(file instanceof File)) {
      throw new Error('업로드할 이미지 파일이 없습니다.');
    }

    const sb = getClient();

    const extension =
      String(file.name || '').split('.').pop()?.toLowerCase() || 'bin';

    const safeFolder = String(folder || 'uploads')
      .replace(/^\/+|\/+$/g, '')
      .replace(/[^a-zA-Z0-9/_-]/g, '-');

    const fileName =
      Date.now() +
      '-' +
      Math.random().toString(36).slice(2, 10) +
      '.' +
      extension;

    const path = safeFolder + '/' + fileName;

    const { error } = await sb.storage
      .from('site-assets')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined
      });

    if (error) throw error;

    const { data } = sb.storage
      .from('site-assets')
      .getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new Error('이미지 공개 URL을 생성하지 못했습니다.');
    }

    return data.publicUrl;
  }

  window.V12_CLOUD = {
    cfg,
    saveConfig,
    ready,
    signIn,
    signOut,
    restoreSession,
    getDraft,
    getPublished,
    saveDraft,
    publish,
    uploadImage,
    revisions,
    restoreRevision
  };
})();
