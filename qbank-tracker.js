(function(){
  const KEY='universal_qbank_tracker_v1';
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{"entries":[]}')}catch(e){return {entries:[]}}}
  function save(d){localStorage.setItem(KEY,JSON.stringify(d))}
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function topicsFromPage(){return [...document.querySelectorAll('.topic-btn')].map(b=>({id:b.dataset.topic||b.textContent.trim(),name:b.textContent.replace(/^\s*\d+\.\s*/,'').trim()}))}
  function pageDay(){return document.body.dataset.studyDay || (document.title.match(/Day\s+(\d+)/i)?.[1] ? 'Day '+document.title.match(/Day\s+(\d+)/i)[1] : 'Study')}
  function aggregate(entries){
    const a={answered:0,correct:0,incorrect:0,flagged:0};
    entries.forEach(e=>{a.answered+=+e.answered||0;a.correct+=+e.correct||0;a.incorrect+=+e.incorrect||0;a.flagged+=+e.flagged||0});
    a.accuracy=a.answered?Math.round(a.correct/a.answered*100):0;return a;
  }
  function grouped(entries){const m={};entries.forEach(e=>{const k=e.day+'||'+e.topic;(m[k]||(m[k]={day:e.day,topic:e.topic,entries:[]})).entries.push(e)});return Object.values(m)}
  function renderDay(){
    const root=document.getElementById('qbank-tracker'); if(!root)return;
    const day=root.dataset.day||pageDay(), topics=topicsFromPage(), d=load();
    const dayEntries=d.entries.filter(e=>e.day===day), total=aggregate(dayEntries);
    const opts=topics.map(t=>`<option value="${esc(t.name)}">${esc(t.name)}</option>`).join('');
    root.innerHTML=`<div class="qbank-card"><h2>📊 External QBank Progress</h2><p class="qbank-sub">Track performance from any question bank or exam source without copying question stems or answer choices.</p>
    <div class="qbank-note"><b>Copyright-safe:</b> save only your counts and a short learning point in your own words. Do not paste third-party questions or explanations here.</div>
    <div class="qbank-stats"><div class="qbank-stat"><span>Answered</span><b>${total.answered}</b></div><div class="qbank-stat"><span>Correct</span><b>${total.correct}</b></div><div class="qbank-stat"><span>Incorrect</span><b>${total.incorrect}</b></div><div class="qbank-stat"><span>Accuracy</span><b>${total.accuracy}%</b></div><div class="qbank-stat"><span>Flagged</span><b>${total.flagged}</b></div></div>
    <h3>Add a practice session</h3><div class="qbank-form">
      <label>Topic<select id="qb-topic">${opts}</select></label>
      <label>Source label<input id="qb-source" placeholder="e.g. QBank A, USMLE, PLAB"></label>
      <label>Answered<input id="qb-answered" type="number" min="0" value="0"></label>
      <label>Correct<input id="qb-correct" type="number" min="0" value="0"></label>
      <label>Flagged / unsure<input id="qb-flagged" type="number" min="0" value="0"></label>
      <label class="qbank-wide">Learning point<textarea id="qb-learning" placeholder="Write the rule or concept you learned in your own words."></textarea></label>
    </div><div class="qbank-actions"><button class="qbank-btn" id="qb-save">Save session</button><button class="qbank-btn secondary" id="qb-export">Export my tracker</button><span class="qbank-message" id="qb-msg"></span></div>
    <h3 style="margin-top:20px">Progress by topic</h3><div id="qb-table"></div><div class="qbank-history" id="qb-history"></div></div>`;
    function draw(){const cur=load().entries.filter(e=>e.day===day); const gs=grouped(cur); if(!gs.length){document.getElementById('qb-table').innerHTML='<div class="qbank-empty">No external QBank sessions saved for this day yet.</div>';document.getElementById('qb-history').innerHTML='';return}
      const rows=gs.map(g=>{const x=aggregate(g.entries); const latest=[...g.entries].reverse().find(e=>e.learning)?.learning||'';return `<tr><td>${esc(g.topic)}</td><td>${x.answered}</td><td>${x.correct}</td><td>${x.incorrect}</td><td>${x.accuracy}%</td><td>${x.flagged}</td><td>${esc(latest)}</td></tr>`}).join('');
      document.getElementById('qb-table').innerHTML=`<div class="qbank-table-wrap"><table class="qbank-table"><thead><tr><th>Topic</th><th>Answered</th><th>Correct</th><th>Incorrect</th><th>Accuracy</th><th>Flagged</th><th>Latest learning point</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      document.getElementById('qb-history').innerHTML=`<details><summary>View session history (${cur.length})</summary>${[...cur].reverse().map(e=>`<div class="qbank-history-item"><b>${esc(e.topic)}</b> — ${e.correct}/${e.answered} correct${e.source?` <span class="qbank-source-label">· ${esc(e.source)}</span>`:''}<br><span class="qbank-source-label">${esc(e.date)}</span>${e.learning?`<br>${esc(e.learning)}`:''}</div>`).join('')}</details>`;
    }
    document.getElementById('qb-save').onclick=()=>{let answered=+document.getElementById('qb-answered').value||0, correct=+document.getElementById('qb-correct').value||0, flagged=+document.getElementById('qb-flagged').value||0; if(correct>answered){document.getElementById('qb-msg').textContent='Correct cannot exceed answered.';return} const data=load();data.entries.push({day,topic:document.getElementById('qb-topic').value,source:document.getElementById('qb-source').value.trim(),answered,correct,incorrect:Math.max(answered-correct,0),flagged,learning:document.getElementById('qb-learning').value.trim(),date:new Date().toLocaleDateString()});save(data);document.getElementById('qb-msg').textContent='Saved ✓';setTimeout(()=>location.reload(),350)};
    document.getElementById('qb-export').onclick=()=>{const blob=new Blob([JSON.stringify(load(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='qbank-progress.json';a.click();URL.revokeObjectURL(a.href)};
    draw();
  }
  function renderHome(){const root=document.getElementById('qbank-summary');if(!root)return;const d=load(),tot=aggregate(d.entries),gs=grouped(d.entries).map(g=>({...g,stats:aggregate(g.entries)}));const eligible=gs.filter(g=>g.stats.answered>=5).sort((a,b)=>a.stats.accuracy-b.stats.accuracy);const weak=eligible[0];root.innerHTML=`<div class="qbank-card"><h2>📊 My QBank Progress</h2><p class="qbank-sub">Private browser-based tracking for any external QBank or international exam.</p><div class="qbank-home-grid"><div class="qbank-stat"><span>Answered</span><b>${tot.answered}</b></div><div class="qbank-stat"><span>Correct</span><b>${tot.correct}</b></div><div class="qbank-stat"><span>Incorrect</span><b>${tot.incorrect}</b></div><div class="qbank-stat"><span>Overall accuracy</span><b>${tot.accuracy}%</b></div></div>${weak?`<div class="qbank-weak"><b>Needs review:</b> ${esc(weak.day)} · ${esc(weak.topic)} — ${weak.stats.accuracy}% across ${weak.stats.answered} questions</div>`:'<div class="qbank-empty">Your topic summaries will appear here after you save QBank sessions on the day pages.</div>'}</div>`}
  document.addEventListener('DOMContentLoaded',()=>{renderDay();renderHome()});
})();
