const container = document.getElementById("videos");
const searchInput = document.getElementById("searchTag");
const noResultsMessage = document.getElementById("noResults");

// Chargement des vidéos depuis l'API
async function fetchVideos() {
  try {
    const res = await fetch('/.netlify/functions/getVideos');
    const videos = await res.json();
    renderVideos(videos);
  } catch (error) {
    console.error("Erreur lors du chargement des vidéos :", error);
  }
}

// Affichage des vidéos
function renderVideos(videos) {
  container.innerHTML = "";
  let visible = 0;

  videos.forEach((videoData, index) => {
    const value = searchInput.value.toLowerCase();
    const match =
      videoData.titre.toLowerCase().includes(value) ||
      videoData.description.toLowerCase().includes(value) ||
      videoData.tags.some(tag => tag.toLowerCase().includes(value));

    if (!match) return;

    visible++;
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${0.1 * (index + 1)}s`;
    card.innerHTML = `
      <video class="card-video" controls poster="${videoData.poster || ''}">
        <source src="${videoData.source}" type="video/mp4" />
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>
      <div class="card-content">
        <h2>${videoData.titre}</h2>
        <p>${videoData.description}</p>
        <div class="tags">
          ${videoData.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  noResultsMessage.style.display = visible === 0 ? "block" : "none";

  // Lecture unique
  const allVideos = document.querySelectorAll(".card-video");
  allVideos.forEach(video => {
    video.addEventListener("play", () => {
      allVideos.forEach(v => {
        if (v !== video) v.pause();
      });
    });
  });
}

// Filtrage en temps réel
searchInput.addEventListener("input", fetchVideos);

// Chargement initial
fetchVideos();

// Formulaire de contribution
document.getElementById("videoForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    titre: form.titre.value,
    source: form.source.value,
    description: form.description.value,
    tags: form.tags.value.split(',').map(tag => tag.trim())
  };

  try {
    const res = await fetch('/.netlify/functions/postVideo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();
    const message = document.getElementById("formMessage");

    if (result.success) {
      message.textContent = " Vidéo proposée avec succès. En attente de validation.";
      form.reset();
      fetchVideos();
    } else {
      message.textContent = " Une erreur est survenue. Veuillez réessayer.";
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi du formulaire :", error);
    document.getElementById("formMessage").textContent = "❌ Erreur réseau ou serveur.";
  }
});
