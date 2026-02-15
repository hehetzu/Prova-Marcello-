document.addEventListener('DOMContentLoaded', () => {

  // Configurazione percorso tema (passato da functions.php)
  const themePath = (window.themeConfig && window.themeConfig.themeUrl) ? window.themeConfig.themeUrl + '/' : '';

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
    // Aggiornato per usare il path del tema per l'immagine di default
    modalImg.src = item.tagName === 'VIDEO' ? (item.poster || themePath + 'foto/deflex.jpeg') : item.src;
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
    // Aggiornato per usare il path del tema
    clientsGalleryContainer.innerHTML = clientImages.map(src => 
      `<img src="${themePath}${src}" alt="Risultato finale del lavoro su un paziente" loading="lazy">`
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

  // URL del tuo Google Apps Script (Assicurati di aggiornarlo se fai una Nuova Distribuzione)
  const googleScriptURL = "https://script.google.com/macros/s/AKfycbwoeUyQyflLQEajTgYLfK47mzyBZuaemDWWKVpfhwPZTvS9iZ0ekt0KDtusjLkHYNm1/exec";

  // --- TRACKING VISITE (Counter Segreto) ---
  // Invia un segnale a Google Sheet una volta per sessione
  if (!sessionStorage.getItem('visit_logged')) {
    const trackParams = new URLSearchParams();
    trackParams.append('action', 'track_visit');
    trackParams.append('device', navigator.userAgent); // Info sul dispositivo (Mobile/PC)

    fetch(googleScriptURL, { method: 'POST', body: trackParams }).catch(err => {});
    sessionStorage.setItem('visit_logged', 'true');
  }

  const contactForm = document.getElementById('contact-form');
  if(contactForm) {
    contactForm.addEventListener('submit', async function(e) {
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

      // Fallback di sicurezza: se c'è una data compilata, forziamo il tipo "appuntamento"
      // Questo corregge eventuali errori se il campo hidden non si è aggiornato
      if (formData.get('data_appuntamento') && formData.get('data_appuntamento').trim() !== '') {
        formData.set('tipo_richiesta', 'appuntamento');
      }

      // Configurazione per una mail più professionale (Template e Auto-risposta)
      formData.set('_captcha', 'false'); // Assicura che il captcha sia disattivato
      // Rimuoviamo temporaneamente il template 'box' per garantire la consegna

      // Preparazione dati per Telegram
      const telegramPayload = {
        nome: formData.get('name'),
        email: formData.get('email'),
        telefono: formData.get('phone') || formData.get('telefono'),
        messaggio: formData.get('message'),
        data: (formData.get('data_appuntamento') && formData.get('ora_appuntamento')) ? (formData.get('data_appuntamento') + ' ' + formData.get('ora_appuntamento')) : ''
      };

      try {
        // 1. PRIMA controlliamo e salviamo su Google Sheet (per evitare doppie prenotazioni)
        const sheetResponse = await fetch(googleScriptURL, {
          method: "POST",
          body: formData
        });
        
        const sheetData = await sheetResponse.json();
        
        if (sheetData.result === 'error') {
          // Se Google dice che è occupato o c'è un errore, ci fermiamo QUI.
          alert("⚠️ " + sheetData.message);
          submitButton.textContent = originalText;
          submitButton.disabled = false;
          return; // Stop
        }

        console.log("✅ Prenotazione confermata su Google Sheet.");

        // 2. Se Google è OK, inviamo a Telegram e Email in parallelo
        const telegramPromise = fetch('https://marcello-bot.onrender.com/webhook', {
        // const telegramPromise = fetch('http://localhost:5000/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telegramPayload)
        }).catch(err => console.warn("Errore Telegram:", err));

        const emailPromise = fetch(contactForm.action, {
          method: "POST",
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        const [emailResult] = await Promise.all([emailPromise, telegramPromise]);

        if (emailResult.ok) {
          handleSuccess();
        } else {
          throw new Error("Errore invio email FormSubmit");
        }

      } catch (err) {
        handleError(err);
      }
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
    if (!contactForm.querySelector('[name="telefono"]') && !contactForm.querySelector('[name="phone"]')) {
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
    const defaultSubject = contactForm.querySelector('input[name="_subject"]').value;
    const openPopup = () => {
      modalOverlay.classList.add('is-open');
    };
    const closePopup = () => {
      modalOverlay.classList.remove('is-open');
      // Ripristina l'oggetto dell'email quando il popup si chiude
      const subjectInput = contactForm.querySelector('input[name="_subject"]');
      if (subjectInput) subjectInput.value = defaultSubject;
    };

    window.closeContactPopup = closePopup; // Rendi la funzione di chiusura accessibile globalmente
    window.openContactPopup = openPopup;   // Rendi la funzione di apertura accessibile globalmente
    closeBtn.addEventListener('click', closePopup);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closePopup();
    });

    // Funzione per preparare il form per una richiesta generica (Preventivo)
    const prepareForQuote = () => {
      const subjectInput = contactForm.querySelector('input[name="_subject"]');
      const dateInput = document.getElementById('booking_date');
      const timeInput = document.getElementById('booking_time');
      const typeInput = document.getElementById('request_type');
      const msgBox = document.getElementById('message');

      if (subjectInput) subjectInput.value = "Richiesta Preventivo / Informazioni";
      if (dateInput) dateInput.value = ""; // Pulisce la data
      if (timeInput) timeInput.value = ""; // Pulisce l'ora
      if (typeInput) typeInput.value = "preventivo"; // Imposta tipo preventivo
      
      // Rimuovi eventuale testo automatico di appuntamento dal messaggio
      if (msgBox && msgBox.value.includes('Richiesta appuntamento')) {
        msgBox.value = msgBox.value.replace(/Richiesta appuntamento.*?\n\n/s, '');
      }
      
      openPopup();
    };

    // 4. Aggiungi bottone vicino ai contatti
    const infoBtn = document.createElement('button');
    infoBtn.textContent = 'Richiedi Preventivo';
    infoBtn.className = 'btn';
    infoBtn.addEventListener('click', prepareForQuote);
    contactInfo.appendChild(infoBtn);

    // 5. Collega anche il bottone fisso
    if (quoteButton) {
      quoteButton.addEventListener('click', (e) => {
        e.preventDefault();
        prepareForQuote();
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

  // --- Gestione Calendario Appuntamenti ---
  const calendarGrid = document.getElementById('calendar-grid');
  if (calendarGrid) {
    const showCalendarBtn = document.getElementById('show-calendar-btn');
    const calendarWrapper = document.getElementById('calendar-wrapper');

    if (showCalendarBtn && calendarWrapper) {
      showCalendarBtn.addEventListener('click', () => {
        calendarWrapper.style.display = 'flex';
        showCalendarBtn.style.display = 'none';
      });
    }

    const monthYear = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const timeSlots = document.getElementById('time-slots');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const bookingAction = document.getElementById('booking-action');
    const confirmBookingBtn = document.getElementById('confirm-booking-btn');
    const bookingDateInput = document.getElementById('booking_date');
    const bookingTimeInput = document.getElementById('booking_time');
    const messageBox = document.getElementById('message');

    let currentDate = new Date();
    let selectedDate = null;
    let selectedTime = null;
    const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

    function renderCalendar(date) {
      calendarGrid.innerHTML = '';
      const year = date.getFullYear();
      const month = date.getMonth();
      monthYear.textContent = `${months[month]} ${year}`;
      
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      let hasStarted = false;

      for (let i = 1; i <= daysInMonth; i++) {
        const checkDate = new Date(year, month, i);
        const dayOfWeek = checkDate.getDay(); // 0=Dom, 6=Sab

        // SALTA I WEEKEND (Non li renderizza proprio)
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        // Aggiungi padding solo per la prima riga del mese (Lun-Ven)
        if (!hasStarted) {
          const padding = dayOfWeek - 1; // Lun=1 -> 0 padding, Mar=2 -> 1 padding...
          for(let p=0; p<padding; p++) {
            calendarGrid.appendChild(document.createElement('div'));
          }
          hasStarted = true;
        }

        const dayEl = document.createElement('div');
        dayEl.textContent = i;
        dayEl.className = 'calendar-day';
        const today = new Date(); today.setHours(0,0,0,0);

        if (checkDate < today) { // Disabilita solo passato (weekend già esclusi)
           dayEl.classList.add('disabled');
        } else {
           dayEl.addEventListener('click', () => selectDate(i, month, year, dayEl));
        }
        if (selectedDate && selectedDate.getDate() === i && selectedDate.getMonth() === month && selectedDate.getFullYear() === year) dayEl.classList.add('selected');
        calendarGrid.appendChild(dayEl);
      }
    }

    // Funzione per recuperare gli orari occupati (da collegare al Google Script in futuro)
    async function getBookedSlots(date) {
      // Formatta la data come dd/mm/yyyy per il confronto con il foglio Google
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dateString = `${day}/${month}/${year}`;
      try {
        const response = await fetch(`${googleScriptURL}?date=${encodeURIComponent(dateString)}`);
        const data = await response.json();
        return data.bookedSlots || []; // Ora ci aspettiamo una lista di oggetti con stato
      } catch (e) {
        console.error("Errore controllo disponibilità:", e);
        return []; // In caso di errore, mostra tutto disponibile per non bloccare l'utente
      }
    }

    async function selectDate(day, month, year, el) {
      document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
      el.classList.add('selected');
      selectedDate = new Date(year, month, day);
      selectedDateDisplay.textContent = `${day} ${months[month]} ${year}`;
      
      // Mostra caricamento mentre controlla la disponibilità
      timeSlots.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:10px;color:#666;">Verifica disponibilità...</div>';
      timeSlotsContainer.style.display = 'block';
      bookingAction.style.display = 'none';

      await renderTimeSlots();
    }

    async function renderTimeSlots() {
      const bookedSlots = await getBookedSlots(selectedDate);
      
      timeSlots.innerHTML = '';
      const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];
      times.forEach(time => {
        const btn = document.createElement('button');
        btn.textContent = time;
        btn.className = 'time-slot-btn';

        // Cerca se questo orario è prenotato
        const slot = bookedSlots.find(s => s.time === time);
        
        if (slot && slot.status === 'confirmed') {
          btn.disabled = true;
          btn.style.cursor = 'not-allowed';
          btn.style.opacity = '0.4';
          btn.style.textDecoration = 'line-through';
          btn.title = "Orario non disponibile";
        } else {
          if (slot) {
            btn.classList.add('pending');
            btn.title = "In attesa di conferma - Potrebbe essere già occupato";
          }
          btn.addEventListener('click', () => {
            document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedTime = time;
            bookingAction.style.display = 'block';
          });
        }
        timeSlots.appendChild(btn);
      });
    }

    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(currentDate); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(currentDate); });
    confirmBookingBtn.addEventListener('click', () => {
      const subjectInput = contactForm.querySelector('input[name="_subject"]');
      const typeInput = document.getElementById('request_type');

      if (bookingDateInput) bookingDateInput.value = selectedDate.toLocaleDateString('it-IT');
      if (bookingTimeInput) bookingTimeInput.value = selectedTime;
      if (typeInput) typeInput.value = "appuntamento"; // Imposta tipo appuntamento

      if (messageBox && !messageBox.value.includes('Richiesta appuntamento')) messageBox.value = `Richiesta appuntamento per il ${selectedDate.toLocaleDateString('it-IT')} alle ore ${selectedTime}.\n\n` + messageBox.value;
      // Modifica l'oggetto dell'email per identificare subito la richiesta di appuntamento
      if (subjectInput) {
        subjectInput.value = `Richiesta Appuntamento - ${selectedDate.toLocaleDateString('it-IT')} ore ${selectedTime}`;
      }
      if (window.openContactPopup) window.openContactPopup();
    });
    renderCalendar(currentDate);
  }
});