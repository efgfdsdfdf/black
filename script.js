// ================= USER MANAGEMENT ================= //
function getCurrentUser() { return localStorage.getItem("currentUser"); }

function signup(username, password) {
  if (!username || !password) return alert("Please fill all fields!");
  let users = JSON.parse(localStorage.getItem("users")) || {};
  if (users[username]) return alert("User already exists!");
  users[username] = { password, notes: [], timetable: [], gpa: [], profile: {}, notifications: [] };
  localStorage.setItem("users", JSON.stringify(users));
  alert("Account created! Please login.");
  window.location.href = "index.html";
}

function login(username, password) {
  let users = JSON.parse(localStorage.getItem("users")) || {};
  if (users[username] && users[username].password === password) {
    localStorage.setItem("currentUser", username);
    window.location.href = "homepage.html";
  } else alert("Invalid username or password.");
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}

// ================= NOTES MODULE ================= //
(function() {
  let editingIndex = -1;

  function getUsers() { return JSON.parse(localStorage.getItem("users") || "{}"); }
  function saveUsers(users) { localStorage.setItem("users", JSON.stringify(users)); }

  function els() {
    return {
      noteInput: document.getElementById("noteInput"),
      saveBtn: document.getElementById("saveNoteBtn") || document.getElementById("addNoteBtn"),
      cancelBtn: document.getElementById("cancelNoteEditBtn"),
      notesList: document.getElementById("notesList"),
      noteForm: document.getElementById("noteForm")
    };
  }

  function renderNotes() {
    const { notesList } = els();
    if (!notesList) return;
    const user = getCurrentUser();
    if (!user) return notesList.innerHTML="<li>Please log in to manage notes.</li>";

    const users = getUsers();
    const notes = users[user]?.notes || [];
    notesList.innerHTML = "";
    if (notes.length === 0) {
      notesList.innerHTML='<li style="opacity:.8">No notes yet — add one above.</li>';
      return;
    }

    notes.forEach((note, i)=>{
      const li = document.createElement("li");
      li.className="note-item";
      li.style.display="flex"; li.style.justifyContent="space-between"; li.style.alignItems="center"; li.style.gap="8px";
      const textDiv = document.createElement("div");
      textDiv.innerHTML=note.replace(/\n/g,"<br>");
      textDiv.style.flex="1"; textDiv.style.textAlign="left";

      const actions = document.createElement("div");
      actions.style.display="flex"; actions.style.gap="6px";
      const editBtn = document.createElement("button"); editBtn.textContent="✏️ Edit"; editBtn.onclick=()=>startEdit(i);
      const delBtn = document.createElement("button"); delBtn.textContent="🗑️ Delete"; delBtn.className="delete-btn"; delBtn.onclick=()=>{ if(confirm("Delete this note?")) deleteNote(i); };

      actions.appendChild(editBtn); actions.appendChild(delBtn);
      li.appendChild(textDiv); li.appendChild(actions);
      notesList.appendChild(li);
    });
  }

  function startEdit(index) {
    const { noteInput, saveBtn, cancelBtn } = els();
    const user = getCurrentUser();
    if (!user) return alert("Please login to edit notes.");
    const users = getUsers();
    const notes = users[user]?.notes || [];
    if (!notes[index]) return;
    noteInput.value = notes[index];
    editingIndex = index;
    if (saveBtn) saveBtn.textContent="🔁 Update Note";
    if (cancelBtn) cancelBtn.style.display="inline-block";
    noteInput.focus(); noteInput.selectionStart=noteInput.selectionEnd=noteInput.value.length;
  }

  function cancelEdit() {
    const { noteInput, saveBtn, cancelBtn } = els();
    editingIndex=-1; if(noteInput) noteInput.value=""; if(saveBtn) saveBtn.textContent="💾 Save Note"; if(cancelBtn) cancelBtn.style.display="none";
  }

  function handleSave(e) {
    if(e) e.preventDefault();
    const { noteInput, saveBtn, cancelBtn } = els();
    if(!noteInput) return;
    const text = noteInput.value.trim();
    if(!text) return alert("Please type a note before saving.");
    const user = getCurrentUser();
    if(!user) return alert("Please login to save notes.");
    const users = getUsers();
    if(!users[user]) users[user]={password:"",notes:[],timetable:[],gpa:[],profile:{},notifications:[]};
    if(!Array.isArray(users[user].notes)) users[user].notes=[];
    if(editingIndex===-1) users[user].notes.push(text);
    else { users[user].notes[editingIndex]=text; editingIndex=-1; if(saveBtn) saveBtn.textContent="💾 Save Note"; }
    saveUsers(users); if(noteInput) noteInput.value=""; if(cancelBtn) cancelBtn.style.display="none"; renderNotes();
  }

  function deleteNote(index) {
    const user = getCurrentUser();
    if(!user) return;
    const users = getUsers();
    if(!users[user]?.notes) return;
    users[user].notes.splice(index,1);
    saveUsers(users);
    if(editingIndex===index) cancelEdit();
    if(editingIndex>index) editingIndex--;
    renderNotes();
  }

  function init() {
    const { noteInput, saveBtn, cancelBtn, noteForm } = els();
    if(noteForm) noteForm.addEventListener("submit", handleSave);
    else if(saveBtn){ saveBtn.type="button"; saveBtn.addEventListener("click", handleSave); }
    if(cancelBtn){ cancelBtn.type="button"; cancelBtn.addEventListener("click", cancelEdit); cancelBtn.style.display="none"; }
    if(noteInput){ noteInput.addEventListener("keydown",(ev)=>{ if(ev.key==="Enter" && (ev.ctrlKey||ev.metaKey)){ ev.preventDefault(); handleSave(); } }); }
    renderNotes();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.__notes={ renderNotes, startEdit, deleteNote, handleSave, cancelEdit };
})();

// ================= TIMETABLE ================= //
let editingTimetableIndex = null;
function addClass(e){
  e.preventDefault();
  const user=getCurrentUser(); if(!user) return;
  const course=document.getElementById("classCourse").value.trim();
  const day=document.getElementById("classDay").value;
  const time=document.getElementById("classTime").value;
  const notifyBefore=parseInt(document.getElementById("notifyBefore").value);
  if(!course||!day||!time) return alert("Please fill all fields.");

  let users=JSON.parse(localStorage.getItem("users"))||{};
  if(!users[user].timetable) users[user].timetable=[];
  if(editingTimetableIndex===null) users[user].timetable.push({course,day,time,notifyBefore});
  else{ users[user].timetable[editingTimetableIndex]={course,day,time,notifyBefore}; editingTimetableIndex=null; document.getElementById("addClassBtn").textContent="➕ Add Class"; document.getElementById("cancelEditBtn").style.display="none"; }

  localStorage.setItem("users",JSON.stringify(users));
  document.getElementById("timetableForm").reset();
  loadTimetable();
}

function loadTimetable(){
  const user=getCurrentUser(); if(!user) return;
  let users=JSON.parse(localStorage.getItem("users"))||{};
  const timetable=users[user].timetable||[];
  const list=document.getElementById("timetableList"); if(!list) return;
  list.innerHTML="";
  timetable.forEach((item,index)=>{
    const li=document.createElement("li");
    li.innerHTML=`<span><b>${item.course}</b> - ${item.day}, ${item.time} (⏰ ${item.notifyBefore} min before)</span>`;
    const editBtn=document.createElement("button"); editBtn.textContent="Edit"; editBtn.onclick=()=>editClass(index);
    const delBtn=document.createElement("button"); delBtn.textContent="Delete"; delBtn.onclick=()=>deleteClass(index);
    li.appendChild(editBtn); li.appendChild(delBtn);
    list.appendChild(li);
  });
}

function editClass(index){
  const user=getCurrentUser(); if(!user) return;
  let users=JSON.parse(localStorage.getItem("users"));
  const item=users[user].timetable[index];
  document.getElementById("classCourse").value=item.course;
  document.getElementById("classDay").value=item.day;
  document.getElementById("classTime").value=item.time;
  document.getElementById("notifyBefore").value=item.notifyBefore;
  editingTimetableIndex=index; document.getElementById("addClassBtn").textContent="Update Class"; document.getElementById("cancelEditBtn").style.display="inline-block";
}

function deleteClass(index){
  const user=getCurrentUser(); if(!user) return;
  let users=JSON.parse(localStorage.getItem("users"));
  users[user].timetable.splice(index,1);
  localStorage.setItem("users",JSON.stringify(users));
  loadTimetable();
}

document.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("timetableForm");
  if(form) form.addEventListener("submit",addClass);
  const cancelBtn=document.getElementById("cancelEditBtn");
  if(cancelBtn) cancelBtn.addEventListener("click",()=>{
    editingTimetableIndex=null;
    document.getElementById("timetableForm").reset();
    document.getElementById("addClassBtn").textContent="➕ Add Class";
    cancelBtn.style.display="none";
  });
  loadTimetable();
});

// ================= GPA ================= //
const gpaForm=document.getElementById("gpaForm");
const courseNameInput=document.getElementById("courseName");
const courseGradeInput=document.getElementById("courseGrade");
const courseUnitsInput=document.getElementById("courseUnits");
const gpaList=document.getElementById("gpaList");
const gpaResult=document.getElementById("gpaResult");
const cancelEditBtn=document.getElementById("cancelCourseEditBtn");
const gradePoints={A:5,B:4,C:3,D:2,E:1,F:0};
let gpaCourses=[], gpaEditIndex=null;

function loadGPA(){
  const user=getCurrentUser(); if(!user) return;
  let users=JSON.parse(localStorage.getItem("users"))||{};
  if(!users[user].gpa) users[user].gpa=[];
  gpaCourses=users[user].gpa;
  displayGPA();
}

function displayGPA(){
  gpaList.innerHTML="";
  if(gpaCourses.length===0){ gpaList.innerHTML='<li style="color:gray;text-align:center;">No courses added yet.</li>'; gpaResult.textContent="0.00"; return; }
  gpaCourses.forEach((c,i)=>{
    const li=document.createElement("li");
    li.innerHTML=`<span>${c.name} - <b>${c.grade}</b> (${c.units} units)</span>
    <div class="actions">
      <button class="edit-btn" onclick="editGPA(${i})">✏️</button>
      <button class="delete-btn" onclick="deleteGPA(${i})">🗑️</button>
    </div>`;
    gpaList.appendChild(li);
  });
  calculateGPA();
}

function calculateGPA(){
  let totalUnits=0, totalPoints=0;
  gpaCourses.forEach(c=>{ totalUnits+=c.units; totalPoints+=gradePoints[c.grade]*c.units; });
  gpaResult.textContent=totalUnits>0?(totalPoints/totalUnits).toFixed(2):"0.00";
}

function saveGPA(){ const user=getCurrentUser(); if(!user) return; let users=JSON.parse(localStorage.getItem("users")); users[user].gpa=gpaCourses; localStorage.setItem("users",JSON.stringify(users)); }

if(gpaForm) gpaForm.addEventListener("submit",e=>{
  e.preventDefault();
  const name=courseNameInput.value.trim(); const grade=courseGradeInput.value; const units=parseInt(courseUnitsInput.value);
  if(!name||!grade||isNaN(units)) return alert("Please fill all fields correctly!");
  const course={name,grade,units};
  if(gpaEditIndex!==null){ gpaCourses[gpaEditIndex]=course; gpaEditIndex=null; cancelEditBtn.style.display="none"; }
  else gpaCourses.push(course);
  saveGPA(); displayGPA(); gpaForm.reset();
});

function editGPA(i){ const c=gpaCourses[i]; courseNameInput.value=c.name; courseGradeInput.value=c.grade; courseUnitsInput.value=c.units; gpaEditIndex=i; cancelEditBtn.style.display="inline-block"; }

if(cancelEditBtn) cancelEditBtn.addEventListener("click",()=>{ gpaEditIndex=null; cancelEditBtn.style.display="none"; gpaForm.reset(); });

function deleteGPA(i){ if(confirm("Delete this course?")){ gpaCourses.splice(i,1); saveGPA(); displayGPA(); } }

document.addEventListener("DOMContentLoaded", loadGPA);

// ================= LOGOUT ================= //
const logoutButton=document.getElementById("logoutBtn");
if(logoutButton) logoutButton.addEventListener("click",()=>{ if(confirm("Logout now?")) logout(); });
