
const load=(k,f)=>JSON.parse(localStorage.getItem(k)||JSON.stringify(f));
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let notes=load("study_notes",[]);
let mistakes=load("study_mistakes",[]);
let stats=load("study_stats",[]);
let dayDone=load("day_done",Array(30).fill(false));

function updateKPIs(){
  const d=dayDone.filter(Boolean).length;
  const q=stats.reduce((a,s)=>a+(+s.q||0),0);
  document.querySelectorAll("[data-days]").forEach(x=>x.textContent=d);
  document.querySelectorAll("[data-questions]").forEach(x=>x.textContent=q);
  document.querySelectorAll("[data-mistakes]").forEach(x=>x.textContent=mistakes.length);
  document.querySelectorAll("[data-notes]").forEach(x=>x.textContent=notes.length);
  document.querySelectorAll("[data-progress]").forEach(x=>x.style.width=(d/30*100)+"%");
}
function openModal(id){document.getElementById(id)?.classList.add("open")}
function closeModal(id){document.getElementById(id)?.classList.remove("open")}
function saveNote(){
  const subject=document.getElementById("noteSubject").value;
  const title=document.getElementById("noteTitle").value.trim();
  const body=document.getElementById("noteBody").value.trim();
  if(!title)return alert("Add a title.");
  notes.push({subject,title,body,date:new Date().toLocaleDateString()});
  save("study_notes",notes); closeModal("noteModal"); updateKPIs();
  document.getElementById("noteTitle").value="";document.getElementById("noteBody").value="";
}
function saveMistake(){
  const topic=document.getElementById("mTopic").value.trim();
  const clue=document.getElementById("mClue").value.trim();
  const answer=document.getElementById("mAnswer").value.trim();
  const rule=document.getElementById("mRule").value.trim();
  if(!clue||!answer)return alert("Add clue and answer.");
  mistakes.push({topic,clue,answer,rule,date:new Date().toLocaleDateString()});
  save("study_mistakes",mistakes);closeModal("mistakeModal");updateKPIs();
  ["mTopic","mClue","mAnswer","mRule"].forEach(id=>document.getElementById(id).value="");
}
function markDay1(){
  dayDone[0]=true;save("day_done",dayDone);updateKPIs();
  alert("Day 1 marked complete.");
}

// Per-topic personal notes (saved in this browser)
function saveTopicNote(topicId){
  const el=document.getElementById("note-"+topicId);
  if(!el) return;
  localStorage.setItem("day1_"+topicId, el.value);
  const status=document.getElementById("status-"+topicId);
  if(status){
    status.textContent="Saved";
    setTimeout(()=>status.textContent="",1500);
  }
}
function loadTopicNotes(){
  ["abcde","shock","sepsis","anaphylaxis","ams","heat","burns","trauma"].forEach(id=>{
    const el=document.getElementById("note-"+id);
    if(el) el.value=localStorage.getItem("day1_"+id)||"";
  });
}
function saveExamCure(){
  const q=+document.getElementById("ecq").value||0;
  const score=+document.getElementById("ecscore").value||0;
  const wrong=+document.getElementById("ecwrong").value||0;
  const weak=document.getElementById("ecweak").value.trim();
  localStorage.setItem("day1_examcure",JSON.stringify({q,score,wrong,weak}));
  alert("Day 1 ExamCure tracker saved.");
}
function loadExamCure(){
  const d=JSON.parse(localStorage.getItem("day1_examcure")||"{}");
  if(document.getElementById("ecq")) document.getElementById("ecq").value=d.q||"";
  if(document.getElementById("ecscore")) document.getElementById("ecscore").value=d.score||"";
  if(document.getElementById("ecwrong")) document.getElementById("ecwrong").value=d.wrong||"";
  if(document.getElementById("ecweak")) document.getElementById("ecweak").value=d.weak||"";
}
document.addEventListener("DOMContentLoaded",()=>{updateKPIs();loadTopicNotes();loadExamCure();});
