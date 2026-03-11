// ActivityPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function ActivityPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    try {
      const res = await authFetch('/api/v1/activity');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) { console.error('Activity load:', e); }
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
    const timer = setInterval(loadEvents, 5000);
    return () => clearInterval(timer);
  }, []);

  const clearActivity = async () => {
    if(!confirm('Xoá tất cả activity?')) return;
    try {
      const r = await authFetch('/api/v1/activity', {method:'DELETE'});
      const d = await r.json();
      if(d.ok) { showToast('🗑️ Đã xoá '+(d.cleared||0)+' events','success'); setEvents([]); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const fmtTime = (t) => new Date(t).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const typeIcon = (t) => {
    if (t.includes('llm')) return '🤖';
    if (t.includes('tool')) return '🛠️';
    if (t.includes('scheduler')) return '⏰';
    if (t.includes('channel')) return '📨';
    return '⚡';
  };
  const typeBadge = (t) => {
    if (t.includes('error')) return 'badge-red';
    if (t.includes('completed')) return 'badge-green';
    if (t.includes('started')) return 'badge-yellow';
    return 'badge-blue';
  };

  return html`<div>
    <div class="page-header"><div>
      <h1>⚡ Activity Feed</h1>
      <div class="sub">Real-time system events (auto-refreshes every 5s)</div>
    </div>
      <button class="btn btn-outline" style="color:var(--red);padding:8px 18px" onClick=${clearActivity}>🗑️ Xoá Activity</button>
    </div>

    <div class="stats">
      <${StatsCard} label="Events" value=${events.length} color="accent" icon="⚡" />
    </div>

    <div class="card">
      <h3 style="margin-bottom:12px">📝 Event Log</h3>
      ${loading ? html`<div style="text-align:center;padding:20px;color:var(--text2)">Loading...</div>` : events.length === 0
        ? html`<div style="text-align:center;padding:40px;color:var(--text2)">
            <div style="font-size:48px;margin-bottom:12px">🌟</div>
            <p>No activity yet. Start a conversation or run a scheduled task!</p>
          </div>`
        : html`<div style="display:flex;flex-direction:column;gap:8px">
            ${events.map(ev => html`
              <div key=${ev.timestamp} style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
                <div style="font-size:20px">${typeIcon(ev.event_type)}</div>
                <div style="flex:1">
                  <div style="display:flex;align-items:center;gap:8px">
                    <span class="badge ${typeBadge(ev.event_type)}">${ev.event_type}</span>
                    <span style="color:var(--text2);font-size:12px">${ev.agent}</span>
                  </div>
                  <div style="font-size:13px;margin-top:4px">${ev.detail}</div>
                </div>
                <div style="font-family:var(--mono);font-size:11px;color:var(--text2)">${fmtTime(ev.timestamp)}</div>
              </div>
            `)}
          </div>`
      }
    </div>
  </div>`;
}


export { ActivityPage };
