document.addEventListener('DOMContentLoaded', () => {

  // Imposta l'anno corrente nel footer
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // --- MENU HAMBURGER ---
  const hamburger = document.querySelector('.hamburger-menu');
  const nav = document.querySelector('header nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('is-open');
      nav.classList.toggle('is-open');
    });

    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('is-open');
        nav.classList.remove('is-open');
      });
    });
  }

  // --- GALLERIE E MODALE ---
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-img');
  let currentGalleryItems = [];
  let currentIndex = 0;

  // Funzioni per la modale
  const openModal = () => modal.classList.add('is-open');
  const closeModal = () => modal.classList.remove('is-open');

  function showModalImage(index) {
    // Rende la navigazione infinita (loop)
    const newIndex = (index + currentGalleryItems.length) % currentGalleryItems.length;

    const item = currentGalleryItems[newIndex];
    // La modale mostra solo immagini, quindi per i video usiamo il 'poster' o un'immagine di fallback
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

  // Funzione per inizializzare una galleria
  function setupGallery(galleryId) {
    const galleryWrapper = document.getElementById(galleryId);
    if (!galleryWrapper) return;

    const gallery = galleryWrapper.querySelector('.gallery');
    const prevBtn = galleryWrapper.querySelector('.carousel-btn.prev');
    const nextBtn = galleryWrapper.querySelector('.carousel-btn.next');
    const items = Array.from(gallery.querySelectorAll('img, video'));

    // Gestione click sulle immagini per aprire la modale
    items.forEach((item, index) => {
      if (item.tagName === 'IMG') {
        item.addEventListener('click', () => {
          currentGalleryItems = items;
          showModalImage(index);
          openModal();
        });
      }
    });

    // Gestione pulsanti carosello
    if (prevBtn && nextBtn) {
      const scrollAmount = gallery.clientWidth; // Scorre per l'intera larghezza visibile
      
      nextBtn.addEventListener('click', () => {
        // Se siamo quasi alla fine, torna all'inizio
        if (gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 10) {
          gallery.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          gallery.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      });

      prevBtn.addEventListener('click', () => {
        // Se siamo all'inizio, vai alla fine
        if (gallery.scrollLeft === 0) {
          gallery.scrollTo({ left: gallery.scrollWidth, behavior: 'smooth' });
        } else {
          gallery.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
      });
    }

    // Gestione trascinamento per scorrere
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

  // Popola e inizializza la galleria dei clienti
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

  // Inizializza entrambe le gallerie
  setupGallery('main-gallery');
  setupGallery('clients-gallery');


  // --- ANIMAZIONI ALLO SCORRIMENTO ---
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

  // --- GESTIONE FORM CONTATTI ---
  const contactForm = document.getElementById('contact-form');
  if(contactForm) {
    contactForm.addEventListener('submit', function(e) {
      const submitButton = contactForm.querySelector('button[type="submit"]');
      // Aggiunge un feedback visivo all'invio
      setTimeout(() => {
        submitButton.textContent = 'Invio in corso...';
        submitButton.disabled = true;
      }, 100);
    });
  }

  // --- NASCONDI PULSANTE PREVENTIVO NELLA SEZIONE CONTATTI ---
  const contactSection = document.getElementById('contatti');
  const quoteButton = document.querySelector('.fixed-quote-btn');

  if (contactSection && quoteButton) {
    const buttonObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Se la sezione contatti è visibile, nascondi il pulsante
          quoteButton.classList.add('is-hidden');
        } else {
          // Altrimenti, mostralo
          quoteButton.classList.remove('is-hidden');
        }
      });
    }, { threshold: 0.1 }); // Si attiva quando il 10% della sezione è visibile
    buttonObserver.observe(contactSection);
  }
});