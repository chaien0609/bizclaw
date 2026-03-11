// CostPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function CostPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [breakdown, setBreakdown] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await authFetch('/api/v1/traces/cost');
      const data = await res.json();
      setBreakdown(data.breakdown || []);
      setTotal(data.total_cost_usd || 0);
    } catch (e) { console.error('Cost load:', e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const clearCost = async () => {
    if(!confirm('Xoá dữ liệu cost?')) return;
    try {
      const r = await authFetch('/api/v1/traces', {method:'DELETE'});
      const d = await r.json();
      if(d.ok) { showToast('🗑️ Đã reset cost data','success'); setBreakdown([]); setTotal(0); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const fmtCost = (c) => c < 0.001 ? '<$0.001' : '$' + c.toFixed(4);
  const sorted = [...breakdown].sort((a, b) => b.cost_usd - a.cost_usd);

  return html`<div>
    <div class="page-header"><div>
      <h1>💰 Cost Tracking</h1>
      <div class="sub">LLM cost breakdown by model (session)</div>
    </div>
      <button class="btn btn-outline" style="color:var(--red);padding:8px 18px" onClick=${clearCost}>🗑️ Reset Cost</button>
    </div>

    <div class="stats">
      <${StatsCard} label="Total Cost" value=${fmtCost(total)} color="orange" icon="💰" />
      <${StatsCard} label="Models Used" value=${breakdown.length} color="blue" icon="🤖" />
      <${StatsCard} label="Total Calls" value=${breakdown.reduce((s, b) => s + b.calls, 0)} color="accent" icon="📞" />
    </div>

    <div class="card">
      <h3 style="margin-bottom:12px">📊 Cost by Model</h3>
      ${loading ? html`<div style="text-align:center;padding:20px;color:var(--text2)">Loading...</div>` : html`
        <table>
          <thead><tr><th>Model</th><th>Calls</th><th>Tokens</th><th>Cost</th><th>% of Total</th></tr></thead>
          <tbody>
            ${sorted.map(b => html`<tr key=${b.model}>
              <td><span class="badge badge-blue">${b.model}</span></td>
              <td style="font-family:var(--mono)">${b.calls}</td>
              <td style="font-family:var(--mono)">${(b.total_tokens || 0).toLocaleString()}</td>
              <td style="font-family:var(--mono);color:var(--orange);font-weight:600">${fmtCost(b.cost_usd)}</td>
              <td>
                <div style="background:var(--bg2);border-radius:4px;height:16px;overflow:hidden">
                  <div style="background:var(--grad1);height:100%;width:${total > 0 ? (b.cost_usd / total * 100) : 0}%;border-radius:4px"></div>
                </div>
              </td>
            </tr>`)}
          </tbody>
        </table>
      `}
    </div>
  </div>`;
}


export { CostPage };
