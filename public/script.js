/* =========================
   GLOBAL: Menu mobile & UX
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
 
  // menu

document.querySelector(".menu-btn").addEventListener("click", () => {
  document.querySelector(".menu").classList.toggle("open");
});
  // Animation simple au scroll (fade-in)
  const animatedEls = document.querySelectorAll(".fade-in, .fade-in-delay, .slide-up");
  const onScrollAnimate = () => {
    const triggerBottom = window.innerHeight * 0.9;
    animatedEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < triggerBottom) el.classList.add("in-view");
    });
  };
  onScrollAnimate();
  document.addEventListener("scroll", onScrollAnimate);

  // Bouton "retour en haut" (optionnel)
  const backTopBtn = document.createElement("button");
  backTopBtn.className = "back-to-top";
  backTopBtn.innerHTML = "↑";
  Object.assign(backTopBtn.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "none",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    cursor: "pointer",
    display: "none",
    zIndex: "999"
  });
  document.body.appendChild(backTopBtn);
  backTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.addEventListener("scroll", () => {
    backTopBtn.style.display = window.scrollY > 400 ? "block" : "none";
  });

  /* =========================
     HOME: Carousel d'images
     ========================= */
  const carousel = document.querySelector(".carousel");
  if (carousel) {
    const slides = carousel.querySelectorAll(".slide");
    const prevBtn = document.querySelector(".prev");
    const nextBtn = document.querySelector(".next");
    let currentSlide = 0;
    let autoTimer;

    const showSlide = (index) => {
      slides.forEach((s, i) => s.classList.toggle("active", i === index));
    };

    const moveSlide = (step) => {
      currentSlide = (currentSlide + step + slides.length) % slides.length;
      showSlide(currentSlide);
      resetAuto();
    };

    const startAuto = () => {
      autoTimer = setInterval(() => moveSlide(1), 5000);
    };
    const resetAuto = () => {
      clearInterval(autoTimer);
      startAuto();
    };

    // Init
    showSlide(currentSlide);
    startAuto();

    // Controls
    if (prevBtn) prevBtn.addEventListener("click", () => moveSlide(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => moveSlide(1));

    // Swipe mobile
    let startX = null;
    carousel.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });
    carousel.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 50) moveSlide(diff > 0 ? -1 : 1);
      startX = null;
    });
  }

  /* =========================
     TRAININGS: Petits détails
     ========================= */
  // Lazy loading des images des formations
  const trainingImgs = document.querySelectorAll(".post-img");
  const lazyLoad = (img) => {
    if ("loading" in HTMLImageElement.prototype) {
      img.setAttribute("loading", "lazy");
    }
  };
  trainingImgs.forEach(lazyLoad);

  // Optionnel: compteur de vues local (simulation)
  const postCards = document.querySelectorAll(".post-card");
  postCards.forEach((card) => {
    const eye = card.querySelector(".fa-eye");
    const eyeText = eye ? eye.parentElement : null;
    if (eyeText) {
      const numMatch = eyeText.textContent.match(/\d+/);
      const base = numMatch ? parseInt(numMatch[0], 10) : 0;
      eyeText.textContent = `${base} vues`;
    }
  });
});

/* =========================
   CSS helper classes (via JS)
   ========================= */
// Ajoute dynamiquement une petite feuille de style pour les animations si nécessaire
(function injectHelperCSS() {
  const style = document.createElement("style");
  style.innerHTML = `
    .fade-in, .fade-in-delay, .slide-up { opacity: 0; transform: translateY(10px); transition: all .6s ease; }
    .fade-in-delay { transition-delay: .15s; }
    .in-view { opacity: 1; transform: translateY(0); }
  `;
  document.head.appendChild(style);
})();
