// McpPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function McpPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [servers,setServers] = useState([]);
  const [loading,setLoading] = useState(true);
  const [showAdd,setShowAdd] = useState(false);
  const [addForm,setAddForm] = useState({name:'',command:'npx',args:'',env:''});

  const popular = [
    {name:'playwright',desc:'Browser automation (Chrome, Firefox)',icon:'🎭',cmd:'npx -y @anthropic/mcp-server-playwright'},
    {name:'gmail',desc:'Gmail read/send/draft',icon:'📧',cmd:'npx -y @anthropic/mcp-server-gmail'},
    {name:'google-calendar',desc:'Google Calendar events',icon:'📅',cmd:'npx -y @anthropic/mcp-server-google-calendar'},
    {name:'filesystem',desc:'Read/write filesystem',icon:'📁',cmd:'npx -y @modelcontextprotocol/server-filesystem /tmp'},
    {name:'github',desc:'GitHub API',icon:'🐙',cmd:'npx -y @modelcontextprotocol/server-github'},
    {name:'postgres',desc:'PostgreSQL queries',icon:'🐘',cmd:'npx -y @modelcontextprotocol/server-postgres'},
    {name:'slack',desc:'Slack integration',icon:'💬',cmd:'npx -y @modelcontextprotocol/server-slack'},
    {name:'puppeteer',desc:'Puppeteer browser',icon:'🌐',cmd:'npx -y @modelcontextprotocol/server-puppeteer'},
    {name:'brave-search',desc:'Brave Search API',icon:'🔍',cmd:'npx -y @anthropic/mcp-server-brave-search'},
    {name:'notion',desc:'Notion pages/databases',icon:'📝',cmd:'npx -y @anthropic/mcp-server-notion'},
    {name:'memory',desc:'Knowledge graph',icon:'🧠',cmd:'npx -y @modelcontextprotocol/server-memory'},
    {name:'gdrive',desc:'Google Drive',icon:'📂',cmd:'npx -y @anthropic/server-gdrive'},
    {name:'sqlite',desc:'SQLite database',icon:'💾',cmd:'npx -y @modelcontextprotocol/server-sqlite'},
  ];

  const load = async () => {
    try{const r=await authFetch('/api/v1/mcp/servers');const d=await r.json();setServers(d.servers||[]);}catch(e){}
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const addServer = async () => {
    if(!addForm.name.trim()) { showToast('⚠️ Nhập tên','error'); return; }
    try {
      const args = addForm.args ? addForm.args.split(' ') : [];
      const body = { name:addForm.name, command:addForm.command, args, env:addForm.env?JSON.parse(addForm.env):{} };
      const r = await authFetch('/api/v1/mcp/servers', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
      });
      const d=await r.json();
      if(d.ok) { showToast('✅ Đã thêm: '+addForm.name,'success'); setShowAdd(false); setAddForm({name:'',command:'npx',args:'',env:''}); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const removeServer = async (name) => {
    if(!confirm('Xoá MCP server "'+name+'"?')) return;
    try {
      const r = await authFetch('/api/v1/mcp/servers/'+encodeURIComponent(name), {method:'DELETE'});
      const d=await r.json();
      if(d.ok) { showToast('🗑️ Đã xoá: '+name,'success'); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const quickAdd = (p) => {
    const parts = p.cmd.split(' ');
    setAddForm({name:p.name, command:parts[0], args:parts.slice(1).join(' '), env:''});
    setShowAdd(true);
  };

  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';

  return html`<div>
    <div class="page-header"><div><h1>🔗 ${t('mcp.title',lang)}</h1><div class="sub">${t('mcp.subtitle',lang)}</div></div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${()=>setShowAdd(!showAdd)}>+ Thêm Server</button>
    </div>
    <div class="stats">
      <${StatsCard} label=${t('mcp.total',lang)} value=${servers.length} color="accent" icon="🔗" />
      <${StatsCard} label=${t('mcp.active',lang)} value=${servers.filter(s=>s.status==='connected').length} color="green" icon="✅" />
    </div>

    ${showAdd && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <h3 style="margin-bottom:10px">🔌 Thêm MCP Server</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <label>Tên server<input style="${inp}" value=${addForm.name} onInput=${e=>setAddForm(f=>({...f,name:e.target.value}))} placeholder="filesystem" /></label>
          <label>Command<input style="${inp}" value=${addForm.command} onInput=${e=>setAddForm(f=>({...f,command:e.target.value}))} placeholder="npx" /></label>
          <label style="grid-column:span 2">Arguments<input style="${inp}" value=${addForm.args} onInput=${e=>setAddForm(f=>({...f,args:e.target.value}))} placeholder="-y @modelcontextprotocol/server-filesystem /tmp" /></label>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>setShowAdd(false)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${addServer}>💾 Thêm</button>
        </div>
      </div>
    `}

    <div class="card"><h3 style="margin-bottom:12px">🔌 ${t('mcp.popular',lang)} — Quick Add</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
        ${popular.map(p=>html`<div key=${p.name} style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
          <span style="font-size:22px">${p.icon}</span>
          <div style="flex:1"><strong style="font-size:13px">${p.name}</strong><div style="font-size:11px;color:var(--text2)">${p.desc}</div></div>
          <button class="btn btn-outline btn-sm" onClick=${()=>quickAdd(p)} title="Quick Add">+</button>
        </div>`)}
      </div>
    </div>
    ${servers.length>0&&html`<div class="card" style="margin-top:14px"><h3 style="margin-bottom:12px">📡 Connected Servers (${servers.length})</h3>
      <table><thead><tr><th>Server</th><th>Protocol</th><th>Tools</th><th>Status</th><th style="text-align:right">Thao tác</th></tr></thead><tbody>
        ${servers.map(s=>html`<tr key=${s.name}><td><strong>${s.name}</strong></td><td><span class="badge badge-blue">${s.transport||'stdio'}</span></td><td>${s.tools_count||0}</td><td><span class="badge ${s.status==='connected'?'badge-green':'badge-red'}">${s.status}</span></td>
          <td style="text-align:right"><button class="btn btn-outline btn-sm" style="color:var(--red)" onClick=${()=>removeServer(s.name)} title="Xoá">🗑️</button></td>
        </tr>`)}
      </tbody></table>
    </div>`}
  </div>`;
}


export { McpPage };
