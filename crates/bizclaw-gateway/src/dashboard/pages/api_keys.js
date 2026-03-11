// ApiKeysPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function ApiKeysPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({name:'', scopes:'read,write', expires_days:''});
  const [newKey, setNewKey] = useState(null);

  const load = async () => {
    try { const r=await authFetch('/api/v1/api-keys'); const d=await r.json(); setKeys(d.keys||[]); } catch(e){}
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const createKey = async () => {
    if(!form.name.trim()) { showToast('⚠️ Nhập tên cho API key','error'); return; }
    try {
      const body = { name: form.name, scopes: form.scopes };
      if(form.expires_days) body.expires_days = parseInt(form.expires_days);
      const r = await authFetch('/api/v1/api-keys', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const d = await r.json();
      if(d.ok) { setNewKey(d.key); showToast('🔑 API key đã tạo!','success'); load(); setShowCreate(false); setForm({name:'',scopes:'read,write',expires_days:''}); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const revokeKey = async (id, name) => {
    if(!confirm('Thu hồi API key "'+name+'"? Key này sẽ không thể sử dụng nữa.')) return;
    try {
      const r = await authFetch('/api/v1/api-keys/'+id, {method:'DELETE'});
      const d = await r.json();
      if(d.ok) { showToast('🗑️ Đã thu hồi: '+name,'success'); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const copyKey = (key) => {
    navigator.clipboard.writeText(key).then(()=>showToast('📋 Đã copy API key','success'));
  };

  const inp = 'padding:10px;border:1px solid var(--border);border-radius:6px;background:var(--bg2);color:var(--text);width:100%';

  if(loading) return html`<div class="card" style="text-align:center;padding:40px;color:var(--text2)">Loading...</div>`;

  return html`<div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div><h1 style="margin:0">🔑 API Keys</h1><div class="sub">Quản lý API keys để truy cập BizClaw từ bên ngoài</div></div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${()=>setShowCreate(!showCreate)}>+ Tạo API Key</button>
    </div>

    ${newKey && html`<div class="card" style="border:2px solid var(--green);background:rgba(0,200,0,0.05);margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="font-size:24px">🎉</span><strong>API Key đã tạo thành công!</strong></div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:8px">⚠️ Copy và lưu key này ngay — nó sẽ <strong>không hiển thị lại</strong>!</div>
      <div style="display:flex;gap:8px;align-items:center">
        <input readonly value=${newKey} style="${inp};font-family:var(--mono);font-size:13px;flex:1" onClick=${e=>e.target.select()} />
        <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 16px;white-space:nowrap" onClick=${()=>copyKey(newKey)}>📋 Copy</button>
        <button class="btn btn-outline" style="padding:8px 16px" onClick=${()=>setNewKey(null)}>✕ Đóng</button>
      </div>
    </div>`}

    ${showCreate && html`<div class="card" style="margin-bottom:16px">
      <h3 style="margin-top:0">➕ Tạo API Key mới</h3>
      <div style="display:grid;gap:10px;max-width:500px">
        <label>Tên<input style="${inp}" value=${form.name} onInput=${e=>setForm(f=>({...f,name:e.target.value}))} placeholder="My App Key" /></label>
        <label>Quyền (Scopes)<select style="${inp}" value=${form.scopes} onChange=${e=>setForm(f=>({...f,scopes:e.target.value}))}>
          <option value="read,write">Đọc + Ghi (Full)</option>
          <option value="read">Chỉ đọc</option>
          <option value="chat">Chat only</option>
        </select></label>
        <label>Hết hạn sau (ngày, để trống = vĩnh viễn)<input type="number" style="${inp}" value=${form.expires_days} onInput=${e=>setForm(f=>({...f,expires_days:e.target.value}))} placeholder="30" /></label>
        <div style="display:flex;gap:8px">
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${createKey}>🔑 Tạo Key</button>
          <button class="btn btn-outline" style="padding:8px 20px" onClick=${()=>setShowCreate(false)}>Hủy</button>
        </div>
      </div>
    </div>`}

    <div class="card">
      <h3 style="margin-top:0">🗂️ Danh sách API Keys (${keys.length})</h3>
      ${keys.length===0 ? html`<div style="text-align:center;padding:30px;color:var(--text2)"><div style="font-size:48px;margin-bottom:12px">🔐</div><p>Chưa có API key nào. Tạo key đầu tiên để bắt đầu.</p></div>`
      : html`<div style="display:grid;gap:6px">
        ${keys.map(k=>html`<div key=${k.id} style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
          <span style="font-size:20px">${k.active?'🟢':'🔴'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600">${k.name}</div>
            <div style="font-size:11px;color:var(--text2);font-family:var(--mono)">${k.key_prefix}••••••••••••</div>
          </div>
          <span class="badge badge-blue" style="font-size:10px">${k.scopes}</span>
          ${k.expires_at ? html`<span class="badge badge-purple" style="font-size:10px">Exp: ${k.expires_at.split('T')[0]}</span>` : html`<span class="badge badge-green" style="font-size:10px">∞ Vĩnh viễn</span>`}
          <span style="font-size:10px;color:var(--text2)">${k.last_used_at ? 'Used: '+k.last_used_at.split('T')[0] : 'Chưa dùng'}</span>
          <button class="btn" style="background:var(--red);color:#fff;padding:4px 12px;font-size:11px" onClick=${()=>revokeKey(k.id,k.name)}>🗑️ Thu hồi</button>
        </div>`)}
      </div>`}
    </div>

    <div class="card" style="margin-top:16px">
      <h3 style="margin-top:0">📖 Cách sử dụng API Key</h3>
      <div style="font-size:13px;line-height:1.8;color:var(--text2)">
        <p><strong>Header Authentication:</strong></p>
        <pre style="background:var(--bg2);padding:12px;border-radius:6px;font-size:12px;overflow-x:auto"><code>curl -H "Authorization: Bearer bz_your_key_here" \\
  http://your-server:3000/v1/chat/completions \\
  -d '{"model":"default","messages":[{"role":"user","content":"Hello"}]}'</code></pre>
        <p style="margin-top:12px"><strong>Endpoints có thể truy cập:</strong></p>
        <div style="display:grid;gap:4px;font-family:var(--mono);font-size:12px">
          <div>POST /v1/chat/completions — Chat với AI agent</div>
          <div>GET  /v1/models — Danh sách models/agents</div>
          <div>GET  /api/v1/agents — Danh sách agents</div>
          <div>GET  /api/v1/usage — Xem usage & quotas</div>
        </div>
      </div>
    </div>
  </div>`;
}


export { ApiKeysPage };
