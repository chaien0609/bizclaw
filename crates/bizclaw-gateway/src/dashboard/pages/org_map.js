// OrgMapPage — extracted from app.js for modularity
// Uses window globals from index.html (Preact + HTM)
const { h, html, useState, useEffect, useContext, useCallback, useRef, useMemo } = window;
import { t, authFetch, authHeaders, StatsCard } from '/static/dashboard/shared.js';

function OrgMapPage({ lang }) {
  const { showToast, navigate } = useContext(AppContext);
  const [agents,setAgents] = useState([]);
  const [links,setLinks] = useState([]);
  const [loading,setLoading] = useState(true);
  const [selected,setSelected] = useState(null);
  const [view,setView] = useState('tree'); // tree | grid

  useEffect(()=>{
    (async()=>{
      try {
        const [agRes, orchRes] = await Promise.all([authFetch('/api/v1/agents'), authFetch('/api/v1/orchestration/links')]);
        const agData=await agRes.json(); const orchData=await orchRes.json();
        setAgents(agData.agents||[]);
        setLinks(orchData.links||[]);
      } catch(e){}
      setLoading(false);
    })();
  },[]);

  if(loading) return html`<div style="text-align:center;padding:60px;color:var(--text2)">⏳ Loading Org Map...</div>`;

  // Build hierarchy tree
  const agentMap = {};
  agents.forEach(a => { agentMap[a.name] = {...a, children: []}; });
  
  links.forEach(l => {
    const from = l.from_agent || l.source;
    const to = l.to_agent || l.target;
    if(agentMap[from] && agentMap[to]) agentMap[from].children.push(to);
  });

  // Find roots (agents not referenced as children)
  const childSet = new Set();
  links.forEach(l=>childSet.add(l.to_agent||l.target));
  const roots = Object.keys(agentMap).filter(k=>!childSet.has(k));
  if(roots.length===0 && agents.length>0) roots.push(agents[0].name);

  const colors = ['var(--accent)','var(--green)','var(--blue)','var(--orange)','var(--pink)','var(--cyan)'];
  const roleIcons = {main:'👑',sales:'💰',marketing:'📢',coder:'💻',writer:'✍️',analyst:'📊',support:'🎧',general:'🤖',hr:'🧑‍💼'};

  // SVG-based org chart — proper non-overlapping tree layout
  const nodeW=180, nodeH=70, gapX=50, gapY=90;
  const nodePositions = {};
  let maxX=0, maxY=0;

  // Deduplicate children: each node appears under ONE parent only (first link wins)
  const claimed = new Set();
  const treeChildren = {};
  roots.forEach(r => { treeChildren[r] = []; });
  Object.keys(agentMap).forEach(k => { if(!treeChildren[k]) treeChildren[k] = []; });

  // BFS from roots to assign children without duplication
  const queue = [...roots];
  const visited = new Set(roots);
  while(queue.length > 0) {
    const node = queue.shift();
    const ch = (agentMap[node]||{}).children||[];
    ch.forEach(c => {
      if(!claimed.has(c)) {
        claimed.add(c);
        if(!treeChildren[node]) treeChildren[node] = [];
        treeChildren[node].push(c);
        if(!visited.has(c)) { visited.add(c); queue.push(c); }
      }
    });
  }

  // Bottom-up subtree width calculation
  const subtreeWidth = {};
  const calcWidth = (name) => {
    const ch = treeChildren[name] || [];
    if(ch.length === 0) { subtreeWidth[name] = nodeW; return nodeW; }
    let total = 0;
    ch.forEach((c,i) => { total += calcWidth(c); if(i < ch.length-1) total += gapX; });
    subtreeWidth[name] = Math.max(total, nodeW);
    return subtreeWidth[name];
  };
  roots.forEach(r => calcWidth(r));

  // Position nodes top-down
  const layoutNode = (name, x, y, depth) => {
    const w = subtreeWidth[name] || nodeW;
    const nodeX = x + (w - nodeW) / 2;
    nodePositions[name] = { x: nodeX, y, depth };
    maxX = Math.max(maxX, nodeX + nodeW);
    maxY = Math.max(maxY, y + nodeH);
    const ch = treeChildren[name] || [];
    let childX = x;
    ch.forEach(c => {
      layoutNode(c, childX, y + nodeH + gapY, depth + 1);
      childX += (subtreeWidth[c] || nodeW) + gapX;
    });
  };

  let startX = 30;
  roots.forEach(r => {
    layoutNode(r, startX, 30, 0);
    startX += (subtreeWidth[r] || nodeW) + gapX * 2;
  });

  const svgW = Math.max(maxX + 60, 600);
  const svgH = Math.max(maxY + 60, 300);

  // Build link pairs from original data (not tree-deduplicated) for drawing all connections
  const linkPairs = links.map(l => ({
    from: l.from_agent || l.source,
    to: l.to_agent || l.target,
    type: l.link_type || l.direction || ''
  }));

  return html`<div>
    <div class="page-header"><div>
      <h1>🗺️ Org Map</h1>
      <div class="sub">Agent hierarchy — click agent to view details</div>
    </div>
      <div style="display:flex;gap:4px">
        <button class="btn ${view==='tree'?'':'btn-outline'}" style="padding:6px 14px" onClick=${()=>setView('tree')}>🌳 Tree</button>
        <button class="btn ${view==='grid'?'':'btn-outline'}" style="padding:6px 14px" onClick=${()=>setView('grid')}>📊 Grid</button>
      </div>
    </div>

    <div class="stats">
      <${StatsCard} label="Agents" value=${agents.length} color="accent" icon="🤖" />
      <${StatsCard} label="Links" value=${links.length} color="blue" icon="🔗" />
      <${StatsCard} label="Root Nodes" value=${roots.length} color="green" icon="👑" />
    </div>

    ${view==='tree' ? html`
      <div class="card" style="overflow:auto;min-height:400px;position:relative">
        <svg width=${svgW} height=${svgH} style="font-family:var(--font)">
          <!-- Connection lines (from ALL original links, including cross-links) -->
          ${linkPairs.map((l,i)=>{
            const from = nodePositions[l.from];
            const to = nodePositions[l.to];
            if(!from||!to) return null;
            const x1=from.x+nodeW/2, y1=from.y+nodeH;
            const x2=to.x+nodeW/2, y2=to.y;
            // Curved connector — vertical if same column, bezier otherwise
            const midY = (y1+y2)/2;
            const isCross = from.depth >= to.depth; // cross-link (not parent→child)
            return html`<path key=${'line'+i}
              d="M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}"
              fill="none" stroke=${isCross?'var(--orange)':'var(--accent)'}
              stroke-width=${isCross?1.5:2} stroke-opacity=${isCross?0.5:0.4}
              stroke-dasharray=${isCross?'6,4':''} />`;
          })}
          <!-- Agent nodes -->
          ${Object.entries(nodePositions).map(([name,pos],i)=>{
            const a=agentMap[name]||{name,role:'',children:[]};
            const col=colors[pos.depth%colors.length];
            const isSelected=selected===name;
            return html`<g key=${name} style="cursor:pointer" onClick=${()=>setSelected(isSelected?null:name)}>
              <rect x=${pos.x} y=${pos.y} width=${nodeW} height=${nodeH} rx="10" ry="10"
                fill="var(--surface)" stroke=${isSelected?col:'var(--border)'} stroke-width=${isSelected?2.5:1.5}
                style="filter:${isSelected?'drop-shadow(0 4px 12px rgba(99,102,241,.3))':''}" />
              <text x=${pos.x+14} y=${pos.y+26} font-size="13" font-weight="700" fill="var(--text)">
                ${(roleIcons[a.role]||'🤖')} ${name.length>14?name.slice(0,12)+'..':name}
              </text>
              <text x=${pos.x+14} y=${pos.y+44} font-size="10" fill="var(--text2)">
                ${a.provider||'default'} / ${(a.model||'—').length>16?(a.model||'—').slice(0,14)+'..':a.model||'—'}
              </text>
              <text x=${pos.x+14} y=${pos.y+58} font-size="9" fill=${col}>
                ${a.role||'agent'} ${(a.channels||[]).length>0?'📡'+a.channels.length:''}
              </text>
            </g>`;
          })}
        </svg>
      </div>
    ` : html`
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
        ${agents.length===0?html`<div class="card" style="text-align:center;grid-column:span 3;padding:30px;color:var(--text2)">Chưa có agent. Vào AI Agent → Tạo agent!</div>`:''}
        ${agents.map((a,i)=>html`<div key=${a.name} class="card" style="cursor:pointer;border-left:3px solid ${colors[i%colors.length]}" onClick=${()=>setSelected(selected===a.name?null:a.name)}>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:24px">${roleIcons[a.role]||'🤖'}</span>
            <div><strong style="font-size:14px">${a.name}</strong><div style="font-size:11px;color:var(--text2)">${a.role||'agent'}</div></div>
          </div>
          <div style="font-size:11px;color:var(--text2);margin-bottom:6px">${a.description||'—'}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            <span class="badge badge-blue">${a.provider||'—'}</span>
            <span class="badge">${a.model||'—'}</span>
          </div>
        </div>`)}
      </div>
    `}

    ${selected && html`
      <div class="card" style="margin-top:14px;border:1px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>${roleIcons[(agentMap[selected]||{}).role]||'🤖'} ${selected}</h3>
          <div style="display:flex;gap:6px">
            <button class="btn" style="background:var(--grad1);color:#fff;padding:6px 16px" onClick=${()=>navigate('chat')}>💬 Chat</button>
            <button class="btn btn-outline btn-sm" onClick=${()=>setSelected(null)}>✕</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:13px">
          ${[['Vai trò',(agentMap[selected]||{}).role||'—'],['Provider',(agentMap[selected]||{}).provider||'default'],['Model',(agentMap[selected]||{}).model||'—'],
            ['Channels',((agentMap[selected]||{}).channels||[]).join(', ')||'—'],['Description',(agentMap[selected]||{}).description||'—'],
            ['Delegates to',((agentMap[selected]||{}).children||[]).join(', ')||'none']
          ].map(([k,v])=>html`<div key=${k} style="padding:8px 12px;background:var(--bg2);border-radius:6px"><div style="font-size:10px;color:var(--text2);text-transform:uppercase;margin-bottom:2px">${k}</div><strong>${v}</strong></div>`)}
        </div>
      </div>
    `}
  </div>`;
}


export { OrgMapPage };
