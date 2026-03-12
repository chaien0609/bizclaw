// BizClaw Edge IoT Gateway — MQTT/CoAP bridge + Xiaozhi Voice
const { html, useState, useEffect } = window;
import { authFetch } from '/static/dashboard/shared.js';

export function EdgeGatewayPage({ config, lang }) {
  const [edgeConfig, setEdgeConfig] = useState({ enabled:false, node_id:'edge-001', mqtt_broker:'mqtt://localhost:1883', mqtt_topic:'bizclaw/edge', coap_port:5683, sync_interval:60, xiaozhi_enabled:false });
  const [devices, setDevices] = useState([
    { id:'xiaozhi-001', name:'Xiaozhi Speaker', type:'voice', status:'online', last_seen:'2 min ago', firmware:'2.1.0', messages:342 },
    { id:'sensor-temp-01', name:'Temperature Sensor', type:'sensor', status:'online', last_seen:'30s ago', firmware:'1.0.3', messages:1205 },
    { id:'cam-door-01', name:'Door Camera', type:'camera', status:'offline', last_seen:'2h ago', firmware:'1.2.1', messages:89 },
    { id:'relay-light-01', name:'Light Controller', type:'actuator', status:'online', last_seen:'1 min ago', firmware:'1.1.0', messages:567 },
    { id:'xiaozhi-002', name:'Xiaozhi Mini', type:'voice', status:'online', last_seen:'5 min ago', firmware:'2.0.8', messages:128 }
  ]);
  const [tab, setTab] = useState('devices');
  const u = (k,v)=>setEdgeConfig(p=>({...p,[k]:v}));
  const iS = 'padding:8px 12px;border-radius:6px;border:1px solid var(--border);background:var(--bg);color:var(--text1);font-size:13px;width:100%';
  const typeIcon = { voice:'🎙️', sensor:'🌡️', camera:'📹', actuator:'💡' };
  const online = devices.filter(d=>d.status==='online').length;

  return html`<div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <div><h2 style="color:var(--text1);margin:0">📡 Edge IoT Gateway</h2>
        <p style="color:var(--text2);font-size:12px;margin:4px 0 0">MQTT/CoAP bridge · Xiaozhi Voice · ${online}/${devices.length} devices online</p></div>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;color:var(--text2)">Gateway</span>
        <button onClick=${()=>u('enabled',!edgeConfig.enabled)} style="width:44px;height:24px;border-radius:12px;border:none;background:${edgeConfig.enabled?'#10b981':'var(--border)'};cursor:pointer;position:relative">
          <span style="position:absolute;top:2px;${edgeConfig.enabled?'right:2px':'left:2px'};width:20px;height:20px;border-radius:50%;background:#fff;transition:all 0.2s"></span></button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
      ${[{i:'📡',l:'Devices',v:devices.length,c:'#6366f1'},{i:'🟢',l:'Online',v:online,c:'#10b981'},{i:'💬',l:'Messages',v:devices.reduce((s,d)=>s+d.messages,0).toLocaleString(),c:'#f59e0b'},{i:'🎙️',l:'Voice Devices',v:devices.filter(d=>d.type==='voice').length,c:'#ef4444'}].map(x=>html`
        <div class="card" style="padding:14px;text-align:center">
          <div style="font-size:20px">${x.i}</div>
          <div style="font-size:24px;font-weight:700;color:${x.c}">${x.v}</div>
          <div style="font-size:11px;color:var(--text2)">${x.l}</div>
        </div>`)}
    </div>

    <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:8px">
      ${[['devices','📱 Devices'],['mqtt','📡 MQTT'],['xiaozhi','🎙️ Xiaozhi'],['config','⚙️ Config']].map(([id,l])=>html`
        <button onClick=${()=>setTab(id)} style="padding:8px 16px;border-radius:6px 6px 0 0;border:none;background:${id===tab?'var(--accent)':'transparent'};color:${id===tab?'#fff':'var(--text2)'};cursor:pointer;font-size:13px">${l}</button>`)}
    </div>

    ${tab==='devices'?html`
      <div class="card" style="padding:16px">
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <tr style="color:var(--text2)"><th style="text-align:left;padding:8px 0">Device</th><th>Type</th><th>Status</th><th>Last Seen</th><th>FW</th><th>Messages</th></tr>
          ${devices.map(d=>html`<tr style="border-top:1px solid var(--border)">
            <td style="padding:8px 0;color:var(--text1);font-weight:500">${typeIcon[d.type]||'📦'} ${d.name}<div style="font-size:10px;color:var(--text2)">${d.id}</div></td>
            <td style="text-align:center;color:var(--text2)">${d.type}</td>
            <td style="text-align:center"><span style="padding:2px 8px;border-radius:4px;font-size:10px;background:${d.status==='online'?'#10b98120':'#ef444420'};color:${d.status==='online'?'#10b981':'#ef4444'}">${d.status}</span></td>
            <td style="text-align:center;color:var(--text2)">${d.last_seen}</td>
            <td style="text-align:center;color:var(--text2)">${d.firmware}</td>
            <td style="text-align:center;color:var(--accent)">${d.messages}</td>
          </tr>`)}
        </table>
      </div>`:null}

    ${tab==='mqtt'?html`
      <div class="card" style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:14px;color:var(--text1)">📡 MQTT Configuration</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Broker URL</label><input value=${edgeConfig.mqtt_broker} onInput=${e=>u('mqtt_broker',e.target.value)} style="${iS}" /></div>
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Topic Prefix</label><input value=${edgeConfig.mqtt_topic} onInput=${e=>u('mqtt_topic',e.target.value)} style="${iS}" /></div>
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">CoAP Port</label><input type="number" value=${edgeConfig.coap_port} onInput=${e=>u('coap_port',+e.target.value)} style="${iS}" /></div>
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Sync Interval (s)</label><input type="number" value=${edgeConfig.sync_interval} onInput=${e=>u('sync_interval',+e.target.value)} style="${iS}" /></div>
        </div>
        <div style="margin-top:12px;padding:12px;border-radius:8px;background:var(--bg)">
          <div style="font-size:12px;color:var(--text1);font-weight:600;margin-bottom:6px">📊 MQTT Topics</div>
          <div style="font-family:monospace;font-size:11px;color:var(--text2);line-height:1.8">
            ${edgeConfig.mqtt_topic}/devices/+/telemetry<br/>
            ${edgeConfig.mqtt_topic}/devices/+/commands<br/>
            ${edgeConfig.mqtt_topic}/devices/+/status<br/>
            ${edgeConfig.mqtt_topic}/ai/request<br/>
            ${edgeConfig.mqtt_topic}/ai/response
          </div>
        </div>
      </div>`:null}

    ${tab==='xiaozhi'?html`
      <div class="card" style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:14px;color:var(--text1)">🎙️ Xiaozhi Voice Integration</h3>
        <div style="padding:16px;border-radius:8px;background:var(--bg);margin-bottom:12px">
          <div style="font-size:13px;color:var(--text1);font-weight:600;margin-bottom:8px">Voice Agent Pipeline</div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px">
            ${['🎙️ Xiaozhi Device','→','📡 MQTT','→','🧠 BizClaw Agent','→','🔊 TTS Response','→','🎙️ Speaker'].map((s,i)=>
              i%2===0?html`<div style="padding:8px 12px;border-radius:6px;background:var(--surface);border:1px solid var(--border);color:var(--text1)">${s}</div>`
              :html`<span style="color:var(--accent)">→</span>`)}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${devices.filter(d=>d.type==='voice').map(d=>html`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid var(--border);border-radius:8px">
              <div><span style="font-weight:600;color:var(--text1)">🎙️ ${d.name}</span><span style="margin-left:8px;font-size:11px;color:var(--text2)">FW ${d.firmware}</span></div>
              <div style="display:flex;gap:8px;align-items:center">
                <span style="padding:2px 8px;border-radius:4px;font-size:10px;background:${d.status==='online'?'#10b98120':'#ef444420'};color:${d.status==='online'?'#10b981':'#ef4444'}">${d.status}</span>
                <button style="padding:4px 10px;border-radius:4px;border:1px solid var(--border);background:transparent;color:var(--text2);cursor:pointer;font-size:11px">🔄 OTA</button>
              </div>
            </div>`)}
        </div>
      </div>`:null}

    ${tab==='config'?html`
      <div class="card" style="padding:16px">
        <h3 style="margin:0 0 12px;font-size:13px;color:var(--text1)">⚙️ Edge Gateway Config</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Node ID</label><input value=${edgeConfig.node_id} onInput=${e=>u('node_id',e.target.value)} style="${iS}" /></div>
          <div><label style="font-size:11px;color:var(--text2);display:block;margin-bottom:3px">Protocols</label><input value="mqtt, http, websocket, coap" style="${iS}" disabled /></div>
        </div>
        <button style="margin-top:12px;padding:8px 20px;border-radius:6px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">💾 Save</button>
      </div>`:null}
  </div>`;
}
