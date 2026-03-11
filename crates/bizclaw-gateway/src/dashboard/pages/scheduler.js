// SchedulerPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function SchedulerPage({ lang }) {
  const { showToast } = useContext(AppContext);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({name:'',cron:'0 9 * * *',prompt:'',max_retries:'3'});

  const loadData = async () => {
    try {
      const [tasksRes, notiRes] = await Promise.all([
        authFetch('/api/v1/scheduler/tasks'),
        authFetch('/api/v1/scheduler/notifications'),
      ]);
      const tasksData = await tasksRes.json();
      const notiData = await notiRes.json();
      setTasks(tasksData.tasks || []);
      setStats(tasksData.stats || {});
      setNotifications(notiData.notifications || []);
    } catch (e) { console.error('Scheduler load err:', e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const createTask = async () => {
    if(!form.name.trim()) { showToast('⚠️ Nhập tên task','error'); return; }
    try {
      const r = await authFetch('/api/v1/scheduler/tasks', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          name: form.name,
          task_type: { Cron: { expression: form.cron } },
          action: { AgentPrompt: { prompt: form.prompt } },
          retry: { max_retries: parseInt(form.max_retries)||3, delay_secs: 60 },
        })
      });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const txt = await r.text();
      let d; try { d = JSON.parse(txt); } catch(e) { d = {ok: true}; }
      if(d.ok !== false) { showToast('✅ Đã tạo task: '+form.name,'success'); setShowForm(false); setForm({name:'',cron:'0 9 * * *',prompt:'',max_retries:'3'}); loadData(); }
      else showToast('❌ '+(d.error||'Lỗi'),'error');
    } catch(e) { showToast('❌ '+e.message,'error'); }
  };

  const toggleTask = async (id, enabled) => {
    await authFetch('/api/v1/scheduler/tasks/' + id + '/toggle', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ enabled: !enabled })
    });
    loadData();
  };

  const deleteTask = async (id) => {
    if (!confirm('Xóa task này?')) return;
    await authFetch('/api/v1/scheduler/tasks/' + id, { method: 'DELETE', headers: authHeaders() });
    loadData();
  };

  const statusBadge = (status, task) => {
    if (!status) return html`<span class="badge badge-blue">pending</span>`;
    if (status === 'Pending') return html`<span class="badge badge-blue">pending</span>`;
    if (status === 'Running') return html`<span class="badge badge-yellow">running</span>`;
    if (status === 'Completed') return html`<span class="badge badge-green">completed</span>`;
    if (status === 'Disabled') return html`<span class="badge badge-purple">disabled</span>`;
    if (typeof status === 'object' && status.RetryPending)
      return html`<span class="badge badge-orange">🔄 retry ${status.RetryPending.attempt}/${task?.retry?.max_retries || 3}</span>`;
    if (typeof status === 'object' && status.Failed)
      return html`<span class="badge badge-red" title=${status.Failed}>❌ failed</span>`;
    return html`<span class="badge badge-blue">${JSON.stringify(status)}</span>`;
  };

  const taskTypeLabel = (task) => {
    const tt = task.task_type;
    if (!tt) return '—';
    if (tt.Once) return '⏱ Once';
    if (tt.Cron) return '📅 ' + tt.Cron.expression;
    if (tt.Interval) return '🔁 ' + tt.Interval.every_secs + 's';
    return JSON.stringify(tt);
  };

  const formatTime = (t) => {
    if (!t) return '—';
    return new Date(t).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const active = tasks.filter(t => t.enabled).length;
  const retrying = tasks.filter(t => t.status && typeof t.status === 'object' && t.status.RetryPending).length;
  const failed = tasks.filter(t => t.status && typeof t.status === 'object' && t.status.Failed && t.fail_count >= (t.retry?.max_retries || 3)).length;

  const inp = 'width:100%;padding:8px;margin-top:4px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px';

  return html`<div>
    <div class="page-header"><div>
      <h1>⏰ ${t('sched.title', lang)}</h1>
      <div class="sub">${t('sched.subtitle', lang)}</div>
    </div>
      <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 18px" onClick=${()=>setShowForm(!showForm)}>+ Tạo Task</button>
    </div>

    <div class="stats">
      <${StatsCard} label="Total Tasks" value=${tasks.length} color="accent" />
      <${StatsCard} label="Active" value=${active} color="green" />
      <${StatsCard} label=${t('sched.retrying', lang)} value=${retrying} color="orange" />
      <${StatsCard} label=${t('sched.failed', lang)} value=${failed} color="red" />
    </div>

    ${showForm && html`
      <div class="card" style="margin-bottom:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>➕ Tạo Task mới</h3>
          <button class="btn btn-outline btn-sm" onClick=${()=>setShowForm(false)}>✕ Đóng</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
          <label>Tên Task<input style="${inp}" value=${form.name} onInput=${e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Daily Report" /></label>
          <label>Cron Expression
            <input style="${inp}" value=${form.cron} onInput=${e=>setForm(f=>({...f,cron:e.target.value}))} placeholder="0 9 * * *" />
            <div style="font-size:10px;color:var(--text2);margin-top:2px">0 9 * * * = 9:00 mỗi ngày | */30 * * * * = mỗi 30p | 0 8 * * 1 = T2 8:00</div>
          </label>
          <label style="grid-column:span 2">Prompt (Agent sẽ chạy)
            <textarea style="${inp};min-height:80px;resize:vertical" value=${form.prompt} onInput=${e=>setForm(f=>({...f,prompt:e.target.value}))} placeholder="Tóm tắt tin tức hôm nay và gửi báo cáo..." />
          </label>
          <label>Max Retries<input type="number" style="${inp}" value=${form.max_retries} onInput=${e=>setForm(f=>({...f,max_retries:e.target.value}))} min="0" max="10" /></label>
        </div>
        <div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-outline" onClick=${()=>setShowForm(false)}>Huỷ</button>
          <button class="btn" style="background:var(--grad1);color:#fff;padding:8px 20px" onClick=${createTask}>💾 Tạo</button>
        </div>
      </div>
    `}

    <div class="card">
      <h3 style="margin-bottom:12px">📋 Tasks (${tasks.length})</h3>
      ${loading ? html`<div style="color:var(--text2);text-align:center;padding:20px">Loading...</div>` : html`
        <table>
          <thead><tr>
            <th>Task</th><th>Type</th><th>Action</th><th>Status</th>
            <th>Retries</th><th>Next Run</th><th>Error</th><th></th>
          </tr></thead>
          <tbody>
            ${tasks.map(task => html`<tr key=${task.id}>
              <td><strong>${task.name}</strong></td>
              <td>${taskTypeLabel(task)}</td>
              <td style="font-size:12px">${task.action?.AgentPrompt ? '🤖 Agent' : task.action?.Webhook ? '🌐 Webhook' : '📢 Notify'}</td>
              <td>${statusBadge(task.status, task)}</td>
              <td style="font-family:var(--mono);font-size:12px">${task.fail_count || 0}/${task.retry?.max_retries || 3}</td>
              <td style="font-family:var(--mono);font-size:12px">${formatTime(task.next_run)}</td>
              <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:var(--red)" title=${task.last_error || ''}>
                ${task.last_error ? task.last_error.substring(0, 50) : '—'}
              </td>
              <td style="white-space:nowrap">
                <button class="btn btn-outline btn-sm" onClick=${() => toggleTask(task.id, task.enabled)}>
                  ${task.enabled ? '⏸' : '▶'}
                </button>
                <button class="btn btn-sm" style="background:var(--red);color:#fff;margin-left:4px" onClick=${() => deleteTask(task.id)}>🗑</button>
              </td>
            </tr>`)}
          </tbody>
        </table>
      `}
    </div>

    ${notifications.length > 0 && html`
      <div class="card" style="margin-top:16px">
        <h3 style="margin-bottom:12px">📨 Notification History (${notifications.length})</h3>
        <table>
          <thead><tr><th>Title</th><th>Priority</th><th>Source</th><th>Time</th></tr></thead>
          <tbody>
            ${notifications.slice(0, 20).map(n => html`<tr key=${n.id}>
              <td>${n.title}</td>
              <td><span class="badge ${n.priority === 'urgent' ? 'badge-red' : n.priority === 'high' ? 'badge-orange' : 'badge-blue'}">${n.priority}</span></td>
              <td style="font-size:12px">${n.source}</td>
              <td style="font-family:var(--mono);font-size:12px">${formatTime(n.created_at)}</td>
            </tr>`)}
          </tbody>
        </table>
      </div>
    `}
  </div>`;
}


export { SchedulerPage };
