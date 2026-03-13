// DB Assistant — Natural Language to SQL with RAG pipeline
const { h, html, useState, useEffect, useRef } = window;
import { t, authFetch, StatsCard } from '/static/dashboard/shared.js';

function DbAssistantPage({ config, lang }) {
  const [connections, setConnections] = useState([]);
  const [selectedConn, setSelectedConn] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState('');
  const [examples, setExamples] = useState([]);
  const [indexedDbs, setIndexedDbs] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const inputRef = useRef(null);

  // Fetch connections & status
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const r = await authFetch('/api/v1/nl-query/status');
      const d = await r.json();
      setConnections(d.connections || []);
      setIndexedDbs(d.indexed || []);
      if (d.connections?.length > 0 && !selectedConn) {
        setSelectedConn(d.connections[0].id);
      }
    } catch (e) {
      console.warn('NL query status:', e);
    }
  };

  // Load rules & examples when connection changes
  useEffect(() => {
    if (!selectedConn) return;
    loadRules();
    loadExamples();
  }, [selectedConn]);

  const loadRules = async () => {
    if (!selectedConn) return;
    try {
      const r = await authFetch(`/api/v1/nl-query/rules/${selectedConn}`);
      const d = await r.json();
      setRules(d.rules || []);
    } catch (e) { console.warn('Rules:', e); }
  };

  const loadExamples = async () => {
    if (!selectedConn) return;
    try {
      const r = await authFetch(`/api/v1/nl-query/examples/${selectedConn}`);
      const d = await r.json();
      setExamples(d.examples || []);
    } catch (e) { console.warn('Examples:', e); }
  };

  // Ask NL question
  const askQuestion = async () => {
    if (!question.trim() || !selectedConn || loading) return;
    const q = question.trim();
    setQuestion('');
    setLoading(true);

    setHistory(prev => [...prev, {
      type: 'user', content: q, time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    }]);

    try {
      const r = await authFetch('/api/v1/nl-query/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: selectedConn, question: q })
      });
      const d = await r.json();
      setHistory(prev => [...prev, {
        type: 'bot',
        content: d.result || d.error || 'No response',
        sql: d.sql || null,
        success: d.ok !== false,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (e) {
      setHistory(prev => [...prev, {
        type: 'error',
        content: `❌ Error: ${e.message}`,
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Index schema
  const indexSchema = async () => {
    if (!selectedConn || loading) return;
    setLoading(true);
    try {
      const r = await authFetch('/api/v1/nl-query/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: selectedConn })
      });
      const d = await r.json();
      setHistory(prev => [...prev, {
        type: 'system',
        content: d.result || d.error || 'Index completed',
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
      }]);
      loadStatus();
    } catch (e) {
      setHistory(prev => [...prev, { type: 'error', content: `❌ ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  // Add rule
  const addRule = async () => {
    if (!newRule.trim() || !selectedConn) return;
    try {
      await authFetch('/api/v1/nl-query/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: selectedConn, rule: newRule.trim() })
      });
      setNewRule('');
      loadRules();
    } catch (e) { console.warn('Add rule:', e); }
  };

  const isIndexed = indexedDbs.includes(selectedConn);

  return html`<div style="padding:24px;max-width:1200px;margin:0 auto">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
      <span style="font-size:32px">🧠</span>
      <div>
        <h1 style="font-size:22px;margin:0;font-weight:700">DB Assistant</h1>
        <p style="color:var(--text2);font-size:13px;margin:2px 0 0">Hỏi database bằng tiếng Việt — AI tự viết SQL (Text2SQL RAG)</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row" style="margin-bottom:20px">
      <${StatsCard} icon="🗄️" label="Connections" value=${connections.length} />
      <${StatsCard} icon="📊" label="Indexed" value=${indexedDbs.length} accent="green" />
      <${StatsCard} icon="📝" label="Learned Q&A" value=${examples.length} accent="blue" />
      <${StatsCard} icon="📏" label="Business Rules" value=${rules.length} accent="yellow" />
    </div>

    <!-- Connection selector + tabs -->
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
      <select value=${selectedConn} onChange=${e => setSelectedConn(e.target.value)}
        style="padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);color:var(--text);font-size:13px;min-width:200px">
        ${connections.length === 0 ? html`<option>No connections configured</option>` : ''}
        ${connections.map(c => html`<option key=${c.id} value=${c.id}>🗄️ ${c.id} (${c.db_type}) — ${c.description}</option>`)}
      </select>
      <span class="badge ${isIndexed ? 'badge-green' : 'badge-red'}">${isIndexed ? '✅ Indexed' : '⚠️ Not indexed'}</span>
      ${!isIndexed && selectedConn ? html`
        <button class="btn btn-sm" style="background:var(--accent);color:#fff" onClick=${indexSchema} disabled=${loading}>
          ${loading ? '⏳ Indexing...' : '📊 Index Schema'}
        </button>
      ` : ''}
      <div style="flex:1"></div>
      <div style="display:flex;gap:2px;background:var(--bg);border-radius:8px;padding:2px;border:1px solid var(--border)">
        ${['chat', 'rules', 'examples'].map(tab => html`
          <button key=${tab} class="btn btn-sm" onClick=${() => setActiveTab(tab)}
            style=${`padding:6px 14px;border-radius:6px;font-size:12px;${activeTab === tab ? 'background:var(--accent);color:#fff' : 'background:transparent;color:var(--text2)'}`}>
            ${tab === 'chat' ? '💬 Chat' : tab === 'rules' ? '📏 Rules' : '📝 Examples'}
          </button>
        `)}
      </div>
    </div>

    <!-- Tab content -->
    ${activeTab === 'chat' ? html`
      <div class="card" style="height:calc(100vh - 320px);display:flex;flex-direction:column">
        <!-- Chat history -->
        <div style="flex:1;overflow-y:auto;padding:16px">
          ${history.length === 0 ? html`
            <div style="text-align:center;padding:60px 20px;color:var(--text2)">
              <div style="font-size:48px;margin-bottom:16px">🧠</div>
              <h3 style="font-size:16px;margin:0 0 8px;color:var(--text)">Hỏi gì database cũng trả lời</h3>
              <p style="font-size:13px;max-width:400px;margin:0 auto 16px">
                Kết nối database → Index schema → Hỏi bằng tiếng Việt → AI tự viết SQL
              </p>
              <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
                ${['Doanh thu tháng này?', 'Top 10 khách hàng?', 'Đơn hàng chưa giao?', 'So sánh QoQ'].map(q => html`
                  <button key=${q} class="btn btn-outline btn-sm" onClick=${() => setQuestion(q)}>${q}</button>
                `)}
              </div>
            </div>
          ` : html`
            ${history.map((m, i) => html`
              <div key=${i} style=${`margin-bottom:12px;padding:12px 16px;border-radius:12px;font-size:13px;line-height:1.6;
                ${m.type === 'user' ? 'background:var(--accent);color:#fff;margin-left:60px;border-bottom-right-radius:4px' :
                  m.type === 'error' ? 'background:rgba(239,68,68,.1);color:var(--red);border:1px solid rgba(239,68,68,.2)' :
                  m.type === 'system' ? 'background:rgba(99,102,241,.05);border:1px solid var(--border)' :
                  'background:var(--bg);border:1px solid var(--border);margin-right:60px;border-bottom-left-radius:4px'}`}>
                ${m.sql ? html`
                  <div style="margin-bottom:8px;font-size:11px;color:var(--text2)">Generated SQL:</div>
                  <pre style="background:var(--bg2);padding:10px;border-radius:8px;font-size:12px;font-family:var(--mono);overflow-x:auto;margin-bottom:8px;color:var(--cyan)">${m.sql}</pre>
                ` : ''}
                <div style="white-space:pre-wrap">${m.content}</div>
                ${m.time ? html`<div style="font-size:10px;color:var(--text2);margin-top:4px;text-align:right">${m.time}</div>` : ''}
              </div>
            `)}
            ${loading ? html`<div style="display:flex;align-items:center;gap:6px;color:var(--text2);font-size:13px;padding:8px">
              <span class="pulse">●</span> AI đang phân tích câu hỏi...
            </div>` : ''}
          `}
        </div>
        <!-- Input -->
        <div style="padding:12px 16px;border-top:1px solid var(--border);display:flex;gap:8px">
          <input ref=${inputRef} value=${question} onInput=${e => setQuestion(e.target.value)}
            onKeyDown=${e => e.key === 'Enter' && askQuestion()}
            placeholder="Hỏi database bằng tiếng Việt... (vd: Doanh thu tháng này bao nhiêu?)"
            style="flex:1;padding:10px 14px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:13px" />
          <button class="btn" onClick=${askQuestion} disabled=${loading || !selectedConn || !isIndexed}
            style="background:var(--accent);color:#fff;padding:10px 20px;border-radius:10px;font-weight:600">
            ${loading ? '⏳' : '🧠'} Ask
          </button>
        </div>
      </div>
    ` : ''}

    ${activeTab === 'rules' ? html`
      <div class="card" style="padding:20px">
        <h3 style="font-size:15px;margin:0 0 12px;display:flex;align-items:center;gap:8px">
          📏 Business Rules
          <span class="badge badge-outline">${selectedConn}</span>
        </h3>
        <p style="font-size:12px;color:var(--text2);margin:0 0 16px">
          Rules AI phải tuân theo khi viết SQL. Ví dụ: "Revenue = SUM(total)" hoặc "Always exclude deleted_at IS NOT NULL".
        </p>
        <!-- Add rule -->
        <div style="display:flex;gap:8px;margin-bottom:16px">
          <input value=${newRule} onInput=${e => setNewRule(e.target.value)}
            onKeyDown=${e => e.key === 'Enter' && addRule()}
            placeholder="Thêm business rule mới..."
            style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:13px" />
          <button class="btn btn-sm" style="background:var(--accent);color:#fff" onClick=${addRule}>+ Add</button>
        </div>
        <!-- Rules list -->
        ${rules.length === 0 ? html`
          <div style="text-align:center;padding:40px;color:var(--text2)">
            📏 Chưa có rules. Thêm rules để AI viết SQL chính xác hơn.
          </div>
        ` : html`
          ${rules.map((r, i) => html`
            <div key=${i} style="padding:10px 14px;margin-bottom:6px;background:var(--bg);border-radius:8px;border:1px solid var(--border);display:flex;align-items:center;gap:10px;font-size:13px">
              <span style="color:var(--accent);font-weight:600">${i + 1}.</span>
              <span style="flex:1">${r.rule}</span>
              <span class="badge badge-outline" style="font-size:10px">${r.connection_id}</span>
            </div>
          `)}
        `}
      </div>
    ` : ''}

    ${activeTab === 'examples' ? html`
      <div class="card" style="padding:20px">
        <h3 style="font-size:15px;margin:0 0 12px;display:flex;align-items:center;gap:8px">
          📝 Learned Q&A Pairs
          <span class="badge badge-outline">${selectedConn}</span>
          <span class="badge badge-green">${examples.length} examples</span>
        </h3>
        <p style="font-size:12px;color:var(--text2);margin:0 0 16px">
          Những câu hỏi + SQL đã được xác nhận đúng. AI sẽ dùng làm ví dụ (few-shot) khi gặp câu hỏi tương tự.
        </p>
        ${examples.length === 0 ? html`
          <div style="text-align:center;padding:40px;color:var(--text2)">
            📝 Chưa có examples. Hỏi câu hỏi NL → AI viết SQL đúng → tự động lưu.
          </div>
        ` : html`
          ${examples.map((e, i) => html`
            <div key=${i} style="padding:12px 16px;margin-bottom:8px;background:var(--bg);border-radius:10px;border:1px solid var(--border)">
              <div style="font-size:13px;font-weight:500;margin-bottom:6px">💬 ${e.question}</div>
              <pre style="font-size:12px;font-family:var(--mono);color:var(--cyan);background:var(--bg2);padding:8px 12px;border-radius:6px;margin:0;overflow-x:auto">${e.sql}</pre>
              <div style="display:flex;gap:8px;margin-top:6px;font-size:10px;color:var(--text2)">
                <span>Tables: ${(e.tables_used || []).join(', ')}</span>
                <span>•</span>
                <span>${e.created_at || ''}</span>
              </div>
            </div>
          `)}
        `}
      </div>
    ` : ''}
  </div>`;
}

export { DbAssistantPage };
