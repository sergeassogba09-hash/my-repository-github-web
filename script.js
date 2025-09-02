const form = document.getElementById('postForm');
const container = document.getElementById('contentContainer');
const formMessage = document.getElementById('formMessage');
const noResults = document.getElementById('noResults');
const toggleBtn = document.getElementById('toggleFormBtn');
const formOverlay = document.getElementById('formOverlay');
const searchInput = document.getElementById('searchInput');
const cancelBtn = document.getElementById('cancelBtn');

let posts = [];

// 🔁 Toggle formulaire
toggleBtn.addEventListener('click', () => {
  const isVisible = formOverlay.style.display === 'flex';
  formOverlay.style.display = isVisible ? 'none' : 'flex';
  formOverlay.classList.toggle('visible');
  toggleBtn.textContent = isVisible ? ' Ajouter une vidéo' : ' Fermer';
});

// ❌ Annuler
cancelBtn.addEventListener('click', () => {
  form.reset();
  formOverlay.style.display = 'none';
  formOverlay.classList.remove('visible');
  toggleBtn.textContent = ' Ajouter une vidéo';
});

// 📤 Soumission vers Cloudinary
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const file = document.getElementById('mediaFile').files[0];

  if (!file || file.type !== 'video/mp4') {
    formMessage.textContent = "⚠️ Veuillez sélectionner une vidéo .mp4.";
    return;
  }

  const formData = new FormData();
  formData.append('mediaFile', file);
  formData.append('title', title);
  formData.append('description', description);

  formMessage.textContent = "⏳ Téléversement vers Cloudinary...";

  try {
    const res = await fetch('upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      posts.unshift({
        title: data.title,
        description: data.description,
        mediaUrl: data.url
      });
      renderPosts(posts);
      formMessage.textContent = "✅ Vidéo publiée sur Cloudinary.";
      form.reset();
      formOverlay.style.display = 'none';
      formOverlay.classList.remove('visible');
      toggleBtn.textContent = ' Ajouter une vidéo';
    } else {
      formMessage.textContent = "❌ " + data.error;
    }
  } catch (err) {
    console.error(err);
    formMessage.textContent = "❌ Erreur réseau.";
  }
});

// 🔍 Filtrage
searchInput.addEventListener('input', () => {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = posts.filter(post =>
    post.title.toLowerCase().includes(keyword) ||
    post.description.toLowerCase().includes(keyword)
  );
  renderPosts(filtered, keyword);
});

// 🧱 Affichage
function renderPosts(data, keyword = '') {
  container.innerHTML = '';

  if (data.length === 0) {
    noResults.style.display = 'block';
    noResults.textContent = keyword
      ? `Aucun contenu trouvé pour « ${keyword} »`
      : 'Aucun contenu trouvé.';
    return;
  }

  noResults.style.display = 'none';

  data.forEach(post => {
    const card = document.createElement('div');
    card.className = 'card';

    const highlightedTitle = highlightKeyword(post.title, keyword);
    const highlightedDesc = highlightKeyword(post.description, keyword);

    card.innerHTML = `
      <video class="card-video" controls>
        <source src="${post.mediaUrl}" type="video/mp4">
        Votre navigateur ne supporte pas la vidéo.
      </video>
      <div class="card-content">
        <h2>${highlightedTitle}</h2>
        <p>${highlightedDesc}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// ✨ Surbrillance
function highlightKeyword(text, keyword) {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}
