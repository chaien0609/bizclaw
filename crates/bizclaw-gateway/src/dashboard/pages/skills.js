// SkillsPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function SkillsPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editSkill, setEditSkill] = useState(null);
  const [detailSkill, setDetailSkill] = useState(null);
  const [form, setForm] = useState({name:'',icon:'🧩',category:'custom',description:'',system_prompt:'',tags:''});

  const load = async () => {
    try {
      const r = await authFetch('/api/v1/skills');
      if(!r.ok) throw new Error('HTTP '+r.status);
      const d = await r.json();
      setSkills(d.skills || []);
    } catch (e) {
      console.error('Skills load:', e);
      setSkills([]);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const categories = ['all','coding','data','devops','writing','security','business','custom'];
  const catIcons = { all:'🌐', coding:'💻', data:'📊', devops:'🔧', writing:'✍️', security:'🔒', business:'💼', custom:'🧩' };
  const emojiOptions = ['🧩','🤖','📊','🔍','💡','🎯','📝','🏗️','🧪','⚡','🎨','📚','🔐','🌍','💬','📈','🛡️','🔬','🎓','🏥'];

  const openCreate = () => {
    setEditSkill(null);
    setForm({name:'',icon:'🧩',category:'custom',description:'',system_prompt:'',tags:''});
    setShowForm(true);
  };
  const openEdit = (skill) => {
    if(skill.builtin) { showToast('ℹ️ Skill built-in không chỉnh sửa được','info'); return; }
    setEditSkill(skill);
    setForm({
      name: skill.name||'',
      icon: skill.icon||'🧩',
      category: skill.category||'custom',
      description: skill.description||'',
      system_prompt: skill.system_prompt||'',
      tags: (skill.tags||[]).join(', '),
    });
    setShowForm(true);
  };

  const saveSkill = async () => {
    if(!form.name.trim()) { showToast('⚠️ Nhập tên skill','error'); return; }
    const body = {
      name: form.name, icon: form.icon, category: form.category,
      description: form.description, system_prompt: form.system_prompt,
      tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean),
    };
    try {
      if(editSkill && editSkill.id) {
        const r = await authFetch('/api/v1/skills/'+encodeURIComponent(editSkill.id), {
          method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
        });
        if(!r.ok) throw new Error('HTTP '+r.status);
        const d = await r.json();
        if(d.ok) { showToast('✅ Đã cập nhật: '+form.name,'success'); setShowForm(false); load(); }
        else showToast('❌ '+(d.error||'Lỗi'),'error');
      } else {
        const r = await authFetch('/api/v1/skills', {
          method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)
        });
        if(!r.ok) throw new Error('HTTP '+r.status);
        const d = await r.json();
        if(d.ok) { showToast('✅ Đã tạo: '+form.name,'success'); setShowForm(false); load(); }
        else showToast('❌ '+(d.error||'Lỗi'),'error');
      }
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const installSkill = async (skill) => {
    try {
      const r = await authFetch('/api/v1/skills/install', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({skill:skill.id})});
      if(!r.ok) throw new Error('HTTP '+r.status);
      const d = await r.json();
      if(d.ok) { showToast('✅ Installed: '+skill.name,'success'); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const uninstallSkill = async (skill) => {
    try {
      const r = await authFetch('/api/v1/skills/uninstall', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({skill:skill.id})});
      if(!r.ok) throw new Error('HTTP '+r.status);
      const d = await r.json();
      if(d.ok) { showToast('🗑️ Uninstalled: '+skill.name,'success'); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const deleteSkill = async (skill) => {
    if(skill.builtin) { showToast('ℹ️ Không thể xoá skill built-in','info'); return; }
    if(!confirm('Xoá skill "'+skill.name+'"?')) return;
    try {
      const r = await authFetch('/api/v1/skills/'+encodeURIComponent(skill.id), {method:'DELETE'});
      if(!r.ok) throw new Error('HTTP '+r.status);
      const d = await r.json();
      if(d.ok) { showToast('🗑️ Đã xoá: '+skill.name,'success'); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const filtered = skills.filter(s => {
    if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(s.tags||[]).some(t=>t.includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';

  return html`<div>
    <div class="page-header"><div>
      <h1>🧩 ${t('skill.title', lang)}</h1>
      <div class="sub">${t('skill.subtitle', lang)}</div>
    </div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${openCreate}>+ Tạo Skill</button>
    </div>

    <div class="stats">
      <${StatsCard} label=${t('skill.total', lang)} value=${skills.length} color="accent" icon="🧩" />
      <${StatsCard} label=${t('skill.installed', lang)} value=${skills.filter(s=>s.installed).length} color="green" icon="✅" />
      <${StatsCard} label="Custom" value=${skills.filter(s=>!s.builtin).length} color="purple" icon="✨" />
      <${StatsCard} label=${t('skill.categories', lang)} value=${categories.length - 1} color="blue" icon="📁" />
    </div>

    ${showForm && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>${editSkill ? '✏️ Sửa: '+editSkill.name : '➕ Tạo Skill mới'}</h3>
          <button class="btn btn-outline btn-sm" onClick=${()=>setShowForm(false)}>✕ Đóng</button>
        </div>
        <div style="display:grid;grid-template-columns:auto 1fr 1fr;gap:10px;font-size:13px;align-items:end">
          <label>Icon
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
              ${emojiOptions.map(e=>html`<button key=${e} class="btn btn-outline btn-sm" style=${form.icon===e?'background:var(--accent);color:#fff;font-size:18px':'font-size:18px'} onClick=${()=>setForm(f=>({...f,icon:e}))}>${e}</button>`)}
            </div>
          </label>
          <label>Tên Skill<input style="${inp}" value=${form.name} onInput=${e=>setForm(f=>({...f,name:e.target.value}))} placeholder="My Skill" /></label>
          <label>Category
            <select style="${inp};cursor:pointer" value=${form.category} onChange=${e=>setForm(f=>({...f,category:e.target.value}))}>
              ${['coding','data','devops','writing','security','business','custom'].map(c=>html`<option key=${c} value=${c}>${catIcons[c]} ${c}</option>`)}
            </select>
          </label>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;font-size:13px">
          <label>Mô tả<input style="${inp}" value=${form.description} onInput=${e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Mô tả ngắn..." /></label>
          <label>Tags (phân cách bằng dấu phẩy)<input style="${inp}" value=${form.tags} onInput=${e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="rust, async, performance" /></label>
        </div>
        <label style="display:block;margin-top:10px;font-size:13px">System Prompt (hướng dẫn AI khi dùng skill này)
          <textarea style="${inp};min-height:100px;resize:vertical;font-family:monospace" value=${form.system_prompt} onInput=${e=>setForm(f=>({...f,system_prompt:e.target.value}))} placeholder="You are an expert in ... Help with ..." />
        </label>
        <div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>setShowForm(false)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${saveSkill}>💾 ${editSkill?'Cập nhật':'Tạo'}</button>
        </div>
      </div>
    `}

    ${detailSkill && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:40px">${detailSkill.icon}</span>
            <div>
              <h3 style="margin:0">${detailSkill.name}</h3>
              <div style="display:flex;gap:6px;align-items:center;margin-top:4px">
                <span class="badge" style="font-size:10px">v${detailSkill.version}</span>
                <span class="badge ${detailSkill.builtin?'':'badge-green'}" style="font-size:10px">${detailSkill.builtin?'built-in':'custom'}</span>
                <span class="badge" style="font-size:10px">${catIcons[detailSkill.category]} ${detailSkill.category}</span>
                ${detailSkill.installed ? html`<span class="badge badge-green" style="font-size:10px">✅ Installed</span>` : html`<span class="badge" style="font-size:10px;opacity:0.5">Not installed</span>`}
              </div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onClick=${()=>setDetailSkill(null)}>✕ Đóng</button>
        </div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:10px">${detailSkill.description}</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px">
          ${(detailSkill.tags||[]).map(tag=>html`<span key=${tag} class="badge" style="font-size:10px">#${tag}</span>`)}
        </div>
        ${detailSkill.system_prompt && html`
          <div style="margin-top:8px">
            <strong style="font-size:12px;color:var(--text2)">📋 System Prompt:</strong>
            <pre style="font-size:12px;white-space:pre-wrap;background:var(--bg2);padding:10px;border-radius:6px;margin-top:6px;max-height:200px;overflow-y:auto;border:1px solid var(--border)">${detailSkill.system_prompt}</pre>
          </div>
        `}
        <div style="margin-top:12px;display:flex;gap:8px">
          ${detailSkill.installed
            ? html`<button class="btn btn-sm" style="background:var(--red);color:#fff" onClick=${()=>{uninstallSkill(detailSkill);setDetailSkill(null);}}>🗑️ Gỡ cài</button>`
            : html`<button class="btn btn-sm" style="background:var(--green);color:#fff" onClick=${()=>{installSkill(detailSkill);setDetailSkill(null);}}>+ Cài đặt</button>`}
          ${!detailSkill.builtin && html`<button class="btn btn-outline btn-sm" onClick=${()=>{openEdit(detailSkill);setDetailSkill(null);}}>✏️ Sửa</button>`}
          ${!detailSkill.builtin && html`<button class="btn btn-outline btn-sm" style="color:var(--red)" onClick=${()=>{deleteSkill(detailSkill);setDetailSkill(null);}}>🗑️ Xoá</button>`}
        </div>
      </div>
    `}

    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input placeholder=${t('skill.search', lang)} value=${searchQuery} onInput=${e=>setSearchQuery(e.target.value)}
          style="flex:1;min-width:200px;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px" />
        <div style="display:flex;gap:4px">
          ${categories.map(cat => html`<button key=${cat}
            class="btn ${selectedCategory===cat?'':'btn-outline'} btn-sm"
            style=${selectedCategory===cat?'background:var(--grad1);color:#fff':''}
            onClick=${()=>setSelectedCategory(cat)}>${catIcons[cat]} ${cat}</button>`)}
        </div>
      </div>
    </div>

    ${loading ? html`<div class="card" style="text-align:center;padding:40px;color:var(--text2)">Loading...</div>` : html`
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px">
        ${filtered.map(skill => html`<div key=${skill.id||skill.name} class="card" style="border-left:3px solid ${skill.installed?'var(--green)':'var(--border)'};cursor:pointer" onClick=${()=>setDetailSkill(skill)}>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:32px">${skill.icon}</span>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px">
                <strong style="font-size:15px">${skill.name}</strong>
                <span class="badge" style="font-size:10px">v${skill.version}</span>
                ${skill.builtin ? html`<span class="badge" style="font-size:9px;opacity:0.6">built-in</span>` : html`<span class="badge badge-green" style="font-size:9px">custom</span>`}
              </div>
              <div style="font-size:11px;color:var(--text2)">${skill.category}</div>
            </div>
            <div style="display:flex;gap:4px;align-items:center" onClick=${e=>e.stopPropagation()}>
              ${skill.installed
                ? html`<button class="btn btn-sm" style="background:var(--green);color:#fff;font-size:11px" onClick=${()=>uninstallSkill(skill)}>✅ Gỡ cài</button>`
                : html`<button class="btn btn-outline btn-sm" onClick=${()=>installSkill(skill)}>+ Cài đặt</button>`}
              ${!skill.builtin && html`<button class="btn btn-outline btn-sm" onClick=${()=>openEdit(skill)} title="Sửa">✏️</button>`}
              ${!skill.builtin && html`<button class="btn btn-outline btn-sm" style="color:var(--red)" onClick=${()=>deleteSkill(skill)} title="Xoá">🗑️</button>`}
            </div>
          </div>
          <div style="font-size:13px;color:var(--text2);margin-bottom:8px">${skill.description}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${(skill.tags||[]).map(tag=>html`<span key=${tag} class="badge" style="font-size:10px">#${tag}</span>`)}
          </div>
        </div>`)}
      </div>
    `}
  </div>`;
}


export { SkillsPage };
