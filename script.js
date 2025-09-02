// 📦 Sélecteurs principaux
const form = document.getElementById('postForm');
const container = document.getElementById('contentContainer');
const formMessage = document.getElementById('formMessage');
const noResults = document.getElementById('noResults');
const toggleBtn = document.getElementById('toggleFormBtn');
const formOverlay = document.getElementById('formOverlay');
const searchInput = document.getElementById('searchInput');
const cancelBtn = document.getElementById('cancelBtn');
const globalLikeCount = document.getElementById('globalLikeCount');
const globalLikeCountHeader = document.getElementById('globalLikeCountHeader');

// 🔢 Initialisation des likes globaux
let posts = [];
let globalLikes = parseInt(localStorage.getItem('globalLikes')) || 0;
if (globalLikeCountHeader) globalLikeCountHeader.textContent = globalLikes;
if (globalLikeCount) globalLikeCount.textContent = globalLikes;

// 🔁 Toggle formulaire d’ajout
toggleBtn.addEventListener('click', () => {
  const isVisible = formOverlay.style.display === 'flex' || formOverlay.classList.contains('visible');

  if (isVisible) {
    formOverlay.style.display = 'none';
    formOverlay.classList.remove('visible');
    toggleBtn.textContent = ' Ajouter une vidéo';
  } else {
    formOverlay.style.display = 'flex';
    formOverlay.classList.add('visible');
    toggleBtn.textContent = ' Fermer';
  }
});

// ❌ Annuler et masquer le formulaire
cancelBtn.addEventListener('click', () => {
  form.reset();
  formOverlay.style.display = 'none';
  formOverlay.classList.remove('visible');
  toggleBtn.textContent = ' Ajouter une vidéo';
});

// 📤 Soumission du formulaire
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  const fileInput = document.getElementById('mediaFile');
  const file = fileInput.files[0];

  if (!file || file.type !== 'video/mp4') {
    formMessage.textContent = "⚠️ Veuillez sélectionner une vidéo .mp4.";
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('mediaFile', file);

  formMessage.textContent = "⏳ Publication en cours...";

  fetch('upload_video.php', {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      formMessage.textContent = "✅ Vidéo publiée avec succès.";
      form.reset();
      formOverlay.style.display = 'none';
      formOverlay.classList.remove('visible');
      toggleBtn.textContent = ' Ajouter une vidéo';
      fetchVideos(); // 🔄 Recharge les vidéos depuis Neon
    } else {
      formMessage.textContent = "❌ " + data.error;
    }
  })
  .catch(err => {
    formMessage.textContent = "❌ Erreur réseau.";
    console.error(err);
  });
});

// 🔍 Filtrage dynamique par mot-clé
searchInput.addEventListener('input', () => {
  const keyword = searchInput.value.trim().toLowerCase();

  const filtered = posts.filter(post =>
    post.title.toLowerCase().includes(keyword) ||
    post.description.toLowerCase().includes(keyword)
  );

  renderPosts(filtered, keyword);
});

// 🧱 Affichage des cartes vidéo
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
        <div class="like-section">
          <button class="like-btn">👍</button>
          <span class="like-count">0</span>
        </div>
      </div>
    `;
    container.appendChild(card);

    const likeBtn = card.querySelector('.like-btn');
    const likeCount = card.querySelector('.like-count');

    likeBtn.addEventListener('click', () => {
      let count = parseInt(likeCount.textContent);
      likeCount.textContent = count + 1;

      globalLikes++;
      if (globalLikeCountHeader) globalLikeCountHeader.textContent = globalLikes;
      if (globalLikeCount) globalLikeCount.textContent = globalLikes;
      localStorage.setItem('globalLikes', globalLikes);
    });
  });
}

// ✨ Mise en surbrillance des mots-clés
function highlightKeyword(text, keyword) {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}

// 📥 Récupération des vidéos depuis Neon
async function fetchVideos() {
  try {
    const res = await fetch('get_videos.php');
    const data = await res.json();

    posts = data.map(video => ({
      title: video.title,
      description: video.description,
      mediaUrl: video.url
    }));

    renderPosts(posts);
  } catch (error) {
    console.error("Erreur lors du chargement des vidéos :", error);
    noResults.style.display = 'block';
    noResults.textContent = "Impossible de charger les vidéos.";
  }
}

// 🚀 Chargement initial
window.addEventListener('DOMContentLoaded', fetchVideos);
