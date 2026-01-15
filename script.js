document.addEventListener('DOMContentLoaded', () => {

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

      fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: {
            'Accept': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          alert('Messaggio inviato con successo! Ti risponderemo al più presto.');
          contactForm.reset();
        } else {
          alert('Si è verificato un errore durante l\'invio. Riprova più tardi.');
        }
      })
      .catch(error => {
        alert('Errore di connessione. Controlla la tua rete e riprova.');
      })
      .finally(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      });
    });
  }

  const contactSection = document.getElementById('contatti');
  const quoteButton = document.querySelector('.fixed-quote-btn');

  if (contactSection && quoteButton) {
    const buttonObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          quoteButton.classList.add('is-hidden');
        } else {
          quoteButton.classList.remove('is-hidden');
        }
      });
    }, { threshold: 0.1 });
    buttonObserver.observe(contactSection);
  }

  const footer = document.querySelector('footer');
  const whatsappButton = document.querySelector('.whatsapp-button');

  if (footer && whatsappButton) {
    const footerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          whatsappButton.classList.add('is-hidden');
        } else {
          whatsappButton.classList.remove('is-hidden');
        }
      });
    }, { threshold: 0.1 });
    footerObserver.observe(footer);
  }
});