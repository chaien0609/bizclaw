// DashboardPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function DashboardPage({ config, lang }) {
  const [clock, setClock] = useState('--:--:--');
  const [dateStr, setDateStr] = useState('');
  const [sysInfo, setSysInfo] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  // Fetch system info from /api/v1/info
  useEffect(() => {
    (async () => {
      try {
        const r = await authFetch('/api/v1/info');
        const d = await r.json();
        setSysInfo(d);
      } catch (e) { console.warn('Info fetch:', e); }
    })();
  }, []);

  const provider = sysInfo.default_provider || config?.default_provider || '—';
  const model = config?.default_model || sysInfo.default_model || '—';
  const version = sysInfo.version || config?.version || '—';
  
  // Format uptime from seconds
  const uptimeSecs = sysInfo.uptime_secs || 0;
  const uptimeStr = uptimeSecs > 0
    ? (uptimeSecs >= 3600 ? Math.floor(uptimeSecs/3600) + 'h ' : '') + Math.floor((uptimeSecs%3600)/60) + 'm ' + (uptimeSecs%60) + 's'
    : '—';
  
  // Parse platform "macos/aarch64" → os + arch
  const [osName, archName] = (sysInfo.platform || '').split('/');

  return html`<div>
    <div class="page-header"><div>
      <h1>${t('dash.title', lang)}</h1>
      <div class="sub">${t('dash.subtitle', lang)}</div>
    </div></div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:16px">
      <${StatsCard} label=${t('dash.clock', lang)} value=${clock} color="accent" sub=${dateStr} icon="⏰" />
      <${StatsCard} label=${t('dash.uptime', lang)} value=${uptimeStr} color="green" sub=${t('dash.status', lang)} />
      <${StatsCard} label=${t('dash.provider', lang)} value=${provider} color="blue" sub=${model} />
      <${StatsCard} label=${t('dash.version', lang)} value=${version} color="accent" />
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div class="card-label" style="margin:0">🖥️ ${t('dash.system', lang)}</div>
          <span class="badge badge-green">● ${t('dash.online', lang)}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
          <div><span style="color:var(--text2)">${t('sys.os', lang)}</span> ${osName || '—'}</div>
          <div><span style="color:var(--text2)">${t('sys.arch', lang)}</span> ${archName || '—'}</div>
          <div><span style="color:var(--text2)">SIMD:</span> <span style="color:var(--accent2)">${archName === 'aarch64' ? 'NEON' : archName === 'x86_64' ? 'AVX2' : '—'}</span></div>
          <div><span style="color:var(--text2)">${t('sys.memory', lang)}</span> ${sysInfo.memory || '—'}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-label" style="margin-bottom:10px">⚡ ${t('dash.quickactions', lang)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${['chat', 'settings', 'channels', 'knowledge', 'configfile'].map(p => html`
            <button class="btn btn-outline btn-sm" key=${p}
              onClick=${() => window._navigate && window._navigate(p)}>
              ${PAGES.find(x => x.id === p)?.icon || ''} ${t(PAGES.find(x => x.id === p)?.label || p, lang)}
            </button>
          `)}
        </div>
      </div>
    </div>
  </div>`;
}


export { DashboardPage };
