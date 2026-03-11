// TracesPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function TracesPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [traces, setTraces] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await authFetch('/api/v1/traces');
      const data = await res.json();
      setTraces(data.traces || []);
      setStats(data.stats || {});
    } catch (e) { console.error('Traces load:', e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const clearTraces = async () => {
    if(!confirm('Xoá tất cả traces?')) return;
    try {
      const r = await authFetch('/api/v1/traces', {method:'DELETE'});
      const d = await r.json();
      if(d.ok) { showToast('🗑️ Đã xoá '+d.cleared+' traces','success'); setTraces([]); setStats({}); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const fmtLatency = (ms) => ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(1) + 's';
  const fmtCost = (c) => c < 0.001 ? '<$0.001' : '$' + c.toFixed(4);
  const fmtTime = (t) => new Date(t).toLocaleTimeString('en-US', { hour12: false });

  return html`<div>
    <div class="page-header"><div>
      <h1>📊 LLM Traces</h1>
      <div class="sub">Monitor every LLM call — tokens, latency, cost</div>
    </div>
      <button class="btn btn-outline" style="color:var(--red);padding:8px 18px" onClick=${clearTraces}>🗑️ Xoá Traces</button>
    </div>

    <div class="stats">
      <${StatsCard} label="Total Calls" value=${stats.total_calls || 0} color="accent" />
      <${StatsCard} label="Total Tokens" value=${(stats.total_tokens || 0).toLocaleString()} color="blue" />
      <${StatsCard} label="Avg Latency" value=${fmtLatency(stats.avg_latency_ms || 0)} color="green" />
      <${StatsCard} label="Total Cost" value=${fmtCost(stats.total_cost_usd || 0)} color="orange" />
      <${StatsCard} label="Cache Hit" value=${((stats.cache_hit_rate || 0) * 100).toFixed(0) + '%'} color="accent" />
    </div>

    <div class="card">
      <h3 style="margin-bottom:12px">📈 Recent Traces (${traces.length})</h3>
      ${loading ? html`<div style="text-align:center;padding:20px;color:var(--text2)">Loading...</div>` : html`
        <table>
          <thead><tr>
            <th>Time</th><th>Model</th><th>Prompt</th><th>Completion</th><th>Total</th>
            <th>Latency</th><th>Cost</th><th>Cache</th><th>Status</th>
          </tr></thead>
          <tbody>
            ${traces.map(t => html`<tr key=${t.id}>
              <td style="font-family:var(--mono);font-size:12px">${fmtTime(t.timestamp)}</td>
              <td><span class="badge badge-blue">${t.model}</span></td>
              <td style="font-family:var(--mono);font-size:12px">${t.prompt_tokens}</td>
              <td style="font-family:var(--mono);font-size:12px">${t.completion_tokens}</td>
              <td style="font-family:var(--mono);font-size:12px;font-weight:600">${t.total_tokens}</td>
              <td style="font-family:var(--mono);font-size:12px">${fmtLatency(t.latency_ms)}</td>
              <td style="font-family:var(--mono);font-size:12px;color:var(--orange)">${fmtCost(t.cost_usd)}</td>
              <td>${t.cache_hit ? '✅' : '➖'}</td>
              <td><span class="badge ${t.status === 'ok' ? 'badge-green' : 'badge-red'}">${t.status}</span></td>
            </tr>`)}
          </tbody>
        </table>
      `}
    </div>
  </div>`;
}


export { TracesPage };
