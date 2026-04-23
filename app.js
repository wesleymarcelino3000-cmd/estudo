const CONFIG = window.APP_CONFIG || {};
const sb = (CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && window.supabase)
  ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey)
  : null;

const state = {
  user: null,
  theme: localStorage.getItem("acfjson_theme") || "dark",
  favorites: JSON.parse(localStorage.getItem("acfjson_favorites") || "[]"),
  notes: JSON.parse(localStorage.getItem("acfjson_notes") || "{}"),
  plan: JSON.parse(localStorage.getItem("acfjson_plan") || "{}"),
  books: [],
  flatVerses: [],
  currentBook: "",
  currentChapter: 1,
  lastAiAnswer: ""
};

const planDays = [
  "Dia 1 - Mateus 5","Dia 2 - João 3","Dia 3 - Salmos 23","Dia 4 - Romanos 8","Dia 5 - Filipenses 4",
  "Dia 6 - Provérbios 3","Dia 7 - Isaías 41","Dia 8 - João 14","Dia 9 - Salmos 91","Dia 10 - Tiago 1"
];

function el(id){ return document.getElementById(id); }
function saveLocal(){
  localStorage.setItem("acfjson_theme", state.theme);
  localStorage.setItem("acfjson_favorites", JSON.stringify(state.favorites));
  localStorage.setItem("acfjson_notes", JSON.stringify(state.notes));
  localStorage.setItem("acfjson_plan", JSON.stringify(state.plan));
}
function toast(msg){
  const t = el("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"), 1800);
}
function setTheme(){ document.body.className = state.theme === "light" ? "light" : ""; }
function setAuthStatus(){ el("authStatus").textContent = state.user ? `Logado: ${state.user.email}` : "Modo local"; }
function switchView(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.querySelectorAll(".menu-btn").forEach(v=>v.classList.remove("active"));
  el("view-" + view).classList.add("active");
  document.querySelector(`.menu-btn[data-view="${view}"]`).classList.add("active");
  if(view === "favoritos") renderFavorites();
  if(view === "anotacoes") renderNotes();
  if(view === "plano") renderPlan();
  if(view === "busca") renderSearch();
}
window.switchView = switchView;

function refFor(v){ return `${v.book} ${v.chapter}:${v.verse}`; }
function chapterVerses(book, chapter){ return state.flatVerses.filter(v => v.book === book && v.chapter === Number(chapter)); }
function allChapters(book){ return [...new Set(state.flatVerses.filter(v=>v.book===book).map(v=>v.chapter))].sort((a,b)=>a-b); }

async function loadBible(){
  try{
    const res = await fetch("./data/acf_biblia_ptbr.json", { cache: "no-store" });
    const data = await res.json();
    state.books = data.books || [];
    state.flatVerses = [];
    state.books.forEach(book => {
      (book.chapters || []).forEach((chapter, cIndex) => {
        (chapter || []).forEach((verse, vIndex) => {
          state.flatVerses.push({
            book: book.name,
            chapter: cIndex + 1,
            verse: vIndex + 1,
            text: verse
          });
        });
      });
    });
    el("statusText").textContent = `Bíblia carregada: ${state.flatVerses.length} versículos`;
    populateBooks();
    renderChapter();
  }catch(e){
    console.error(e);
    el("statusText").textContent = "Erro ao carregar JSON da Bíblia";
  }
}

function populateBooks(){
  const select = el("bookSelect");
  select.innerHTML = state.books.map(b => `<option value="${b.name}">${b.name}</option>`).join("");
  state.currentBook = state.books[0]?.name || "";
  select.value = state.currentBook;
  populateChapters();
}
function populateChapters(){
  const chapters = allChapters(state.currentBook);
  const select = el("chapterSelect");
  select.innerHTML = chapters.map(c => `<option value="${c}">${c}</option>`).join("");
  state.currentChapter = chapters[0] || 1;
  select.value = String(state.currentChapter);
}

function renderVerseCard(v, showRemove=false){
  const div = document.createElement("div");
  div.className = "verse-card";
  div.innerHTML = `<div class="ref">${refFor(v)}</div><div>${v.text}</div>`;
  const actions = document.createElement("div");
  actions.className = "actions";
  const fav = document.createElement("button");
  fav.className = "small-btn" + (state.favorites.includes(refFor(v)) ? " saved" : "");
  fav.textContent = state.favorites.includes(refFor(v)) ? "Favorito" : "Salvar favorito";
  fav.onclick = () => toggleFavorite(refFor(v));
  const note = document.createElement("button");
  note.className = "small-btn ghost";
  note.textContent = "Anotar";
  note.onclick = () => {
    el("noteRef").value = refFor(v);
    el("noteText").value = state.notes[refFor(v)] || "";
    switchView("anotacoes");
  };
  actions.appendChild(fav);
  actions.appendChild(note);
  if(showRemove){
    const rem = document.createElement("button");
    rem.className = "small-btn ghost";
    rem.textContent = "Remover";
    rem.onclick = () => toggleFavorite(refFor(v));
    actions.appendChild(rem);
  }
  const ai = document.createElement("button");
  ai.className = "small-btn ghost";
  ai.textContent = "Explicar com IA";
  ai.onclick = () => {
    el("aiMode").value = "explicar";
    el("aiInput").value = `Explique ${refFor(v)}: ${v.text}`;
    switchView("ia");
  };
  actions.appendChild(ai);
  div.appendChild(actions);
  return div;
}

function renderChapter(){
  el("chapterTitle").textContent = `${state.currentBook} ${state.currentChapter}`;
  const root = el("chapterList");
  root.innerHTML = "";
  chapterVerses(state.currentBook, state.currentChapter).forEach(v => root.appendChild(renderVerseCard(v)));
}
function renderSearch(){
  const term = el("searchInput").value.trim().toLowerCase();
  const root = el("searchList");
  root.innerHTML = "";
  if(!term){
    root.innerHTML = '<div class="item">Digite algo para buscar.</div>';
    return;
  }
  const results = state.flatVerses.filter(v => refFor(v).toLowerCase().includes(term) || String(v.text).toLowerCase().includes(term)).slice(0, 200);
  if(!results.length){
    root.innerHTML = '<div class="item">Nenhum resultado encontrado.</div>';
    return;
  }
  results.forEach(v => root.appendChild(renderVerseCard(v)));
}
function renderFavorites(){
  const root = el("favoritesList");
  root.innerHTML = "";
  if(!state.favorites.length){
    root.innerHTML = '<div class="item">Nenhum favorito salvo.</div>';
    return;
  }
  state.favorites.forEach(ref => {
    const v = state.flatVerses.find(x => refFor(x) === ref);
    if(v) root.appendChild(renderVerseCard(v, true));
  });
}
function renderNotes(){
  const root = el("notesList");
  root.innerHTML = "";
  const entries = Object.entries(state.notes);
  if(!entries.length){
    root.innerHTML = '<div class="item">Nenhuma anotação salva.</div>';
    return;
  }
  entries.forEach(([ref, text]) => {
    const item = document.createElement("div");
    item.className = "item";
    item.innerHTML = `<div class="item-title">${ref}</div><div>${String(text).slice(0, 280)}</div>`;
    item.onclick = () => {
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
    item.innerHTML = `<div class="item-title">${day}</div><div>${done ? "Concluído" : "Pendente"}</div>`;
    const btn = document.createElement("button");
    btn.textContent = done ? "Marcar pendente" : "Concluir";
    btn.style.marginTop = "10px";
    btn.onclick = () => togglePlan(i);
    item.appendChild(btn);
    root.appendChild(item);
  });
}

async function register(){
  if(!sb) return toast("Supabase não configurado");
  const { error } = await sb.auth.signUp({ email: el("email").value.trim(), password: el("password").value.trim() });
  if(error) return toast(error.message);
  toast("Cadastro enviado");
}
async function login(){
  if(!sb) return toast("Supabase não configurado");
  const { data, error } = await sb.auth.signInWithPassword({ email: el("email").value.trim(), password: el("password").value.trim() });
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
async function checkSession(){
  if(!sb) return;
  const { data } = await sb.auth.getUser();
  state.user = data?.user || null;
  setAuthStatus();
  if(state.user) await syncFromCloud();
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
  renderFavorites(); renderNotes(); renderPlan();
}
async function toggleFavorite(ref){
  if(state.favorites.includes(ref)){
    state.favorites = state.favorites.filter(x => x !== ref);
    if(state.user && sb) await sb.from("favorites").delete().eq("user_id", state.user.id).eq("verse_key", ref);
    toast("Favorito removido");
  } else {
    state.favorites.unshift(ref);
    if(state.user && sb){
      const m = ref.match(/^(.*) (\d+):(\d+)$/);
      await sb.from("favorites").upsert({
        user_id: state.user.id,
        verse_key: ref,
        book: m ? m[1] : ref,
        chapter: m ? Number(m[2]) : 1,
        verse: m ? Number(m[3]) : 1
      }, { onConflict: "user_id,verse_key" });
    }
    toast("Favorito salvo");
  }
  saveLocal();
  renderFavorites(); renderChapter(); renderSearch();
}
async function saveNote(){
  const ref = el("noteRef").value.trim();
  const text = el("noteText").value.trim();
  if(!ref) return toast("Digite a referência");
  if(text) state.notes[ref] = text; else delete state.notes[ref];
  if(state.user && sb){
    const m = ref.match(/^(.*) (\d+):(\d+)$/);
    if(text){
      await sb.from("notes").upsert({
        user_id: state.user.id,
        verse_key: ref,
        book: m ? m[1] : ref,
        chapter: m ? Number(m[2]) : 1,
        verse: m ? Number(m[3]) : 1,
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
  if(state.user && sb) await sb.from("reading_progress").delete().eq("user_id", state.user.id);
  saveLocal(); renderPlan(); toast("Plano resetado");
}
function systemPrompt(mode){
  const map = {
    chat: "Responda em português do Brasil como um assistente bíblico respeitoso. Use linguagem simples e objetiva.",
    explicar: "Explique o versículo ou trecho pedido em português do Brasil com contexto, significado e aplicação prática.",
    reflexao: "Crie uma reflexão bíblica em português do Brasil, profunda e acessível.",
    oracao: "Escreva uma oração em português do Brasil, reverente e ligada ao tema pedido.",
    estudo: "Monte um estudo bíblico completo em português do Brasil com título, introdução, versículos, explicação, aplicação e conclusão."
  };
  return map[mode] || map.chat;
}
async function askAI(){
  const mode = el("aiMode").value;
  const input = el("aiInput").value.trim();
  if(!input) return toast("Digite sua pergunta");
  el("aiOutput").textContent = "Gerando resposta...";
  try{
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, system: systemPrompt(mode), input })
    });
    const data = await response.json();
    if(!response.ok) throw new Error(data.error || "Falha na IA");
    state.lastAiAnswer = data.output || "";
    el("aiOutput").textContent = state.lastAiAnswer || "Sem resposta.";
  }catch(e){
    el("aiOutput").textContent = "Erro ao falar com a IA. Verifique OPENAI_API_KEY no Vercel.";
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
el("themeToggle").addEventListener("click", ()=>{ state.theme = state.theme === "dark" ? "light" : "dark"; setTheme(); saveLocal(); });
el("registerBtn").addEventListener("click", register);
el("loginBtn").addEventListener("click", login);
el("logoutBtn").addEventListener("click", logout);
el("bookSelect").addEventListener("change", ()=>{ state.currentBook = el("bookSelect").value; populateChapters(); renderChapter(); });
el("chapterSelect").addEventListener("change", ()=>{ state.currentChapter = Number(el("chapterSelect").value); renderChapter(); });
el("searchInput").addEventListener("input", ()=>{ switchView("busca"); renderSearch(); });
el("saveNoteBtn").addEventListener("click", saveNote);
el("clearNoteBtn").addEventListener("click", ()=>{ el("noteText").value = ""; saveNote(); });
el("resetPlanBtn").addEventListener("click", resetPlan);
el("askAiBtn").addEventListener("click", askAI);
el("saveAiAsNoteBtn").addEventListener("click", saveAiAsNote);

setTheme();
setAuthStatus();
renderFavorites();
renderNotes();
renderPlan();
checkSession();
loadBible();
