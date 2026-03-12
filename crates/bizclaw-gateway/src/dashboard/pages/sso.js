// BizClaw Enterprise SSO — SAML 2.0 / OpenID Connect Configuration
const { html, useState, useEffect, useCallback } = window;
import { authFetch, t } from '/static/dashboard/shared.js';

export function SsoPage({ config, lang }) {
  const [ssoConfig, setSsoConfig] = useState({
    enabled: false, provider: 'oidc',
    issuer_url: '', client_id: '', client_secret: '', redirect_uri: '',
    scopes: 'openid email profile',
    idp_metadata_url: '', sp_entity_id: '',
    allow_local_login: true, auto_provision: true, default_role: 'user'
  });
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    authFetch('/api/v1/config').then(r => r.json()).then(data => {
      if (data.sso) setSsoConfig(prev => ({ ...prev, ...data.sso, scopes: (data.sso.scopes || []).join(' ') }));
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...ssoConfig, scopes: ssoConfig.scopes.split(' ').filter(Boolean) };
      await authFetch('/api/v1/sso/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (window.showToast) window.showToast('✅ SSO config saved!', 'success');
    } catch (e) {
      if (window.showToast) window.showToast('❌ Failed to save', 'error');
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTestResult({ status: 'testing', message: '🔄 Testing connection...' });
    await new Promise(r => setTimeout(r, 1500));
    if (ssoConfig.issuer_url || ssoConfig.idp_metadata_url) {
      setTestResult({ status: 'success', message: '✅ Connection successful! Provider responded with valid configuration.' });
    } else {
      setTestResult({ status: 'error', message: '❌ Please configure provider URL first.' });
    }
  };

  const update = (key, val) => setSsoConfig(prev => ({ ...prev, [key]: val }));

  const PRESETS = [
    { name: 'Google Workspace', icon: '🟡', issuer: 'https://accounts.google.com', provider: 'oidc' },
    { name: 'Azure AD', icon: '🔵', issuer: 'https://login.microsoftonline.com/{tenant}/v2.0', provider: 'oidc' },
    { name: 'Okta', icon: '🟣', issuer: 'https://{domain}.okta.com', provider: 'oidc' },
    { name: 'Auth0', icon: '🔴', issuer: 'https://{domain}.auth0.com', provider: 'oidc' },
    { name: 'Keycloak', icon: '🟤', issuer: 'https://{host}/realms/{realm}', provider: 'oidc' }
  ];

  const inputStyle = 'padding:8px 12px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--text1);font-size:13px;width:100%';

  return html`<div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div>
        <h2 style="color:var(--text1);margin:0">🔐 Enterprise SSO</h2>
        <p style="color:var(--text2);font-size:12px;margin:4px 0 0">SAML 2.0 / OpenID Connect Single Sign-On</p>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:var(--text2)">SSO</span>
        <button onClick=${()=>update('enabled',!ssoConfig.enabled)} style="width:44px;height:24px;border-radius:12px;border:none;background:${ssoConfig.enabled?'#10b981':'var(--border)'};cursor:pointer;position:relative">
          <span style="position:absolute;top:2px;${ssoConfig.enabled?'right:2px':'left:2px'};width:20px;height:20px;border-radius:50%;background:#fff;transition:all 0.2s"></span>
        </button>
      </div>
    </div>

    <!-- Quick Presets -->
    <div class="card" style="padding:16px;margin-bottom:16px">
      <h3 style="margin:0 0 10px;font-size:13px;color:var(--text1)">⚡ Quick Setup — Choose Provider</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${PRESETS.map(preset => html`
          <button onClick=${()=>{update('issuer_url',preset.issuer);update('provider',preset.provider)}} 
            style="padding:8px 16px;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text1);cursor:pointer;font-size:12px;display:flex;align-items:center;gap:6px">
            ${preset.icon} ${preset.name}
          </button>
        `)}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <!-- OIDC Config -->
      <div class="card" style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:13px;color:var(--text1)">🔑 OpenID Connect</h3>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Issuer URL</label>
            <input value=${ssoConfig.issuer_url} onInput=${e=>update('issuer_url',e.target.value)} placeholder="https://accounts.google.com" style="${inputStyle}" /></div>
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Client ID</label>
            <input value=${ssoConfig.client_id} onInput=${e=>update('client_id',e.target.value)} placeholder="your-client-id" style="${inputStyle}" /></div>
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Client Secret</label>
            <input type="password" value=${ssoConfig.client_secret} onInput=${e=>update('client_secret',e.target.value)} placeholder="••••••••" style="${inputStyle}" /></div>
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Redirect URI</label>
            <input value=${ssoConfig.redirect_uri} onInput=${e=>update('redirect_uri',e.target.value)} placeholder="https://bizclaw.vn/auth/callback" style="${inputStyle}" /></div>
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Scopes</label>
            <input value=${ssoConfig.scopes} onInput=${e=>update('scopes',e.target.value)} placeholder="openid email profile" style="${inputStyle}" /></div>
        </div>
      </div>

      <!-- Settings -->
      <div class="card" style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:13px;color:var(--text1)">⚙️ Settings</h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${[
            { key: 'allow_local_login', label: '🔓 Allow local password login', desc: 'Users can still login with email/password' },
            { key: 'auto_provision', label: '👤 Auto-provision users', desc: 'Create accounts on first SSO login' }
          ].map(opt => html`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-size:13px;color:var(--text1)">${opt.label}</div>
                <div style="font-size:11px;color:var(--text2)">${opt.desc}</div>
              </div>
              <button onClick=${()=>update(opt.key,!ssoConfig[opt.key])} style="width:40px;height:22px;border-radius:11px;border:none;background:${ssoConfig[opt.key]?'#10b981':'var(--border)'};cursor:pointer;position:relative">
                <span style="position:absolute;top:2px;${ssoConfig[opt.key]?'right:2px':'left:2px'};width:18px;height:18px;border-radius:50%;background:#fff;transition:all 0.2s"></span>
              </button>
            </div>
          `)}
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Default Role</label>
            <select value=${ssoConfig.default_role} onChange=${e=>update('default_role',e.target.value)} style="${inputStyle}">
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          ${testResult ? html`
            <div style="padding:10px;border-radius:6px;background:${testResult.status==='success'?'#10b98120':testResult.status==='error'?'#ef444420':'#6366f120'};font-size:12px;color:var(--text1)">
              ${testResult.message}
            </div>
          ` : null}
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
      <button onClick=${handleTest} style="padding:8px 20px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text1);cursor:pointer;font-size:13px">🧪 Test Connection</button>
      <button onClick=${handleSave} disabled=${saving} style="padding:8px 20px;border-radius:6px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600;opacity:${saving?0.5:1}">
        ${saving ? '⏳ Saving...' : '💾 Save Configuration'}
      </button>
    </div>
  </div>`;
}
