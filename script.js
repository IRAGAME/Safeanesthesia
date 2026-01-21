/* =========================
   GLOBAL: Menu mobile & UX
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
  // Menu burger
  const burger = document.querySelector(".burger");
  const nav = document.getElementById("nav");

  if (burger && nav) {
    burger.addEventListener("click", () => {
      const isOpen = nav.style.display === "flex";
      nav.style.display = isOpen ? "none" : "flex";
    });

    // Fermer le menu après un clic sur un lien (mobile)
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth < 768) nav.style.display = "none";
      });
    });

    // Reset sur desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768) nav.style.display = "flex";
    });
  }

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

  /* ==================================
     CONTACT: Validation & soumission
     ================================== */
  const contactForm = document.querySelector("form[onsubmit='submitContactForm(event)']");
  const statusEl = document.getElementById("form-status");

  // Remplace l'attribut inline par un handler JS propre
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!statusEl) return;

      const formData = new FormData(contactForm);
      const payload = {
        name: formData.get("name")?.trim(),
        email: formData.get("email")?.trim(),
        subject: formData.get("subject")?.trim(),
        message: formData.get("message")?.trim()
      };

      // Validation simple
      const errors = [];
      if (!payload.name || payload.name.length < 2) errors.push("Nom invalide.");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!payload.email || !emailRegex.test(payload.email)) errors.push("E-mail invalide.");
      if (!payload.subject || payload.subject.length < 2) errors.push("Objet invalide.");
      if (!payload.message || payload.message.length < 10) errors.push("Message trop court.");

      if (errors.length) {
        statusEl.textContent = errors.join(" ");
        statusEl.style.color = "#ef4444";
        return;
      }

      // Affichage d'un état de chargement
      statusEl.textContent = "Envoi en cours...";
      statusEl.style.color = "#94a3b8";

      try {
        // Si tu as un endpoint backend, décommente et adapte l’URL:
        // const res = await fetch("/api/contact", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(payload)
        // });
        // if (!res.ok) throw new Error("Erreur serveur.");
        // const data = await res.json();

        // Simulation locale (sans backend)
        await new Promise((r) => setTimeout(r, 800));

        statusEl.textContent = "Message envoyé. Merci pour votre contact !";
        statusEl.style.color = "#22c55e";
        contactForm.reset();
      } catch (err) {
        statusEl.textContent = "Échec de l'envoi. Réessayez plus tard.";
        statusEl.style.color = "#ef4444";
      }
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
