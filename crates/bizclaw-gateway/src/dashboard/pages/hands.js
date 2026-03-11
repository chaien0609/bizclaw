// HandsPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function HandsPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [hands, setHands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editHand, setEditHand] = useState(null);
  const [form, setForm] = useState({name:'',schedule:'',prompt:'',phases:'',icon:'🤚'});

  const defaultHands = [
    { id:'research', name:'Research Hand', icon:'🔍', schedule:'0 */6 * * *', prompt:'Research and gather information on specified topics, analyze findings, produce summary reports.', phases:'gather,analyze,report', enabled:true, runs:0, tokens:0, cost:0 },
    { id:'analytics', name:'Analytics Hand', icon:'📊', schedule:'0 6 * * *', prompt:'Collect metrics and analytics data, process trends, generate daily insight reports.', phases:'collect,process,report', enabled:true, runs:0, tokens:0, cost:0 },
    { id:'content', name:'Content Hand', icon:'📝', schedule:'0 8 * * *', prompt:'Generate content ideas, create drafts, self-review with quality checks.', phases:'ideate,create,review', enabled:true, runs:0, tokens:0, cost:0 },
    { id:'monitor', name:'Monitor Hand', icon:'🔔', schedule:'*/5 * * * *', prompt:'Monitor system health, external services, and alert on anomalies.', phases:'check,alert', enabled:true, runs:0, tokens:0, cost:0 },
    { id:'sync', name:'Sync Hand', icon:'🔄', schedule:'*/30 * * * *', prompt:'Synchronize data between systems, reconcile differences, push updates.', phases:'fetch,reconcile,push', enabled:true, runs:0, tokens:0, cost:0 },
    { id:'outreach', name:'Outreach Hand', icon:'📧', schedule:'0 9 * * 1-5', prompt:'Prepare outreach messages, review content quality, send to configured channels.', phases:'prepare,review,send', enabled:true, runs:0, tokens:0, cost:0 },
    { id:'security', name:'Security Hand', icon:'🛡️', schedule:'0 * * * *', prompt:'Scan for security issues, analyze vulnerabilities, report findings.', phases:'scan,analyze,report', enabled:true, runs:0, tokens:0, cost:0 },
  ];

  const load = async () => {
    try {
      const r = await authFetch('/api/v1/scheduler/tasks');
      const d = await r.json();
      const tasks = d.tasks || [];
      // Map scheduler tasks to hands format, merge with defaults
      if(tasks.length > 0) {
        const mapped = tasks.filter(t => t.name && t.name.includes('Hand')).map(t => ({
          id: t.id, name: t.name, icon: t.icon || '🤚',
          schedule: t.task_type?.Cron?.expression || t.task_type?.Interval ? (t.task_type.Interval.every_secs + 's') : '',
          prompt: t.action?.AgentPrompt?.prompt || '',
          phases: t.phases || '', enabled: t.enabled !== false,
          runs: t.run_count || 0, tokens: t.total_tokens || 0, cost: t.total_cost || 0,
          status: t.status, fail_count: t.fail_count || 0, next_run: t.next_run, last_error: t.last_error
        }));
        if(mapped.length > 0) { setHands(mapped); setLoading(false); return; }
      }
      setHands(defaultHands);
    } catch(e) { setHands(defaultHands); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditHand(null);
    setForm({name:'',schedule:'0 */6 * * *',prompt:'',phases:'gather,analyze,report',icon:'🤚'});
    setShowForm(true);
  };
  const openEdit = (h) => {
    setEditHand(h);
    setForm({name:h.name,schedule:h.schedule,prompt:h.prompt||'',phases:h.phases||'',icon:h.icon||'🤚'});
    setShowForm(true);
  };

  const saveHand = async () => {
    if(!form.name.trim()) { showToast('⚠️ Nhập tên Hand','error'); return; }
    try {
      // Backend API expects: name, task_type (string), cron/interval_secs, prompt/action
      const body = {
        name: form.name,
        task_type: 'cron',
        cron: form.schedule || '0 */6 * * *',
        prompt: form.prompt || '',
        icon: form.icon,
        phases: form.phases,
      };
      if(editHand && editHand.id) {
        // No PUT route — delete + recreate
        try { await authFetch('/api/v1/scheduler/tasks/'+editHand.id, {method:'DELETE'}); } catch(e) {}
        const r = await authFetch('/api/v1/scheduler/tasks', {
          method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
        });
        const d = await r.json();
        if(d.ok || d.id) { showToast('✅ Đã cập nhật: '+form.name,'success'); setShowForm(false); load(); }
        else showToast('❌ '+(d.error||'Lỗi'),'error');
      } else {
        const r = await authFetch('/api/v1/scheduler/tasks', {
          method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
        });
        const d = await r.json();
        if(d.ok || d.id) { showToast('✅ Đã tạo Hand: '+form.name,'success'); setShowForm(false); load(); }
        else showToast('❌ '+(d.error||'Lỗi'),'error');
      }
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const toggleHand = async (h) => {
    if(h.id && typeof h.id === 'string' && h.id.length > 10) {
      try {
        await authFetch('/api/v1/scheduler/tasks/'+h.id+'/toggle', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({enabled:!h.enabled})
        });
        showToast((h.enabled?'⏸ Đã tắt':'▶ Đã bật')+': '+h.name,'success');
        load();
      } catch(e) { showToast('❌ '+e.message,'error'); }
    } else {
      setHands(prev => prev.map(x => x.id === h.id ? {...x, enabled:!x.enabled} : x));
      showToast((h.enabled?'⏸ Đã tắt':'▶ Đã bật')+': '+h.name,'success');
    }
  };

  const deleteHand = async (h) => {
    if(!confirm('Xoá Hand "'+h.name+'"?')) return;
    if(h.id && typeof h.id === 'string' && h.id.length > 10) {
      try {
        await authFetch('/api/v1/scheduler/tasks/'+h.id, {method:'DELETE'});
        showToast('🗑️ Đã xoá: '+h.name,'success');
        load();
      } catch(e) { showToast('❌ '+e.message,'error'); }
    } else {
      setHands(prev => prev.filter(x => x.id !== h.id));
      showToast('🗑️ Đã xoá: '+h.name,'success');
    }
  };

  const statusBadge = (h) => {
    if(!h.enabled) return html`<span class="badge badge-purple">🚫 disabled</span>`;
    if(h.status === 'Running') return html`<span class="badge badge-yellow">⏳ running</span>`;
    if(h.status === 'Completed') return html`<span class="badge badge-green">✅ done</span>`;
    if(h.status && typeof h.status === 'object' && h.status.Failed) return html`<span class="badge badge-red">❌ failed</span>`;
    if(h.status && typeof h.status === 'object' && h.status.RetryPending) return html`<span class="badge badge-orange">🔄 retry</span>`;
    return html`<span class="badge badge-green">⏹ idle</span>`;
  };

  const activeCount = hands.filter(h => h.enabled).length;
  const totalRuns = hands.reduce((s,h) => s + (h.runs||0), 0);
  const totalCost = hands.reduce((s,h) => s + (h.cost||0), 0);
  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';
  const icons = ['🤚','🔍','📊','📝','🔔','🔄','📧','🛡️','🤖','⚡','🌐','💼','🎯','📋','🧹'];

  return html`<div>
    <div class="page-header"><div>
      <h1>🤚 Autonomous Hands</h1>
      <div class="sub">Autonomous agents chạy 24/7 — tạo, cấu hình, quản lý</div>
    </div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${openCreate}>+ Tạo Hand</button>
    </div>
    <div class="stats">
      <${StatsCard} label="Total Hands" value=${hands.length} color="accent" icon="🤚" />
      <${StatsCard} label="Active" value=${activeCount} color="green" icon="▶" />
      <${StatsCard} label="Total Runs" value=${totalRuns} color="blue" icon="🔁" />
      <${StatsCard} label="Total Cost" value=${'$'+totalCost.toFixed(4)} color="orange" icon="💰" />
    </div>

    ${showForm && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>${editHand ? '✏️ Sửa Hand: '+editHand.name : '➕ Tạo Hand mới'}</h3>
          <button class="btn btn-outline btn-sm" onClick=${()=>setShowForm(false)}>✕ Đóng</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <label>Icon
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">
              ${icons.map(ic => html`<button key=${ic} class="btn btn-outline btn-sm" style=${form.icon===ic?'background:var(--accent);color:#fff':''} onClick=${()=>setForm(f=>({...f,icon:ic}))}>${ic}</button>`)}
            </div>
          </label>
          <label>Tên Hand<input style="${inp}" value=${form.name} onInput=${e=>setForm(f=>({...f,name:e.target.value}))} placeholder="My Custom Hand" /></label>
          <label>Schedule (Cron)<input style="${inp}" value=${form.schedule} onInput=${e=>setForm(f=>({...f,schedule:e.target.value}))} placeholder="0 */6 * * * (mỗi 6h)" />
            <div style="font-size:10px;color:var(--text2);margin-top:2px">Cron format: phút giờ ngày tháng thứ. VD: */5 * * * * = mỗi 5 phút</div>
          </label>
          <label>Phases (comma-separated)<input style="${inp}" value=${form.phases} onInput=${e=>setForm(f=>({...f,phases:e.target.value}))} placeholder="gather,analyze,report" /></label>
          <label style="grid-column:span 2">Agent Prompt<textarea style="${inp};min-height:100px;resize:vertical;font-family:var(--mono)" value=${form.prompt} onInput=${e=>setForm(f=>({...f,prompt:e.target.value}))} placeholder="Describe what this hand should do autonomously..." /></label>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>setShowForm(false)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${saveHand}>💾 ${editHand?'Cập nhật':'Tạo'}</button>
        </div>
      </div>
    `}

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px">
      ${hands.map(h => html`<div class="card" key=${h.id} style="border-left:3px solid ${h.enabled?'var(--green)':'var(--text2)'}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:24px">${h.icon}</span>
            <div><strong>${h.name}</strong><div style="font-size:11px;color:var(--text2)">📅 ${h.schedule}</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            ${statusBadge(h)}
            <button class="btn btn-outline btn-sm" onClick=${()=>toggleHand(h)} title=${h.enabled?'Tắt':'Bật'}>${h.enabled?'⏸':'▶'}</button>
            <button class="btn btn-outline btn-sm" onClick=${()=>openEdit(h)} title="Sửa">✏️</button>
            <button class="btn btn-outline btn-sm" style="color:var(--red)" onClick=${()=>deleteHand(h)} title="Xoá">🗑️</button>
          </div>
        </div>
        ${h.prompt && html`<div style="font-size:11px;color:var(--text2);margin-bottom:8px;max-height:40px;overflow:hidden;text-overflow:ellipsis">${h.prompt}</div>`}
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">
          ${(h.phases||'').split(',').filter(Boolean).map((p,i) => html`<span key=${i} class="badge badge-blue" style="font-size:10px">${i+1}. ${p.trim()}</span>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;font-size:11px;color:var(--text2)">
          <div>Runs: <strong style="color:var(--text)">${h.runs||0}</strong></div>
          <div>Tokens: <strong style="color:var(--text)">${h.tokens||0}</strong></div>
          <div>Cost: <strong style="color:var(--orange)">$${(h.cost||0).toFixed(4)}</strong></div>
        </div>
        ${h.last_error && html`<div style="font-size:10px;color:var(--red);margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title=${h.last_error}>⚠️ ${h.last_error}</div>`}
      </div>`)}
    </div>
  </div>`;
}


export { HandsPage };
