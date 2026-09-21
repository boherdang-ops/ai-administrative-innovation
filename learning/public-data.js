(() => {
  const SUPABASE_URL = 'https://pkthcglmmsjoofocuarp.supabase.co';
  const ANON_KEY = 'sb_publishable_xDXYwAMNZg84Xy7NERjMRw_YzuaCZhR';
  const clone = x => JSON.parse(JSON.stringify(x));

  function mapRemoteTrack(t) {
    return {
      num: t.track_code,
      name: t.name,
      desc: t.description || '',
      count: 0,
      sortOrder: t.sort_order ?? (parseInt(t.track_code, 10) || 0),
      remote: true
    };
  }

  function mapRemoteContent(c, trackName) {
    return {
      id: c.content_code,
      track: c.track_code,
      trackName: trackName || c.track_code,
      title: c.title,
      summary: c.summary || '',
      type: 'LEARNING',
      time: c.expected_time || '',
      level: c.level || '기본',
      status: 'open',
      published: true,
      learning: c.learning || {},
      assets: c.assets || {},
      links: c.external_links || [],
      flow: c.flow || {},
      sortOrder: c.sort_order ?? 0,
      publishedAt: c.published_at || null
    };
  }

  async function rest(path) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
      headers: {
        apikey: ANON_KEY,
        Authorization: 'Bearer ' + ANON_KEY,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Public data load failed (${res.status}): ${text}`);
    }
    return res.json();
  }

  window.HUB_READY = (async () => {
    const base = clone(window.HUB_DATA || { tracks: [], contents: [] });
    try {
      const [remoteTracks, remoteContents] = await Promise.all([
        rest('learning_tracks?select=track_code,name,description,sort_order,is_active&is_active=eq.true&order=sort_order.asc'),
        rest('learning_contents?select=content_code,track_code,title,summary,level,expected_time,status,learning,assets,external_links,flow,sort_order,published_at&status=eq.public&order=track_code.asc,sort_order.asc,content_code.asc')
      ]);

      const trackMap = new Map();
      (base.tracks || []).forEach((t, i) => trackMap.set(t.num, { ...t, sortOrder: i + 1 }));
      remoteTracks.forEach(t => {
        const m = mapRemoteTrack(t);
        trackMap.set(m.num, { ...(trackMap.get(m.num) || {}), ...m });
      });

      const contentMap = new Map();
      (base.contents || []).forEach((c, i) => contentMap.set(c.id, { ...c, sortOrder: i + 1 }));
      remoteContents.forEach(c => {
        const tn = trackMap.get(c.track_code)?.name || c.track_code;
        const m = mapRemoteContent(c, tn);
        contentMap.set(m.id, { ...(contentMap.get(m.id) || {}), ...m });
      });

      const tracks = [...trackMap.values()].sort((a, b) =>
        (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) || String(a.num).localeCompare(String(b.num))
      );
      const trackOrder = new Map(tracks.map((t, i) => [t.num, i]));
      const contents = [...contentMap.values()].map(c => ({
        ...c,
        trackName: trackMap.get(c.track)?.name || c.trackName || c.track
      })).sort((a, b) =>
        (trackOrder.get(a.track) ?? 9999) - (trackOrder.get(b.track) ?? 9999) ||
        (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999) ||
        String(a.id).localeCompare(String(b.id))
      );

      tracks.forEach(t => { t.count = contents.filter(c => c.track === t.num).length; });
      const merged = { tracks, contents, source: 'supabase+framework' };
      window.HUB_DATA = merged;
      return merged;
    } catch (e) {
      console.warn('[Learning Hub] Supabase public sync failed; static framework remains active.', e);
      base.source = 'framework-fallback';
      window.HUB_DATA = base;
      return base;
    }
  })();
})();
