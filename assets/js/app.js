
// Strat-ish Card Game — static single-file app
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

let TEAMS = [], ROSTERS = {};
let STATE = { user:null, cpu:null, possession:'USER', yard:25, down:1, toGo:10, score:{USER:0,CPU:0} };
let DEF_CALL = { key:'zone', weights:{rush:0,cover:0,run:0} };

async function load(){
  TEAMS = await fetch('data/team-meta.json').then(r=>r.json());
  ROSTERS = await fetch('data/rosters-2008.json').then(r=>r.json());
  // local override
  const local = localStorage.getItem('rosters-2008');
  if(local){ try{ ROSTERS = JSON.parse(local); console.log('Loaded local rosters override'); }catch(e){} }
  populateTeamSelects();
}

function populateTeamSelects(){
  const u = $('#userSel'), c = $('#cpuSel');
  TEAMS.forEach(t=>{
    const o1 = document.createElement('option'); o1.value=t.abbr; o1.textContent=`${t.abbr} — ${t.name}`;
    const o2 = o1.cloneNode(true);
    u.appendChild(o1); c.appendChild(o2);
  });
  u.value = 'NYG'; c.value = 'NE';
}

function startGame(){
  const ua = $('#userSel').value, ca = $('#cpuSel').value;
  if(ua===ca){ alert('Pick different teams'); return; }
  STATE.user = TEAMS.find(t=>t.abbr===ua);
  STATE.cpu  = TEAMS.find(t=>t.abbr===ca);
  // reset state
  STATE.possession = 'USER'; STATE.yard=25; STATE.down=1; STATE.toGo=10; STATE.score={USER:0,CPU:0};
  $('#setup').style.display='none'; $('#game').style.display='grid';
  renderAll();
  setResult(`${STATE.user.abbr} receives. Ball at 25.`);
}

function renderAll(){
  renderSidebars();
  renderPlays();
  renderDefBar();
  updateField();
  updateHeader();
}

function renderSidebars(){
  const left = $('#leftRoster'), right = $('#rightRoster');
  left.innerHTML=''; right.innerHTML='';
  const userRoster = ROSTERS[STATE.user.abbr] || [];
  const cpuRoster  = ROSTERS[STATE.cpu.abbr] || [];
  const leftIsOff = STATE.possession==='USER';
  $('#leftTitle').textContent = leftIsOff ? `${STATE.user.abbr} Offense` : `${STATE.user.abbr} Defense`;
  $('#rightTitle').textContent = leftIsOff ? `${STATE.cpu.abbr} Defense` : `${STATE.cpu.abbr} Offense`;
  $('#leftLogo').src = STATE.user.logo; $('#leftAbbr').textContent = STATE.user.abbr;
  $('#rightLogo').src = STATE.cpu.logo; $('#rightAbbr').textContent = STATE.cpu.abbr;

  const offOrder = ['QB','RB','WR1','WR2','WR3','TE'];
  const defOrder = ['DT1','DT2','DE1','DE2','LB1','LB2','LB3','CB1','CB2','FS','SS'];
  const leftList = (leftIsOff ? offOrder : defOrder).map(pos => userRoster.find(p=>p.position===pos) || {name:`(${pos})`,position:pos,stats:{}});
  const rightList = (leftIsOff ? defOrder : offOrder).map(pos => cpuRoster.find(p=>p.position===pos) || {name:`(${pos})`,position:pos,stats:{}});

  leftList.forEach(p=> left.appendChild(makePlayerNode(p)));
  rightList.forEach(p=> right.appendChild(makePlayerNode(p)));
}

function makePlayerNode(p){
  const row = document.createElement('div'); row.className='player';
  const name = document.createElement('div'); name.textContent = p.name;
  const pos = document.createElement('div'); pos.className='pos'; pos.textContent = p.position;
  row.appendChild(name); row.appendChild(pos);
  row.addEventListener('mouseenter', ()=> showCard(p));
  row.addEventListener('mouseleave', hideCard);
  return row;
}

function showCard(p){
  $('#hoverTitle').textContent = p.name;
  $('#hoverPos').textContent = p.position;
  $('#hoverStats').textContent = JSON.stringify(p.stats||{}, null, 2);
  $('#hoverCard').style.display='block';
}
function hideCard(){ $('#hoverCard').style.display='none'; }

function renderPlays(){
  const off = $('#offBar'); off.innerHTML='';
  const plays = [
    {key:'run_rb', img:'assets/ui/run.svg', label:'Run RB'},
    {key:'short_pass', img:'assets/ui/short.svg', label:'Short Pass'},
    {key:'deep_pass', img:'assets/ui/deep.svg', label:'Deep Pass'},
    {key:'screen', img:'assets/ui/screen.svg', label:'Screen'},
    {key:'te_seam', img:'assets/ui/te.svg', label:'TE Seam'},
    {key:'punt', img:'assets/ui/punt.svg', label:'Punt'},
    {key:'fg', img:'assets/ui/fg.svg', label:'Field Goal'}
  ];
  plays.forEach(pl=>{
    const b=document.createElement('button');
    const img=document.createElement('img'); img.src=pl.img; img.alt=pl.label;
    b.appendChild(img); b.title=pl.label;
    b.addEventListener('click', ()=> onPlay(pl.key));
    off.appendChild(b);
  });
}

function renderDefBar(){
  const def = $('#defBar'); def.innerHTML='';
  const defs = [
    {key:'blitz', img:'assets/ui/def_blitz.svg', label:'Blitz', weights:{rush:6,cover:-6,run:2}},
    {key:'zone',  img:'assets/ui/def_zone.svg',  label:'Zone',  weights:{rush:0,cover:6,run:0}},
    {key:'man',   img:'assets/ui/def_man.svg',   label:'Man',   weights:{rush:2,cover:2,run:-2}}
  ];
  defs.forEach(d=>{
    const b=document.createElement('button');
    const img=document.createElement('img'); img.src=d.img; img.alt=d.label;
    b.appendChild(img); b.title=d.label;
    b.addEventListener('click', ()=> { DEF_CALL = d; highlightDef(); });
    def.appendChild(b);
  });
  highlightDef();
}

function highlightDef(){
  $$('#defBar button').forEach((btn,i)=> btn.style.outline = (DEF_CALL && DEF_CALL.key === ['blitz','zone','man'][i]) ? '2px solid var(--accent)' : 'none');
}

function setResult(txt){ $('#result').textContent = txt; const log = document.createElement('div'); log.textContent = txt; log.className='small'; document.getElementById('log').prepend(log); }
function updateField(){
  const pct = Math.max(1, Math.min(99, STATE.yard));
  $('#ball').style.left = pct + '%';
  $('#downBadge').textContent = `${['1st','2nd','3rd','4th'][STATE.down-1]} & ${STATE.toGo} @ ${Math.round(STATE.yard)}`;
  $('#posBadge').textContent = `${STATE.possession} ball`;
  $('#leftTitle'); // noop
}

function defenseBucket(roster){
  const runFront = ['DT1','DT2','DE1','DE2','LB1','LB2','LB3'];
  const coverBack = ['CB1','CB2','FS','SS','LB1','LB2','LB3'];
  const avg = (arr,key)=> { if(arr.length===0) return 70; const vals=arr.map(p=> p.stats?.[key] ?? p.rating ?? 70); return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length); };
  return {
    run: avg(roster.filter(p=>runFront.includes(p.position)),'runD'),
    rush: avg(roster.filter(p=>runFront.includes(p.position)),'rush'),
    cover: avg(roster.filter(p=>coverBack.includes(p.position)),'cover'),
    tackle: avg(roster,'tackle')
  };
}

function computeOutcome(offAbbr, defAbbr, key){
  const off = ROSTERS[offAbbr] || [];
  const def = ROSTERS[defAbbr] || [];
  const qb = off.find(p=>p.position==='QB');
  const buckets = defenseBucket(def);
  const W = DEF_CALL.weights || {rush:0,cover:0,run:0};
  let desc=''; let yards=0; let autoFirst=false; let penal=false;

  if(key==='run_rb'){
    const rb = off.find(p=>p.position==='RB'); desc = `Run by ${rb?.name||'RB'}`;
    let base = (rb?.stats?.inside || 70) - (buckets.run - 70) - (W.run||0);
    yards = rollOutcome(base, 'run');
  } else if(key==='short_pass'){
    const wr = off.find(p=>p.position==='WR1') || off.find(p=>p.position==='TE'); desc = `Short pass to ${wr?.name||'WR'}`;
    let base = (qb?.stats?.short || 72) + (wr?.stats?.catch || 70) - (buckets.cover - 70) + (W.cover||0);
    yards = rollOutcome(base, 'pass');
  } else if(key==='deep_pass'){
    const wr = off.find(p=>p.position==='WR2') || off.find(p=>p.position==='WR1'); desc = `Deep pass to ${wr?.name||'WR'}`;
    let base = (qb?.stats?.deep || 68) + (wr?.stats?.route || 70) - (buckets.cover - 70) - 2 + (W.cover||0);
    yards = rollOutcome(base, 'pass');
  } else if(key==='screen'){
    const rb = off.find(p=>p.position==='RB'); desc = `Screen to ${rb?.name||'RB'}`;
    let base = (qb?.stats?.short || 70) + (rb?.stats?.catch || 68) - (buckets.cover - 72) + (W.cover||0);
    yards = rollOutcome(base, 'pass');
  } else if(key==='te_seam'){
    const te = off.find(p=>p.position==='TE'); desc = `TE seam to ${te?.name||'TE'}`;
    let base = (qb?.stats?.short || 72) + (te?.stats?.route || 70) - (buckets.cover - 70) + (W.cover||0);
    yards = rollOutcome(base, 'pass');
  } else {
    return {special:true};
  }

  return {desc, yards, autoFirst, penal};
}

function rollOutcome(base, type){
  const d2 = Math.floor(Math.random()*6)+1 + Math.floor(Math.random()*6)+1;
  const d6 = Math.floor(Math.random()*6)+1;
  const metric = base + (d2 - 7) * 3 + (d6 - 3);
  let yards = 0;
  if(metric < 60) {
    yards = (type==='run') ? Math.floor(Math.random()*2)-1 : 0;
  } else if(metric < 70){
    yards = (type==='run') ? 1 + Math.floor(Math.random()*3) : 3 + Math.floor(Math.random()*4);
  } else if(metric < 82){
    yards = (type==='run') ? 4 + Math.floor(Math.random()*5) : 7 + Math.floor(Math.random()*7);
  } else if(metric < 92){
    yards = (type==='run') ? 10 + Math.floor(Math.random()*10) : 15 + Math.floor(Math.random()*12);
  } else {
    yards = 25 + Math.floor(Math.random()*25);
  }
  return yards;
}

function advance(yards, autoFirst=false){
  STATE.yard += yards;
  if(STATE.yard >= 100){
    setResult(`TOUCHDOWN!`);
    if(STATE.possession==='USER') STATE.score.USER += 7; else STATE.score.CPU +=7;
    kickoffNext();
    return;
  }
  if(autoFirst){ STATE.down=1; STATE.toGo=10; updateField(); return; }
  STATE.toGo -= Math.max(0,yards);
  if(STATE.toGo <= 0){ STATE.down=1; STATE.toGo=10; }
  else { STATE.down++; if(STATE.down>4){ STATE.possession = (STATE.possession==='USER') ? 'CPU' : 'USER'; STATE.yard = 25; STATE.down=1; STATE.toGo=10; renderAll(); return; }}
  updateField();
}

function kickoffNext(){ STATE.yard=25; STATE.down=1; STATE.toGo=10; STATE.possession = (STATE.possession==='USER') ? 'CPU' : 'USER'; renderAll(); setResult(`${STATE.possession} ball on 25.`); }

function doPunt(){ const net = 30 + Math.floor(Math.random()*30); setResult(`Punt of ${net} yards.`); STATE.yard += net; if(STATE.yard>=100) STATE.yard=20; STATE.possession = (STATE.possession==='USER') ? 'CPU' : 'USER'; STATE.down=1; STATE.toGo=10; renderAll(); }

function doFG(){ const dist = 100 - STATE.yard + 17; const make = dist<=50 ? 0.88 : dist<=57 ? 0.65 : 0.35; const good = Math.random() < make; if(good){ setResult(`Field goal good from ${dist} yards.`); if(STATE.possession==='USER') STATE.score.USER+=3; else STATE.score.CPU+=3; kickoffNext(); } else { setResult(`Field goal missed from ${dist} yards.`); STATE.possession = (STATE.possession==='USER') ? 'CPU' : 'USER'; STATE.yard = 100 - dist; STATE.down=1; STATE.toGo=10; renderAll(); } }

function onPlay(key){ if(key==='punt') return doPunt(); if(key==='fg') return doFG(); const off = STATE.possession==='USER' ? STATE.user.abbr : STATE.cpu.abbr; const def = STATE.possession==='USER' ? STATE.cpu.abbr : STATE.user.abbr; const out = computeOutcome(off, def, key); setResult((STATE.possession==='USER' ? 'YOU: ' : 'CPU: ') + out.desc); advance(out.yards, out.autoFirst); renderAll(); if(STATE.possession!=='USER') setTimeout(()=> cpuPlay(), 850); }

function cpuPlay(){ if(STATE.possession==='USER') return; const choices = ['run_rb','short_pass','deep_pass','screen','te_seam','punt','fg']; const pick = choices[Math.floor(Math.random()*choices.length)]; onPlay(pick); }

function setResult(txt){ $('#result').textContent = txt; const log = document.getElementById('log'); const row=document.createElement('div'); row.textContent = txt; row.className='small'; log.prepend(row); }
function updateHeader(){ $('#homeName').textContent = `${STATE.user.name}`; $('#awayName').textContent = `${STATE.cpu.name}`; $('#homeScore').textContent = STATE.score.USER; $('#awayScore').textContent = STATE.score.CPU; }

function updateField(){ updateHeader(); const pct = Math.max(1,Math.min(99,STATE.yard)); $('#ball').style.left = pct + '%'; $('#downBadge').textContent = `${['1st','2nd','3rd','4th'][STATE.down-1]} & ${STATE.toGo} @ ${Math.round(STATE.yard)}`; $('#posBadge').textContent = `${STATE.possession} ball`; }

// Admin modal functions
function openAdmin(){ $('#adminModal').style.display='flex'; $('#rosterText').value = JSON.stringify(ROSTERS, null, 2); }
function closeAdmin(){ $('#adminModal').style.display='none'; }
function saveRosters(){ try{ const data = JSON.parse($('#rosterText').value); ROSTERS = data; localStorage.setItem('rosters-2008', JSON.stringify(data)); alert('Saved to localStorage'); closeAdmin(); }catch(e){ alert('Invalid JSON'); } }
function importRosters(){ try{ const data = JSON.parse($('#importText').value); ROSTERS = data; localStorage.setItem('rosters-2008', JSON.stringify(data)); alert('Imported and saved'); }catch(e){ alert('Invalid JSON'); } }
function exportRosters(){ $('#importText').value = JSON.stringify(ROSTERS, null, 2); }

document.addEventListener('DOMContentLoaded', ()=>{ $('#startBtn').addEventListener('click', startGame); $('#adminBtn').addEventListener('click', openAdmin); $('#adminClose').addEventListener('click', closeAdmin); $('#saveRosters').addEventListener('click', saveRosters); $('#importBtn').addEventListener('click', importRosters); $('#exportBtn').addEventListener('click', exportRosters); load(); });
