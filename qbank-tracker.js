(function(){
  const KEY='universal_qbank_tracker_v2';
  const OLD_KEY='universal_qbank_tracker_v1';
  const SUBJECTS=['Emergency Medicine','Cardiology','Respiratory Medicine','Endocrinology','Gastroenterology','Neurology','Infectious Diseases','Nephrology','Hematology','Rheumatology','Pediatrics','Obstetrics & Gynecology','Psychiatry','Dermatology','Surgery','Preventive Medicine','Mixed / General Medicine'];
  const DAY_SUBJECT={'Day 1':'Emergency Medicine','Day 2':'Cardiology','Day 3':'Cardiology','Day 4':'Respiratory Medicine','Day 5':'Endocrinology','Day 6':'Endocrinology','Day 7':'Nephrology','Day 8':'Nephrology','Day 9':'Infectious Diseases','Day 10':'Infectious Diseases'};
  function load(){
    try{
      let v=JSON.parse(localStorage.getItem(KEY)||'null');
      if(v&&Array.isArray(v.entries)) return v;
      const old=JSON.parse(localStorage.getItem(OLD_KEY)||'null');
      if(old&&Array.isArray(old.entries)){
        v={entries:old.entries.map(e=>({
          subject:DAY_SUBJECT[e.day]||'Mixed / General Medicine', source:e.source||'', answered:+e.answered||0,
          correct:+e.correct||0, incorrect:Number.isFinite(+e.incorrect)?+e.incorrect:Math.max((+e.answered||0)-(+e.correct||0),0),
          flagged:+e.flagged||0, weakAreas:e.topic||'', learning:e.learning||'', date:e.date||new Date().toLocaleDateString(),
          originDay:e.day||''
        }))};
        save(v); return v;
      }
      return {entries:[]};
    }catch(e){return {entries:[]}}
  }
  function save(d){localStorage.setItem(KEY,JSON.stringify(d))}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function pageDay(){return document.body.dataset.studyDay || (document.title.match(/Day\s+(\d+)/i)?.[1] ? 'Day '+document.title.match(/Day\s+(\d+)/i)[1] : 'Study')}
  function aggregate(entries){const a={answered:0,correct:0,incorrect:0,flagged:0};entries.forEach(e=>{a.answered+=+e.answered||0;a.correct+=+e.correct||0;a.incorrect+=+e.incorrect||0;a.flagged+=+e.flagged||0});a.accuracy=a.answered?Math.round(a.correct/a.answered*100):0;return a}
  function groupedBySubject(entries){const m={};entries.forEach(e=>{const k=e.subject||'Mixed / General Medicine';(m[k]||(m[k]={subject:k,entries:[]})).entries.push(e)});return Object.values(m)}
  function subjectOptions(selected){return SUBJECTS.map(s=>`<option value="${esc(s)}"${s===selected?' selected':''}>${esc(s)}</option>`).join('')}
  function renderDay(){
    const root=document.getElementById('qbank-tracker'); if(!root)return;
    const day=root.dataset.day||pageDay(), defaultSubject=DAY_SUBJECT[day]||'Mixed / General Medicine', d=load();
    const subjectEntries=d.entries.filter(e=>e.subject===defaultSubject), total=aggregate(subjectEntries);
    root.innerHTML=`<div class="qbank-card"><h2>📊 External QBank Progress</h2><p class="qbank-sub">Log mixed question-bank blocks by <b>subject</b>. Topic-level details are optional and can be added only when you notice a weakness.</p>
    <div class="qbank-note"><b>Copyright-safe:</b> save your counts and your own learning points only. Do not paste third-party question stems, answer choices, or explanations.</div>
    <div class="qbank-stats"><div class="qbank-stat"><span>${esc(defaultSubject)} answered</span><b>${total.answered}</b></div><div class="qbank-stat"><span>Correct</span><b>${total.correct}</b></div><div class="qbank-stat"><span>Incorrect</span><b>${total.incorrect}</b></div><div class="qbank-stat"><span>Accuracy</span><b>${total.accuracy}%</b></div><div class="qbank-stat"><span>Flagged</span><b>${total.flagged}</b></div></div>
    <h3>Add a practice block</h3><div class="qbank-form">
      <label>Subject / block<select id="qb-subject">${subjectOptions(defaultSubject)}</select></label>
      <label>Source label <span class="qbank-optional">optional</span><input id="qb-source" placeholder="e.g. QBank A, PLAB, USMLE"></label>
      <label>Answered<input id="qb-answered" type="number" min="0" value="0"></label>
      <label>Correct<input id="qb-correct" type="number" min="0" value="0"></label>
      <label>Flagged / unsure<input id="qb-flagged" type="number" min="0" value="0"></label>
      <label class="qbank-wide">Weak areas noticed <span class="qbank-optional">optional</span><input id="qb-weak" placeholder="e.g. shock, toxidromes, trauma"></label>
      <label class="qbank-wide">Learning point <span class="qbank-optional">optional</span><textarea id="qb-learning" placeholder="Write one useful rule or concept in your own words."></textarea></label>
    </div><div class="qbank-actions"><button class="qbank-btn" id="qb-save">Save block</button><button class="qbank-btn secondary" id="qb-export">Export my tracker</button><span class="qbank-message" id="qb-msg"></span></div>
    <h3 style="margin-top:20px">Progress by subject</h3><div id="qb-table"></div><div class="qbank-history" id="qb-history"></div></div>`;
    function draw(){
      const cur=load().entries, gs=groupedBySubject(cur).sort((a,b)=>a.subject.localeCompare(b.subject));
      if(!gs.length){document.getElementById('qb-table').innerHTML='<div class="qbank-empty">No external QBank blocks saved yet.</div>';document.getElementById('qb-history').innerHTML='';return}
      const rows=gs.map(g=>{const x=aggregate(g.entries);const latestWeak=[...g.entries].reverse().find(e=>e.weakAreas)?.weakAreas||'';return `<tr><td>${esc(g.subject)}</td><td>${x.answered}</td><td>${x.correct}</td><td>${x.incorrect}</td><td>${x.accuracy}%</td><td>${x.flagged}</td><td>${esc(latestWeak||'—')}</td></tr>`}).join('');
      document.getElementById('qb-table').innerHTML=`<div class="qbank-table-wrap"><table class="qbank-table"><thead><tr><th>Subject / Block</th><th>Answered</th><th>Correct</th><th>Incorrect</th><th>Accuracy</th><th>Flagged</th><th>Recent weak areas</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      document.getElementById('qb-history').innerHTML=`<details><summary>View block history (${cur.length})</summary>${[...cur].reverse().map(e=>`<div class="qbank-history-item"><b>${esc(e.subject)}</b> — ${e.correct}/${e.answered} correct${e.source?` <span class="qbank-source-label">· ${esc(e.source)}</span>`:''}<br><span class="qbank-source-label">${esc(e.date)}</span>${e.weakAreas?`<br><b>Weak areas:</b> ${esc(e.weakAreas)}`:''}${e.learning?`<br><b>Learning point:</b> ${esc(e.learning)}`:''}</div>`).join('')}</details>`;
    }
    document.getElementById('qb-save').onclick=()=>{
      const answered=+document.getElementById('qb-answered').value||0, correct=+document.getElementById('qb-correct').value||0, flagged=+document.getElementById('qb-flagged').value||0, msg=document.getElementById('qb-msg');
      if(answered<=0){msg.textContent='Enter the number of questions answered.';return}
      if(correct>answered){msg.textContent='Correct cannot exceed answered.';return}
      if(flagged>answered){msg.textContent='Flagged cannot exceed answered.';return}
      const data=load();data.entries.push({subject:document.getElementById('qb-subject').value,source:document.getElementById('qb-source').value.trim(),answered,correct,incorrect:answered-correct,flagged,weakAreas:document.getElementById('qb-weak').value.trim(),learning:document.getElementById('qb-learning').value.trim(),date:new Date().toLocaleDateString(),originDay:day});save(data);msg.textContent='Saved ✓';setTimeout(()=>location.reload(),350)
    };
    document.getElementById('qb-export').onclick=()=>{const blob=new Blob([JSON.stringify(load(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='qbank-progress.json';a.click();URL.revokeObjectURL(a.href)};
    draw();
  }
  function renderHome(){
    const root=document.getElementById('qbank-summary');if(!root)return;const d=load(),tot=aggregate(d.entries),gs=groupedBySubject(d.entries).map(g=>({...g,stats:aggregate(g.entries)}));
    const eligible=gs.filter(g=>g.stats.answered>=10).sort((a,b)=>a.stats.accuracy-b.stats.accuracy), weak=eligible[0], strong=[...eligible].sort((a,b)=>b.stats.accuracy-a.stats.accuracy)[0];
    const table=gs.length?`<div class="qbank-table-wrap qbank-home-table"><table class="qbank-table"><thead><tr><th>Subject</th><th>Answered</th><th>Accuracy</th></tr></thead><tbody>${gs.sort((a,b)=>b.stats.answered-a.stats.answered).map(g=>`<tr><td>${esc(g.subject)}</td><td>${g.stats.answered}</td><td>${g.stats.accuracy}%</td></tr>`).join('')}</tbody></table></div>`:'';
    root.innerHTML=`<div class="qbank-card"><h2>📊 My QBank Progress</h2><p class="qbank-sub">Private browser-based tracking for mixed practice blocks from any external QBank or international exam.</p><div class="qbank-home-grid"><div class="qbank-stat"><span>Answered</span><b>${tot.answered}</b></div><div class="qbank-stat"><span>Correct</span><b>${tot.correct}</b></div><div class="qbank-stat"><span>Incorrect</span><b>${tot.incorrect}</b></div><div class="qbank-stat"><span>Overall accuracy</span><b>${tot.accuracy}%</b></div></div>${weak?`<div class="qbank-insights"><div class="qbank-weak"><b>Needs most review:</b> ${esc(weak.subject)} — ${weak.stats.accuracy}% across ${weak.stats.answered} questions</div>${strong&&strong.subject!==weak.subject?`<div class="qbank-strong"><b>Strongest subject:</b> ${esc(strong.subject)} — ${strong.stats.accuracy}%</div>`:''}</div>`:'<div class="qbank-empty">Subject summaries will appear here after you save QBank blocks.</div>'}${table}</div>`
  }
  document.addEventListener('DOMContentLoaded',()=>{renderDay();renderHome()});
})();
