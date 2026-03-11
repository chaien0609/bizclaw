// WorkflowsPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function WorkflowsPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWf, setSelectedWf] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editWf, setEditWf] = useState(null);
  const [form, setForm] = useState({name:'',description:'',tags:'',steps:[{name:'',type:'Sequential',agent_role:'',prompt:''}]});
  const [runResult, setRunResult] = useState(null);
  const [running, setRunning] = useState(null);
  const [runInput, setRunInput] = useState('');
  const [showRunInput, setShowRunInput] = useState(null);

  const load = async () => {
    try {
      const r = await authFetch('/api/v1/workflows');
      if(!r.ok) throw new Error('HTTP '+r.status);
      const d = await r.json();
      setWorkflows(d.workflows || []);
    } catch (e) {
      console.error('Workflows load:', e);
      setWorkflows([]);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const stepTypeIcon = (type) => {
    const icons = { Sequential: '➡️', FanOut: '🔀', Collect: '📥', Conditional: '🔀', Loop: '🔁', Transform: '✨' };
    return icons[type] || '⚙️';
  };
  const stepTypeBadge = (type) => {
    const colors = { Sequential: 'badge-blue', FanOut: 'badge-purple', Collect: 'badge-green', Conditional: 'badge-orange', Loop: 'badge-yellow', Transform: 'badge-blue' };
    return colors[type] || 'badge-blue';
  };
  const stepTypes = ['Sequential','FanOut','Collect','Conditional','Loop','Transform'];

  const openCreate = () => {
    setEditWf(null);
    setForm({name:'',description:'',tags:'',steps:[{name:'Step 1',type:'Sequential',agent_role:'',prompt:''}]});
    setShowForm(true);
  };
  const openEdit = (wf) => {
    if(wf.builtin) { showToast('ℹ️ Template mẫu không chỉnh sửa được. Hãy tạo workflow mới.','info'); return; }
    setEditWf(wf);
    setForm({
      name: wf.name||'',
      description: wf.description||'',
      tags: (wf.tags||[]).join(', '),
      steps: (wf.steps||[]).map(s=>({name:s.name||'',type:s.type||'Sequential',agent_role:s.agent_role||'',prompt:s.prompt||''})),
    });
    setShowForm(true);
  };

  const addStep = () => setForm(f=>({...f, steps:[...f.steps, {name:'Step '+(f.steps.length+1),type:'Sequential',agent_role:'',prompt:''}]}));
  const removeStep = (idx) => setForm(f=>({...f, steps:f.steps.filter((_,i)=>i!==idx)}));
  const updateStep = (idx, key, val) => setForm(f=>({...f, steps:f.steps.map((s,i)=>i===idx?{...s,[key]:val}:s)}));

  const saveWorkflow = async () => {
    if(!form.name.trim()) { showToast('⚠️ Nhập tên workflow','error'); return; }
    if(form.steps.length===0) { showToast('⚠️ Thêm ít nhất 1 step','error'); return; }
    const body = {
      name: form.name,
      description: form.description,
      tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean),
      steps: form.steps,
    };
    try {
      if(editWf && editWf.id) {
        const r = await authFetch('/api/v1/workflows/'+encodeURIComponent(editWf.id), {
          method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
        });
        if(!r.ok) throw new Error('HTTP '+r.status);
        const d = await r.json();
        if(d.ok) { showToast('✅ Đã cập nhật: '+form.name,'success'); setShowForm(false); load(); }
        else showToast('❌ '+(d.error||'Lỗi'),'error');
      } else {
        const r = await authFetch('/api/v1/workflows', {
          method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
        });
        if(!r.ok) throw new Error('HTTP '+r.status);
        const d = await r.json();
        if(d.ok) { showToast('✅ Đã tạo: '+form.name,'success'); setShowForm(false); load(); }
        else showToast('❌ '+(d.error||'Lỗi'),'error');
      }
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const runWorkflow = async (wf) => {
    setRunning(wf.id);
    setRunResult(null);
    try {
      const r = await authFetch('/api/v1/workflows/run', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({workflow_id:wf.id, input:runInput})
      });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const d = await r.json();
      if(d.ok) {
        showToast('✅ Hoàn thành: '+wf.name+' ('+d.steps_completed+' steps)','success');
        setRunResult(d);
        setShowRunInput(null);
      } else {
        showToast('❌ '+(d.error||'Lỗi'),'error');
      }
    } catch(e) { showToast('❌ '+e.message,'error'); }
    setRunning(null);
  };

  const deleteWorkflow = async (wf) => {
    if(wf.builtin) { showToast('ℹ️ Không thể xoá template mẫu','info'); return; }
    if(!confirm('Xoá workflow "'+wf.name+'"?')) return;
    try {
      const r = await authFetch('/api/v1/workflows/'+encodeURIComponent(wf.id), {method:'DELETE'});
      if(!r.ok) throw new Error('HTTP '+r.status);
      const d = await r.json();
      if(d.ok) { showToast('🗑️ Đã xoá: '+wf.name,'success'); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';

  return html`<div>
    <div class="page-header"><div>
      <h1>🔄 ${t('wf.title', lang)}</h1>
      <div class="sub">${t('wf.subtitle', lang)}</div>
    </div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${openCreate}>+ Tạo Workflow</button>
    </div>

    <div class="stats">
      <${StatsCard} label=${t('wf.total', lang)} value=${workflows.length} color="accent" icon="🔄" />
      <${StatsCard} label="Custom" value=${workflows.filter(w=>!w.builtin).length} color="green" icon="✨" />
      <${StatsCard} label=${t('wf.templates', lang)} value=${workflows.filter(w=>w.builtin).length} color="blue" icon="📋" />
    </div>

    ${showForm && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>${editWf ? '✏️ Sửa: '+editWf.name : '➕ Tạo Workflow mới'}</h3>
          <button class="btn btn-outline btn-sm" onClick=${()=>setShowForm(false)}>✕ Đóng</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <label>Tên Workflow<input style="${inp}" value=${form.name} onInput=${e=>setForm(f=>({...f,name:e.target.value}))} placeholder="My Workflow" /></label>
          <label>Tags (phân cách bằng dấu phẩy)<input style="${inp}" value=${form.tags} onInput=${e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="content, writing" /></label>
          <label style="grid-column:span 2">Mô tả<input style="${inp}" value=${form.description} onInput=${e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Mô tả ngắn..." /></label>
        </div>

        <h4 style="margin-top:14px;margin-bottom:8px">📋 Steps (${form.steps.length})</h4>
        <div style="display:grid;gap:8px">
          ${form.steps.map((step, idx) => html`
            <div key=${idx} style="padding:10px;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
              <div style="display:grid;grid-template-columns:1fr 140px 1fr auto;gap:8px;align-items:end;font-size:12px">
                <label>Step Name<input style="${inp}" value=${step.name} onInput=${e=>updateStep(idx,'name',e.target.value)} placeholder="Step name" /></label>
                <label>Type
                  <select style="${inp};cursor:pointer" value=${step.type} onChange=${e=>updateStep(idx,'type',e.target.value)}>
                    ${stepTypes.map(t=>html`<option key=${t} value=${t}>${stepTypeIcon(t)} ${t}</option>`)}
                  </select>
                </label>
                <label>Agent Role<input style="${inp}" value=${step.agent_role} onInput=${e=>updateStep(idx,'agent_role',e.target.value)} placeholder="Writer, Analyst..." /></label>
                <button class="btn btn-outline btn-sm" style="color:var(--red);margin-bottom:2px" onClick=${()=>removeStep(idx)} title="Xoá step">🗑️</button>
              </div>
              <label style="display:block;margin-top:6px;font-size:12px">Prompt (tuỳ chọn)<input style="${inp}" value=${step.prompt||''} onInput=${e=>updateStep(idx,'prompt',e.target.value)} placeholder="Custom prompt cho step này (để trống = auto-generate)" /></label>
            </div>
          `)}
        </div>
        <button class="btn btn-outline btn-sm" style="margin-top:8px" onClick=${addStep}>+ Thêm Step</button>

        <div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>setShowForm(false)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${saveWorkflow}>💾 ${editWf?'Cập nhật':'Tạo'}</button>
        </div>
      </div>
    `}

    ${showRunInput && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--green)">
        <h3 style="margin-bottom:8px">▶ Chạy: ${showRunInput.name}</h3>
        <label style="font-size:13px">Input (context đầu vào cho workflow)
          <textarea style="${inp};min-height:60px;resize:vertical" value=${runInput} onInput=${e=>setRunInput(e.target.value)} placeholder="Nhập nội dung/yêu cầu cho workflow xử lý..." />
        </label>
        <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>{setShowRunInput(null);setRunInput('');}}>Huỷ</button>
          <button class="btn" style="background:var(--green);color:#fff;padding:8px 20px" onClick=${()=>runWorkflow(showRunInput)} disabled=${running}>
            ${running ? '⏳ Đang chạy...' : '▶ Chạy'}
          </button>
        </div>
      </div>
    `}

    ${runResult && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--green)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <h3>✅ Kết quả: ${runResult.workflow} (${runResult.steps_completed} steps)</h3>
          <button class="btn btn-outline btn-sm" onClick=${()=>setRunResult(null)}>✕ Đóng</button>
        </div>
        ${(runResult.results||[]).map(r => html`
          <div key=${r.step} style="padding:10px;margin-bottom:8px;background:var(--bg2);border-radius:8px;border-left:3px solid var(--accent)">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <span class="badge badge-blue">Step ${r.step}</span>
              <strong>${r.name}</strong>
              <span style="color:var(--text2);font-size:11px">→ ${r.agent_role}</span>
            </div>
            <pre style="font-size:12px;white-space:pre-wrap;background:var(--bg);padding:8px;border-radius:4px;margin:0;max-height:200px;overflow-y:auto">${r.output}</pre>
          </div>
        `)}
        <div style="margin-top:10px;padding:10px;background:var(--bg2);border-radius:8px;border-left:3px solid var(--green)">
          <strong>📋 Final Output:</strong>
          <pre style="font-size:12px;white-space:pre-wrap;margin-top:6px;max-height:200px;overflow-y:auto">${runResult.final_output}</pre>
        </div>
      </div>
    `}

    <div style="display:grid;grid-template-columns:1fr 2fr;gap:14px">
      <div class="card">
        <h3 style="margin-bottom:12px">⚙️ ${t('wf.step_types', lang)}</h3>
        <div style="display:grid;gap:6px">
          ${[['Sequential','➡️','Steps run one after another'],['FanOut','🔀','Multiple steps run in parallel'],['Collect','📥','Gather results (All/Best/Vote/Merge)'],['Conditional','🔀','If/else branching'],['Loop','🔁','Repeat until condition met'],['Transform','✨','Template transformation']].map(([name,icon,desc]) => html`
            <div key=${name} style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg2);border-radius:6px">
              <span style="font-size:20px">${icon}</span>
              <div style="flex:1"><strong style="font-size:13px">${name}</strong><div style="font-size:11px;color:var(--text2)">${desc}</div></div>
              <span class="badge ${stepTypeBadge(name)}">${name}</span>
            </div>
          `)}
        </div>
      </div>

      <div class="card">
        <h3 style="margin-bottom:12px">📋 Workflows (${workflows.length})</h3>
        ${loading ? html`<div style="text-align:center;padding:20px;color:var(--text2)">Loading...</div>` : html`
          <div style="display:grid;gap:8px">
            ${workflows.map(wf => html`<div key=${wf.id} style="padding:12px;background:var(--bg2);border-radius:8px;border:1px solid ${selectedWf===wf.id?'var(--accent)':'var(--border)'};cursor:pointer" onClick=${()=>setSelectedWf(selectedWf===wf.id?null:wf.id)}>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <div style="display:flex;align-items:center;gap:6px">
                  <strong style="font-size:14px">${wf.name}</strong>
                  ${wf.builtin ? html`<span class="badge" style="font-size:9px;opacity:0.6">built-in</span>` : html`<span class="badge badge-green" style="font-size:9px">custom</span>`}
                </div>
                <div style="display:flex;gap:4px;align-items:center">
                  ${(wf.tags||[]).map(tag=>html`<span key=${tag} class="badge" style="font-size:10px">${tag}</span>`)}
                  <button class="btn btn-outline btn-sm" onClick=${(e)=>{e.stopPropagation();setShowRunInput(wf);setRunInput('');}} title="Chạy" disabled=${!!running}>▶</button>
                  ${!wf.builtin && html`<button class="btn btn-outline btn-sm" onClick=${(e)=>{e.stopPropagation();openEdit(wf);}} title="Sửa">✏️</button>`}
                  ${!wf.builtin && html`<button class="btn btn-outline btn-sm" style="color:var(--red)" onClick=${(e)=>{e.stopPropagation();deleteWorkflow(wf);}} title="Xoá">🗑️</button>`}
                </div>
              </div>
              <div style="font-size:12px;color:var(--text2);margin-bottom:8px">${wf.description}</div>
              ${selectedWf===wf.id && html`<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
                ${(wf.steps||[]).map((s,i)=>html`<div key=${i} style="display:flex;align-items:center;gap:4px;padding:4px 8px;background:var(--bg);border-radius:4px;font-size:11px">
                  <span>${stepTypeIcon(s.type)}</span>
                  <strong>${s.name}</strong>
                  <span style="color:var(--text2)">→ ${s.agent_role}</span>
                  ${i<wf.steps.length-1?html`<span style="margin-left:4px">→</span>`:''}
                </div>`)}
              </div>`}
            </div>`)}
          </div>
        `}
      </div>
    </div>
  </div>`;
}


export { WorkflowsPage };
