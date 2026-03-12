// BizClaw LLM Fine-Tuning Pipeline
const { html, useState, useEffect } = window;
import { authFetch } from '/static/dashboard/shared.js';

export function FineTuningPage({ config, lang }) {
  const [tab, setTab] = useState('overview');
  const [ftConfig, setFtConfig] = useState({ enabled:false, provider:'openai', base_model:'gpt-4o-mini-2024-07-18', epochs:3, lr:1.8, batch:4, auto_collect:false, min_rating:4, max_samples:10000 });
  const datasets = [
    { name:'customer_support_v1.jsonl', samples:2450, created:'2026-03-10', size:'4.2MB', status:'ready' },
    { name:'sales_conversations.jsonl', samples:1230, created:'2026-03-08', size:'2.1MB', status:'ready' },
    { name:'technical_qa.jsonl', samples:890, created:'2026-03-05', size:'1.5MB', status:'collecting' }
  ];
  const jobs = [
    { id:'ft-abc123', model:'gpt-4o-mini', dataset:'customer_support_v1.jsonl', status:'completed', progress:100, cost:'$2.50', created:'2026-03-11' },
    { id:'ft-def456', model:'gpt-4o-mini', dataset:'sales_conversations.jsonl', status:'running', progress:67, cost:'~$1.80', created:'2026-03-12' }
  ];
  const u = (k,v) => setFtConfig(p=>({...p,[k]:v}));
  const iS = 'padding:8px 12px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--text1);font-size:13px;width:100%';

  return html`<div>
    <h2 style="color:var(--text1);margin:0 0 4px">🧪 LLM Fine-Tuning Pipeline</h2>
    <p style="color:var(--text2);font-size:12px;margin:0 0 16px">Train custom models from your conversations</p>
    <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:8px">
      ${[['overview','📊 Overview'],['datasets','📁 Datasets'],['training','🏋️ Jobs'],['config','⚙️ Config']].map(([id,l])=>html`
        <button onClick=${()=>setTab(id)} style="padding:8px 16px;border-radius:6px 6px 0 0;border:none;background:${id===tab?'var(--accent)':'transparent'};color:${id===tab?'#fff':'var(--text2)'};cursor:pointer;font-size:13px">${l}</button>`)}
    </div>
    ${tab==='overview'?html`
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        ${[{i:'📁',l:'Datasets',v:3,c:'#6366f1'},{i:'📝',l:'Samples',v:'4,570',c:'#10b981'},{i:'🏋️',l:'Jobs',v:2,c:'#f59e0b'},{i:'✅',l:'Trained',v:1,c:'#ef4444'}].map(x=>html`
          <div class="card" style="padding:16px;text-align:center">
            <div style="font-size:24px">${x.i}</div>
            <div style="font-size:28px;font-weight:700;color:${x.c}">${x.v}</div>
            <div style="font-size:11px;color:var(--text2)">${x.l}</div>
          </div>`)}
      </div>
      <div class="card" style="padding:20px">
        <h3 style="margin:0 0 12px;font-size:14px;color:var(--text1)">🔄 Pipeline Flow</h3>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:20px;flex-wrap:wrap">
          ${['💬 Conversations','→','📊 Rating ≥ 4','→','📁 Dataset','→','🏋️ Fine-Tune','→','🤖 Custom Model'].map((s,i)=>
            i%2===0?html`<div style="padding:10px 14px;border-radius:8px;background:var(--surface);border:1px solid var(--border);font-size:12px;color:var(--text1)">${s}</div>`
            :html`<span style="font-size:20px;color:var(--accent)">→</span>`)}
        </div>
      </div>`:null}
    ${tab==='datasets'?html`
      <div class="card" style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:14px;color:var(--text1)">📁 Datasets</h3>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <tr style="color:var(--text2)"><th style="text-align:left;padding:8px 0">Name</th><th>Samples</th><th>Size</th><th>Status</th></tr>
          ${datasets.map(d=>html`<tr style="border-top:1px solid var(--border)">
            <td style="padding:8px 0;color:var(--text1)">📄 ${d.name}</td>
            <td style="text-align:center;color:var(--accent)">${d.samples}</td>
            <td style="text-align:center;color:var(--text2)">${d.size}</td>
            <td style="text-align:center"><span style="padding:2px 8px;border-radius:4px;font-size:10px;background:${d.status==='ready'?'#10b98120':'#f59e0b20'};color:${d.status==='ready'?'#10b981':'#f59e0b'}">${d.status}</span></td>
          </tr>`)}
        </table>
      </div>`:null}
    ${tab==='training'?html`
      <div class="card" style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:14px;color:var(--text1)">🏋️ Training Jobs</h3>
        ${jobs.map(j=>html`<div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-weight:600;color:var(--text1)">${j.id} <span style="font-size:11px;color:var(--text2)">${j.model}</span></span>
            <span style="padding:3px 10px;border-radius:4px;font-size:10px;font-weight:600;background:${j.status==='completed'?'#10b98120':'#6366f120'};color:${j.status==='completed'?'#10b981':'#6366f1'}">${j.status}</span>
          </div>
          <div style="height:6px;background:var(--bg);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${j.progress}%;background:linear-gradient(90deg,#6366f1,#10b981);border-radius:3px"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--text2)"><span>${j.progress}%</span><span>${j.cost}</span></div>
        </div>`)}
      </div>`:null}
    ${tab==='config'?html`
      <div class="card" style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:13px;color:var(--text1)">⚙️ Training Config</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Provider</label><select value=${ftConfig.provider} onChange=${e=>u('provider',e.target.value)} style="${iS}"><option>openai</option><option>together</option><option>fireworks</option></select></div>
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Base Model</label><input value=${ftConfig.base_model} onInput=${e=>u('base_model',e.target.value)} style="${iS}" /></div>
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Epochs</label><input type="number" value=${ftConfig.epochs} onInput=${e=>u('epochs',+e.target.value)} style="${iS}" /></div>
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Batch Size</label><input type="number" value=${ftConfig.batch} onInput=${e=>u('batch',+e.target.value)} style="${iS}" /></div>
        </div>
        <button style="margin-top:12px;padding:8px 20px;border-radius:6px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">💾 Save</button>
      </div>`:null}
  </div>`;
}
