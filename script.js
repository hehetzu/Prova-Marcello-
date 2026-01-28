document.addEventListener('DOMContentLoaded', () => {

  // Inizializzazione EmailJS (Sostituisci con la tua Public Key)
  // La trovi in Account > API Keys su https://dashboard.emailjs.com/
  if (window.emailjs) emailjs.init("JbtNJPR5Mob1J9gSu");

  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const hamburger = document.querySelector('.hamburger-menu');
  const nav = document.querySelector('header nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('is-open');
      nav.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-open');
        nav.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-img');
  let currentGalleryItems = [];
  let currentIndex = 0;

  const openModal = () => modal.classList.add('is-open');
  const closeModal = () => modal.classList.remove('is-open');

  function showModalImage(index) {
    const newIndex = (index + currentGalleryItems.length) % currentGalleryItems.length;

    const item = currentGalleryItems[newIndex];
    modalImg.src = item.tagName === 'VIDEO' ? (item.poster || 'foto/deflex.jpeg') : item.src;
    currentIndex = newIndex;
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal-close')) {
        closeModal();
      }
    });
    modal.querySelector('.prev').addEventListener('click', () => showModalImage(currentIndex - 1));
    modal.querySelector('.next').addEventListener('click', () => showModalImage(currentIndex + 1));
  }

  function setupGallery(galleryId) {
    const galleryWrapper = document.getElementById(galleryId);
    if (!galleryWrapper) return;

    const gallery = galleryWrapper.querySelector('.gallery');
    const prevBtn = galleryWrapper.querySelector('.carousel-btn.prev');
    const nextBtn = galleryWrapper.querySelector('.carousel-btn.next');
    const items = Array.from(gallery.querySelectorAll('img, video'));

    items.forEach((item, index) => {
      if (item.tagName === 'IMG') {
        item.addEventListener('click', () => {
          currentGalleryItems = items;
          showModalImage(index);
          openModal();
        });
      }
    });

    if (prevBtn && nextBtn) {
      const scrollAmount = gallery.clientWidth;
      
      nextBtn.addEventListener('click', () => {
        if (gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 10) {
          gallery.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          gallery.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      });

      prevBtn.addEventListener('click', () => {
        if (gallery.scrollLeft === 0) {
          gallery.scrollTo({ left: gallery.scrollWidth, behavior: 'smooth' });
        } else {
          gallery.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      });
    }

    let isDown = false;
    let startX;
    let scrollLeft;

    gallery.addEventListener('mousedown', (e) => {
      isDown = true;
      gallery.style.cursor = 'grabbing';
      startX = e.pageX - gallery.offsetLeft;
      scrollLeft = gallery.scrollLeft;
    });
    gallery.addEventListener('mouseleave', () => { isDown = false; gallery.style.cursor = 'grab'; });
    gallery.addEventListener('mouseup', () => { isDown = false; gallery.style.cursor = 'grab'; });
    gallery.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - gallery.offsetLeft;
      const walk = (x - startX) * 2;
      gallery.scrollLeft = scrollLeft - walk;
    });
  }

  const clientsGalleryContainer = document.querySelector('#clients-gallery .gallery');
  if (clientsGalleryContainer) {
    const clientImages = [
      'foto/foto-cliente-1.jpeg', 'foto/foto-cliente-2.jpeg', 'foto/foto-cliente-3.jpeg',
      'foto/foto-cliente-4.jpeg', 'foto/foto-cliente-5.jpeg', 'foto/foto-cliente-6.jpeg'
    ];
    clientsGalleryContainer.innerHTML = clientImages.map(src => 
      `<img src="${src}" alt="Risultato finale del lavoro su un paziente" loading="lazy">`
    ).join('');
  }

  setupGallery('main-gallery');
  setupGallery('clients-gallery');


  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay) || 0;
        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

  const contactForm = document.getElementById('contact-form');
  if(contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;

      submitButton.textContent = 'Invio in corso...';
      submitButton.disabled = true;

      // Funzione per gestire l'errore finale
      const handleError = (err) => {
        console.error('Errore invio:', err);
        alert('Si è verificato un errore. Per favore contattaci telefonicamente o su WhatsApp.');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      };

      // Funzione per gestire il successo
      const handleSuccess = () => {
        alert('Messaggio inviato con successo! Ti risponderemo al più presto.');
        contactForm.reset();
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        if (window.closeContactPopup) window.closeContactPopup(); // Chiude il popup del form
      };

      const formData = new FormData(contactForm);

      // 1. Invio a FormSubmit (Email)
      const emailPromise = fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      // 2. Invio a Google Script (Foglio Google)
      const googleScriptURL = "https://script.google.com/macros/s/AKfycbyIsiZx_rIJaiuvTGiRG8mZVega6EddbRI-6B_2_8Vk58wuRBf-SaIZPPN_DvJBlyju/exec";
      const sheetPromise = fetch(googleScriptURL, {
        method: "POST",
        body: formData
      });

      // Gestiamo entrambi gli invii e controlliamo i risultati individualmente
      Promise.allSettled([emailPromise, sheetPromise])
        .then(([emailResult, sheetResult]) => {

          const emailOK = emailResult.status === 'fulfilled' && emailResult.value.ok;
          const sheetOK = sheetResult.status === 'fulfilled' && sheetResult.value.ok;

          if (sheetResult.status === 'rejected' || !sheetOK) {
            console.warn("Salvataggio su Foglio Google fallito:", sheetResult.reason || "La risposta non era OK.");
          } else {
            console.log("✅ Dati salvati correttamente su Google Sheet.");
          }

          if (emailOK) {
            // L'email (azione principale) è andata a buon fine.
            handleSuccess();
            if (!sheetOK) {
              console.warn("Attenzione: il backup dei dati sul foglio Google potrebbe non essere andato a buon fine.");
            }
          } else {
            // Se l'invio dell'email fallisce, è un errore critico.
            throw new Error(emailResult.reason || 'Errore durante l\'invio del modulo via email.');
          }
        }).catch(handleError);
    });
  }

  const contactSection = document.getElementById('contatti');
  const quoteButton = document.querySelector('.fixed-quote-btn');

  // Gestione Popup Form
  window.closeContactPopup = () => {}; // Crea una funzione globale vuota
  const contactInfo = document.querySelector('.contatti-info');
  if (contactForm) {
    contactForm.style.display = 'none';
  }

  if (contactForm && contactInfo) {
    // Aggiungi campo telefono dinamicamente
    if (!contactForm.querySelector('[name="telefono"]')) {
      const emailInput = contactForm.querySelector('input[name="email"]');
      if (emailInput) {
        const emailGroup = emailInput.closest('.form-group');
        if (emailGroup) {
          const phoneGroup = document.createElement('div');
          phoneGroup.className = 'form-group';
          phoneGroup.innerHTML = `
            <label for="telefono">Telefono</label>
            <input type="tel" id="telefono" name="telefono" placeholder="Il tuo numero di telefono">
          `;
          emailGroup.parentNode.insertBefore(phoneGroup, emailGroup.nextSibling);
        }
      }
    }

    // 1. Crea il contenitore Modale
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal';
    modalOverlay.style.zIndex = '10000';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'popup-form-content';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'popup-close-btn';

    // 2. Sposta il form nel modale
    contactForm.parentNode.removeChild(contactForm);
    contactForm.classList.remove('animate-on-scroll');
    contactForm.style.display = 'block';
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(contactForm);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // 3. Funzioni e Eventi
    const openPopup = () => modalOverlay.classList.add('is-open');
    const closePopup = () => modalOverlay.classList.remove('is-open');

    window.closeContactPopup = closePopup; // Rendi la funzione di chiusura accessibile globalmente
    closeBtn.addEventListener('click', closePopup);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closePopup();
    });

    // 4. Aggiungi bottone vicino ai contatti
    const infoBtn = document.createElement('button');
    infoBtn.textContent = 'Richiedi Preventivo';
    infoBtn.className = 'btn';
    infoBtn.addEventListener('click', openPopup);
    contactInfo.appendChild(infoBtn);

    // 5. Collega anche il bottone fisso
    if (quoteButton) {
      quoteButton.addEventListener('click', (e) => {
        e.preventDefault();
        openPopup();
        contactForm.style.display = 'block';
        contactForm.classList.add('is-visible');
        contactSection.scrollIntoView({ behavior: 'smooth' });
        quoteButton.classList.add('is-hidden');
      });
    }
  }

  // --- Gestione visibilità bottoni fissi (Preventivo e WhatsApp) ---
  const footer = document.querySelector('footer');
  const whatsappButton = document.querySelector('.whatsapp-button');
  const scrollThreshold = 200; // Mostra i bottoni dopo 200px di scroll

  // Stato di visibilità delle sezioni che nascondono i bottoni
  let quoteSectionIsVisible = false;
  let whatsappSectionIsVisible = false;

  // Funzione centralizzata per aggiornare la visibilità dei bottoni
  function updateFixedButtonsVisibility() {
    const isScrolled = window.scrollY > scrollThreshold;

    if (quoteButton) {
      const shouldHide = !isScrolled || quoteSectionIsVisible;
      quoteButton.classList.toggle('is-hidden', shouldHide);
    }
    if (whatsappButton) {
      const shouldHide = !isScrolled || whatsappSectionIsVisible;
      whatsappButton.classList.toggle('is-hidden', shouldHide);
    }
  }

  // 1. Esegui il controllo iniziale e imposta il listener per lo scroll
  updateFixedButtonsVisibility();
  window.addEventListener('scroll', updateFixedButtonsVisibility, { passive: true });

  // 2. Imposta un unico IntersectionObserver per monitorare le sezioni rilevanti
  if (contactSection || footer) {
    const intersectionStates = new Map();
    const visibilityObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        intersectionStates.set(entry.target, entry.isIntersecting);
      });
      quoteSectionIsVisible = intersectionStates.get(contactSection) || false;
      whatsappSectionIsVisible = (intersectionStates.get(contactSection) || false) || (intersectionStates.get(footer) || false);
      updateFixedButtonsVisibility();
    }, { threshold: 0.1 });

    if (contactSection) visibilityObserver.observe(contactSection);
    if (footer) visibilityObserver.observe(footer);
  }
});