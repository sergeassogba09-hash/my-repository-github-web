const videos = [
  {
    titre: "Kamalo Vibes",
    source: "assets/videos/video2.MP4",
    poster: "assets/images/img1.jpg",
    description: "Une initiative culturelle portée par les jeunes de Kamalo.",
    tags: ["Culture", "Jeunesse", "Kamalo"]
  },
  {
    titre: "Éco-chantier Sagbado",
    source: "assets/videos/video1.MP4",
    poster: "assets/images/img4.jpg",
    description: "Mobilisation citoyenne pour l’environnement à Sagbado.",
    tags: ["Environnement", "Sagbado", "Action"]
  },
    {
    titre: "Éco-chantier Sagbado",
    source: "assets/videos/video1.MP4",
    poster: "assets/images/img4.jpg",
    description: "Mobilisation citoyenne pour l’environnement à Sagbado.",
    tags: ["Environnement", "Sagbado", "Action"]
  }
];

const container = document.getElementById("videos");

function renderVideos(filteredVideos) {
  container.innerHTML = "";
  filteredVideos.forEach((videoData, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${0.1 * (index + 1)}s`;
    card.innerHTML = `
      <video class="card-video" controls poster="${videoData.poster}">
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

const searchInput = document.getElementById("searchTag");
const noResultsMessage = document.getElementById("noResults");

searchInput.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();

  const filtered = videos.filter(video =>
    video.tags.some(tag => tag.toLowerCase().includes(value))
  );

  renderVideos(filtered);

  // Affiche ou masque le message selon les résultats
  noResultsMessage.style.display = filtered.length === 0 ? "block" : "none";
});

// Affichage initial
renderVideos(videos);
noResultsMessage.style.display = "none";

