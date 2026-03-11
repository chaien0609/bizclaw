// ChannelsPage — Multi-Instance Channel Management
// Supports adding multiple Telegram bots, Zalo accounts, etc.
// Uses /api/v1/channel-instances CRUD API
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function ChannelsPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [instances, setInstances] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configCh, setConfigCh] = useState(null);
  const [chForm, setChForm] = useState({});
  const [zaloQr, setZaloQr] = useState(null);
  const [zaloLoading, setZaloLoading] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newChType, setNewChType] = useState('');
  const [newChName, setNewChName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';

  // Channel type definitions — which types exist and their config fields
  const channelDefs = [
    {name:'cli',icon:'💻',label:'CLI Terminal',type:'interactive',alwaysActive:true},
    {name:'telegram',icon:'📱',label:'Telegram Bot',type:'messaging',multi:true,
     fields:[{key:'bot_token',label:'Bot Token',secret:true},{key:'allowed_chat_ids',label:'Allowed Chat IDs',placeholder:'-100123, 987654'}]},
    {name:'zalo',icon:'💙',label:'Zalo',type:'messaging',hasQr:true,multi:true,
     fields:[{key:'cookie',label:'Cookie (từ chat.zalo.me)',secret:true,textarea:true},{key:'imei',label:'IMEI (Device ID)',placeholder:'Tự tạo nếu để trống'}]},
    {name:'discord',icon:'🎮',label:'Discord Bot',type:'messaging',multi:true,
     fields:[{key:'bot_token',label:'Bot Token',secret:true},{key:'allowed_channel_ids',label:'Allowed Channel IDs',placeholder:'123456, 789012'}]},
    {name:'email',icon:'📧',label:'Email (IMAP/SMTP)',type:'messaging',multi:true,
     fields:[{key:'smtp_host',label:'SMTP Host',placeholder:'smtp.gmail.com'},{key:'smtp_port',label:'SMTP Port',placeholder:'587'},
             {key:'smtp_user',label:'Email Address',placeholder:'bot@example.com'},{key:'smtp_pass',label:'App Password',secret:true},
             {key:'imap_host',label:'IMAP Host',placeholder:'imap.gmail.com'}]},
    {name:'whatsapp',icon:'💬',label:'WhatsApp Business',type:'messaging',multi:true,
     fields:[{key:'phone_number_id',label:'Phone Number ID'},{key:'access_token',label:'Access Token',secret:true},{key:'business_id',label:'Business ID'}]},
    {name:'webhook',icon:'🌐',label:'Webhook',type:'api',multi:true,
     fields:[{key:'webhook_url',label:'Outbound URL',placeholder:'https://example.com/webhook'},{key:'webhook_secret',label:'Secret',secret:true}]},
  ];

  // ── Load data ──
  const load = async () => {
    try {
      const [instRes, agentRes] = await Promise.all([
        authFetch('/api/v1/channel-instances'),
        authFetch('/api/v1/agents'),
      ]);
      const instData = await instRes.json();
      const agentData = await agentRes.json();
      setInstances(instData.instances || []);
      setAgents(agentData.agents || []);
    } catch(e) {
      console.error('Channels load:', e);
      setInstances([]);
      setAgents([]);
    }
    setLoading(false);
  };
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 8000);
    load().finally(() => clearTimeout(timeout));
    return () => clearTimeout(timeout);
  }, []);

  // ── Build display list: instances from API + unconfigured types ──
  const getDisplayList = () => {
    const list = [];
    // CLI always first
    list.push({ id: 'cli', name: 'CLI Terminal', channel_type: 'cli', enabled: true, agent_name: '', config: {}, icon: '💻', status: 'active' });
    // Instance list from API
    for (const inst of instances) {
      const def = channelDefs.find(d => d.name === inst.channel_type);
      list.push({
        ...inst,
        icon: def?.icon || '📡',
        status: inst.enabled ? 'active' : 'configured',
      });
    }
    // Unconfigured channel types (shown as "available")
    for (const def of channelDefs) {
      if (def.name === 'cli') continue;
      if (!instances.find(i => i.channel_type === def.name)) {
        list.push({
          id: 'avail_' + def.name,
          name: def.label,
          channel_type: def.name,
          enabled: false,
          agent_name: '',
          config: {},
          icon: def.icon,
          status: 'available',
        });
      }
    }
    return list;
  };

  // ── Open config form ──
  const openConfig = (inst) => {
    const def = channelDefs.find(d => d.name === inst.channel_type);
    if (!def || !def.fields) return;
    setConfigCh({ ...def, instanceId: inst.id, instanceName: inst.name || def.label });
    setZaloQr(null);
    // Pre-fill form
    const cfg = inst.config || {};
    const f = {
      enabled: inst.enabled !== false,
      display_name: inst.name || '',
      agent_name: inst.agent_name || '',
    };
    (def.fields || []).forEach(fd => { f[fd.key] = cfg[fd.key] || ''; });
    setChForm(f);
  };

  // ── Save (create or update) via instance API ──
  const saveChannelConfig = async () => {
    if (!configCh) return;
    try {
      const config = {};
      (configCh.fields || []).forEach(fd => {
        if (chForm[fd.key]) config[fd.key] = chForm[fd.key];
      });

      const isNew = !configCh.instanceId || configCh.instanceId.startsWith('avail_');
      const body = {
        ...(isNew ? {} : { id: configCh.instanceId }),
        name: chForm.display_name || configCh.instanceName || configCh.name,
        channel_type: configCh.name,
        enabled: chForm.enabled !== false,
        agent_name: chForm.agent_name || '',
        config,
      };

      const r = await authFetch('/api/v1/channel-instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.ok) {
        showToast('✅ Đã lưu ' + (chForm.display_name || configCh.name), 'success');
        setConfigCh(null);
        load();
      } else {
        showToast('❌ ' + (d.error || 'Lỗi lưu kênh'), 'error');
      }
    } catch(e) {
      showToast('❌ ' + e.message, 'error');
    }
  };

  // ── Delete instance ──
  const deleteInstance = async (id) => {
    try {
      const r = await authFetch('/api/v1/channel-instances/' + encodeURIComponent(id), { method: 'DELETE' });
      const d = await r.json();
      if (d.ok) {
        showToast('🗑️ Đã xoá kênh', 'success');
        setDeleteConfirm(null);
        load();
      } else {
        showToast('❌ ' + (d.error || 'Lỗi xoá'), 'error');
      }
    } catch(e) {
      showToast('❌ ' + e.message, 'error');
    }
  };

  // ── Add new channel instance ──
  const addNewChannel = () => {
    if (!newChType) { showToast('⚠️ Chọn loại kênh', 'error'); return; }
    const def = channelDefs.find(d => d.name === newChType);
    if (!def) return;
    const displayName = newChName.trim() || (def.label + ' #' + (instances.filter(i => i.channel_type === newChType).length + 1));
    setConfigCh({ ...def, instanceId: null, instanceName: displayName });
    const f = { enabled: true, display_name: displayName, agent_name: '' };
    (def.fields || []).forEach(fd => { f[fd.key] = ''; });
    setChForm(f);
    setShowAddNew(false);
    setNewChType('');
    setNewChName('');
  };

  // ── Zalo QR ──
  const loadZaloQr = async () => {
    setZaloLoading(true);
    try {
      const r = await authFetch('/api/v1/zalo/qr', { method: 'POST' });
      const d = await r.json();
      if (d.ok) { setZaloQr(d); if (d.imei) setChForm(f => ({ ...f, imei: d.imei })); }
      else showToast('❌ ' + (d.error || 'Không thể tạo QR'), 'error');
    } catch(e) { showToast('❌ ' + e.message, 'error'); }
    setZaloLoading(false);
  };

  const statusBadge = s => {
    if (s === 'active') return html`<span class="badge badge-green" style="font-size:11px">● Hoạt động</span>`;
    if (s === 'configured') return html`<span class="badge badge-blue" style="font-size:11px">○ Tắt</span>`;
    return html`<span class="badge" style="font-size:11px;opacity:0.6">+ Thêm</span>`;
  };

  if (loading) return html`<div class="card" style="text-align:center;padding:40px;color:var(--text2)">Đang tải kênh liên lạc...</div>`;

  const displayList = getDisplayList();
  const activeCount = displayList.filter(i => i.status === 'active').length;
  const totalInstances = instances.length;
  const multiCapable = channelDefs.filter(d => d.multi);

  // Group instances by type for the grid
  const typeGroups = {};
  for (const inst of displayList) {
    if (!typeGroups[inst.channel_type]) typeGroups[inst.channel_type] = [];
    typeGroups[inst.channel_type].push(inst);
  }

  return html`<div>
    <div class="page-header"><div><h1>📡 ${t('channels.title', lang)}</h1><div class="sub">${t('channels.subtitle', lang)} — Hỗ trợ nhiều kênh cùng loại (multi-instance)</div></div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${() => setShowAddNew(!showAddNew)}>+ Thêm kênh mới</button>
    </div>
    <div class="stats">
      <${StatsCard} label="Tổng instance" value=${totalInstances} color="accent" icon="📡" />
      <${StatsCard} label="Đang hoạt động" value=${activeCount} color="green" icon="✅" />
      <${StatsCard} label="Loại kênh" value=${channelDefs.length} color="blue" icon="🔌" />
    </div>

    ${showAddNew && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="margin:0">➕ Thêm kênh liên lạc mới</h3>
          <button class="btn btn-outline btn-sm" onClick=${() => setShowAddNew(false)}>✕</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <label>Loại kênh
            <select style="${inp};cursor:pointer" value=${newChType} onChange=${e => setNewChType(e.target.value)}>
              <option value="">— Chọn loại kênh —</option>
              ${multiCapable.map(d => html`<option key=${d.name} value=${d.name}>${d.icon} ${d.label}</option>`)}
            </select>
          </label>
          <label>Tên hiển thị
            <input style="${inp}" value=${newChName} onInput=${e => setNewChName(e.target.value)} placeholder="VD: Bot bán hàng, Support Bot 2..." />
          </label>
        </div>
        ${newChType && html`
          <div style="margin-top:10px;padding:10px;background:var(--bg2);border-radius:8px;font-size:12px;color:var(--text2)">
            💡 <strong>${channelDefs.find(d => d.name === newChType)?.icon} ${channelDefs.find(d => d.name === newChType)?.label}</strong> —
            Bạn có thể tạo nhiều instance cùng loại. Mỗi instance có token/config riêng và gán cho agent khác nhau.
            <br/>Hiện có: <strong>${instances.filter(i => i.channel_type === newChType).length}</strong> instance loại này.
          </div>
        `}
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${() => setShowAddNew(false)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${addNewChannel}>➕ Tạo kênh</button>
        </div>
      </div>
    `}

    ${configCh && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="margin:0">${configCh.icon} Cấu hình: ${chForm.display_name || configCh.instanceName}</h3>
          <button class="btn btn-outline btn-sm" onClick=${() => setConfigCh(null)}>✕ Đóng</button>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          ${''}
          <div style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--bg2);border-radius:8px">
            <span style="font-size:13px">Kích hoạt:</span>
            <div style="position:relative;width:44px;height:24px;background:${chForm.enabled ? 'var(--green)' : 'var(--bg3)'};border-radius:12px;cursor:pointer;transition:background 0.3s" onClick=${() => setChForm(f => ({ ...f, enabled: !f.enabled }))}>
              <div style="position:absolute;top:2px;left:${chForm.enabled ? '22px' : '2px'};width:20px;height:20px;background:#fff;border-radius:50%;transition:left 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>
            </div>
            <span style="font-size:12px;color:${chForm.enabled ? 'var(--green)' : 'var(--text2)'}">${chForm.enabled ? 'Bật' : 'Tắt'}</span>
          </div>

          ${''}
          <label style="font-size:13px">Gán Agent
            <select style="${inp};cursor:pointer" value=${chForm.agent_name || ''} onChange=${e => setChForm(f => ({ ...f, agent_name: e.target.value }))}>
              <option value="">— Không gán (dùng default) —</option>
              ${agents.map(ag => html`<option key=${ag.name} value=${ag.name}>🤖 ${ag.name}${ag.role ? ` (${ag.role})` : ''}</option>`)}
            </select>
          </label>
        </div>

        <div style="margin-bottom:10px">
          <label style="font-size:13px">Tên hiển thị
            <input style="${inp}" value=${chForm.display_name || ''} onInput=${e => setChForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Tên tuỳ chỉnh cho kênh này" />
          </label>
        </div>

        ${configCh.hasQr && html`
          <div style="margin-bottom:14px;padding:12px;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <strong style="font-size:13px">📱 Đăng nhập Zalo bằng QR</strong>
              <button class="btn" style="background:var(--grad1);color:#fff;padding:4px 12px;font-size:12px" onClick=${loadZaloQr} disabled=${zaloLoading}>${zaloLoading ? 'Đang tạo...' : '🔲 Quét QR'}</button>
            </div>
            ${zaloQr && html`
              <div style="text-align:center;padding:10px">
                ${zaloQr.qr_code ? html`<img src="${zaloQr.qr_code.startsWith('data:') ? zaloQr.qr_code : 'data:image/png;base64,' + zaloQr.qr_code}" style="width:200px;height:200px;border-radius:8px;border:2px solid var(--accent)" />` : html`<div style="color:var(--text2)">Không thể hiển thị QR</div>`}
                <div style="font-size:12px;color:var(--text2);margin-top:8px">${zaloQr.message || 'Quét mã QR bằng Zalo trên điện thoại'}</div>
              </div>
            `}
            <div style="font-size:11px;color:var(--text2);margin-top:6px">Hoặc paste cookie từ chat.zalo.me vào ô bên dưới</div>
          </div>
        `}

        <div style="display:grid;gap:10px;font-size:13px">
          ${(configCh.fields || []).map(fd => html`
            <label key=${fd.key}>${fd.label}
              ${fd.textarea ? html`<textarea style="${inp};min-height:80px;font-family:var(--mono);resize:vertical" value=${chForm[fd.key] || ''} onInput=${e => setChForm(f => ({ ...f, [fd.key]: e.target.value }))} placeholder=${fd.placeholder || 'Nhập ' + fd.label + '...'} />` :
              html`<input style="${inp}" type=${fd.secret ? 'password' : 'text'} value=${chForm[fd.key] || ''} onInput=${e => setChForm(f => ({ ...f, [fd.key]: e.target.value }))} placeholder=${fd.placeholder || 'Nhập ' + fd.label + '...'} />`}
            </label>
          `)}
        </div>
        <div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${() => setConfigCh(null)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${saveChannelConfig}>💾 Lưu cấu hình</button>
        </div>
      </div>
    `}

    ${deleteConfirm && html`
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;display:flex;align-items:center;justify-content:center" onClick=${() => setDeleteConfirm(null)}>
        <div style="background:var(--surface);padding:24px;border-radius:12px;width:360px;text-align:center" onClick=${e => e.stopPropagation()}>
          <div style="font-size:28px;margin-bottom:8px">🗑️</div>
          <h3>Xoá kênh này?</h3>
          <p style="color:var(--text2);font-size:13px;margin-bottom:16px">Bạn có chắc muốn xoá <strong>${deleteConfirm.name}</strong>? Thao tác không thể hoàn tác.</p>
          <div style="display:flex;gap:8px;justify-content:center">
            <button class="btn btn-outline" onClick=${() => setDeleteConfirm(null)}>Huỷ</button>
            <button class="btn" style="background:var(--red);color:#fff;padding:8px 20px" onClick=${() => deleteInstance(deleteConfirm.id)}>🗑️ Xoá</button>
          </div>
        </div>
      </div>
    `}

    ${Object.entries(typeGroups).map(([type, items]) => {
      const def = channelDefs.find(d => d.name === type);
      const hasMultiple = items.length > 1 || (def?.multi && items.some(i => i.status !== 'available'));
      return html`
        <div class="card" style="margin-bottom:10px" key=${type}>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <h3 style="margin:0;display:flex;align-items:center;gap:6px">
              <span style="font-size:20px">${def?.icon || '📡'}</span>
              ${def?.label || type}
              ${items.length > 1 ? html`<span style="font-size:12px;color:var(--text2);font-weight:normal">(${items.filter(i => i.status !== 'available').length} instance${items.filter(i => i.status !== 'available').length > 1 ? 's' : ''})</span>` : ''}
            </h3>
            ${def?.multi && html`
              <button class="btn btn-outline btn-sm" onClick=${() => { setNewChType(type); addNewChannel(); }} style="font-size:11px">+ Thêm ${def.label}</button>
            `}
          </div>
          <div style="display:grid;gap:8px">
            ${items.map(inst => html`
              <div key=${inst.id} style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg2);border-radius:8px;border:1px solid ${inst.status === 'active' ? 'var(--green)' : inst.status === 'configured' ? 'var(--accent)' : 'var(--border)'}">
                <div style="flex:1">
                  <div style="display:flex;align-items:center;gap:6px">
                    <strong style="font-size:13px">${inst.name || def?.label}</strong>
                    ${inst.agent_name ? html`<span style="font-size:11px;padding:2px 6px;background:var(--accent);color:#fff;border-radius:4px">🤖 ${inst.agent_name}</span>` : ''}
                  </div>
                  ${inst.id && !inst.id.startsWith('avail_') && html`<div style="font-size:11px;color:var(--text2);margin-top:2px">ID: ${inst.id}</div>`}
                </div>
                ${statusBadge(inst.status)}
                ${def?.fields && html`<button class="btn btn-outline btn-sm" onClick=${() => openConfig(inst)} title="Cấu hình">⚙️</button>`}
                ${inst.id && !inst.id.startsWith('avail_') && inst.id !== 'cli' && html`
                  <button class="btn btn-outline btn-sm" onClick=${() => setDeleteConfirm(inst)} title="Xoá" style="color:var(--red);border-color:var(--red)">🗑️</button>
                `}
              </div>
            `)}
          </div>
        </div>
      `;
    })}
  </div>`;
}

export { ChannelsPage };
