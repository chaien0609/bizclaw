// BrainPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function BrainPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [health,setHealth] = useState(null);
  const [files,setFiles] = useState([]);
  const [editFile,setEditFile] = useState(null);
  const [fileContent,setFileContent] = useState('');
  const [showNew,setShowNew] = useState(false);
  const [newName,setNewName] = useState('');

  const load = async () => {
    try{const r=await authFetch('/api/v1/health');setHealth(await r.json());}catch(e){}
    try{const r2=await authFetch('/api/v1/brain/files');const d2=await r2.json();setFiles(d2.files||[]);}catch(e){}
  };
  useEffect(()=>{ load(); },[]);

  const openFile = async (name) => {
    try {
      const r = await authFetch('/api/v1/brain/files/'+encodeURIComponent(name));
      const d = await r.json();
      setFileContent(d.content || '');
      setEditFile(name);
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const saveFile = async () => {
    try {
      const r = await authFetch('/api/v1/brain/files/'+encodeURIComponent(editFile), {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({content:fileContent})
      });
      const d = await r.json();
      if(d.ok) { showToast('✅ Đã lưu: '+editFile,'success'); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const createFile = async () => {
    if(!newName.trim()) return;
    const fname = newName.endsWith('.md') ? newName : newName + '.md';
    try {
      const r = await authFetch('/api/v1/brain/files/'+encodeURIComponent(fname), {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({content:'# '+fname+'\n\n'})
      });
      const d = await r.json();
      if(d.ok) { showToast('✅ Đã tạo: '+fname,'success'); setShowNew(false); setNewName(''); load(); openFile(fname); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const checks = [
    {name:'SIMD (NEON/AVX)',status:health?.simd||'—',ok:true},{name:'Memory',status:health?.memory||'—',ok:true},
    {name:'Thread Pool',status:health?.threads||'—',ok:true},{name:'GGUF Parser',status:'ready',ok:true},
    {name:'KV Cache',status:'initialized',ok:true},{name:'Quantization',status:'Q4_K_M, Q5_K_M, Q8_0',ok:true},
  ];
  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';

  return html`<div>
    <div class="page-header"><div><h1>🧠 ${t('brain.title',lang)}</h1><div class="sub">${t('brain.ws_sub',lang)}</div></div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${()=>setShowNew(!showNew)}>+ Tạo file</button>
    </div>
    <div class="stats">
      <${StatsCard} label=${t('brain.engine',lang)} value="BizClaw Brain" color="accent" icon="🧠" />
      <${StatsCard} label=${t('brain.quant',lang)} value="Q4-Q8" color="blue" icon="📊" />
      <${StatsCard} label=${t('brain.files_count',lang)} value=${files.length} color="green" icon="📄" />
    </div>

    ${showNew && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <h3 style="margin-bottom:8px">📄 Tạo file mới</h3>
        <div style="display:flex;gap:8px;align-items:end">
          <label style="flex:1">Tên file<input style="${inp}" value=${newName} onInput=${e=>setNewName(e.target.value)} placeholder="MY_FILE.md" /></label>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 16px" onClick=${createFile}>Tạo</button>
        </div>
      </div>
    `}

    ${editFile && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <h3>📝 ${editFile}</h3>
          <div style="display:flex;gap:6px">
            <button class="btn" style="background:var(--grad1);color:#fff;padding:6px 16px" onClick=${saveFile}>💾 Lưu</button>
            <button class="btn btn-outline btn-sm" onClick=${()=>setEditFile(null)}>✕</button>
          </div>
        </div>
        <textarea value=${fileContent} onInput=${e=>setFileContent(e.target.value)}
          style="width:100%;min-height:300px;padding:12px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:var(--mono);font-size:13px;line-height:1.6;resize:vertical" />
      </div>
    `}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="card"><h3 style="margin-bottom:12px">🏥 ${t('brain.health_title',lang)}</h3>
        <div style="display:grid;gap:6px">
          ${checks.map(c=>html`<div key=${c.name} style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg2);border-radius:6px">
            <span>${c.ok?'✅':'❌'}</span>
            <strong style="font-size:13px;flex:1">${c.name}</strong>
            <span style="font-size:12px;color:var(--text2)">${c.status}</span>
          </div>`)}
        </div>
      </div>
      <div class="card"><h3 style="margin-bottom:12px">📁 ${t('brain.ws_title',lang)}</h3>
        ${files.length===0?html`<div style="text-align:center;padding:20px;color:var(--text2)"><p>Workspace trống. Click "+ Tạo file" để bắt đầu.</p></div>`:html`<div style="display:grid;gap:4px">${files.map(f=>html`<div key=${f.name||f} style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg2);border-radius:4px;font-size:13px;cursor:pointer" onClick=${()=>openFile(f.name||f)} onMouseOver=${e=>e.currentTarget.style.borderColor='var(--accent)'} onMouseOut=${e=>e.currentTarget.style.borderColor='transparent'}>
          <span>📄</span><span style="flex:1">${f.name||f}</span><span style="color:var(--text2);font-size:11px">${f.size||''}</span>
          <span class="badge badge-blue" style="font-size:10px">✏️ Edit</span>
        </div>`)}</div>`}
      </div>
    </div>
  </div>`;
}


export { BrainPage };
