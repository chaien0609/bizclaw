// ChannelsPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function ChannelsPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [channelData, setChannelData] = useState(null);
  const [apiChannels, setApiChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configCh, setConfigCh] = useState(null);
  const [chForm, setChForm] = useState({});
  const [zaloQr, setZaloQr] = useState(null);
  const [zaloLoading, setZaloLoading] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newChType, setNewChType] = useState('');
  const [newChName, setNewChName] = useState('');
  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';

  // Channel definitions with proper field mappings
  const channelDefs = [
    {name:'cli',icon:'💻',label:'CLI Terminal',type:'interactive',alwaysActive:true},
    {name:'telegram',icon:'📱',label:'Telegram Bot',type:'messaging',multi:true,
     fields:[{key:'bot_token',label:'Bot Token',secret:true},{key:'allowed_chat_ids',label:'Allowed Chat IDs',placeholder:'-100123, 987654'}]},
    {name:'zalo',icon:'💙',label:'Zalo Personal',type:'messaging',hasQr:true,multi:true,
     fields:[{key:'cookie',label:'Cookie (từ chat.zalo.me)',secret:true,textarea:true},{key:'imei',label:'IMEI (Device ID)',placeholder:'Tự tạo nếu để trống'}]},
    {name:'discord',icon:'🎮',label:'Discord Bot',type:'messaging',multi:true,
     fields:[{key:'bot_token',label:'Bot Token',secret:true},{key:'allowed_channel_ids',label:'Allowed Channel IDs',placeholder:'123456, 789012'}]},
    {name:'email',icon:'📧',label:'Email (IMAP/SMTP)',type:'messaging',multi:true,
     fields:[{key:'smtp_host',label:'SMTP Host',placeholder:'smtp.gmail.com'},{key:'smtp_port',label:'SMTP Port',placeholder:'587'},
             {key:'smtp_user',label:'Email Address',placeholder:'bot@example.com'},{key:'smtp_pass',label:'App Password',secret:true},
             {key:'imap_host',label:'IMAP Host',placeholder:'imap.gmail.com'}]},
    {name:'whatsapp',icon:'💬',label:'WhatsApp Business',type:'messaging',
     fields:[{key:'phone_number_id',label:'Phone Number ID'},{key:'access_token',label:'Access Token',secret:true},{key:'business_id',label:'Business ID'}]},
    {name:'webhook',icon:'🌐',label:'Webhook',type:'api',multi:true,
     fields:[{key:'webhook_url',label:'Outbound URL',placeholder:'https://example.com/webhook'},{key:'webhook_secret',label:'Secret',secret:true}]},
  ];

  const load = async () => {
    try {
      // Load both config and channel list
      const [cfgRes, chRes] = await Promise.all([
        authFetch('/api/v1/config'),
        authFetch('/api/v1/channels'),
      ]);
      const cfgData = await cfgRes.json();
      const chData = await chRes.json();
      setChannelData(cfgData.channels || {});
      setApiChannels(chData.channels || []);
    } catch(e) {
      console.error('Channels load:', e);
      setChannelData({});
      setApiChannels([]);
    }
    setLoading(false);
  };
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 8000);
    load().finally(() => clearTimeout(t));
    return () => clearTimeout(t);
  }, []);

  // Build a merged list of channel instances (from API + config)
  const getChannelInstances = () => {
    const instances = [];
    // Always add CLI
    instances.push({ key: 'cli', name: 'cli', type: 'cli', defName: 'cli', label: 'CLI Terminal', icon: '💻', status: 'active', channelType: 'interactive' });
    // From API channels
    for (const ac of apiChannels) {
      const def = channelDefs.find(d => d.name === ac.channel_type || d.name === ac.name);
      if (def && def.name !== 'cli') {
        instances.push({
          key: ac.id || ac.name,
          name: ac.display_name || ac.name || def.label,
          type: def.name,
          defName: def.name,
          label: ac.display_name || def.label,
          icon: def.icon,
          status: ac.status || (ac.enabled ? 'active' : 'configured'),
          channelType: def.type,
          config: ac,
        });
      }
    }
    // From config data (if not already in API channels)
    for (const def of channelDefs) {
      if (def.name === 'cli') continue;
      const cfgCh = channelData?.[def.name];
      if (cfgCh && !instances.find(i => i.defName === def.name)) {
        instances.push({
          key: def.name,
          name: def.name,
          type: def.name,
          defName: def.name,
          label: cfgCh.display_name || def.label,
          icon: def.icon,
          status: cfgCh.enabled ? 'active' : 'configured',
          channelType: def.type,
          config: cfgCh,
        });
      }
    }
    // From config data — multi instances (telegram_2, zalo_shop, etc.)
    if (channelData) {
      for (const [k, v] of Object.entries(channelData)) {
        if (!instances.find(i => i.key === k)) {
          const baseType = k.replace(/_\d+$/, '').replace(/_[a-z]+$/, '');
          const def = channelDefs.find(d => d.name === baseType);
          if (def) {
            instances.push({
              key: k,
              name: k,
              type: def.name,
              defName: def.name,
              label: v.display_name || k,
              icon: def.icon,
              status: v.enabled ? 'active' : 'configured',
              channelType: def.type,
              config: v,
            });
          }
        }
      }
    }
    // Add unconfigured channel types at the bottom
    for (const def of channelDefs) {
      if (def.name === 'cli') continue;
      if (!instances.find(i => i.defName === def.name)) {
        instances.push({
          key: 'avail_' + def.name,
          name: def.name,
          type: def.name,
          defName: def.name,
          label: def.label,
          icon: def.icon,
          status: 'available',
          channelType: def.type,
        });
      }
    }
    return instances;
  };

  const openConfig = (inst) => {
    const def = channelDefs.find(d => d.name === inst.defName);
    if (!def || !def.fields) return;
    setConfigCh({ ...def, instanceKey: inst.key, instanceLabel: inst.label });
    setZaloQr(null);
    // Pre-fill form from config data
    const cfgCh = inst.config || channelData?.[inst.key] || channelData?.[inst.defName] || {};
    const f = { enabled: inst.status === 'active', display_name: inst.label || '' };
    (def.fields || []).forEach(fd => {
      f[fd.key] = cfgCh[fd.key] || '';
    });
    setChForm(f);
  };

  const saveChannelConfig = async () => {
    if(!configCh) return;
    try {
      const body = { channel_type: configCh.name, instance_key: configCh.instanceKey, enabled: chForm.enabled !== false, display_name: chForm.display_name, ...chForm };
      const r = await authFetch('/api/v1/channels/update', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify(body)
      });
      const d = await r.json();
      if(d.ok) { showToast('✅ Đã cấu hình '+configCh.instanceLabel,'success'); setConfigCh(null); load(); }
      else showToast('❌ '+(d.error||d.message||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const addNewChannel = async () => {
    if (!newChType) { showToast('⚠️ Chọn loại kênh','error'); return; }
    const def = channelDefs.find(d => d.name === newChType);
    if (!def) return;
    const instanceName = newChName.trim() || (newChType + '_' + Date.now().toString(36).slice(-4));
    // Open config form for the new instance
    setConfigCh({ ...def, instanceKey: instanceName, instanceLabel: (def.icon + ' ' + instanceName) });
    const f = { enabled: true, display_name: newChName.trim() || def.label };
    (def.fields || []).forEach(fd => { f[fd.key] = ''; });
    setChForm(f);
    setShowAddNew(false);
    setNewChType('');
    setNewChName('');
  };

  const loadZaloQr = async () => {
    setZaloLoading(true);
    try {
      const r = await authFetch('/api/v1/zalo/qr', { method: 'POST' });
      const d = await r.json();
      if(d.ok) { setZaloQr(d); if(d.imei) setChForm(f=>({...f,imei:d.imei})); }
      else showToast('❌ '+(d.error||'Không thể tạo QR'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
    setZaloLoading(false);
  };

  const statusBadge = s => {
    if(s==='active') return html`<span class="badge badge-green" style="font-size:11px">● Hoạt động</span>`;
    if(s==='configured') return html`<span class="badge badge-blue" style="font-size:11px">✓ Đã cấu hình</span>`;
    return html`<span class="badge" style="font-size:11px">○ Chưa kết nối</span>`;
  };

  if(loading) return html`<div class="card" style="text-align:center;padding:40px;color:var(--text2)">Đang tải kênh liên lạc...</div>`;

  const allInstances = getChannelInstances();
  const activeCount = allInstances.filter(i => i.status==='active').length;
  const configuredCount = allInstances.filter(i => i.status==='configured').length;
  const multiCapable = channelDefs.filter(d => d.multi);

  return html`<div>
    <div class="page-header"><div><h1>📱 ${t('channels.title',lang)}</h1><div class="sub">${t('channels.subtitle',lang)} — Hỗ trợ nhiều instance mỗi loại</div></div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${()=>setShowAddNew(!showAddNew)}>+ Thêm kênh</button>
    </div>
    <div class="stats">
      <${StatsCard} label="Tổng kênh" value=${allInstances.length} color="accent" icon="📱" />
      <${StatsCard} label="Hoạt động" value=${activeCount} color="green" icon="✅" />
      <${StatsCard} label="Đã cấu hình" value=${configuredCount} color="blue" icon="🔧" />
    </div>

    ${showAddNew && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>➕ Thêm kênh liên lạc mới</h3>
          <button class="btn btn-outline btn-sm" onClick=${()=>setShowAddNew(false)}>✕ Đóng</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <label>Loại kênh
            <select style="${inp};cursor:pointer" value=${newChType} onChange=${e=>setNewChType(e.target.value)}>
              <option value="">— Chọn loại kênh —</option>
              ${multiCapable.map(d => html`<option key=${d.name} value=${d.name}>${d.icon} ${d.label}</option>`)}
            </select>
          </label>
          <label>Tên hiển thị (tuỳ chọn)
            <input style="${inp}" value=${newChName} onInput=${e=>setNewChName(e.target.value)} placeholder="VD: Bot bán hàng, Zalo cá nhân 2..." />
          </label>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>setShowAddNew(false)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${addNewChannel}>➕ Tạo kênh</button>
        </div>
      </div>
    `}

    ${configCh && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="margin:0">${configCh.icon} Cấu hình ${configCh.instanceLabel}</h3>
          <button class="btn btn-outline btn-sm" onClick=${()=>setConfigCh(null)}>✕ Đóng</button>
        </div>

        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:10px;background:var(--bg2);border-radius:8px">
          <span style="font-size:13px">Kích hoạt kênh:</span>
          <div style="position:relative;width:44px;height:24px;background:${chForm.enabled?'var(--green)':'var(--bg3)'};border-radius:12px;cursor:pointer;transition:background 0.3s" onClick=${()=>setChForm(f=>({...f,enabled:!f.enabled}))}>
            <div style="position:absolute;top:2px;left:${chForm.enabled?'22px':'2px'};width:20px;height:20px;background:#fff;border-radius:50%;transition:left 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>
          </div>
          <span style="font-size:12px;color:${chForm.enabled?'var(--green)':'var(--text2)'}">${chForm.enabled?'Đang bật':'Đang tắt'}</span>
        </div>

        <div style="margin-bottom:10px">
          <label style="font-size:13px">Tên hiển thị
            <input style="${inp}" value=${chForm.display_name||''} onInput=${e=>setChForm(f=>({...f,display_name:e.target.value}))} placeholder="Tên tuỳ chỉnh cho kênh này" />
          </label>
        </div>

        ${configCh.hasQr && html`
          <div style="margin-bottom:14px;padding:12px;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <strong style="font-size:13px">📱 Đăng nhập Zalo bằng QR</strong>
              <button class="btn" style="background:var(--grad1);color:#fff;padding:4px 12px;font-size:12px" onClick=${loadZaloQr} disabled=${zaloLoading}>${zaloLoading?'Đang tạo...':'🔲 Quét QR'}</button>
            </div>
            ${zaloQr && html`
              <div style="text-align:center;padding:10px">
                ${zaloQr.qr_code ? html`<img src="${zaloQr.qr_code.startsWith('data:') ? zaloQr.qr_code : 'data:image/png;base64,'+zaloQr.qr_code}" style="width:200px;height:200px;border-radius:8px;border:2px solid var(--accent)" />` : html`<div style="color:var(--text2)">Không thể hiển thị QR</div>`}
                <div style="font-size:12px;color:var(--text2);margin-top:8px">${zaloQr.message || 'Quét mã QR bằng Zalo trên điện thoại'}</div>
              </div>
            `}
            <div style="font-size:11px;color:var(--text2);margin-top:6px">Hoặc paste cookie từ chat.zalo.me vào ô bên dưới</div>
          </div>
        `}

        <div style="display:grid;gap:10px;font-size:13px">
          ${(configCh.fields||[]).map(fd => html`
            <label key=${fd.key}>${fd.label}
              ${fd.textarea ? html`<textarea style="${inp};min-height:80px;font-family:var(--mono);resize:vertical" value=${chForm[fd.key]||''} onInput=${e=>setChForm(f=>({...f,[fd.key]:e.target.value}))} placeholder=${fd.placeholder||'Nhập '+fd.label+'...'} />` :
              html`<input style="${inp}" type=${fd.secret?'password':'text'} value=${chForm[fd.key]||''} onInput=${e=>setChForm(f=>({...f,[fd.key]:e.target.value}))} placeholder=${fd.placeholder||'Nhập '+fd.label+'...'} />`}
            </label>
          `)}
        </div>
        <div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>setConfigCh(null)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${saveChannelConfig}>💾 Lưu cấu hình</button>
        </div>
      </div>
    `}

    <div class="card"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">
      ${allInstances.map(inst => {
        const def = channelDefs.find(d => d.name === inst.defName);
        return html`<div key=${inst.key} style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg2);border-radius:8px;border:1px solid ${inst.status==='active'?'var(--green)':inst.status==='configured'?'var(--accent)':'var(--border)'}">
          <span style="font-size:24px">${inst.icon}</span>
          <div style="flex:1">
            <strong style="font-size:13px">${inst.label}</strong>
            <div style="font-size:11px;color:var(--text2)">${inst.channelType}${inst.key !== inst.defName ? html` • <span style="color:var(--accent)">${inst.defName}</span>` : ''}</div>
          </div>
          ${statusBadge(inst.status)}
          ${def?.fields && html`<button class="btn btn-outline btn-sm" onClick=${()=>openConfig(inst)} title="Cấu hình">⚙️</button>`}
        </div>`;
      })}
    </div></div>
  </div>`;
}


export { ChannelsPage };
