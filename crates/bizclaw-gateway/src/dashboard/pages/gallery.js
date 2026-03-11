// GalleryPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function GalleryPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [allSkills,setAllSkills] = useState([]);
  const [loading,setLoading] = useState(true);
  const [selectedCat,setSelectedCat] = useState(null);
  const [selectedSkill,setSelectedSkill] = useState(null);
  const [cloning,setCloning] = useState(false);
  const [search,setSearch] = useState('');
  const [showForm,setShowForm] = useState(false);
  const [gForm,setGForm] = useState({name:'',icon:'🤖',cat:'productivity',desc:'',role:'assistant',prompt:''});

  const load = async () => { try{const r=await authFetch('/api/v1/gallery');const d=await r.json();setAllSkills(d.skills||[]);}catch(e){} setLoading(false); };
  useEffect(()=>{ load(); },[]);

  const catMap = {
    hr:{icon:'🧑‍💼',label:'Nhân sự (HR)'},sales:{icon:'💰',label:'Kinh doanh'},finance:{icon:'📊',label:'Tài chính'},
    operations:{icon:'🏭',label:'Vận hành'},legal:{icon:'⚖️',label:'Pháp lý'},'customer-service':{icon:'📞',label:'CSKH'},
    marketing:{icon:'📣',label:'Marketing'},ecommerce:{icon:'🛒',label:'Thương mại ĐT'},management:{icon:'💼',label:'Quản lý'},
    admin:{icon:'📝',label:'Hành chính'},it:{icon:'💻',label:'IT'},analytics:{icon:'📧',label:'Phân tích'},
    training:{icon:'🎓',label:'Đào tạo'},productivity:{icon:'⚡',label:'Năng suất'}
  };

  const categories = [...new Set(allSkills.map(s=>s.cat))].filter(Boolean).sort();
  const catCounts = {};
  categories.forEach(c => { catCounts[c] = allSkills.filter(s=>s.cat===c).length; });

  const filtered = allSkills.filter(s => {
    if(selectedCat && s.cat !== selectedCat) return false;
    if(search) {
      const q = search.toLowerCase();
      return (s.name||'').toLowerCase().includes(q) || (s.desc||'').toLowerCase().includes(q) || (s.cat||'').toLowerCase().includes(q);
    }
    return true;
  });

  const cloneAsAgent = async (skill) => {
    setCloning(true);
    try {
      const r = await authFetch('/api/v1/agents', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          name: skill.id || skill.name.toLowerCase().replace(/\s+/g,'-'),
          role: skill.role || 'assistant',
          description: skill.desc || skill.name,
          system_prompt: skill.prompt || '',
          provider: '',
          model: ''
        })
      });
      const d = await r.json();
      if(d.ok) {
        showToast('✅ Đã tạo agent "'+skill.name+'" từ Gallery!','success');
        setSelectedSkill(null);
      } else {
        showToast('❌ '+(d.error||'Lỗi tạo agent'),'error');
      }
    } catch(e) { showToast('❌ '+e.message,'error'); }
    setCloning(false);
  };

  const createTemplate = async () => {
    if(!gForm.name.trim()) { showToast('⚠️ Nhập tên template','error'); return; }
    try {
      const r = await authFetch('/api/v1/gallery', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({id:gForm.name.toLowerCase().replace(/\s+/g,'-'), ...gForm})
      });
      const d=await r.json();
      if(d.ok||d.id) { showToast('✅ Đã tạo template: '+gForm.name,'success'); setShowForm(false); setGForm({name:'',icon:'🤖',cat:'productivity',desc:'',role:'assistant',prompt:''}); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const deleteTemplate = async (id, name) => {
    if(!confirm('Xoá template "'+name+'"?')) return;
    try {
      const r = await authFetch('/api/v1/gallery/'+encodeURIComponent(id), {method:'DELETE'});
      const d=await r.json();
      if(d.ok) { showToast('🗑️ Đã xoá: '+name,'success'); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  if(loading) return html`<div style="text-align:center;padding:60px;color:var(--text2)">⏳ Loading Gallery...</div>`;

  // Detail view
  if(selectedSkill) {
    const s = selectedSkill;
    return html`<div>
      <div class="page-header"><div><h1>📦 ${s.icon||'📦'} ${s.name}</h1><div class="sub">${s.desc}</div></div>
        <button class="btn btn-outline" onClick=${()=>setSelectedSkill(null)}>← Quay lại</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="card">
          <h3 style="margin-bottom:12px">📋 Thông tin</h3>
          <div style="display:grid;gap:8px;font-size:13px">
            <div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--bg2);border-radius:6px"><span style="color:var(--text2)">Danh mục</span><span class="badge badge-blue">${(catMap[s.cat]||{}).label||s.cat}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--bg2);border-radius:6px"><span style="color:var(--text2)">Vai trò</span><span class="badge">${s.role||'assistant'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--bg2);border-radius:6px"><span style="color:var(--text2)">Tác giả</span><span>${s.author||'bizclaw'}</span></div>
            <div style="display:flex;justify-content:space-between;padding:6px 10px;background:var(--bg2);border-radius:6px"><span style="color:var(--text2)">ID</span><span style="font-family:var(--mono);font-size:12px">${s.id}</span></div>
          </div>
          <div style="margin-top:16px">
            <button class="btn" style="background:var(--grad1);color:#fff;padding:10px 24px;width:100%;font-size:14px" onClick=${()=>cloneAsAgent(s)} disabled=${cloning}>
              ${cloning ? '⏳ Đang tạo...' : '🤖 Clone thành Agent'}
            </button>
            <div style="font-size:11px;color:var(--text2);text-align:center;margin-top:6px">Tạo agent mới với System Prompt từ template này</div>
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:12px">💬 System Prompt</h3>
          <div style="padding:14px;background:var(--bg2);border-radius:8px;border:1px solid var(--border);font-size:13px;line-height:1.8;white-space:pre-wrap;max-height:400px;overflow-y:auto;font-family:var(--mono)">${s.prompt||'(Chưa có prompt)'}</div>
        </div>
      </div>
    </div>`;
  }

  return html`<div>
    <div class="page-header"><div><h1>📦 ${t('gallery.title',lang)}</h1><div class="sub">${t('gallery.subtitle',lang)} — ${allSkills.length} mẫu agent, ${categories.length} danh mục</div></div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${()=>setShowForm(!showForm)}>+ Tạo Template</button>
    </div>
    <div class="stats">
      <${StatsCard} label="Templates" value=${allSkills.length} color="accent" icon="📦" />
      <${StatsCard} label="Danh mục" value=${categories.length} color="blue" icon="📁" />
      <${StatsCard} label=${selectedCat?(catMap[selectedCat]||{}).label||selectedCat:'Tất cả'} value=${filtered.length} color="green" icon="🔍" />
    </div>

    ${showForm && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>📦 Tạo Template mới</h3>
          <button class="btn btn-outline btn-sm" onClick=${()=>setShowForm(false)}>✕ Đóng</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <label>Tên<input style="width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px" value=${gForm.name} onInput=${e=>setGForm(f=>({...f,name:e.target.value}))} placeholder="My Agent Template" /></label>
          <label>Danh mục
            <select style="width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;cursor:pointer" value=${gForm.cat} onChange=${e=>setGForm(f=>({...f,cat:e.target.value}))}>
              ${categories.map(c=>html`<option key=${c} value=${c}>${(catMap[c]||{}).label||c}</option>`)}
              <option value="custom">Custom</option>
            </select>
          </label>
          <label style="grid-column:span 2">Mô tả<input style="width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px" value=${gForm.desc} onInput=${e=>setGForm(f=>({...f,desc:e.target.value}))} placeholder="What this template does..." /></label>
          <label style="grid-column:span 2">System Prompt<textarea style="width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;min-height:100px;resize:vertical;font-family:var(--mono)" value=${gForm.prompt} onInput=${e=>setGForm(f=>({...f,prompt:e.target.value}))} placeholder="You are an expert in..." /></label>
        </div>
        <div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>setShowForm(false)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${createTemplate}>💾 Tạo</button>
        </div>
      </div>
    `}

    <div style="margin-bottom:14px"><input type="text" placeholder="🔍 Tìm template... (tên, mô tả, danh mục)" value=${search} onInput=${e=>setSearch(e.target.value)}
      style="width:100%;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px" /></div>

    <div class="card" style="margin-bottom:14px">
      <h3 style="margin-bottom:10px">📁 Danh mục ${selectedCat?html` — <span style="color:var(--accent)">${(catMap[selectedCat]||{}).label||selectedCat}</span> <button class="btn btn-outline btn-sm" style="margin-left:8px" onClick=${()=>setSelectedCat(null)}>✕ Xoá filter</button>`:''}</h3>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${categories.map(c=>html`<button key=${c} class="btn ${selectedCat===c?'':'btn-outline'} btn-sm" style="${selectedCat===c?'background:var(--grad1);color:#fff':''};display:flex;align-items:center;gap:4px"
          onClick=${()=>setSelectedCat(selectedCat===c?null:c)}>
          <span>${(catMap[c]||{}).icon||'📁'}</span> ${(catMap[c]||{}).label||c} <span class="badge" style="font-size:10px">${catCounts[c]}</span>
        </button>`)}
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:12px">🤖 Templates (${filtered.length})</h3>
      ${filtered.length===0?html`<div style="text-align:center;padding:30px;color:var(--text2)">Không tìm thấy template phù hợp.</div>`:html`
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px">
        ${filtered.map(s=>html`<div key=${s.id||s.name} style="padding:12px 14px;background:var(--bg2);border-radius:8px;border:1px solid var(--border);cursor:pointer;transition:all 0.15s"
          onClick=${()=>setSelectedSkill(s)} onMouseOver=${e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.transform='translateY(-1px)'}} onMouseOut=${e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none'}}>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <span style="font-size:28px">${s.icon||'📦'}</span>
            <div style="flex:1;min-width:0">
              <strong style="font-size:13px;display:block">${s.name}</strong>
              <span class="badge" style="font-size:10px;margin-top:2px">${(catMap[s.cat]||{}).label||s.cat}</span>
            </div>
            <div style="display:flex;gap:4px">
              <button class="btn btn-outline btn-sm" onClick=${e=>{e.stopPropagation();cloneAsAgent(s)}} title="Clone thành Agent">🤖+</button>
              <button class="btn btn-outline btn-sm" style="color:var(--red)" onClick=${e=>{e.stopPropagation();deleteTemplate(s.id,s.name)}} title="Xoá">🗑</button>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text2);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${s.desc||''}</div>
        </div>`)}
      </div>`}
    </div>
  </div>`;
}


export { GalleryPage };
