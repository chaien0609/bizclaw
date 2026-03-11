// ChatWidget — Floating chat widget component
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    { from:'bot', text:'👋 Chào bạn! Hỏi về: Chat, Channels, Agent, Lịch trình, Kho tri thức...' }
  ]);
  const [input, setInput] = useState('');
  const msgsRef = useRef(null);
  const { navigate } = useContext(AppContext);

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMsgs(prev => [...prev, { from:'user', text: q }]);
    setInput('');
    const lq = q.toLowerCase();
    let best = null, bestScore = 0;
    WIKI_ARTICLES.forEach(a => {
      let score = 0;
      const hay = (a.title+' '+a.content).toLowerCase();
      lq.split(/\s+/).forEach(k => { if(hay.includes(k)) score++; });
      if(score > bestScore) { bestScore = score; best = a; }
    });
    setTimeout(() => {
      if(best && bestScore >= 1) {
        const snippet = best.content.replace(/<[^>]+>/g,'').slice(0,200);
        setMsgs(prev => [...prev, { from:'bot', text: `📖 ${best.icon} ${best.title}\n\n${snippet}...\n\n→ Xem Wiki để biết thêm` }]);
      } else {
        setMsgs(prev => [...prev, { from:'bot', text: '🤔 Thử hỏi: chat, telegram, agent, lịch trình...' }]);
      }
    }, 300);
  };

  useEffect(() => { if(msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight; }, [msgs]);

  return html`
    <div style="position:fixed;bottom:20px;right:20px;z-index:9999">
      ${open && html`
        <div style="width:360px;height:480px;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.4);display:flex;flex-direction:column;overflow:hidden;margin-bottom:10px">
          <div style="padding:12px 16px;background:linear-gradient(135deg,var(--accent),#7c3aed);color:#fff;display:flex;justify-content:space-between;align-items:center;border-radius:14px 14px 0 0">
            <div><strong>🤖 Trợ lý</strong><div style="font-size:10px;opacity:0.8">Hỏi cách sử dụng</div></div>
            <button onclick=${() => setOpen(false)} style="background:none;border:none;color:#fff;font-size:16px;cursor:pointer">✕</button>
          </div>
          <div ref=${msgsRef} style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px">
            ${msgs.map(m => html`
              <div style="background:${m.from==='user'?'var(--accent)':'var(--bg2)'};color:${m.from==='user'?'#fff':'var(--text)'};padding:8px 12px;border-radius:10px;font-size:12px;line-height:1.6;max-width:85%;align-self:${m.from==='user'?'flex-end':'flex-start'};white-space:pre-wrap">${m.text}</div>
            `)}
          </div>
          <div style="padding:8px 12px;border-top:1px solid var(--border);display:flex;gap:6px">
            <input value=${input} onInput=${e => setInput(e.target.value)} onKeyDown=${e => e.key==='Enter' && send()} placeholder="Hỏi gì đó..." style="flex:1;padding:7px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:12px" />
            <button onclick=${send} class="btn btn-primary btn-sm">📤</button>
          </div>
        </div>
      `}
      <button onclick=${() => setOpen(!open)} style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#7c3aed);border:none;color:#fff;font-size:20px;cursor:pointer;box-shadow:0 4px 16px rgba(99,102,241,0.4);transition:transform 0.2s" onmouseenter="this.style.transform='scale(1.1)'" onmouseleave="this.style.transform='scale(1)'">💬</button>
    </div>
  `;
}


export { ChatWidget };
