// OrchestrationPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function OrchestrationPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [delegations,setDelegations] = useState([]);
  const [links,setLinks] = useState([]);
  const [agentsList, setAgentsList] = useState([]);
  const [showCreate,setShowCreate] = useState(false);
  const [form,setForm] = useState({from:'',to:'',task:''});

  const load = async () => {
    try{
      const [r1,r2,r3]=await Promise.all([
        authFetch('/api/v1/orchestration/delegations'),
        authFetch('/api/v1/orchestration/links'),
        authFetch('/api/v1/agents'),
      ]);
      const d1=await r1.json();const d2=await r2.json();const d3=await r3.json();
      setDelegations(d1.delegations||[]);setLinks(d2.links||[]);setAgentsList(d3.agents||[]);
    }catch(e){}
  };
  useEffect(()=>{ load(); },[]);

  const createDelegation = async () => {
    if(!form.from.trim()||!form.to.trim()||!form.task.trim()) { showToast('⚠️ Điền đầy đủ','error'); return; }
    try {
      const r = await authFetch('/api/v1/orchestration/delegations', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form)});
      const d=await r.json();
      if(d.ok||d.id) { showToast('✅ Delegation created','success'); setShowCreate(false); setForm({from:'',to:'',task:''}); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const deleteDelegation = async (id) => {
    if(!confirm('Xoá delegation?')) return;
    try { await authFetch('/api/v1/orchestration/delegations/'+id, {method:'DELETE'}); showToast('🗑️ Đã xoá','success'); load(); } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';

  return html`<div>
    <div class="page-header"><div><h1>🔀 ${t('orch.title',lang)}</h1><div class="sub">${t('orch.subtitle',lang)}</div></div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${()=>setShowCreate(!showCreate)}>+ Tạo Delegation</button>
    </div>
    <div class="stats"><${StatsCard} label=${t('orch.delegations',lang)} value=${delegations.length} color="accent" icon="📋" /><${StatsCard} label=${t('orch.links',lang)} value=${links.length} color="blue" icon="🔗" /></div>
    ${showCreate && html`<div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
      <h3 style="margin-bottom:10px">📋 Tạo Delegation mới</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
        <label>From Agent
          <select style="${inp};cursor:pointer" value=${form.from} onChange=${e=>setForm(f=>({...f,from:e.target.value}))}>
            <option value="">— Chọn Agent —</option>
            ${agentsList.map(a=>html`<option key=${a.name} value=${a.name}>🤖 ${a.name} ${a.role ? '('+a.role+')' : ''}</option>`)}
          </select>
        </label>
        <label>To Agent
          <select style="${inp};cursor:pointer" value=${form.to} onChange=${e=>setForm(f=>({...f,to:e.target.value}))}>
            <option value="">— Chọn Agent —</option>
            ${agentsList.filter(a=>a.name!==form.from).map(a=>html`<option key=${a.name} value=${a.name}>🤖 ${a.name} ${a.role ? '('+a.role+')' : ''}</option>`)}
          </select>
        </label>
        <label style="grid-column:span 2">Task<input style="${inp}" value=${form.task} onInput=${e=>setForm(f=>({...f,task:e.target.value}))} placeholder="Research topic X and report" /></label>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-outline" onClick=${()=>setShowCreate(false)}>Huỷ</button>
        <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${createDelegation}>📋 Delegate</button>
      </div>
    </div>`}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="card"><h3 style="margin-bottom:12px">📋 ${t('orch.delegate_title',lang)}</h3>
        ${delegations.length===0?html`<div style="text-align:center;padding:20px;color:var(--text2)"><p>Chưa có delegation.</p></div>`:html`<table><thead><tr><th>${t('orch.from_agent',lang)}</th><th>${t('orch.to_agent',lang)}</th><th>${t('orch.task',lang)}</th><th>Status</th><th></th></tr></thead><tbody>${delegations.map(d=>html`<tr key=${d.id}><td>${d.from}</td><td>${d.to}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${d.task}</td><td><span class="badge badge-green">${d.status}</span></td><td><button class="btn btn-outline btn-sm" style="color:var(--red)" onClick=${()=>deleteDelegation(d.id)}>🗑️</button></td></tr>`)}</tbody></table>`}
      </div>
      <div class="card"><h3 style="margin-bottom:12px">🔗 ${t('orch.perm_links',lang)}</h3>
        <div style="display:grid;gap:8px">
          ${['delegate','handoff','broadcast','escalate'].map(p=>html`<div key=${p} style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg2);border-radius:6px">
            <span style="font-size:18px">${p==='delegate'?'📋':p==='handoff'?'🤝':p==='broadcast'?'📢':'⬆️'}</span>
            <div style="flex:1"><strong style="font-size:13px">${p}</strong><div style="font-size:11px;color:var(--text2)">Agent-to-agent ${p}</div></div>
            <span class="badge badge-green">✓ enabled</span>
          </div>`)}
        </div>
      </div>
    </div>
  </div>`;
}


export { OrchestrationPage };
