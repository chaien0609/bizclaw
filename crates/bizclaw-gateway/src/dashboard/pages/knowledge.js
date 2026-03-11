// KnowledgePage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function KnowledgePage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [docs,setDocs] = useState([]);
  const [loading,setLoading] = useState(true);
  const [showAdd,setShowAdd] = useState(false);
  const [addForm,setAddForm] = useState({name:'',content:'',source:'upload'});
  const [uploading,setUploading] = useState(false);
  const [dragOver,setDragOver] = useState(false);

  const load = async () => {
    try{const r=await authFetch('/api/v1/knowledge/documents');const d=await r.json();setDocs(d.documents||[]);}catch(e){}
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const addDoc = async () => {
    if(!addForm.name.trim()||!addForm.content.trim()) { showToast('⚠️ Nhập tên và nội dung','error'); return; }
    try {
      const r = await authFetch('/api/v1/knowledge/documents', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify(addForm)
      });
      const d=await r.json();
      if(d.ok) { showToast('✅ Đã thêm: '+addForm.name+' ('+d.chunks+' chunks)','success'); setShowAdd(false); setAddForm({name:'',content:'',source:'upload'}); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  // Upload file (PDF, TXT, MD, etc.) via multipart
  const uploadFile = async (file) => {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxSize) {
      showToast('❌ File quá lớn (tối đa 10MB)', 'error');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const r = await authFetch('/api/v1/knowledge/upload', {
        method: 'POST',
        body: formData,
      });
      const d = await r.json();
      if (d.ok) {
        const sizeKB = Math.round((d.size || file.size) / 1024);
        showToast('✅ ' + d.name + ' → ' + d.chunks + ' chunks (' + sizeKB + 'KB)', 'success');
        load();
      } else {
        showToast('❌ ' + (d.error || 'Upload failed'), 'error');
      }
    } catch(e) {
      showToast('❌ Upload error: ' + e.message, 'error');
    }
    setUploading(false);
  };

  // Handle drag-and-drop
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        uploadFile(files[i]);
      }
    }
  };

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => { setDragOver(false); };

  // File picker
  const pickFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt,.md,.json,.csv,.log,.toml,.yaml,.yml';
    input.multiple = true;
    input.onchange = (e) => {
      const files = e.target.files;
      for (let i = 0; i < files.length; i++) {
        uploadFile(files[i]);
      }
    };
    input.click();
  };

  const deleteDoc = async (id,name) => {
    if(!confirm('Xoá tài liệu "'+name+'"?')) return;
    try {
      const r = await authFetch('/api/v1/knowledge/documents/'+id, {method:'DELETE'});
      const d=await r.json();
      if(d.ok) { showToast('🗑️ Đã xoá: '+name,'success'); load(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';

  const dropZoneStyle = dragOver
    ? 'border:2px dashed var(--accent);background:rgba(99,102,241,0.08);border-radius:12px;padding:32px;text-align:center;transition:all 0.2s;cursor:pointer'
    : 'border:2px dashed var(--border);background:var(--bg2);border-radius:12px;padding:32px;text-align:center;transition:all 0.2s;cursor:pointer';

  return html`<div>
    <div class="page-header"><div><h1>📚 ${t('kb.title',lang)}</h1><div class="sub">${t('kb.subtitle',lang)}</div></div>
      <div style="display:flex;gap:8px">
        <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${pickFile}>📤 Upload File</button>
        <button class="btn btn-outline" onClick=${()=>setShowAdd(!showAdd)}>✏️ Paste Text</button>
      </div>
    </div>
    <div class="stats"><${StatsCard} label=${t('kb.documents',lang)} value=${docs.length} color="accent" icon="📄" /><${StatsCard} label=${t('kb.chunks',lang)} value=${docs.reduce((s,d)=>s+(d.chunks||0),0)} color="blue" icon="📝" /></div>

    ${html`<div class="card" style="margin-bottom:14px"
      onDrop=${onDrop} onDragOver=${onDragOver} onDragLeave=${onDragLeave}>
      <div style="${dropZoneStyle}">
        ${uploading ? html`
          <div style="font-size:32px;margin-bottom:8px">⏳</div>
          <div style="font-size:14px;color:var(--text2)">Đang xử lý...</div>
        ` : html`
          <div style="font-size:32px;margin-bottom:8px">${dragOver ? '📥' : '📄'}</div>
          <div style="font-size:14px;color:var(--text2)">Kéo thả file vào đây hoặc click <strong>Upload File</strong></div>
          <div style="margin-top:8px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
            <span class="badge badge-green">PDF</span>
            <span class="badge badge-blue">TXT</span>
            <span class="badge badge-blue">MD</span>
            <span class="badge badge-blue">JSON</span>
            <span class="badge badge-blue">CSV</span>
          </div>
          <div style="margin-top:6px;font-size:11px;color:var(--text2)">Tối đa 10MB • PDF sẽ được trích xuất text tự động</div>
        `}
      </div>
    </div>`}

    ${showAdd && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <h3 style="margin-bottom:12px">✏️ Paste nội dung trực tiếp</h3>
        <div style="display:grid;gap:10px;font-size:13px">
          <label>Tên tài liệu<input style="${inp}" value=${addForm.name} onInput=${e=>setAddForm(f=>({...f,name:e.target.value}))} placeholder="guide.md, faq.txt..." /></label>
          <label>Nội dung<textarea style="${inp};min-height:200px;resize:vertical;font-family:var(--mono)" value=${addForm.content} onInput=${e=>setAddForm(f=>({...f,content:e.target.value}))} placeholder="Paste nội dung tài liệu vào đây... (Markdown, text, FAQ)" /></label>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>setShowAdd(false)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${addDoc}>💾 Thêm</button>
        </div>
      </div>
    `}

    <div class="card">${loading?html`<div style="text-align:center;padding:20px;color:var(--text2)">Loading...</div>`:docs.length===0?html`<div style="text-align:center;padding:40px;color:var(--text2)"><div style="font-size:48px;margin-bottom:12px">📚</div><p>Chưa có tài liệu. Upload PDF hoặc paste text để bắt đầu.</p></div>`:html`
      <table><thead><tr><th>Tài liệu</th><th>Chunks</th><th>Source</th><th style="text-align:right">Thao tác</th></tr></thead><tbody>
        ${docs.map(d=>html`<tr key=${d.id}><td><strong>${d.name && d.name.endsWith('.pdf') ? '📄 ' : '📝 '}${d.title||d.name}</strong></td><td>${d.chunks}</td><td style="font-size:12px">${d.source}</td>
          <td style="text-align:right"><button class="btn btn-outline btn-sm" style="color:var(--red)" onClick=${()=>deleteDoc(d.id,d.title||d.name)} title="Xoá">🗑️</button></td>
        </tr>`)}
      </tbody></table>
    `}</div>
  </div>`;
}


export { KnowledgePage };
