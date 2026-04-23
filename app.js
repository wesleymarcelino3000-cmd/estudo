const CONFIG = window.APP_CONFIG || {};
const sb = (CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && window.supabase)
  ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey)
  : null;

const state = {
  versesMap: {},
  versesArray: [],
  books: [],
  currentBook: "",
  currentChapter: 1,
  currentView: "chapter",
  selectedRef: "",
  user: null,
  favorites: JSON.parse(localStorage.getItem("kjm_favorites") || "[]"),
  notes: JSON.parse(localStorage.getItem("kjm_notes") || "{}"),
  plan: JSON.parse(localStorage.getItem("kjm_plan") || "{}"),
  theme: localStorage.getItem("kjm_theme") || "dark"
};

const planDays = [
  "Dia 1 - John 1", "Dia 2 - John 3", "Dia 3 - Psalm 23", "Dia 4 - Genesis 1", "Dia 5 - Matthew 5",
  "Dia 6 - Romans 8", "Dia 7 - Philippians 4", "Dia 8 - Proverbs 3", "Dia 9 - Isaiah 41", "Dia 10 - Revelation 21",
  "Dia 11 - Luke 15", "Dia 12 - Mark 5", "Dia 13 - Hebrews 11", "Dia 14 - James 1", "Dia 15 - Ephesians 6",
  "Dia 16 - Psalm 91", "Dia 17 - John 14", "Dia 18 - Acts 2", "Dia 19 - 1 Corinthians 13", "Dia 20 - Colossians 3",
  "Dia 21 - 2 Timothy 1", "Dia 22 - Matthew 6", "Dia 23 - Psalm 121", "Dia 24 - Romans 12", "Dia 25 - John 10",
  "Dia 26 - Galatians 5", "Dia 27 - Isaiah 53", "Dia 28 - Genesis 37", "Dia 29 - Exodus 14", "Dia 30 - Revelation 22"
];

function el(id){ return document.getElementById(id); }

function toast(msg){
  const t = el("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

function saveLocal(){
  localStorage.setItem("kjm_favorites", JSON.stringify(state.favorites));
  localStorage.setItem("kjm_notes", JSON.stringify(state.notes));
  localStorage.setItem("kjm_plan", JSON.stringify(state.plan));
  localStorage.setItem("kjm_theme", state.theme);
}

function parseRef(ref){
  const match = ref.match(/^(.*) (\d+):(\d+)$/);
  if(!match) return null;
  return { book: match[1], chapter: Number(match[2]), verse: Number(match[3]), ref };
}

function buildArray(map){
  return Object.entries(map).map(([ref, text]) => {
    const p = parseRef(ref);
    return p ? { ...p, text } : null;
  }).filter(Boolean);
}

function uniqueBooks(){
  return [...new Set(state.versesArray.map(v => v.book))];
}

function chaptersFor(book){
  return [...new Set(state.versesArray.filter(v => v.book === book).map(v => v.chapter))].sort((a,b)=>a-b);
}

function versesFor(book, chapter){
  return state.versesArray
    .filter(v => v.book === book && v.chapter === Number(chapter))
    .sort((a,b)=>a.verse-b.verse);
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function switchView(view){
  state.currentView = view;
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));
  el("view-" + view).classList.add("active");
  document.querySelector(`.menu-btn[data-view="${view}"]`).classList.add("active");
  if(view === "search") renderSearch();
  if(view === "favorites") renderFavorites();
  if(view === "notes") renderNotes();
  if(view === "plan") renderPlan();
}

function setAuthStatus(){
  el("authStatus").textContent = state.user
    ? `Logado: ${state.user.email}`
    : "Modo local";
}

function setTheme(){
  document.body.className = state.theme === "light" ? "light" : "";
}

function verseCard(v, opts = {}){
  const card = document.createElement("div");
  card.className = "card";

  const ref = document.createElement("div");
  ref.className = "ref";
  ref.textContent = v.ref;

  const text = document.createElement("div");
  text.className = "verse-text";
  text.innerHTML = escapeHtml(v.text);

  const actions = document.createElement("div");
  actions.className = "actions";

  const favBtn = document.createElement("button");
  favBtn.className = "small-btn" + (state.favorites.includes(v.ref) ? " saved" : "");
  favBtn.textContent = state.favorites.includes(v.ref) ? "Favorito" : "Salvar favorito";
  favBtn.addEventListener("click", () => toggleFavorite(v.ref));

  const noteBtn = document.createElement("button");
  noteBtn.className = "small-btn ghost";
  noteBtn.textContent = "Anotar";
  noteBtn.addEventListener("click", () => {
    state.selectedRef = v.ref;
    el("selectedVerseRef").textContent = v.ref;
    el("noteText").value = state.notes[v.ref] || "";
    switchView("notes");
  });

  actions.appendChild(favBtn);
  actions.appendChild(noteBtn);

  if(opts.showRemove){
    const removeBtn = document.createElement("button");
    removeBtn.className = "small-btn ghost";
    removeBtn.textContent = "Remover";
    removeBtn.addEventListener("click", () => toggleFavorite(v.ref));
    actions.appendChild(removeBtn);
  }

  card.appendChild(ref);
  card.appendChild(text);
  card.appendChild(actions);
  return card;
}

function populateBooks(){
  el("bookSelect").innerHTML = state.books.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("");
  el("bookSelect").value = state.currentBook;
}

function populateChapters(){
  const chapters = chaptersFor(state.currentBook);
  el("chapterSelect").innerHTML = chapters.map(c => `<option value="${c}">${c}</option>`).join("");
  el("chapterSelect").value = String(state.currentChapter);
}

function renderChapter(){
  const list = el("chapterList");
  list.innerHTML = "";
  const verses = versesFor(state.currentBook, state.currentChapter);
  el("chapterTitle").textContent = `${state.currentBook} ${state.currentChapter}`;
  if(!verses.length){
    list.innerHTML = '<div class="card empty">Nenhum versículo encontrado.</div>';
    return;
  }
  verses.forEach(v => list.appendChild(verseCard(v)));
}

function renderSearch(){
  const list = el("searchList");
  list.innerHTML = "";
  const term = el("searchInput").value.trim().toLowerCase();
  if(!term){
    list.innerHTML = '<div class="card empty">Digite algo para buscar.</div>';
    return;
  }
  const results = state.versesArray.filter(v =>
    v.ref.toLowerCase().includes(term) || v.text.toLowerCase().includes(term)
  ).slice(0, 200);

  if(!results.length){
    list.innerHTML = '<div class="card empty">Nenhum resultado encontrado.</div>';
    return;
  }
  results.forEach(v => list.appendChild(verseCard(v)));
}

function renderFavorites(){
  const list = el("favoritesList");
  list.innerHTML = "";
  if(!state.favorites.length){
    list.innerHTML = '<div class="card empty">Nenhum favorito salvo.</div>';
    return;
  }
  state.favorites
    .map(ref => state.versesArray.find(v => v.ref === ref))
    .filter(Boolean)
    .forEach(v => list.appendChild(verseCard(v, { showRemove: true })));
}

function renderNotes(){
  const list = el("notesList");
  list.innerHTML = "";
  const refs = Object.keys(state.notes).filter(ref => (state.notes[ref] || "").trim());
  if(!refs.length){
    list.innerHTML = '<div class="card empty">Nenhuma anotação salva.</div>';
    return;
  }
  refs.sort().forEach(ref => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="ref">${escapeHtml(ref)}</div>
      <div class="verse-text">${escapeHtml(String(state.notes[ref]).slice(0, 200))}</div>
    `;
    card.addEventListener("click", () => {
      state.selectedRef = ref;
      el("selectedVerseRef").textContent = ref;
      el("noteText").value = state.notes[ref] || "";
    });
    list.appendChild(card);
  });
}

function renderPlan(){
  const list = el("planList");
  list.innerHTML = "";
  planDays.forEach((day, index) => {
    const done = !!state.plan[index];
    const card = document.createElement("div");
    card.className = "plan-item" + (done ? " done" : "");
    card.innerHTML = `
      <div class="ref">${day}</div>
      <div class="muted">${done ? "Concluído" : "Pendente"}</div>
    `;
    const btn = document.createElement("button");
    btn.className = "small-btn" + (done ? " saved" : "");
    btn.textContent = done ? "Marcar pendente" : "Marcar concluído";
    btn.style.marginTop = "10px";
    btn.addEventListener("click", () => togglePlan(index));
    card.appendChild(btn);
    list.appendChild(card);
  });
}

async function toggleFavorite(ref){
  if(state.favorites.includes(ref)){
    state.favorites = state.favorites.filter(r => r !== ref);
    if(state.user && sb){
      await sb.from("favorites").delete().eq("user_id", state.user.id).eq("verse_key", ref);
    }
    toast("Favorito removido");
  } else {
    state.favorites.unshift(ref);
    if(state.user && sb){
      const p = parseRef(ref);
      await sb.from("favorites").upsert({
        user_id: state.user.id,
        verse_key: ref,
        book: p.book,
        chapter: p.chapter,
        verse: p.verse
      }, { onConflict: "user_id,verse_key" });
    }
    toast("Favorito salvo");
  }
  saveLocal();
  renderChapter();
  renderSearch();
  renderFavorites();
}

async function saveCurrentNote(){
  if(!state.selectedRef){
    toast("Selecione um versículo");
    return;
  }
  const content = el("noteText").value;
  state.notes[state.selectedRef] = content;
  if(!content.trim()) delete state.notes[state.selectedRef];

  if(state.user && sb){
    const p = parseRef(state.selectedRef);
    if(content.trim()){
      await sb.from("notes").upsert({
        user_id: state.user.id,
        verse_key: state.selectedRef,
        book: p.book,
        chapter: p.chapter,
        verse: p.verse,
        content
      }, { onConflict: "user_id,verse_key" });
    } else {
      await sb.from("notes").delete().eq("user_id", state.user.id).eq("verse_key", state.selectedRef);
    }
  }

  saveLocal();
  renderNotes();
  toast(content.trim() ? "Anotação salva" : "Anotação removida");
}

async function togglePlan(index){
  state.plan[index] = !state.plan[index];
  if(state.user && sb){
    await sb.from("reading_progress").upsert({
      user_id: state.user.id,
      day_index: index,
      done: !!state.plan[index]
    }, { onConflict: "user_id,day_index" });
  }
  saveLocal();
  renderPlan();
  toast(state.plan[index] ? "Dia concluído" : "Dia reaberto");
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

async function register(){
  if(!sb) return toast("Supabase não configurado");
  const email = el("email").value.trim();
  const password = el("password").value.trim();
  if(!email || !password) return toast("Preencha e-mail e senha");
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
  if(!favs.error && Array.isArray(favs.data)){
    state.favorites = favs.data.map(x => x.verse_key);
  }
  const notes = await sb.from("notes").select("verse_key, content").eq("user_id", state.user.id);
  if(!notes.error && Array.isArray(notes.data)){
    state.notes = {};
    notes.data.forEach(n => state.notes[n.verse_key] = n.content);
  }
  const progress = await sb.from("reading_progress").select("day_index, done").eq("user_id", state.user.id);
  if(!progress.error && Array.isArray(progress.data)){
    state.plan = {};
    progress.data.forEach(p => state.plan[p.day_index] = !!p.done);
  }
  saveLocal();
  renderFavorites();
  renderNotes();
  renderPlan();
  renderChapter();
}

async function checkSession(){
  if(!sb) return;
  const { data } = await sb.auth.getUser();
  state.user = data?.user || null;
  setAuthStatus();
  if(state.user) await syncFromCloud();
}

async function loadBible(){
  try{
    const response = await fetch("./data/verses-1769.json", { cache: "no-store" });
    if(!response.ok) throw new Error("Falha ao carregar verses-1769.json");
    state.versesMap = await response.json();
    state.versesArray = buildArray(state.versesMap);
    state.books = uniqueBooks();
    state.currentBook = state.books[0];
    state.currentChapter = chaptersFor(state.currentBook)[0] || 1;
    populateBooks();
    populateChapters();
    renderChapter();
    renderFavorites();
    renderNotes();
    renderPlan();
    el("statusText").textContent = `Bíblia carregada: ${state.versesArray.length} versículos`;
  }catch(err){
    console.error(err);
    el("statusText").textContent = "Erro ao carregar a Bíblia completa";
    el("chapterList").innerHTML = '<div class="card empty">Verifique se o arquivo data/verses-1769.json foi enviado corretamente.</div>';
  }
}

el("bookSelect").addEventListener("change", () => {
  state.currentBook = el("bookSelect").value;
  state.currentChapter = chaptersFor(state.currentBook)[0] || 1;
  populateChapters();
  renderChapter();
});

el("chapterSelect").addEventListener("change", () => {
  state.currentChapter = Number(el("chapterSelect").value);
  renderChapter();
});

el("searchInput").addEventListener("input", () => {
  if(state.currentView !== "search") switchView("search");
  renderSearch();
});

document.querySelectorAll(".menu-btn").forEach(btn => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

el("saveNoteBtn").addEventListener("click", saveCurrentNote);
el("clearNoteBtn").addEventListener("click", async () => {
  if(!state.selectedRef) return;
  el("noteText").value = "";
  await saveCurrentNote();
});
el("resetPlanBtn").addEventListener("click", resetPlan);

el("registerBtn").addEventListener("click", register);
el("loginBtn").addEventListener("click", login);
el("logoutBtn").addEventListener("click", logout);

el("themeToggle").addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  setTheme();
  saveLocal();
});

if("serviceWorker" in navigator){
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

setTheme();
checkSession();
loadBible();
