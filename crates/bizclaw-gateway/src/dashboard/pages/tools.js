// ToolsPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function ToolsPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({name:'',icon:'🔧',desc:'',command:'',args:''});

  const load = async () => {
    try { const r=await authFetch('/api/v1/tools'); const d=await r.json(); setTools(d.tools||[]); }
    catch(e) { console.error('Tools load:', e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createTool = async () => {
    if(!form.name.trim()) { showToast('⚠️ Nhập tên tool','error'); return; }
    try {
      const r = await authFetch('/api/v1/tools', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(form)
      });
      const d=await r.json();
      if(d.ok) { showToast('✅ Đã tạo tool: '+form.name,'success'); setShowForm(false); setForm({name:'',icon:'🔧',desc:'',command:'',args:''}); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const toggleTool = async (name) => {
    const tool = tools.find(t=>t.name===name);
    const newEnabled = !(tool?.enabled);
    try {
      await authFetch('/api/v1/tools/'+name+'/toggle', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({enabled:newEnabled})
      });
      showToast((newEnabled?'✅ Bật':'⏸ Tắt')+': '+name,'success');
      load();
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const deleteTool = async (name) => {
    if(!confirm('Xoá custom tool "'+name+'"?')) return;
    try {
      const r = await authFetch('/api/v1/tools/'+name, {method:'DELETE'});
      const d=await r.json();
      if(d.ok) { showToast('🗑️ Đã xoá: '+name,'success'); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const active = tools.filter(t=>t.enabled).length;
  const custom = tools.filter(t=>!t.builtin).length;
  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';
  const icons = ['🔧','🛠️','⚡','🔌','📡','🤖','🧰','🔬','📊','🌐','💎','🎯'];

  return html`<div>
    <div class="page-header"><div><h1>🛠️ ${t('tools.title',lang)}</h1><div class="sub">${t('tools.subtitle',lang)}</div></div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${()=>setShowForm(!showForm)}>+ Tạo Tool</button>
    </div>
    <div class="stats"><${StatsCard} label="Total Tools" value=${tools.length} color="accent" icon="🛠️" /><${StatsCard} label="Enabled" value=${active} color="green" icon="✅" /><${StatsCard} label="Custom" value=${custom} color="blue" icon="🔧" /><${StatsCard} label="MCP Tools" value="∞" color="orange" icon="🔗" /></div>

    ${showForm && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>🔧 Tạo Custom Tool</h3>
          <button class="btn btn-outline btn-sm" onClick=${()=>setShowForm(false)}>✕ Đóng</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <label>Tên Tool<input style="${inp}" value=${form.name} onInput=${e=>setForm(f=>({...f,name:e.target.value}))} placeholder="my-custom-tool" /></label>
          <label>Icon
            <div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">${icons.map(ic=>html`<button key=${ic} class="btn btn-outline btn-sm" style="${form.icon===ic?'background:var(--accent);color:#fff':''};font-size:16px;padding:4px 8px" onClick=${()=>setForm(f=>({...f,icon:ic}))}>${ic}</button>`)}</div>
          </label>
          <label style="grid-column:span 2">Mô tả<input style="${inp}" value=${form.desc} onInput=${e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="What this tool does..." /></label>
          <label>Command<input style="${inp}" value=${form.command} onInput=${e=>setForm(f=>({...f,command:e.target.value}))} placeholder="python3, node, curl..." /></label>
          <label>Arguments<input style="${inp}" value=${form.args} onInput=${e=>setForm(f=>({...f,args:e.target.value}))} placeholder="script.py --arg1 value" /></label>
        </div>
        <div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>setShowForm(false)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${createTool}>💾 Tạo</button>
        </div>
      </div>
    `}

    <div class="card"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">
      ${tools.map(tl=>html`<div key=${tl.name} style="display:flex;align-items:flex-start;gap:10px;padding:12px;background:var(--bg2);border-radius:8px;border:1px solid var(--border);opacity:${tl.enabled?1:0.5}">
        <span style="font-size:24px">${tl.icon}</span>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:6px">
            <strong style="font-size:13px">${tl.name}</strong>
            ${!tl.builtin && html`<span class="badge badge-green" style="font-size:9px">CUSTOM</span>`}
          </div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">${tl.desc}</div>
        </div>
        <div style="display:flex;gap:4px;align-items:center">
          <button class="btn btn-outline btn-sm" onClick=${()=>toggleTool(tl.name)} title=${tl.enabled?'Tắt':'Bật'}>${tl.enabled?'✅':'⏸'}</button>
          ${!tl.builtin && html`<button class="btn btn-sm" style="background:var(--red);color:#fff" onClick=${()=>deleteTool(tl.name)} title="Xoá">🗑</button>`}
        </div>
      </div>`)}
    </div></div>
  </div>`;
}


export { ToolsPage };
