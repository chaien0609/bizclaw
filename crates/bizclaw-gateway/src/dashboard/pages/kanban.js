// KanbanPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function KanbanPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const COLUMNS = [
    {id:'inbox',title:'📥 Inbox',color:'var(--text2)'},
    {id:'in_progress',title:'🔄 Đang làm',color:'var(--blue)'},
    {id:'review',title:'👀 Review',color:'var(--orange)'},
    {id:'done',title:'✅ Hoàn thành',color:'var(--green)'}
  ];
  const PRIORITIES = [{id:'low',label:'Thấp',color:'var(--text2)'},{id:'normal',label:'Bình thường',color:'var(--blue)'},{id:'high',label:'Cao',color:'var(--orange)'},{id:'urgent',label:'Khẩn cấp',color:'var(--red)'}];

  const loadTickets = () => {
    try { return JSON.parse(localStorage.getItem('bizclaw_kanban')||'[]'); } catch(e){ return []; }
  };
  const saveTickets = (t) => { localStorage.setItem('bizclaw_kanban',JSON.stringify(t)); setTickets(t); };

  const [tickets,setTickets] = useState(loadTickets);
  const [agents,setAgents] = useState([]);
  const [showCreate,setShowCreate] = useState(false);
  const [selectedTicket,setSelectedTicket] = useState(null);
  const [dragOver,setDragOver] = useState(null);
  const [form,setForm] = useState({title:'',description:'',priority:'normal',assigned_agent:'',status:'inbox'});
  const [filterAgent,setFilterAgent] = useState('');

  useEffect(()=>{
    (async()=>{try{const r=await authFetch('/api/v1/agents');const d=await r.json();setAgents(d.agents||[]);}catch(e){}})();
  },[]);

  const createTicket = () => {
    if(!form.title.trim()){showToast('⚠️ Nhập tiêu đề','error');return;}
    const t={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      title:form.title, description:form.description, priority:form.priority,
      assigned_agent:form.assigned_agent, status:'inbox',
      created_at:new Date().toISOString(), updated_at:new Date().toISOString()};
    saveTickets([...tickets,t]);
    showToast('✅ Đã tạo task: '+form.title,'success');
    setForm({title:'',description:'',priority:'normal',assigned_agent:'',status:'inbox'});
    setShowCreate(false);
  };

  const moveTicket = (ticketId, newStatus) => {
    saveTickets(tickets.map(t=>t.id===ticketId?{...t,status:newStatus,updated_at:new Date().toISOString()}:t));
  };

  const deleteTicket = (id) => {
    if(!confirm('Xoá task này?'))return;
    saveTickets(tickets.filter(t=>t.id!==id));
    setSelectedTicket(null);
    showToast('🗑️ Đã xoá task','success');
  };

  const updateTicket = (id, updates) => {
    saveTickets(tickets.map(t=>t.id===id?{...t,...updates,updated_at:new Date().toISOString()}:t));
    if(selectedTicket?.id===id) setSelectedTicket(prev=>({...prev,...updates}));
  };

  const onDragStart = (e, ticketId) => { e.dataTransfer.setData('ticketId', ticketId); };
  const onDragOverCol = (e, colId) => { e.preventDefault(); setDragOver(colId); };
  const onDragLeave = () => setDragOver(null);
  const onDropCol = (e, colId) => {
    e.preventDefault(); setDragOver(null);
    const ticketId=e.dataTransfer.getData('ticketId');
    if(ticketId) moveTicket(ticketId, colId);
  };

  const priColor = (p) => PRIORITIES.find(pr=>pr.id===p)?.color||'var(--text2)';
  const fmtTime = (t) => { if(!t)return'—'; const d=new Date(t); const now=new Date(); const diff=now-d;
    if(diff<60000)return'vừa xong'; if(diff<3600000)return Math.floor(diff/60000)+'p trước';
    if(diff<86400000)return Math.floor(diff/3600000)+'h trước'; return Math.floor(diff/86400000)+'d trước'; };

  const filtered = filterAgent ? tickets.filter(t=>t.assigned_agent===filterAgent) : tickets;
  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';

  return html`<div>
    <div class="page-header"><div>
      <h1>📋 Kanban Board</h1>
      <div class="sub">Quản lý công việc — kéo thả để chuyển trạng thái</div>
    </div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${()=>setShowCreate(true)}>+ Tạo Task</button>
    </div>

    <div class="stats">
      <${StatsCard} label="Tổng Tasks" value=${tickets.length} color="accent" icon="📋" />
      <${StatsCard} label="Đang làm" value=${tickets.filter(t=>t.status==='in_progress').length} color="blue" icon="🔄" />
      <${StatsCard} label="Review" value=${tickets.filter(t=>t.status==='review').length} color="orange" icon="👀" />
      <${StatsCard} label="Done" value=${tickets.filter(t=>t.status==='done').length} color="green" icon="✅" />
    </div>

    ${agents.length>0 && html`
      <div style="display:flex;gap:6px;margin-bottom:14px;align-items:center;overflow-x:auto;padding-bottom:4px">
        <span style="font-size:12px;color:var(--text2);white-space:nowrap">Filter:</span>
        <button class="btn btn-sm ${!filterAgent?'':'btn-outline'}" onClick=${()=>setFilterAgent('')}>Tất cả</button>
        ${agents.map(a=>html`<button key=${a.name} class="btn btn-sm ${filterAgent===a.name?'':'btn-outline'}" onClick=${()=>setFilterAgent(filterAgent===a.name?'':a.name)}>🤖 ${a.name}</button>`)}
      </div>
    `}

    ${showCreate && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>➕ Tạo Task mới</h3>
          <button class="btn btn-outline btn-sm" onClick=${()=>setShowCreate(false)}>✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <label>Tiêu đề<input style="${inp}" value=${form.title} onInput=${e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Bug fix login page..." /></label>
          <label>Ưu tiên<select style="${inp};cursor:pointer" value=${form.priority} onChange=${e=>setForm(f=>({...f,priority:e.target.value}))}>
            ${PRIORITIES.map(p=>html`<option key=${p.id} value=${p.id}>${p.label}</option>`)}
          </select></label>
          <label style="grid-column:span 2">Mô tả<textarea style="${inp};min-height:60px;resize:vertical" value=${form.description} onInput=${e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Chi tiết task..." /></label>
          <label>Gán Agent<select style="${inp};cursor:pointer" value=${form.assigned_agent} onChange=${e=>setForm(f=>({...f,assigned_agent:e.target.value}))}>
            <option value="">— Chưa gán —</option>
            ${agents.map(a=>html`<option key=${a.name} value=${a.name}>🤖 ${a.name}</option>`)}
          </select></label>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>setShowCreate(false)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${createTicket}>💾 Tạo</button>
        </div>
      </div>
    `}

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;min-height:400px">
      ${COLUMNS.map(col=>{
        const colTickets=filtered.filter(t=>t.status===col.id);
        return html`<div key=${col.id}
          style="background:var(--bg2);border-radius:10px;padding:12px;border:2px solid ${dragOver===col.id?'var(--accent)':'transparent'};transition:border-color .2s"
          onDragOver=${e=>onDragOverCol(e,col.id)} onDragLeave=${onDragLeave} onDrop=${e=>onDropCol(e,col.id)}>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-size:13px;font-weight:700;color:${col.color}">${col.title}</div>
            <span class="badge" style="font-size:10px">${colTickets.length}</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;min-height:100px">
            ${colTickets.map(t=>html`<div key=${t.id} draggable="true" onDragStart=${e=>onDragStart(e,t.id)}
              style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;cursor:grab;border-left:3px solid ${priColor(t.priority)};transition:transform .15s,box-shadow .15s"
              onMouseOver=${e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,.2)'}}
              onMouseOut=${e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}
              onClick=${()=>setSelectedTicket(t)}>
              <div style="font-size:13px;font-weight:600;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.title}</div>
              ${t.description?html`<div style="font-size:11px;color:var(--text2);margin-bottom:6px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${t.description}</div>`:''}
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="display:flex;gap:4px;align-items:center">
                  ${t.assigned_agent?html`<span class="badge badge-blue" style="font-size:9px">🤖 ${t.assigned_agent}</span>`:''}
                  <span style="width:6px;height:6px;border-radius:50%;background:${priColor(t.priority)};display:inline-block" title=${t.priority}></span>
                </div>
                <span style="font-size:10px;color:var(--text2)">${fmtTime(t.updated_at)}</span>
              </div>
            </div>`)}
            ${colTickets.length===0?html`<div style="text-align:center;padding:20px;color:var(--text2);font-size:12px;border:1px dashed var(--border);border-radius:8px">Kéo task vào đây</div>`:''}
          </div>
        </div>`;
      })}
    </div>

    ${selectedTicket && html`
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center" onClick=${e=>{if(e.target===e.currentTarget)setSelectedTicket(null)}}>
        <div class="card" style="width:500px;max-height:80vh;overflow-y:auto;border:1px solid var(--accent)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <h3 style="flex:1;overflow:hidden;text-overflow:ellipsis">${selectedTicket.title}</h3>
            <div style="display:flex;gap:4px">
              <button class="btn btn-outline btn-sm" style="color:var(--red)" onClick=${()=>deleteTicket(selectedTicket.id)}>🗑️</button>
              <button class="btn btn-outline btn-sm" onClick=${()=>setSelectedTicket(null)}>✕</button>
            </div>
          </div>
          <div style="display:grid;gap:10px;font-size:13px">
            <label>Tiêu đề<input style="${inp}" value=${selectedTicket.title} onInput=${e=>updateTicket(selectedTicket.id,{title:e.target.value})} /></label>
            <label>Mô tả<textarea style="${inp};min-height:80px;resize:vertical" value=${selectedTicket.description||''} onInput=${e=>updateTicket(selectedTicket.id,{description:e.target.value})} /></label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <label>Trạng thái<select style="${inp};cursor:pointer" value=${selectedTicket.status} onChange=${e=>{moveTicket(selectedTicket.id,e.target.value);setSelectedTicket(prev=>({...prev,status:e.target.value}))}}>
                ${COLUMNS.map(c=>html`<option key=${c.id} value=${c.id}>${c.title}</option>`)}
              </select></label>
              <label>Ưu tiên<select style="${inp};cursor:pointer" value=${selectedTicket.priority} onChange=${e=>updateTicket(selectedTicket.id,{priority:e.target.value})}>
                ${PRIORITIES.map(p=>html`<option key=${p.id} value=${p.id}>${p.label}</option>`)}
              </select></label>
              <label>Gán Agent<select style="${inp};cursor:pointer" value=${selectedTicket.assigned_agent||''} onChange=${e=>updateTicket(selectedTicket.id,{assigned_agent:e.target.value})}>
                <option value="">— Chưa gán —</option>
                ${agents.map(a=>html`<option key=${a.name} value=${a.name}>🤖 ${a.name}</option>`)}
              </select></label>
              <div style="padding:8px 0">
                <div style="font-size:10px;color:var(--text2);text-transform:uppercase;margin-bottom:4px">Tạo lúc</div>
                <div style="font-size:12px">${selectedTicket.created_at?new Date(selectedTicket.created_at).toLocaleString('vi-VN'):'—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `}
  </div>`;
}


export { KanbanPage };
