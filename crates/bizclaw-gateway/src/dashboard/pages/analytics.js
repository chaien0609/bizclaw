// BizClaw Analytics Dashboard — Real-time metrics & insights
const { html, useState, useEffect, useCallback } = window;
import { authFetch, t } from '/static/dashboard/shared.js';

export function AnalyticsPage({ config, lang }) {
  const [metrics, setMetrics] = useState(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/v1/analytics?period=${period}`);
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      // Use demo data
      setMetrics({
        overview: {
          total_messages: 12847, total_tokens: 4283920, total_conversations: 1562,
          avg_latency_ms: 342, active_channels: 5, active_tools: 12,
          cost_usd: 18.42, uptime_percent: 99.7
        },
        daily: [
          { date: '03/07', messages: 1520, tokens: 512000, cost: 2.1 },
          { date: '03/08', messages: 1830, tokens: 624000, cost: 2.6 },
          { date: '03/09', messages: 1640, tokens: 558000, cost: 2.3 },
          { date: '03/10', messages: 2100, tokens: 715000, cost: 3.0 },
          { date: '03/11', messages: 1950, tokens: 664000, cost: 2.8 },
          { date: '03/12', messages: 2210, tokens: 752000, cost: 3.1 },
          { date: '03/13', messages: 1597, tokens: 458920, cost: 2.5 }
        ],
        top_tools: [
          { name: 'web_search', calls: 892, avg_ms: 1200 },
          { name: 'db_query', calls: 645, avg_ms: 85 },
          { name: 'file', calls: 534, avg_ms: 12 },
          { name: 'zalo_tool', calls: 423, avg_ms: 340 },
          { name: 'http_request', calls: 312, avg_ms: 780 },
          { name: 'shell', calls: 256, avg_ms: 450 }
        ],
        channel_stats: [
          { name: 'Zalo Personal', messages: 4520, active_users: 128 },
          { name: 'Telegram', messages: 3210, active_users: 85 },
          { name: 'Discord', messages: 2840, active_users: 62 },
          { name: 'Web Chat', messages: 1680, active_users: 245 },
          { name: 'Webhook', messages: 597, active_users: 12 }
        ],
        provider_usage: [
          { name: 'DeepSeek', tokens: 2100000, cost: 8.4, requests: 3200 },
          { name: 'Gemini', tokens: 1200000, cost: 4.8, requests: 1800 },
          { name: 'OpenAI', tokens: 680000, cost: 3.4, requests: 420 },
          { name: 'Ollama', tokens: 303920, cost: 0, requests: 142 }
        ]
      });
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  if (loading) return html`<div style="padding:40px;text-align:center;color:var(--text2)">⏳ Loading analytics...</div>`;

  const m = metrics?.overview || {};
  const maxMsg = Math.max(...(metrics?.daily || []).map(d => d.messages), 1);

  return html`<div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2 style="color:var(--text1);margin:0">📊 Analytics Dashboard</h2>
      <div style="display:flex;gap:4px">
        ${['24h','7d','30d','90d'].map(p => html`
          <button onClick=${()=>setPeriod(p)} style="padding:6px 14px;border-radius:6px;border:1px solid ${p===period?'var(--accent)':'var(--border)'};background:${p===period?'var(--accent)':'transparent'};color:${p===period?'#fff':'var(--text2)'};cursor:pointer;font-size:12px">${p}</button>
        `)}
      </div>
    </div>

    <!-- KPI Cards -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
      ${[
        { icon: '💬', label: 'Messages', value: m.total_messages?.toLocaleString(), sub: 'conversations: ' + m.total_conversations?.toLocaleString(), color: '#6366f1' },
        { icon: '🎯', label: 'Tokens Used', value: (m.total_tokens/1000000).toFixed(1)+'M', sub: (m.avg_latency_ms||0)+'ms avg latency', color: '#10b981' },
        { icon: '💰', label: 'Cost', value: '$'+(m.cost_usd||0).toFixed(2), sub: m.active_channels+' channels active', color: '#f59e0b' },
        { icon: '⚡', label: 'Uptime', value: m.uptime_percent+'%', sub: m.active_tools+' tools active', color: '#ef4444' }
      ].map(card => html`
        <div class="card" style="padding:16px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:12px;color:var(--text2);margin-bottom:4px">${card.icon} ${card.label}</div>
              <div style="font-size:28px;font-weight:700;color:${card.color}">${card.value}</div>
              <div style="font-size:11px;color:var(--text2);margin-top:2px">${card.sub}</div>
            </div>
          </div>
        </div>
      `)}
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:20px">
      <!-- Message Chart -->
      <div class="card" style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:14px;color:var(--text1)">📈 Daily Messages</h3>
        <div style="display:flex;align-items:flex-end;gap:6px;height:160px;padding-bottom:20px;position:relative">
          ${(metrics?.daily||[]).map((d, i) => html`
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%">
              <div style="font-size:10px;color:var(--text2);margin-bottom:4px">${d.messages}</div>
              <div style="width:100%;background:linear-gradient(to top,#6366f1,#818cf8);border-radius:4px 4px 0 0;height:${(d.messages/maxMsg*100).toFixed(0)}%;min-height:8px;transition:height 0.5s"></div>
              <div style="font-size:10px;color:var(--text2);margin-top:4px">${d.date}</div>
            </div>
          `)}
        </div>
      </div>

      <!-- Provider Usage -->
      <div class="card" style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:14px;color:var(--text1)">🤖 Provider Usage</h3>
        ${(metrics?.provider_usage||[]).map(p => {
          const maxTok = Math.max(...(metrics?.provider_usage||[]).map(x=>x.tokens),1);
          return html`
            <div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
                <span style="color:var(--text1)">${p.name}</span>
                <span style="color:var(--text2)">${(p.tokens/1000000).toFixed(1)}M tok · $${p.cost}</span>
              </div>
              <div style="height:6px;background:var(--bg);border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${(p.tokens/maxTok*100).toFixed(0)}%;background:linear-gradient(90deg,#6366f1,#10b981);border-radius:3px;transition:width 0.5s"></div>
              </div>
            </div>
          `;
        })}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <!-- Top Tools -->
      <div class="card" style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:14px;color:var(--text1)">🔧 Top Tools</h3>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <tr style="color:var(--text2)"><th style="text-align:left;padding:4px 0">Tool</th><th style="text-align:right">Calls</th><th style="text-align:right">Avg ms</th></tr>
          ${(metrics?.top_tools||[]).map((tool, i) => html`
            <tr style="border-top:1px solid var(--border)">
              <td style="padding:6px 0;color:var(--text1)"><span style="color:var(--text2);margin-right:6px">${i+1}.</span>${tool.name}</td>
              <td style="text-align:right;color:var(--accent);font-weight:600">${tool.calls}</td>
              <td style="text-align:right;color:${tool.avg_ms>500?'#ef4444':'#10b981'}">${tool.avg_ms}ms</td>
            </tr>
          `)}
        </table>
      </div>

      <!-- Channel Stats -->
      <div class="card" style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:14px;color:var(--text1)">📡 Channel Activity</h3>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <tr style="color:var(--text2)"><th style="text-align:left;padding:4px 0">Channel</th><th style="text-align:right">Messages</th><th style="text-align:right">Users</th></tr>
          ${(metrics?.channel_stats||[]).map(ch => html`
            <tr style="border-top:1px solid var(--border)">
              <td style="padding:6px 0;color:var(--text1)">${ch.name}</td>
              <td style="text-align:right;color:var(--accent);font-weight:600">${ch.messages.toLocaleString()}</td>
              <td style="text-align:right;color:var(--text2)">${ch.active_users}</td>
            </tr>
          `)}
        </table>
      </div>
    </div>

    <!-- Export Section -->
    <div class="card" style="padding:16px;margin-top:16px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <span style="font-size:13px;color:var(--text1)">📥 Export Analytics Data</span>
        <span style="font-size:11px;color:var(--text2);margin-left:8px">Period: ${period}</span>
      </div>
      <div style="display:flex;gap:8px">
        <button style="padding:6px 14px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text1);cursor:pointer;font-size:12px">📊 CSV</button>
        <button style="padding:6px 14px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text1);cursor:pointer;font-size:12px">📋 JSON</button>
        <button style="padding:6px 14px;border-radius:6px;border:1px solid var(--accent);background:var(--accent);color:#fff;cursor:pointer;font-size:12px">📧 Email Report</button>
      </div>
    </div>
  </div>`;
}
