// WikiPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function WikiPage({ lang }) {
  const [activeId, setActiveId] = useState('getting-started');
  const [searchQ, setSearchQ] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const article = WIKI_ARTICLES.find(a => a.id === activeId) || WIKI_ARTICLES[0];
  const results = searchQ ? WIKI_ARTICLES.filter(a =>
    a.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQ.toLowerCase())
  ) : null;

  return html`
    <div class="page-header"><div><h1>📖 Wiki & Hướng dẫn</h1><div class="sub">Tài liệu hướng dẫn sử dụng hệ thống</div></div>
      <button class="btn btn-outline btn-sm" onclick=${() => setShowSearch(!showSearch)}>🔍 Tìm kiếm</button>
    </div>
    ${showSearch && html`<div style="margin-bottom:16px"><input type="text" placeholder="Tìm kiếm..." value=${searchQ} onInput=${e => setSearchQ(e.target.value)} style="width:100%;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px" /></div>`}
    <div style="display:grid;grid-template-columns:200px 1fr;gap:16px">
      <div class="card" style="position:sticky;top:20px;align-self:start">
        <div style="font-size:12px;font-weight:600;color:var(--accent);margin-bottom:10px">📑 Mục lục</div>
        ${WIKI_ARTICLES.map(a => html`
          <a href="#" onclick=${e => { e.preventDefault(); setActiveId(a.id); setSearchQ(''); }}
            style="display:block;padding:3px 6px;border-radius:4px;text-decoration:none;font-size:12px;line-height:2;color:${activeId===a.id?'var(--accent)':'var(--text)'};background:${activeId===a.id?'var(--bg2)':'transparent'};font-weight:${activeId===a.id?'600':'400'}">${a.icon} ${a.title}</a>
        `)}
      </div>
      <div class="card" style="min-height:400px;font-size:13px;line-height:1.8" dangerouslySetInnerHTML=${{ __html: results ? (results.length ? '<h2>🔍 '+results.length+' kết quả</h2>' + results.map(a => '<div class="card" style="margin:8px 0;cursor:pointer" onclick=""><strong>'+a.icon+' '+a.title+'</strong></div>').join('') : '<p style="color:var(--text2);text-align:center;padding:30px">Không tìm thấy</p>') : article.content }} />
    </div>
  `;
}


export { WikiPage };
