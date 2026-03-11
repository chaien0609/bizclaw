// UsagePage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function UsagePage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [data, setData] = useState(null);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editLimits, setEditLimits] = useState(false);
  const [limitsForm, setLimitsForm] = useState({});

  const load = async () => {
    try {
      const [r1, r2] = await Promise.all([
        authFetch('/api/v1/usage'),
        authFetch('/api/v1/usage/daily?days=30')
      ]);
      const d1 = await r1.json();
      const d2 = await r2.json();
      setData(d1);
      setDaily(d2.data || []);
      if(d1.limits) setLimitsForm(d1.limits);
    } catch(e) {}
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const saveLimits = async () => {
    try {
      const r = await authFetch('/api/v1/usage/limits', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(limitsForm)});
      const d = await r.json();
      if(d.ok) { showToast('✅ Limits đã cập nhật','success'); setEditLimits(false); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  if(loading) return html`<div class="card" style="text-align:center;padding:40px;color:var(--text2)">Loading...</div>`;

  const usage = data?.usage || {};
  const limits = data?.limits || {};
  const rt = data?.realtime || {};

  const quotaBar = (label, icon, current, max, unit) => {
    const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
    const color = pct >= 90 ? 'var(--red)' : pct >= 70 ? '#f59e0b' : 'var(--green)';
    return html`<div style="padding:12px 16px;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-weight:600;font-size:13px">${icon} ${label}</span>
        <span style="font-size:12px;color:var(--text2)">${Math.round(current).toLocaleString()} / ${max.toLocaleString()} ${unit}</span>
      </div>
      <div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width .5s ease"></div>
      </div>
      <div style="text-align:right;font-size:10px;color:${color};margin-top:2px">${pct.toFixed(1)}%</div>
    </div>`;
  };

  const inp = 'padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg2);color:var(--text);width:100%';

  return html`<div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div><h1 style="margin:0">📊 Usage & Quotas</h1><div class="sub">Theo dõi mức sử dụng và giới hạn plan</div></div>
      <button class="btn btn-outline" style="padding:8px 16px" onClick=${()=>load()}>🔄 Refresh</button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px">
      <${StatsCard} label="Active Agents" value=${rt.active_agents||0} color="blue" />
      <${StatsCard} label="Tokens (Month)" value=${Math.round(usage.tokens_in||0 + (usage.tokens_out||0)).toLocaleString()} color="purple" />
      <${StatsCard} label="Requests (Month)" value=${Math.round(usage.requests||0).toLocaleString()} color="green" />
      <${StatsCard} label="Traces in Memory" value=${rt.traces_in_memory||0} color="blue" />
    </div>

    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0">📈 Quota Status</h3>
        <button class="btn btn-outline btn-sm" onClick=${()=>setEditLimits(!editLimits)}>${editLimits?'✕ Đóng':'⚙️ Sửa Limits'}</button>
      </div>

      ${editLimits ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;max-width:600px">
        <label style="font-size:12px">Max Agents<input type="number" style="${inp}" value=${limitsForm.max_agents||10} onInput=${e=>setLimitsForm(f=>({...f,max_agents:+e.target.value}))} /></label>
        <label style="font-size:12px">Max Channels<input type="number" style="${inp}" value=${limitsForm.max_channels||5} onInput=${e=>setLimitsForm(f=>({...f,max_channels:+e.target.value}))} /></label>
        <label style="font-size:12px">Max Tokens/Month<input type="number" style="${inp}" value=${limitsForm.max_tokens_month||1000000} onInput=${e=>setLimitsForm(f=>({...f,max_tokens_month:+e.target.value}))} /></label>
        <label style="font-size:12px">Max Storage (MB)<input type="number" style="${inp}" value=${limitsForm.max_storage_mb||1024} onInput=${e=>setLimitsForm(f=>({...f,max_storage_mb:+e.target.value}))} /></label>
        <label style="font-size:12px">Max API Keys<input type="number" style="${inp}" value=${limitsForm.max_api_keys||10} onInput=${e=>setLimitsForm(f=>({...f,max_api_keys:+e.target.value}))} /></label>
        <label style="font-size:12px">Max MCP Servers<input type="number" style="${inp}" value=${limitsForm.max_mcp_servers||5} onInput=${e=>setLimitsForm(f=>({...f,max_mcp_servers:+e.target.value}))} /></label>
        <div><button class="btn" style="background:var(--grad1);color:#fff;padding:6px 16px" onClick=${saveLimits}>💾 Lưu Limits</button></div>
      </div>` : ''}

      <div style="display:grid;gap:8px">
        ${quotaBar('Agents', '🤖', rt.active_agents||0, limits.max_agents||10, '')}
        ${quotaBar('Tokens tháng này', '🔤', (usage.tokens_in||0)+(usage.tokens_out||0), limits.max_tokens_month||1000000, 'tokens')}
        ${quotaBar('Requests tháng này', '📡', usage.requests||0, limits.max_tokens_month ? limits.max_tokens_month/100 : 10000, '')}
        ${quotaBar('API Keys', '🔑', usage.api_keys_created||0, limits.max_api_keys||10, '')}
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top:0">📅 Usage hàng ngày (30 ngày gần nhất)</h3>
      ${daily.length===0 ? html`<div style="text-align:center;padding:20px;color:var(--text2)">Chưa có dữ liệu usage. Dữ liệu sẽ được ghi nhận khi có requests.</div>`
      : html`<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="border-bottom:2px solid var(--border)">
          <th style="text-align:left;padding:8px">Ngày</th>
          <th style="text-align:left;padding:8px">Metric</th>
          <th style="text-align:right;padding:8px">Giá trị</th>
        </tr></thead>
        <tbody>${daily.slice(-30).map(d=>html`<tr key=${d.date+d.metric} style="border-bottom:1px solid var(--border)">
          <td style="padding:6px 8px;font-family:var(--mono)">${d.date}</td>
          <td style="padding:6px 8px"><span class="badge badge-blue" style="font-size:10px">${d.metric}</span></td>
          <td style="padding:6px 8px;text-align:right;font-family:var(--mono)">${Math.round(d.value).toLocaleString()}</td>
        </tr>`)}</tbody>
      </table></div>`}
    </div>
  </div>`;
}


export { UsagePage };
