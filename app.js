let bible = [];
let currentView = 'read';

const content = document.getElementById('content');
const statusBox = document.getElementById('status');
const searchInput = document.getElementById('search');
const tabs = document.querySelectorAll('.tab');

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;
    render();
  });
});

searchInput.addEventListener('input', render);

function getFavorites() {
  return JSON.parse(localStorage.getItem('favs') || '[]');
}

function setFavorites(favs) {
  localStorage.setItem('favs', JSON.stringify(favs));
}

function verseId(v) {
  return `${v.book}-${v.chapter}-${v.verse}`;
}

function isFavorite(v) {
  return getFavorites().some(f => verseId(f) === verseId(v));
}

function saveFavorite(v) {
  const favs = getFavorites();
  if (!favs.some(f => verseId(f) === verseId(v))) {
    favs.push(v);
    setFavorites(favs);
    render();
  }
}

function removeFavorite(v) {
  const favs = getFavorites().filter(f => verseId(f) !== verseId(v));
  setFavorites(favs);
  render();
}

function createCard(v, inFav = false) {
  const card = document.createElement('div');
  card.className = 'card';

  const ref = document.createElement('div');
  ref.className = 'ref';
  ref.textContent = `${v.book} ${v.chapter}:${v.verse}`;

  const text = document.createElement('div');
  text.textContent = v.text;

  const actions = document.createElement('div');
  actions.className = 'actions';

  const favBtn = document.createElement('button');
  favBtn.className = 'small-btn' + (isFavorite(v) ? ' saved' : '');
  favBtn.textContent = inFav ? 'Remover favorito' : (isFavorite(v) ? 'Salvo' : 'Salvar favorito');
  favBtn.addEventListener('click', () => inFav ? removeFavorite(v) : saveFavorite(v));

  actions.appendChild(favBtn);
  card.appendChild(ref);
  card.appendChild(text);
  card.appendChild(actions);

  return card;
}

function render() {
  const term = searchInput.value.trim().toLowerCase();
  content.innerHTML = '';

  if (currentView === 'read') {
    let list = bible;

    if (term) {
      list = bible.filter(v =>
        v.book.toLowerCase().includes(term) ||
        v.text.toLowerCase().includes(term) ||
        String(v.chapter).includes(term) ||
        String(v.verse).includes(term)
      );
    }

    if (!list.length) {
      content.innerHTML = '<div class="card empty">Nenhum versículo encontrado.</div>';
      return;
    }

    list.forEach(v => content.appendChild(createCard(v, false)));
    return;
  }

  if (currentView === 'fav') {
    let favs = getFavorites();

    if (term) {
      favs = favs.filter(v =>
        v.book.toLowerCase().includes(term) ||
        v.text.toLowerCase().includes(term)
      );
    }

    if (!favs.length) {
      content.innerHTML = '<div class="card empty">Nenhum favorito salvo ainda.</div>';
      return;
    }

    favs.forEach(v => content.appendChild(createCard(v, true)));
  }
}

async function loadBible() {
  statusBox.textContent = 'Carregando versículos...';

  try {
    const response = await fetch('./data/kjv.json', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    bible = await response.json();

    if (!Array.isArray(bible) || bible.length === 0) {
      throw new Error('JSON vazio ou inválido');
    }

    statusBox.textContent = `Versículos carregados: ${bible.length}`;
    render();
  } catch (error) {
    console.error('Erro ao carregar a Bíblia:', error);
    statusBox.textContent = 'Erro ao carregar os versículos.';
    content.innerHTML = `
      <div class="card">
        <div class="ref">Erro de carregamento</div>
        <div>Verifique se o arquivo <b>data/kjv.json</b> foi enviado junto no Vercel.</div>
      </div>
    `;
  }
}

loadBible();
