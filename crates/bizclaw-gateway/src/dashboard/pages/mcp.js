// McpPage — MCP Server Marketplace with 30+ tools catalog
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function McpPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [servers,setServers] = useState([]);
  const [catalog,setCatalog] = useState([]);
  const [loading,setLoading] = useState(true);
  const [showAdd,setShowAdd] = useState(false);
  const [addForm,setAddForm] = useState({name:'',command:'npx',args:'',env:''});
  const [activeCategory,setActiveCategory] = useState('all');
  const [search,setSearch] = useState('');

  const categories = [
    {id:'all',label:'Tất cả',icon:'📦'},
    {id:'core',label:'Core',icon:'⚙️'},
    {id:'developer',label:'Developer',icon:'💻'},
    {id:'database',label:'Database',icon:'🗄️'},
    {id:'productivity',label:'Productivity',icon:'📋'},
    {id:'search',label:'Search',icon:'🔍'},
    {id:'communication',label:'Communication',icon:'💬'},
    {id:'automation',label:'Automation',icon:'🤖'},
    {id:'infrastructure',label:'Infrastructure',icon:'☁️'},
    {id:'business',label:'Business',icon:'💼'},
  ];

  const loadServers = async () => {
    try{const r=await authFetch('/api/v1/mcp/servers');const d=await r.json();setServers(d.servers||[]);}catch(e){}
    setLoading(false);
  };

  const loadCatalog = async () => {
    try{
      const r=await fetch('/api/v1/mcp/catalog');
      if(r.ok){const d=await r.json();setCatalog(d||[]);}
      else setCatalog([]);
    }catch(e){
      // Fallback: hardcoded popular servers
      setCatalog([
        {id:'filesystem',name:'📁 File System',description:'Quản lý file nâng cao',category:'core',command:'npx',args:['-y','@modelcontextprotocol/server-filesystem','/data'],difficulty:'easy',requires_key:false,tags:['file']},
        {id:'github',name:'🐙 GitHub',description:'GitHub repos, issues, PRs',category:'developer',command:'npx',args:['-y','@modelcontextprotocol/server-github'],difficulty:'easy',requires_key:true,tags:['git']},
        {id:'puppeteer',name:'🌐 Puppeteer',description:'Browser automation',category:'automation',command:'npx',args:['-y','@modelcontextprotocol/server-puppeteer'],difficulty:'easy',requires_key:false,tags:['browser']},
        {id:'memory',name:'🧠 Memory',description:'Bộ nhớ dài hạn',category:'core',command:'npx',args:['-y','@modelcontextprotocol/server-memory'],difficulty:'easy',requires_key:false,tags:['memory']},
        {id:'brave-search',name:'🔍 Brave Search',description:'Tìm kiếm web',category:'search',command:'npx',args:['-y','@anthropic/mcp-server-brave-search'],difficulty:'easy',requires_key:true,tags:['search']},
        {id:'postgres',name:'🐘 PostgreSQL',description:'Query PostgreSQL',category:'database',command:'npx',args:['-y','@modelcontextprotocol/server-postgres'],difficulty:'medium',requires_key:false,tags:['sql']},
        {id:'slack',name:'💬 Slack',description:'Slack integration',category:'communication',command:'npx',args:['-y','@modelcontextprotocol/server-slack'],difficulty:'medium',requires_key:true,tags:['chat']},
        {id:'notion',name:'📝 Notion',description:'Notion pages/databases',category:'productivity',command:'npx',args:['-y','notion-mcp-server'],difficulty:'easy',requires_key:true,tags:['notes']},
        {id:'context7',name:'📚 Context7 Docs',description:'Tra cứu docs thư viện',category:'developer',command:'npx',args:['-y','@context7/mcp'],difficulty:'easy',requires_key:false,tags:['docs']},
        {id:'fetch',name:'🌍 URL Reader',description:'Đọc nội dung từ URL',category:'core',command:'npx',args:['-y','@anthropic/mcp-server-fetch'],difficulty:'easy',requires_key:false,tags:['web']},
        {id:'stripe',name:'💳 Stripe',description:'Quản lý thanh toán',category:'business',command:'npx',args:['-y','@stripe/mcp'],difficulty:'medium',requires_key:true,tags:['payment']},
        {id:'docker',name:'🐳 Docker',description:'Quản lý containers',category:'infrastructure',command:'npx',args:['-y','mcp-docker'],difficulty:'medium',requires_key:false,tags:['devops']},
        {id:'youtube',name:'📺 YouTube',description:'Tìm transcript video',category:'search',command:'npx',args:['-y','mcp-youtube'],difficulty:'easy',requires_key:false,tags:['video']},
      ]);
    }
  };

  useEffect(()=>{ loadServers(); loadCatalog(); },[]);

  const filteredCatalog = useMemo(() => {
    const installedNames = new Set(servers.map(s=>s.name));
    let items = catalog.filter(c=>!installedNames.has(c.id));
    if(activeCategory!=='all') items = items.filter(c=>c.category===activeCategory);
    if(search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(c => (c.name+' '+c.description+' '+(c.tags||[]).join(' ')).toLowerCase().includes(q));
    }
    return items;
  },[catalog,servers,activeCategory,search]);

  const addServer = async () => {
    if(!addForm.name.trim()) { showToast('⚠️ Nhập tên','error'); return; }
    try {
      const args = addForm.args ? addForm.args.split(' ') : [];
      const envObj = addForm.env ? JSON.parse(addForm.env) : {};
      const body = { name:addForm.name, command:addForm.command, args, env:envObj };
      const r = await authFetch('/api/v1/mcp/servers', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
      });
      const d=await r.json();
      if(d.ok) { showToast('✅ Đã thêm: '+addForm.name,'success'); setShowAdd(false); setAddForm({name:'',command:'npx',args:'',env:''}); loadServers(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const removeServer = async (name) => {
    if(!confirm('Xoá MCP server "'+name+'"?')) return;
    try {
      const r = await authFetch('/api/v1/mcp/servers/'+encodeURIComponent(name), {method:'DELETE'});
      const d=await r.json();
      if(d.ok) { showToast('🗑️ Đã xoá: '+name,'success'); loadServers(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const quickInstall = (item) => {
    const args = (item.args||[]).join(' ');
    const envStr = item.env && Object.keys(item.env).length > 0 ? JSON.stringify(item.env,null,2) : '';
    setAddForm({name:item.id, command:item.command||'npx', args, env:envStr});
    setShowAdd(true);
    showToast('📝 Kiểm tra config rồi nhấn "Thêm"','info');
  };

  const diffBadge = (d) => {
    if(d==='easy') return html`<span class="badge badge-green" style="font-size:10px">Dễ</span>`;
    if(d==='medium') return html`<span class="badge badge-yellow" style="font-size:10px">Vừa</span>`;
    return html`<span class="badge badge-red" style="font-size:10px">Nâng cao</span>`;
  };

  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';

  return html`<div>
    <div class="page-header"><div><h1>🔗 MCP Marketplace</h1><div class="sub">1000+ tools — cài 1 click, mở rộng AI không giới hạn</div></div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${()=>setShowAdd(!showAdd)}>+ Thêm Thủ Công</button>
    </div>
    <div class="stats">
      <${StatsCard} label="Đã cài" value=${servers.length} color="accent" icon="🔌" />
      <${StatsCard} label="Đang chạy" value=${servers.filter(s=>s.status==='connected').length} color="green" icon="✅" />
      <${StatsCard} label="Catalog" value=${catalog.length} color="blue" icon="📦" />
      <${StatsCard} label="Chưa cài" value=${filteredCatalog.length} color="yellow" icon="🆕" />
    </div>

    ${showAdd && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <h3 style="margin-bottom:10px">🔌 Thêm MCP Server</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <label>Tên server<input style="${inp}" value=${addForm.name} onInput=${e=>setAddForm(f=>({...f,name:e.target.value}))} placeholder="filesystem" /></label>
          <label>Command<input style="${inp}" value=${addForm.command} onInput=${e=>setAddForm(f=>({...f,command:e.target.value}))} placeholder="npx" /></label>
          <label style="grid-column:span 2">Arguments<input style="${inp}" value=${addForm.args} onInput=${e=>setAddForm(f=>({...f,args:e.target.value}))} placeholder="-y @modelcontextprotocol/server-filesystem /tmp" /></label>
          <label style="grid-column:span 2">Environment (JSON)<textarea style="${inp};min-height:40px;font-family:monospace" value=${addForm.env} onInput=${e=>setAddForm(f=>({...f,env:e.target.value}))} placeholder='{"API_KEY": "..."}' /></label>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>setShowAdd(false)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${addServer}>💾 Thêm</button>
        </div>
      </div>
    `}

    ${servers.length>0&&html`<div class="card" style="margin-bottom:14px"><h3 style="margin-bottom:12px">📡 Đang chạy (${servers.length})</h3>
      <table><thead><tr><th>Server</th><th>Protocol</th><th>Tools</th><th>Status</th><th style="text-align:right">Thao tác</th></tr></thead><tbody>
        ${servers.map(s=>html`<tr key=${s.name}><td><strong>${s.name}</strong></td><td><span class="badge badge-blue">${s.transport||'stdio'}</span></td><td>${s.tools_count||0}</td><td><span class="badge ${s.status==='connected'?'badge-green':'badge-red'}">${s.status}</span></td>
          <td style="text-align:right"><button class="btn btn-outline btn-sm" style="color:var(--red)" onClick=${()=>removeServer(s.name)} title="Xoá">🗑️</button></td>
        </tr>`)}
      </tbody></table>
    </div>`}

    <div class="card"><h3 style="margin-bottom:12px">🛒 MCP Catalog — Cài 1 Click</h3>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
        ${categories.map(c=>html`<button key=${c.id}
          class="btn ${activeCategory===c.id?'':'btn-outline'} btn-sm"
          style="${activeCategory===c.id?'background:var(--grad1);color:#fff':''};padding:4px 12px;font-size:12px"
          onClick=${()=>setActiveCategory(c.id)}>${c.icon} ${c.label}</button>`)}
      </div>

      <input style="${inp};margin-bottom:12px" placeholder="🔍 Tìm kiếm tools..." value=${search} onInput=${e=>setSearch(e.target.value)} />

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
        ${filteredCatalog.map(item=>html`<div key=${item.id} style="display:flex;flex-direction:column;padding:14px;background:var(--bg2);border-radius:10px;border:1px solid var(--border);transition:border-color .2s" onMouseEnter=${e=>e.currentTarget.style.borderColor='var(--accent)'} onMouseLeave=${e=>e.currentTarget.style.borderColor='var(--border)'}>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <strong style="font-size:14px;flex:1">${item.name}</strong>
            ${diffBadge(item.difficulty)}
            ${item.requires_key && html`<span class="badge badge-yellow" style="font-size:10px">🔑 Key</span>`}
          </div>
          <div style="font-size:12px;color:var(--text2);flex:1;margin-bottom:8px">${item.description}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">
            ${(item.tags||[]).slice(0,3).map(tag=>html`<span key=${tag} style="font-size:10px;padding:2px 6px;background:var(--bg3);border-radius:4px;color:var(--text2)">${tag}</span>`)}
          </div>
          <button class="btn btn-outline btn-sm" style="align-self:flex-end;padding:4px 14px" onClick=${()=>quickInstall(item)}>⚡ Cài đặt</button>
        </div>`)}
        ${filteredCatalog.length===0 && html`<div style="grid-column:span 3;text-align:center;padding:30px;color:var(--text2)">
          ${search ? '🔍 Không tìm thấy tools phù hợp' : '✅ Đã cài hết tools trong danh mục này!'}
        </div>`}
      </div>
    </div>

    <div class="card" style="margin-top:14px;background:var(--bg2);text-align:center;padding:20px">
      <div style="font-size:14px;color:var(--text2)">🌐 Xem thêm 1000+ MCP servers tại</div>
      <a href="https://github.com/modelcontextprotocol/servers" target="_blank" rel="noopener"
        style="color:var(--accent);font-size:16px;font-weight:600;text-decoration:none">github.com/modelcontextprotocol/servers →</a>
      <div style="margin-top:8px;font-size:12px;color:var(--text2)">Tương thích với Nexent, Claude Desktop, và mọi MCP client</div>
    </div>
  </div>`;
}


export { McpPage };

