const CONFIG = window.APP_CONFIG || {};
const sb = (CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && window.supabase)
  ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey)
  : null;

const planDays = [
  "Dia 1 - Mateus 5","Dia 2 - João 3","Dia 3 - Salmos 23","Dia 4 - Romanos 8","Dia 5 - Filipenses 4",
  "Dia 6 - Provérbios 3","Dia 7 - Isaías 41","Dia 8 - João 14","Dia 9 - Salmos 91","Dia 10 - Tiago 1",
  "Dia 11 - Hebreus 11","Dia 12 - Efésios 6","Dia 13 - Apocalipse 21","Dia 14 - Gênesis 1","Dia 15 - Êxodo 14",
  "Dia 16 - Josué 1","Dia 17 - 1 Samuel 17","Dia 18 - Salmos 1","Dia 19 - Provérbios 31","Dia 20 - Mateus 6",
  "Dia 21 - Lucas 15","Dia 22 - João 10","Dia 23 - Atos 2","Dia 24 - 1 Coríntios 13","Dia 25 - Gálatas 5",
  "Dia 26 - Colossenses 3","Dia 27 - 2 Timóteo 1","Dia 28 - Hebreus 12","Dia 29 - 1 Pedro 5","Dia 30 - Apocalipse 22"
];

const state = {
  user: null,
  theme: localStorage.getItem("acf_ia_theme") || "dark",
  favorites: JSON.parse(localStorage.getItem("acf_ia_favorites") || "[]"),
  notes: JSON.parse(localStorage.getItem("acf_ia_notes") || "{}"),
  plan: JSON.parse(localStorage.getItem("acf_ia_plan") || "{}"),
  lastAiAnswer: ""
};

function el(id){ return document.getElementById(id); }
function saveLocal(){
  localStorage.setItem("acf_ia_theme", state.theme);
  localStorage.setItem("acf_ia_favorites", JSON.stringify(state.favorites));
  localStorage.setItem("acf_ia_notes", JSON.stringify(state.notes));
  localStorage.setItem("acf_ia_plan", JSON.stringify(state.plan));
}
function toast(msg){
  const t = el("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1800);
}
function switchView(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.querySelectorAll(".menu-btn").forEach(v=>v.classList.remove("active"));
  el("view-" + view).classList.add("active");
  document.querySelector(`.menu-btn[data-view="${view}"]`).classList.add("active");
  if(view === "favoritos") renderFavorites();
  if(view === "anotacoes") renderNotes();
  if(view === "plano") renderPlan();
}
window.switchView = switchView;

function setTheme(){
  document.body.className = state.theme === "light" ? "light" : "";
}
function setAuthStatus(){
  el("authStatus").textContent = state.user ? `Logado: ${state.user.email}` : "Modo local";
}
function renderFavorites(list = state.favorites){
  const root = el("favoritesList");
  root.innerHTML = "";
  if(!list.length){
    root.innerHTML = '<div class="item">Nenhum favorito salvo.</div>';
    return;
  }
  list.forEach(ref => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `<div class="item-title">${ref}</div>`;
    const row = document.createElement("div");
    row.className = "row";
    const removeBtn = document.createElement("button");
    removeBtn.className = "ghost";
    removeBtn.textContent = "Remover";
    removeBtn.onclick = ()=>removeFavorite(ref);
    row.appendChild(removeBtn);
    item.appendChild(row);
    root.appendChild(item);
  });
}
function renderNotes(listEntries = Object.entries(state.notes)){
  const root = el("notesList");
  root.innerHTML = "";
  if(!listEntries.length){
    root.innerHTML = '<div class="item">Nenhuma anotação salva.</div>';
    return;
  }
  listEntries.forEach(([ref, text]) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `<div class="item-title">${ref}</div><div>${String(text).slice(0, 280)}</div>`;
    item.onclick = ()=>{
      el("noteRef").value = ref;
      el("noteText").value = text;
    };
    root.appendChild(item);
  });
}
function renderPlan(){
  const root = el("planList");
  root.innerHTML = "";
  planDays.forEach((day, i) => {
    const done = !!state.plan[i];
    const item = document.createElement("div");
    item.className = "plan-item" + (done ? " done" : "");
    item.innerHTML = `<div class="item-title">${day}</div><div class="muted">${done ? "Concluído" : "Pendente"}</div>`;
    const btn = document.createElement("button");
    btn.style.marginTop = "10px";
    btn.textContent = done ? "Marcar pendente" : "Concluir";
    btn.onclick = ()=>togglePlan(i);
    item.appendChild(btn);
    root.appendChild(item);
  });
}
function renderQuickSearch(){
  const term = el("quickSearch").value.trim().toLowerCase();
  const root = el("quickSearchResults");
  root.innerHTML = "";
  if(!term) return;
  const favs = state.favorites.filter(x => x.toLowerCase().includes(term)).map(x => ({type:"Favorito", ref:x, text:""}));
  const notes = Object.entries(state.notes).filter(([r,t]) => r.toLowerCase().includes(term) || String(t).toLowerCase().includes(term)).map(([r,t]) => ({type:"Nota", ref:r, text:t}));
  const merged = [...favs, ...notes].slice(0, 8);
  if(!merged.length){
    root.innerHTML = '<div class="item">Nada encontrado.</div>';
    return;
  }
  merged.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<div class="item-title">${item.type}: ${item.ref}</div><div>${String(item.text).slice(0,120)}</div>`;
    root.appendChild(div);
  });
}
async function register(){
  if(!sb) return toast("Supabase não configurado");
  const email = el("email").value.trim();
  const password = el("password").value.trim();
  const { error } = await sb.auth.signUp({ email, password });
  if(error) return toast(error.message);
  toast("Cadastro enviado");
}
async function login(){
  if(!sb) return toast("Supabase não configurado");
  const email = el("email").value.trim();
  const password = el("password").value.trim();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if(error) return toast(error.message);
  state.user = data.user;
  setAuthStatus();
  await syncFromCloud();
  toast("Login realizado");
}
async function logout(){
  if(sb) await sb.auth.signOut();
  state.user = null;
  setAuthStatus();
  toast("Sessão encerrada");
}
async function syncFromCloud(){
  if(!sb || !state.user) return;
  const favs = await sb.from("favorites").select("verse_key").eq("user_id", state.user.id);
  if(!favs.error) state.favorites = (favs.data || []).map(x=>x.verse_key);
  const notes = await sb.from("notes").select("verse_key, content").eq("user_id", state.user.id);
  if(!notes.error){
    state.notes = {};
    (notes.data || []).forEach(x => state.notes[x.verse_key] = x.content);
  }
  const plan = await sb.from("reading_progress").select("day_index, done").eq("user_id", state.user.id);
  if(!plan.error){
    state.plan = {};
    (plan.data || []).forEach(x => state.plan[x.day_index] = !!x.done);
  }
  saveLocal();
  renderFavorites();
  renderNotes();
  renderPlan();
}
async function checkSession(){
  if(!sb) return;
  const { data } = await sb.auth.getUser();
  state.user = data?.user || null;
  setAuthStatus();
  if(state.user) await syncFromCloud();
}
async function saveFavorite(){
  const ref = el("favoriteRef").value.trim();
  if(!ref) return toast("Digite uma referência");
  if(!state.favorites.includes(ref)) state.favorites.unshift(ref);
  if(state.user && sb){
    await sb.from("favorites").upsert({
      user_id: state.user.id,
      verse_key: ref,
      book: ref.split(" ")[0] || ref,
      chapter: 1,
      verse: 1
    }, { onConflict: "user_id,verse_key" });
  }
  saveLocal();
  el("favoriteRef").value = "";
  renderFavorites();
  toast("Favorito salvo");
}
async function removeFavorite(ref){
  state.favorites = state.favorites.filter(x => x !== ref);
  if(state.user && sb){
    await sb.from("favorites").delete().eq("user_id", state.user.id).eq("verse_key", ref);
  }
  saveLocal();
  renderFavorites();
  toast("Favorito removido");
}
async function saveNote(){
  const ref = el("noteRef").value.trim();
  const text = el("noteText").value.trim();
  if(!ref) return toast("Digite a referência");
  if(text) state.notes[ref] = text; else delete state.notes[ref];
  if(state.user && sb){
    if(text){
      await sb.from("notes").upsert({
        user_id: state.user.id,
        verse_key: ref,
        book: ref.split(" ")[0] || ref,
        chapter: 1,
        verse: 1,
        content: text
      }, { onConflict: "user_id,verse_key" });
    } else {
      await sb.from("notes").delete().eq("user_id", state.user.id).eq("verse_key", ref);
    }
  }
  saveLocal();
  renderNotes();
  toast(text ? "Anotação salva" : "Anotação removida");
}
async function togglePlan(i){
  state.plan[i] = !state.plan[i];
  if(state.user && sb){
    await sb.from("reading_progress").upsert({
      user_id: state.user.id,
      day_index: i,
      done: !!state.plan[i]
    }, { onConflict: "user_id,day_index" });
  }
  saveLocal();
  renderPlan();
}
async function resetPlan(){
  state.plan = {};
  if(state.user && sb){
    await sb.from("reading_progress").delete().eq("user_id", state.user.id);
  }
  saveLocal();
  renderPlan();
  toast("Plano resetado");
}
function buildSystemPrompt(mode){
  const prompts = {
    chat: "Responda em português do Brasil como um assistente bíblico respeitoso. Use linguagem simples, objetiva e pastoral. Quando útil, cite referências bíblicas.",
    explicar: "Explique o versículo ou trecho pedido em português do Brasil. Traga contexto, significado e aplicação prática em tópicos curtos.",
    reflexao: "Crie uma reflexão bíblica em português do Brasil, profunda mas acessível, com aplicação prática ao final.",
    oracao: "Escreva uma oração em português do Brasil, reverente, curta a média, ligada ao tema pedido.",
    estudo: "Monte um estudo bíblico completo em português do Brasil com título, introdução, versículos principais, explicação, aplicação, perguntas para reflexão e conclusão."
  };
  return prompts[mode] || prompts.chat;
}
async function askAI(){
  const mode = el("aiMode").value;
  const input = el("aiInput").value.trim();
  if(!input) return toast("Digite sua pergunta");
  const out = el("aiOutput");
  out.textContent = "Gerando resposta...";
  try{
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        system: buildSystemPrompt(mode),
        input
      })
    });
    const data = await response.json();
    if(!response.ok) throw new Error(data.error || "Falha na IA");
    state.lastAiAnswer = data.output || "";
    out.textContent = state.lastAiAnswer || "Sem resposta.";
  }catch(err){
    out.textContent = "Erro ao falar com a IA. Verifique OPENAI_API_KEY no Vercel.";
  }
}
function saveAiAsNote(){
  const text = state.lastAiAnswer.trim();
  if(!text) return toast("Ainda não há resposta da IA");
  const ref = el("noteRef").value.trim() || "IA - estudo";
  el("noteRef").value = ref;
  el("noteText").value = text;
  saveNote();
  switchView("anotacoes");
}
document.querySelectorAll(".menu-btn").forEach(btn => btn.addEventListener("click", ()=>switchView(btn.dataset.view)));
document.querySelectorAll(".chip").forEach(btn => btn.addEventListener("click", ()=> el("aiInput").value = btn.dataset.prompt));
el("themeToggle").addEventListener("click", ()=>{ state.theme = state.theme === "dark" ? "light" : "dark"; setTheme(); saveLocal(); });
el("registerBtn").addEventListener("click", register);
el("loginBtn").addEventListener("click", login);
el("logoutBtn").addEventListener("click", logout);
el("saveFavoriteBtn").addEventListener("click", saveFavorite);
el("saveNoteBtn").addEventListener("click", saveNote);
el("clearNoteBtn").addEventListener("click", ()=>{ el("noteText").value = ""; saveNote(); });
el("resetPlanBtn").addEventListener("click", resetPlan);
el("quickSearch").addEventListener("input", renderQuickSearch);
el("askAiBtn").addEventListener("click", askAI);
el("saveAiAsNoteBtn").addEventListener("click", saveAiAsNote);

setTheme();
setAuthStatus();
renderFavorites();
renderNotes();
renderPlan();
checkSession();
