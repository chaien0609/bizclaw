// ConfigFilePage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function ConfigFilePage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [content,setContent] = useState('');
  const [loading,setLoading] = useState(true);
  useEffect(()=>{ (async()=>{ try{const r=await authFetch('/api/v1/config/full');const d=await r.json();setContent(d.content||d.raw||JSON.stringify(d,null,2)||'# config.toml not loaded');}catch(e){setContent('# Error loading config');} setLoading(false); })(); },[]);

  const save = async () => {
    try {
      const r = await authFetch('/api/v1/config/update', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({raw:content})
      });
      const d = await r.json();
      if(d.ok) showToast('✅ Config saved','success');
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  return html`<div>
    <div class="page-header"><div><h1>📄 ${t('config.title',lang)}</h1><div class="sub">Xem và chỉnh sửa config.toml trực tiếp</div></div></div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3>📝 config.toml</h3>
        <button class="btn" style="background:var(--grad1);color:#fff;padding:6px 16px" onClick=${save}>💾 ${t('form.save',lang)}</button>
      </div>
      ${loading?html`<div style="text-align:center;padding:20px;color:var(--text2)">Loading...</div>`:html`
        <textarea value=${content} onInput=${e=>setContent(e.target.value)}
          style="width:100%;min-height:500px;padding:16px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--mono);font-size:13px;line-height:1.6;resize:vertical;white-space:pre;overflow-x:auto" />
      `}
    </div>
  </div>`;
}


export { ConfigFilePage };
