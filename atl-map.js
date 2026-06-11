// ─────────────────────────────────────────────────────────────
// ATL Interactive Map v2 — Delta.com-style overview +
// Google-Maps-style concourse detail view.
// Loaded BEFORE the main inline script; reads page globals
// (restaurants, concourseLayout, allLoungesData, …) at call time.
// ─────────────────────────────────────────────────────────────

/* global state for the map */
var mapSelectedVenue = null;   // {type:'rest'|'lounge', key:name|id} or null

// ── Shared geometry helpers ──────────────────────────────────
const MAPV2 = {
  // overview positions: concourse bars left→right (T..F) like the real airport
  ovBars: [
    { id:'T', x:225 }, { id:'A', x:345 }, { id:'B', x:465 },
    { id:'C', x:585 }, { id:'D', x:705 }, { id:'E', x:825 }, { id:'F', x:945 },
  ],
  ovBarTop: 130, ovBarH: 330, ovBarW: 54,
  trainY: 295,
};

function mapEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
function mapJsStr(s){ return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

function poiStyle(r){
  if (r.tags.includes('coffee'))  return { glyph:'☕', color:'#8a5a2b' };
  if (r.tags.includes('bar'))     return { glyph:'🍺', color:'#2563eb' };
  if (r.tags.includes('healthy')) return { glyph:'🥗', color:'#15803d' };
  return { glyph:'🍴', color:'#d97706' };
}

function mapVenueDimmed(r){
  const diets = ['vegetarian','vegan','pescatarian','gluten-free','halal','kosher'];
  if (diets.includes(activeFilter) && !hasDietary(r, activeFilter)) return true;
  if (activeFilter === '24hr' && !r.tags.includes('24hr')) return true;
  if (activeFilter === 'atl'  && !r.tags.includes('atl'))  return true;
  if (activeCraving && cravingMatchers[activeCraving] && !cravingMatchers[activeCraving](r)) return true;
  return false;
}

// lounges in a concourse, normalized for markers
function loungesIn(cid){
  return (typeof allLoungesData !== 'undefined' ? allLoungesData : []).filter(l => l.concourse === cid);
}

// ── MAIN ENTRY — replaces the old buildMap ───────────────────
function buildMap(){
  const canvas = document.getElementById('mapCanvas');
  if (!canvas) return;
  if (activeConcourse && activeConcourse !== null) {
    canvas.classList.add('detail');
    canvas.innerHTML = buildDetailSvg(activeConcourse);
    requestAnimationFrame(() => {
      if (mapSelectedVenue) scrollMapToSelected();
    });
  } else {
    canvas.classList.remove('detail');
    canvas.innerHTML = buildOverviewSvg();
  }
}

// ── OVERVIEW (Delta.com look) ────────────────────────────────
function buildOverviewSvg(){
  const P = [];
  P.push(`<svg viewBox="0 0 1080 560" width="940" style="font-family:'Lato','Helvetica Neue',sans-serif;" xmlns="http://www.w3.org/2000/svg">`);

  // background
  P.push(`<rect x="0" y="0" width="1080" height="560" rx="14" fill="#e8edf3"/>`);
  // decorative apron / runway slabs
  P.push(`<rect x="40"  y="34"  width="990" height="36" rx="18" fill="#dde4ec"/>`);
  P.push(`<rect x="40"  y="492" width="990" height="36" rx="18" fill="#dde4ec"/>`);
  P.push(`<rect x="150" y="84"  width="860" height="14" rx="7"  fill="#d4dde7" opacity="0.7"/>`);
  P.push(`<rect x="150" y="468" width="860" height="14" rx="7"  fill="#d4dde7" opacity="0.7"/>`);

  // Domestic Terminal complex (west side)
  P.push(`<g cursor="pointer" onclick="selectConcourse('domestic')">
    <path d="M 38 200 h 96 a10 10 0 0 1 10 10 v 140 a10 10 0 0 1 -10 10 h -96 a14 14 0 0 1 -14 -14 v -132 a14 14 0 0 1 14 -14 z" fill="#fbfaf7" stroke="#cfd6e0" stroke-width="1.5"/>
    <rect x="58" y="180" width="56" height="22" rx="6" fill="#f3f1ea" stroke="#cfd6e0" stroke-width="1.2"/>
    <rect x="58" y="358" width="56" height="22" rx="6" fill="#f3f1ea" stroke="#cfd6e0" stroke-width="1.2"/>
    <g transform="translate(86,258)">
      <rect x="-16" y="-16" width="32" height="32" rx="6" transform="rotate(45)" fill="#1e3a5f" style="filter:drop-shadow(0 2px 3px rgba(15,30,60,0.35))"/>
      <text x="0" y="5.5" text-anchor="middle" font-size="15" fill="#ffffff">✈</text>
    </g>
    <text x="86" y="318" text-anchor="middle" font-size="14" font-weight="700" fill="#1e3a5f">Domestic</text>
    <text x="86" y="334" text-anchor="middle" font-size="14" font-weight="700" fill="#1e3a5f">Terminal</text>
    <text x="86" y="350" text-anchor="middle" font-size="10" fill="#64748b">${(restaurants||[]).filter(r=>r.concourse==='domestic').length} venues</text>
    <title>Domestic Terminal — tap to explore</title>
  </g>`);

  // SkyTrain line
  P.push(`<line x1="134" y1="${MAPV2.trainY}" x2="1010" y2="${MAPV2.trainY}" stroke="#9fb0c3" stroke-width="5" stroke-dasharray="2,9" stroke-linecap="round" opacity="0.85"/>`);
  P.push(`<text x="540" y="${MAPV2.trainY-44}" text-anchor="middle" font-size="11" fill="#7d8ea3">🚇 ATL SkyTrain · every 2 min</text>`);

  // Concourse bars
  MAPV2.ovBars.forEach(b => {
    const c  = concourseLayout.find(x => x.id === b.id);
    if (!c) return;
    const cnt   = (restaurants||[]).filter(r => r.concourse === b.id).length;
    const lngs  = loungesIn(b.id).length;
    const x = b.x - MAPV2.ovBarW/2, y = MAPV2.ovBarTop, w = MAPV2.ovBarW, h = MAPV2.ovBarH;
    const midY = MAPV2.trainY;
    P.push(`<g cursor="pointer" onclick="selectConcourse('${b.id}')">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="#fbfaf7" stroke="#cfd6e0" stroke-width="1.5"/>
      <rect x="${x-16}" y="${midY-34}" width="${w+32}" height="68" rx="12" fill="#f3f1ea" stroke="#cfd6e0" stroke-width="1.2"/>
      <rect x="${x+8}" y="${y+10}" width="${w-16}" height="8" rx="4" fill="#eceae2"/>
      <rect x="${x+8}" y="${y+h-18}" width="${w-16}" height="8" rx="4" fill="#eceae2"/>
      <g transform="translate(${b.x},${midY})">
        <rect x="-17" y="-17" width="34" height="34" rx="6" transform="rotate(45)" fill="${b.id==='F' ? '#0f2f52' : '#1e3a5f'}" style="filter:drop-shadow(0 2px 3px rgba(15,30,60,0.35))"/>
        <text x="0" y="6" text-anchor="middle" font-size="17" font-weight="800" fill="#ffffff" font-family="Lato,sans-serif">${c.abbr}</text>
      </g>
      <text x="${b.x}" y="${y+h+24}" text-anchor="middle" font-size="13.5" font-weight="700" fill="#1e3a5f">Concourse ${c.abbr}${b.id==='F' ? ' (Intl)' : ''}</text>
      <text x="${b.x}" y="${y+h+40}" text-anchor="middle" font-size="10" fill="#64748b">${c.gates}</text>
      <text x="${b.x}" y="${y+h+54}" text-anchor="middle" font-size="10" fill="#64748b">${cnt} venues${lngs ? ' · ' + lngs + ' lounge' + (lngs>1?'s':'') : ''}</text>
      <title>Concourse ${c.abbr} · ${c.gates} — tap to zoom in</title>
    </g>`);

    // mini lounge diamonds on the bar
    loungesIn(b.id).forEach((l, i) => {
      const [gmin, gmax] = concourseGateRanges[b.id] || [0,1];
      const pct = gmax > gmin ? (l.gateNum - gmin) / (gmax - gmin) : 0.5;
      const ly = y + 14 + Math.max(0.04, Math.min(0.96, pct)) * (h - 28);
      const lcol = l.type === 'skyclub' ? '#4338ca' : l.type === 'centurion' ? '#1a6fa8' : (l.color || '#374151');
      P.push(`<g cursor="pointer" onclick="event.stopPropagation();openLoungeOnMap('${l.id}')">
        <rect x="-5.5" y="-5.5" width="11" height="11" rx="2" transform="translate(${b.x + (i%2 ? 20 : -20)},${ly}) rotate(45)" fill="${lcol}" stroke="white" stroke-width="1.5" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))"/>
        <title>${mapEsc(l.name)} · ${mapEsc(l.subtitle)}</title>
      </g>`);
    });
  });

  // legend
  P.push(`<g transform="translate(34,530)" font-size="10.5" fill="#5b6b80">
    <rect x="-4" y="-9" width="13" height="13" rx="3" transform="rotate(45 2.5 -2.5)" fill="#1e3a5f"/>
    <text x="16" y="2">Concourse — tap to zoom</text>
    <rect x="182" y="-8" width="10" height="10" rx="2" transform="rotate(45 187 -3)" fill="#4338ca"/>
    <text x="200" y="2">Lounge</text>
    <line x1="262" y1="-3" x2="296" y2="-3" stroke="#9fb0c3" stroke-width="4" stroke-dasharray="2,7" stroke-linecap="round"/>
    <text x="304" y="2">SkyTrain</text>
  </g>`);

  P.push(`</svg>`);
  return P.join('');
}

// ── CONCOURSE DETAIL (Google Maps look) ──────────────────────
function gateListFor(cid){
  const [gmin, gmax] = concourseGateRanges[cid] || [0,0];
  const out = [];
  for (let g = gmin; g <= gmax; g++) out.push(g);
  return out;
}

function buildDetailSvg(cid){
  if (cid === 'domestic') return buildDomesticSvg();
  const c = concourseLayout.find(x => x.id === cid);
  if (!c) return '';
  const gates = gateListFor(cid);
  const [gmin, gmax] = concourseGateRanges[cid];

  const VBW = 460, topPad = 86, rowH = 30, botPad = 96;
  const H = topPad + (gates.length - 1) * rowH + botPad;
  const cx = VBW/2, bw = 116, bx = cx - bw/2;
  const gateY = g => topPad + (g - gmin) * rowH;
  const midGate = concourseMidGate[cid] || Math.round((gmin+gmax)/2);
  const hubY = gateY(midGate);

  const P = [];
  P.push(`<svg viewBox="0 0 ${VBW} ${H}" width="100%" style="font-family:'Lato','Helvetica Neue',sans-serif;max-width:470px;display:block;margin:0 auto;" xmlns="http://www.w3.org/2000/svg">`);
  P.push(`<rect x="0" y="0" width="${VBW}" height="${H}" fill="#e9eef5"/>`);

  // title
  P.push(`<text x="${cx}" y="34" text-anchor="middle" font-size="19" font-weight="800" fill="#1e3a5f">Concourse ${c.abbr}${cid==='F' ? ' · International' : ''}</text>`);
  P.push(`<text x="${cx}" y="54" text-anchor="middle" font-size="11.5" fill="#64748b">Gates ${c.gates} · tap a marker for details</text>`);

  // building
  P.push(`<rect x="${bx}" y="${topPad-26}" width="${bw}" height="${H-topPad-botPad+62}" rx="22" fill="#fffdf7" stroke="#d9d2c0" stroke-width="1.6"/>`);
  // walking corridor
  P.push(`<line x1="${cx}" y1="${topPad-8}" x2="${cx}" y2="${H-botPad+22}" stroke="#e7e1d2" stroke-width="10" stroke-linecap="round"/>`);
  P.push(`<line x1="${cx}" y1="${topPad-8}" x2="${cx}" y2="${H-botPad+22}" stroke="#cfc7b2" stroke-width="1.5" stroke-dasharray="1,10" stroke-linecap="round"/>`);

  // center hub + SkyTrain
  P.push(`<rect x="${bx-44}" y="${hubY-46}" width="${bw+88}" height="92" rx="16" fill="#f6f3ea" stroke="#d9d2c0" stroke-width="1.4"/>`);
  P.push(`<line x1="14" y1="${hubY}" x2="${VBW-14}" y2="${hubY}" stroke="#9fb0c3" stroke-width="4" stroke-dasharray="2,8" stroke-linecap="round" opacity="0.9"/>`);
  P.push(`<g transform="translate(${cx},${hubY+30})"><rect x="-52" y="-9" width="104" height="18" rx="9" fill="#1e3a5f" opacity="0.92"/><text x="0" y="4" text-anchor="middle" font-size="9.5" fill="#fff" font-weight="700">🚇 SKYTRAIN STATION</text></g>`);

  // gate chips (odd left, even right)
  gates.forEach(g => {
    const y = gateY(g);
    const left = (g % 2 === 1);
    const chipX = left ? bx - 58 : bx + bw + 12;
    const tickX1 = left ? chipX + 46 : chipX, tickX2 = left ? bx : bx + bw;
    P.push(`<line x1="${tickX1}" y1="${y}" x2="${tickX2}" y2="${y}" stroke="#d9d2c0" stroke-width="1"/>`);
    P.push(`<g><rect x="${chipX}" y="${y-10}" width="46" height="20" rx="5" fill="#fdf0c5" stroke="#e3c25e" stroke-width="1"/>
      <text x="${chipX+23}" y="${y+4}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#7a5d12">${c.abbr}${g}</text></g>`);
  });

  // ── venue markers ──
  const venues = (restaurants||[]).filter(r => r.concourse === cid);
  // group by gate for collision fan-out
  const slotUse = {};
  const offsets = [[-30,0],[30,0],[-30,-15],[30,-15],[-30,15],[30,15],[0,-15],[0,15],[0,0]];
  venues.forEach(r => {
    let g = firstGateNum(r.loc);
    if (g == null || g < gmin || g > gmax) g = midGate;
    const key = 'g'+g;
    const n = slotUse[key] = (slotUse[key]||0) + 1;
    const [dx, dy] = offsets[(n-1) % offsets.length];
    const x = cx + dx, y = gateY(g) + dy;
    const st = poiStyle(r);
    const dim = mapVenueDimmed(r);
    const sel = mapSelectedVenue && mapSelectedVenue.type==='rest' && mapSelectedVenue.key === cid + '|' + r.name;
    const safe = mapJsStr(r.name);
    P.push(`<g cursor="pointer" data-poi="rest" data-key="${mapEsc(cid + '|' + r.name)}" data-vy="${y}" opacity="${dim && !sel ? 0.25 : 1}" onclick="event.stopPropagation();onVenueClick('${safe}','${cid}')">
      ${sel ? `<circle cx="${x}" cy="${y}" r="14" fill="none" stroke="${st.color}" stroke-width="2"><animate attributeName="r" values="13;19;13" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0;0.9" dur="1.6s" repeatCount="indefinite"/></circle>` : ''}
      <circle cx="${x}" cy="${y}" r="${sel ? 12.5 : 10.5}" fill="#ffffff" stroke="${st.color}" stroke-width="${sel ? 3 : 2}" style="filter:drop-shadow(0 1px 2.5px rgba(0,0,0,0.3))"/>
      <text x="${x}" y="${y+3.8}" text-anchor="middle" font-size="${sel ? 11.5 : 10}">${st.glyph}</text>
      ${sel ? `<text x="${x}" y="${y-20}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#1e3a5f" stroke="#ffffff" stroke-width="3.5" paint-order="stroke">${mapEsc(r.name)}</text>` : ''}
      <title>${mapEsc(r.name)} · ${mapEsc(r.loc)} · ${mapEsc(r.hours)}</title>
    </g>`);
  });

  // ── lounge markers ──
  loungesIn(cid).forEach(l => {
    let g = l.gateNum; if (g < gmin || g > gmax) g = midGate;
    const key = 'g'+g;
    const n = slotUse[key] = (slotUse[key]||0) + 1;
    const [dx, dy] = offsets[(n-1) % offsets.length];
    const x = cx + dx, y = gateY(g) + dy;
    const lcol = l.type === 'skyclub' ? '#4338ca' : l.type === 'centurion' ? '#1a6fa8' : (l.color || '#374151');
    const sel = mapSelectedVenue && mapSelectedVenue.type==='lounge' && mapSelectedVenue.key === l.id;
    const glyph = l.type === 'skyclub' ? 'Δ' : l.type === 'centurion' ? 'C' : l.type === 'admirals' ? 'AA' : l.type === 'united' ? 'UA' : '★';
    P.push(`<g cursor="pointer" data-poi="lounge" data-key="${l.id}" data-vy="${y}" onclick="event.stopPropagation();openLoungeOnMap('${l.id}')">
      ${sel ? `<circle cx="${x}" cy="${y}" r="15" fill="none" stroke="${lcol}" stroke-width="2"><animate attributeName="r" values="14;20;14" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0;0.9" dur="1.6s" repeatCount="indefinite"/></circle>` : ''}
      <rect x="-${sel?12:10}" y="-${sel?12:10}" width="${sel?24:20}" height="${sel?24:20}" rx="4" transform="translate(${x},${y}) rotate(45)" fill="${lcol}" stroke="white" stroke-width="2" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,0.35))"/>
      <text x="${x}" y="${y+3.5}" text-anchor="middle" font-size="${glyph.length>1?7.5:10}" font-weight="900" fill="#fff" font-family="sans-serif">${glyph}</text>
      ${sel ? `<text x="${x}" y="${y-22}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#1e3a5f" stroke="#ffffff" stroke-width="3.5" paint-order="stroke">${mapEsc(l.name)}</text>` : ''}
      <title>${mapEsc(l.name)} · ${mapEsc(l.subtitle)} · ${mapEsc(l.hours)}</title>
    </g>`);
  });

  // legend at bottom
  const ly = H - 34;
  P.push(`<g font-size="10" fill="#5b6b80">
    <circle cx="30" cy="${ly}" r="8" fill="#fff" stroke="#d97706" stroke-width="2"/><text x="30" y="${ly+3}" text-anchor="middle" font-size="8">🍴</text>
    <text x="44" y="${ly+3}">Food</text>
    <circle cx="92" cy="${ly}" r="8" fill="#fff" stroke="#8a5a2b" stroke-width="2"/><text x="92" y="${ly+3}" text-anchor="middle" font-size="8">☕</text>
    <text x="106" y="${ly+3}">Coffee</text>
    <circle cx="164" cy="${ly}" r="8" fill="#fff" stroke="#2563eb" stroke-width="2"/><text x="164" y="${ly+3}" text-anchor="middle" font-size="8">🍺</text>
    <text x="178" y="${ly+3}">Bar</text>
    <rect x="-7" y="-7" width="14" height="14" rx="3" transform="translate(222,${ly}) rotate(45)" fill="#4338ca"/>
    <text x="236" y="${ly+3}">Lounge</text>
    <rect x="290" y="${ly-8}" width="34" height="16" rx="4" fill="#fdf0c5" stroke="#e3c25e"/><text x="307" y="${ly+3.5}" text-anchor="middle" font-size="8.5" font-weight="700" fill="#7a5d12">${c.abbr}#</text>
    <text x="332" y="${ly+3}">Gate</text>
  </g>`);

  P.push(`</svg>`);

  // floating zoom-out button (sticky inside the scrolling canvas)
  return `<button class="map-zoomout-btn" onclick="collapsePanel()">← Full airport map</button>` + P.join('');
}

// ── Domestic Terminal detail (no gates) ──────────────────────
function buildDomesticSvg(){
  const venues = (restaurants||[]).filter(r => r.concourse === 'domestic');
  const cols = 4, cellW = 100, cellH = 74, topPad = 120;
  const rows = Math.ceil(venues.length / cols);
  const VBW = 460, H = topPad + rows * cellH + 110;
  const gridW = cols * cellW, gx = (VBW - gridW) / 2;

  const P = [];
  P.push(`<svg viewBox="0 0 ${VBW} ${H}" width="100%" style="font-family:'Lato','Helvetica Neue',sans-serif;max-width:470px;display:block;margin:0 auto;" xmlns="http://www.w3.org/2000/svg">`);
  P.push(`<rect x="0" y="0" width="${VBW}" height="${H}" fill="#e9eef5"/>`);
  P.push(`<text x="${VBW/2}" y="34" text-anchor="middle" font-size="19" font-weight="800" fill="#1e3a5f">Domestic Terminal</text>`);
  P.push(`<text x="${VBW/2}" y="54" text-anchor="middle" font-size="11.5" fill="#64748b">Atrium & pre-security dining · tap a marker for details</text>`);
  P.push(`<rect x="${gx-26}" y="${topPad-44}" width="${gridW+52}" height="${rows*cellH+78}" rx="22" fill="#fffdf7" stroke="#d9d2c0" stroke-width="1.6"/>`);
  P.push(`<text x="${VBW/2}" y="${topPad-16}" text-anchor="middle" font-size="11" font-weight="700" fill="#8a8062">MAIN ATRIUM</text>`);

  venues.forEach((r, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = gx + col*cellW + cellW/2, y = topPad + row*cellH + 26;
    const st = poiStyle(r);
    const dim = mapVenueDimmed(r);
    const sel = mapSelectedVenue && mapSelectedVenue.type==='rest' && mapSelectedVenue.key === 'domestic|' + r.name;
    const safe = mapJsStr(r.name);
    const short = r.name.length > 14 ? r.name.slice(0,13) + '…' : r.name;
    P.push(`<g cursor="pointer" data-poi="rest" data-key="${mapEsc('domestic|' + r.name)}" data-vy="${y}" opacity="${dim && !sel ? 0.25 : 1}" onclick="event.stopPropagation();onVenueClick('${safe}','domestic')">
      ${sel ? `<circle cx="${x}" cy="${y}" r="14" fill="none" stroke="${st.color}" stroke-width="2"><animate attributeName="r" values="13;19;13" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0;0.9" dur="1.6s" repeatCount="indefinite"/></circle>` : ''}
      <circle cx="${x}" cy="${y}" r="${sel ? 12.5 : 10.5}" fill="#ffffff" stroke="${st.color}" stroke-width="${sel ? 3 : 2}" style="filter:drop-shadow(0 1px 2.5px rgba(0,0,0,0.3))"/>
      <text x="${x}" y="${y+3.8}" text-anchor="middle" font-size="${sel ? 11.5 : 10}">${st.glyph}</text>
      <text x="${x}" y="${y+26}" text-anchor="middle" font-size="9" font-weight="${sel?'800':'600'}" fill="#475569" stroke="#fffdf7" stroke-width="3" paint-order="stroke">${mapEsc(short)}</text>
      <title>${mapEsc(r.name)} · ${mapEsc(r.loc)} · ${mapEsc(r.hours)}</title>
    </g>`);
  });

  P.push(`</svg>`);
  return `<button class="map-zoomout-btn" onclick="collapsePanel()">← Full airport map</button>` + P.join('');
}

// ── Interactions ─────────────────────────────────────────────
function onVenueClick(name, cid){
  const r = (restaurants||[]).find(x => x.name === name && (!cid || x.concourse === cid));
  if (!r) return;
  mapSelectedVenue = { type:'rest', key: r.concourse + '|' + name };
  buildMap();
  showVenueInfo(name, r.concourse);
  expandPanel();
}

function showVenueInfo(name, cid){
  const r = (restaurants||[]).find(x => x.name === name && (!cid || x.concourse === cid));
  if (!r) return;
  const cl = r.concourse === 'domestic' ? 'Domestic Terminal' : 'Concourse ' + r.concourse.toUpperCase();
  const safeC = mapJsStr(r.concourse);
  document.getElementById('mapInfoPanel').innerHTML = `
    <button class="panel-back-btn" onclick="mapSelectedVenue=null;selectConcourse('${safeC}')">← All of ${cl}</button>
    <div class="restaurant-list">${renderCard(r, true)}</div>
    <div style="padding:9px 11px;background:#eff6ff;border-radius:8px;font-size:12px;color:#1e40af;border:1px solid #bfdbfe;">📍 Pinpointed on the map — tap the card to chat with Mo about it</div>
  `;
  flashPanel();
}

function openLoungeOnMap(id){
  const l = (typeof allLoungesData !== 'undefined' ? allLoungesData : []).find(x => x.id === id);
  if (!l) return;
  mapSelectedVenue = { type:'lounge', key:id };
  activeConcourse = l.concourse;
  buildMap();
  document.getElementById('mapInfoPanel').innerHTML = `
    <button class="panel-back-btn" onclick="mapSelectedVenue=null;selectConcourse('${l.concourse}')">← All of Concourse ${l.concourse}</button>
    ${renderLoungeCard(l)}
    <button onclick="filterMap('lounges',document.querySelector('.lounge-pill'))" style="width:100%;margin-top:4px;padding:8px;background:#4338ca;color:white;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">🛋️ See all ATL lounges & access info</button>
  `;
  flashPanel();
  expandPanel();
  requestAnimationFrame(scrollMapToSelected);
}

// Locate a venue from a directory card ("Show on map")
function locateOnMap(name, cid){
  const r = (restaurants||[]).find(x => x.name === name && (!cid || x.concourse === cid));
  if (!r) return;
  mapSelectedVenue = { type:'rest', key: r.concourse + '|' + name };
  activeConcourse = r.concourse;
  buildMap();
  showVenueInfo(name, r.concourse);
  requestAnimationFrame(scrollMapToSelected);
}

// Scroll the map canvas so the selected marker is centered (no scrollIntoView)
function scrollMapToSelected(){
  const canvas = document.getElementById('mapCanvas');
  if (!canvas || !mapSelectedVenue) return;
  const sel = canvas.querySelector(`g[data-poi][data-key="${(mapSelectedVenue.type==='rest'?mapSelectedVenue.key:mapSelectedVenue.key).replace(/"/g,'\\"')}"]`);
  const svg = canvas.querySelector('svg');
  if (!sel || !svg) return;
  const vy = parseFloat(sel.getAttribute('data-vy') || '0');
  const vbH = (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.height) || 1;
  const renderedH = svg.getBoundingClientRect().height;
  const btnH = 40; // sticky button space
  const target = (vy / vbH) * renderedH + btnH - canvas.clientHeight / 2;
  canvas.scrollTop = Math.max(0, target);
}
