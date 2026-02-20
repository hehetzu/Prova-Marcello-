document.addEventListener('DOMContentLoaded', () => {

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

    let isDragging = false;

    items.forEach((item, index) => {
      if (item.tagName === 'IMG') {
        item.addEventListener('click', (e) => {
          if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
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
      isDragging = false;
      gallery.style.cursor = 'grabbing';
      startX = e.pageX - gallery.offsetLeft;
      scrollLeft = gallery.scrollLeft;
    });
    gallery.addEventListener('mouseleave', () => { isDown = false; gallery.style.cursor = 'grab'; });
    gallery.addEventListener('mouseup', () => { isDown = false; gallery.style.cursor = 'grab'; });
    gallery.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      isDragging = true;
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

  const googleScriptURL = "https://script.google.com/macros/s/AKfycbwoeUyQyflLQEajTgYLfK47mzyBZuaemDWWKVpfhwPZTvS9iZ0ekt0KDtusjLkHYNm1/exec";

  // --- Inizio Codice "Sveglia" per Render ---
  // Invia una richiesta al backend appena il sito viene aperto per "svegliarlo" dallo standby.
  // Questo viene fatto solo una volta per sessione di navigazione.
  if (!sessionStorage.getItem('backend_warmed_up')) {
    console.log('🔥 Invio ping per svegliare il backend...');
    fetch('https://marcello-bot.onrender.com/').catch(err => console.warn('Ping al backend fallito (normale se in standby).', err));
    sessionStorage.setItem('backend_warmed_up', 'true');
  }
  // --- Fine Codice "Sveglia" ---

  if (!sessionStorage.getItem('visit_logged')) {
    const trackParams = new URLSearchParams();
    trackParams.append('action', 'track_visit');
    trackParams.append('device', navigator.userAgent);

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

      const handleError = (err) => {
        console.error('Errore invio:', err);
        alert('Si è verificato un errore. Per favore contattaci telefonicamente o su WhatsApp.');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      };

      const handleSuccess = () => {
        alert('Messaggio inviato con successo! Ti risponderemo al più presto.');
        contactForm.reset();
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        if (window.closeContactPopup) window.closeContactPopup();
      };

      const formData = new FormData(contactForm);

      if (formData.get('data_appuntamento') && formData.get('data_appuntamento').trim() !== '') {
        formData.set('tipo_richiesta', 'appuntamento');
      }

      formData.set('_captcha', 'false');

      const telegramPayload = {
        nome: formData.get('name'),
        email: formData.get('email'),
        telefono: formData.get('phone') || formData.get('telefono'),
        messaggio: formData.get('message'),
        data: (formData.get('data_appuntamento') && formData.get('ora_appuntamento')) ? (formData.get('data_appuntamento') + ' ' + formData.get('ora_appuntamento')) : ''
      };

      try {
        const sheetResponse = await fetch(googleScriptURL, {
          method: "POST",
          body: formData
        });
        
        const sheetData = await sheetResponse.json();
        
        if (sheetData.result === 'error') {
          alert("⚠️ " + sheetData.message);
          submitButton.textContent = originalText;
          submitButton.disabled = false;
          return;
        }

        console.log("✅ Prenotazione confermata su Google Sheet.");

        const telegramPromise = fetch('https://marcello-bot.onrender.com/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telegramPayload)
        }).catch(err => console.warn("Errore Telegram:", err));

        // LOGICA IBRIDA: Brevo (Principale) -> FormSubmit (Backup)
        const emailLogicPromise = (async () => {
          try {
            const brevoResp = await fetch('https://marcello-bot.onrender.com/send_email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(telegramPayload)
            });
            
            if (brevoResp.ok) {
              console.log("✅ Email inviata con successo via Brevo");
              return { ok: true };
            } else {
              let errorDetail = brevoResp.status;
              try {
                const errorJson = await brevoResp.json();
                errorDetail += `: ${errorJson.message || 'Nessun dettaglio'}`;
              } catch (e) {
                errorDetail += ` ${brevoResp.statusText}`;
              }
              throw new Error("Brevo ha restituito errore: " + errorDetail);
            }
          } catch (err) {
            console.warn("⚠️ Brevo fallito (" + err.message + "), passo al backup FormSubmit...");
            return fetch(contactForm.action, {
              method: "POST",
              body: formData,
              headers: { 'Accept': 'application/json' }
            });
          }
        })();

        const [emailResult] = await Promise.all([emailLogicPromise, telegramPromise]);

        if (emailResult.ok) {
          handleSuccess();
        } else {
          throw new Error("Errore invio email (sia Brevo che Backup falliti)");
        }

      } catch (err) {
        handleError(err);
      }
    });
  }

  const contactSection = document.getElementById('contatti');
  const quoteButton = document.querySelector('.fixed-quote-btn');

  window.closeContactPopup = () => {};
  const contactInfo = document.querySelector('.contatti-info');
  if (contactForm) {
    contactForm.style.display = 'none';
  }

  function setupDynamicForm() {
    const radioInputs = document.querySelectorAll('input[name="request_type_ui"]');
    const messageBox = document.getElementById('message');
    const subjectInput = document.querySelector('input[name="_subject"]');

    const placeholders = {
      'info': 'Scrivi qui la tua richiesta generica...',
      'preventivo': 'Descrivi il tipo di lavorazione (es. Protesi Deflex, Riparazione) per ricevere una stima...',
      'appuntamento': 'Indica le tue preferenze di orario o usa il calendario per prenotare...'
    };

    const subjects = {
      'info': 'Richiesta Informazioni dal sito',
      'preventivo': 'Richiesta Preventivo dal sito',
      'appuntamento': 'Richiesta Appuntamento dal sito'
    };

    radioInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const val = e.target.value;
        if (messageBox) {
          messageBox.placeholder = placeholders[val] || placeholders['info'];
        }
        if (subjectInput) {
          subjectInput.value = subjects[val] || subjects['info'];
        }
      });
    });
  }

  if (contactForm && contactInfo) {
    // Aggiungi campo telefono dinamicamente
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

    setupDynamicForm();

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal';
    modalOverlay.style.zIndex = '10000';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'popup-form-content';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'popup-close-btn';

    contactForm.parentNode.removeChild(contactForm);
    contactForm.classList.remove('animate-on-scroll');
    contactForm.style.display = 'block';
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(contactForm);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    const defaultSubject = contactForm.querySelector('input[name="_subject"]').value;
    const openPopup = (mode) => {
      const requestTypeWrapper = contactForm.querySelector('.request-type-wrapper');
      if (requestTypeWrapper) {
        requestTypeWrapper.style.display = (mode === 'appointment') ? 'none' : 'block';
      }
      modalOverlay.classList.add('is-open');
    };
    const closePopup = () => {
      modalOverlay.classList.remove('is-open');
      const subjectInput = contactForm.querySelector('input[name="_subject"]');
      if (subjectInput) subjectInput.value = defaultSubject;
    };

    window.closeContactPopup = closePopup;
    window.openContactPopup = openPopup;
    closeBtn.addEventListener('click', closePopup);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closePopup();
    });

    const prepareForQuote = () => {
      const subjectInput = contactForm.querySelector('input[name="_subject"]');
      const dateInput = document.getElementById('booking_date');
      const timeInput = document.getElementById('booking_time');
      const typeInput = document.getElementById('request_type');
      const msgBox = document.getElementById('message');
      const quoteRadio = document.getElementById('type-quote');

      if (subjectInput) subjectInput.value = "Richiesta Preventivo / Informazioni";
      if (dateInput) dateInput.value = "";
      if (timeInput) timeInput.value = "";
      if (typeInput) typeInput.value = "preventivo";
      
      if (quoteRadio) {
        quoteRadio.checked = true;
        quoteRadio.dispatchEvent(new Event('change'));
      }
      
      if (msgBox && msgBox.value.includes('Richiesta appuntamento')) {
        msgBox.value = msgBox.value.replace(/Richiesta appuntamento.*?\n\n/s, '');
      }
      
      openPopup('quote');
    };

    const infoBtn = document.createElement('button');
    infoBtn.textContent = 'Richiedi Preventivo';
    infoBtn.className = 'btn';
    infoBtn.addEventListener('click', prepareForQuote);
    contactInfo.appendChild(infoBtn);

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

  const footer = document.querySelector('footer');
  const floatingIcons = document.querySelector('.floating-icons');
  const scrollThreshold = 200;

  let quoteSectionIsVisible = false;
  let whatsappSectionIsVisible = false;

  function updateFixedButtonsVisibility() {
    const isScrolled = window.scrollY > scrollThreshold;

    if (quoteButton) {
      const shouldHide = !isScrolled || quoteSectionIsVisible;
      quoteButton.classList.toggle('is-hidden', shouldHide);
    }
    if (floatingIcons) {
      // Mantieni le icone flottanti visibili di default; nascondile solo
      // quando la sezione contatti o il footer sono visibili.
      const shouldHide = whatsappSectionIsVisible;
      floatingIcons.classList.toggle('is-hidden', shouldHide);
    }
  }

  updateFixedButtonsVisibility();
  window.addEventListener('scroll', updateFixedButtonsVisibility, { passive: true });

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
        const dayOfWeek = checkDate.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

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

        if (checkDate < today) {
           dayEl.classList.add('disabled');
        } else {
           dayEl.addEventListener('click', () => selectDate(i, month, year, dayEl));
        }
        if (selectedDate && selectedDate.getDate() === i && selectedDate.getMonth() === month && selectedDate.getFullYear() === year) dayEl.classList.add('selected');
        calendarGrid.appendChild(dayEl);
      }
    }

    async function getBookedSlots(date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dateString = `${day}/${month}/${year}`;
      try {
        const response = await fetch(`${googleScriptURL}?date=${encodeURIComponent(dateString)}`);
        const data = await response.json();
        return data.bookedSlots || [];
      } catch (e) {
        console.error("Errore controllo disponibilità:", e);
        return [];
      }
    }

    async function selectDate(day, month, year, el) {
      document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
      el.classList.add('selected');
      selectedDate = new Date(year, month, day);
      selectedDateDisplay.textContent = `${day} ${months[month]} ${year}`;
      
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
      if (typeInput) typeInput.value = "appuntamento";

      if (messageBox && !messageBox.value.includes('Richiesta appuntamento')) messageBox.value = `Richiesta appuntamento per il ${selectedDate.toLocaleDateString('it-IT')} alle ore ${selectedTime}.\n\n` + messageBox.value;
      if (subjectInput) {
        subjectInput.value = `Richiesta Appuntamento - ${selectedDate.toLocaleDateString('it-IT')} ore ${selectedTime}`;
      }
      if (window.openContactPopup) window.openContactPopup('appointment');
    });
    renderCalendar(currentDate);
  }

  const cookieBanner = document.getElementById('cookie-banner');
  const acceptCookiesBtn = document.getElementById('accept-cookies');

  if (cookieBanner && acceptCookiesBtn) {
    if (!localStorage.getItem('cookie_consent')) {
      setTimeout(() => {
        cookieBanner.classList.add('is-visible');
      }, 1000);
    }

    acceptCookiesBtn.addEventListener('click', () => {
      localStorage.setItem('cookie_consent', 'true');
      cookieBanner.classList.remove('is-visible');
    });
  }

  // --- INIZIO CODICE CHATBOT ASSISTENTE ---
  initChatbot();

  function initChatbot() {
    // 1. Inietta lo stile CSS per la chat
    const style = document.createElement('style');

    style.innerHTML = `
      .chatbot-window { position: fixed; bottom: 90px; right: 30px; width: 320px; background: #fff; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.15); overflow: hidden; opacity: 0; pointer-events: none; transform: scale(0.5); transform-origin: bottom right; transition: all 0.3s ease; z-index: 9999; display: flex; flex-direction: column; }
      .chatbot-window.show { opacity: 1; pointer-events: auto; transform: scale(1); }
      .chat-header { background: #0056b3; padding: 15px; color: #fff; display: flex; align-items: center; justify-content: space-between; }
      .chat-header h3 { margin: 0; font-size: 16px; }
      .chat-header span { cursor: pointer; font-size: 20px; }
      .chat-box { padding: 15px; height: 300px; overflow-y: auto; background: #f4f4f4; display: flex; flex-direction: column; gap: 10px; }
      .chat-box .chat-msg { max-width: 80%; padding: 10px; border-radius: 10px; font-size: 14px; word-wrap: break-word; }
      .chat-box .incoming { background: #e0e0e0; color: #333; align-self: flex-start; border-bottom-left-radius: 0; }
      .chat-box .outgoing { background: #0056b3; color: #fff; align-self: flex-end; border-bottom-right-radius: 0; }
      .chat-input { padding: 10px; border-top: 1px solid #ddd; display: flex; gap: 5px; background: #fff; }
      .chat-input input { flex: 1; border: 1px solid #ddd; padding: 8px; border-radius: 5px; outline: none; }
      .chat-input button { background: #0056b3; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; }
      .chat-options { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
      .chat-option-btn { background: #fff; border: 1px solid #0056b3; color: #0056b3; padding: 5px 10px; border-radius: 15px; font-size: 12px; cursor: pointer; transition: 0.2s; }
      .chat-option-btn:hover { background: #0056b3; color: #fff; }
      
      /* Stile per il fumetto di benvenuto */
      .robot-greeting { position: absolute; top: 50%; right: 95px; transform: translateY(-50%); background: #fff; color: #333; padding: 8px 15px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); font-size: 14px; font-weight: 600; opacity: 0; transform: translateY(-50%) scale(0.8); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); pointer-events: none; z-index: 10000; white-space: nowrap; }
      .robot-greeting.show { opacity: 1; transform: translateY(-50%) scale(1); }
      .robot-greeting::after { content: ''; position: absolute; top: 50%; left: 100%; transform: translateY(-50%); border-width: 8px; border-style: solid; border-color: transparent transparent transparent #fff; }

      /* Stile per il pulsante WhatsApp flottante */
      .whatsapp-float { background-color: #25D366 !important; } /* Sovrascrive il gradiente per il colore pieno */
      .whatsapp-float svg { width: 30px; height: 30px; fill: #fff; }
    `;
    document.head.appendChild(style);

    // 2. Crea l'HTML della chat (solo finestra: il toggler visibile è il robottino floating)
    const chatbotHTML = `
      <div class="chatbot-window">
        <div class="chat-header">
          <h3>Assistente Virtuale</h3>
          <span class="close-btn">&times;</span>
        </div>
        <div class="chat-box" id="chat-box">
          <div class="chat-msg incoming">Ciao! 👋 Sono l'assistente virtuale del Laboratorio Roso. Come posso chiamarti?</div>
        </div>
        <div class="chat-input">
          <input type="text" id="chat-input-field" placeholder="Scrivi qui..." required>
          <button id="chat-send-btn">➤</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // 3. Logica JavaScript
    const robotBtn = document.getElementById('robot-button');
    const windowChat = document.querySelector('.chatbot-window');
    const closeBtn = document.querySelector('.close-btn');
    const chatBox = document.getElementById('chat-box');
    const inputField = document.getElementById('chat-input-field');
    const sendBtn = document.getElementById('chat-send-btn');

    let step = 0;
    let userData = { nome: '', tipo: '', messaggio: '', email: '', telefono: '', data_app: '' };

    const toggleChat = () => windowChat.classList.toggle('show');
    closeBtn.addEventListener('click', toggleChat);

    if (robotBtn) {
      // Genera un robottino SVG animato via codice (Gratis, leggero e senza file esterni)
      robotBtn.style.position = 'relative'; // Necessario per posizionare il fumetto
      robotBtn.innerHTML = `
        <div class="robot-greeting" id="robot-greeting">Ciao! 👋</div>
        <svg width="85" height="85" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2)); cursor: pointer;">
          <style>
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
            @keyframes blink { 0%, 45%, 55%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.1); } }
            @keyframes antenna { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
            .bot-body { animation: float 3s ease-in-out infinite; transform-origin: center; }
            .bot-eye { transform-origin: center; animation: blink 4s infinite; }
            .bot-antenna { transform-origin: bottom center; animation: antenna 5s ease-in-out infinite; }
          </style>
          <g class="bot-body">
            <!-- Antenna -->
            <g class="bot-antenna" transform="translate(50, 18)">
               <line x1="0" y1="0" x2="0" y2="-12" stroke="#063969" stroke-width="3" stroke-linecap="round"/>
               <circle cx="0" cy="-12" r="3.5" fill="#e74c3c" />
            </g>
            <!-- Testa -->
            <rect x="20" y="18" width="60" height="50" rx="12" fill="#0056b3" stroke="#063969" stroke-width="2"/>
            <!-- Schermo Faccia -->
            <rect x="26" y="28" width="48" height="28" rx="8" fill="#ffffff" />
            <!-- Occhi -->
            <circle class="bot-eye" cx="40" cy="40" r="4" fill="#2c3e50" />
            <circle class="bot-eye" cx="60" cy="40" r="4" fill="#2c3e50" />
            <!-- Bocca -->
            <path d="M 42 50 Q 50 55 58 50" stroke="#2c3e50" stroke-width="2" fill="none" stroke-linecap="round" />
            <!-- Orecchie -->
            <rect x="14" y="35" width="6" height="14" rx="2" fill="#063969" />
            <rect x="80" y="35" width="6" height="14" rx="2" fill="#063969" />
          </g>
        </svg>`;
      robotBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleChat();
      });

      // Mostra il fumetto di benvenuto dopo 1 secondo
      setTimeout(() => {
        const bubble = document.getElementById('robot-greeting');
        if(bubble) {
          bubble.classList.add('show');
          // Nascondilo automaticamente dopo 6 secondi
          setTimeout(() => bubble.classList.remove('show'), 6000);
        }
      }, 1000);
    }

    // Inietta l'icona di WhatsApp nel pulsante esistente
    const waBtn = document.querySelector('.whatsapp-float');
    if (waBtn) {
      waBtn.innerHTML = `
        <img src="foto/icons8-whatsapp.gif" alt="WhatsApp" style="width: 35px; height: 35px;">
      `;
    }

    const appendMessage = (text, type) => {
      const div = document.createElement('div');
      div.classList.add('chat-msg', type);
      div.innerHTML = text; // Usa innerHTML per permettere formattazione
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
    };

    const botReply = (text) => {
      setTimeout(() => appendMessage(text, 'incoming'), 500);
    };

    const handleOptions = (options) => {
      const div = document.createElement('div');
      div.classList.add('chat-options');
      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.classList.add('chat-option-btn');
        btn.textContent = opt;
        btn.onclick = () => handleInput(opt);
        div.appendChild(btn);
      });
      setTimeout(() => {
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
      }, 600);
    };

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    const isValidPhone = (phone) => /^\+?[\d\s-]{7,}$/.test(phone);

    function parseDateTimeFromString(text) {
      const now = new Date();
      let date = null;
      let hour = null;
      let minute = '00';

      // Cerca un orario nel formato "alle 10" o "10:30"
      const timeRegex = /(?:alle|ore)?\s*(\d{1,2})[:.]?(\d{2})?/i;
      const timeMatch = text.match(timeRegex);

      if (timeMatch) {
          hour = parseInt(timeMatch[1], 10);
          if (timeMatch[2]) {
              minute = timeMatch[2];
          }
      }
      
      // Se non trova un orario, non può essere un appuntamento specifico
      if (hour === null) return '';

      // Cerca una data nel formato "DD/MM/YYYY" o "DD/MM"
      const dateRegex = /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?/i;
      const dateMatch = text.match(dateRegex);
      if (dateMatch) {
          const day = parseInt(dateMatch[1], 10);
          const month = parseInt(dateMatch[2], 10) - 1;
          let year = now.getFullYear();
          if (dateMatch[3]) {
              const y = parseInt(dateMatch[3], 10);
              year = y < 100 ? 2000 + y : y;
          }
          date = new Date(year, month, day);
      } else if (/\bdomani\b/i.test(text)) {
          date = new Date();
          date.setDate(now.getDate() + 1);
      } else {
          // Se non c'è una data specifica ma c'è un orario, assume la data di oggi
          date = new Date();
      }

      if (date) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          const formattedHour = String(hour).padStart(2, '0');
          return `${day}/${month}/${year} ${formattedHour}:${minute}`;
      }
      return '';
    }

    const sendToBackend = async () => {
      appendMessage("⏳ Invio richiesta in corso...", 'incoming');
      
      const fullMessage = `[DA CHATBOT] Tipo: ${userData.tipo}\nMessaggio: ${userData.messaggio}`;
      
      // 1. Payload JSON per Telegram e Brevo (email)
      const jsonPayload = {
        nome: userData.nome,
        email: userData.email,
        telefono: userData.telefono,
        messaggio: fullMessage,
        data: userData.data_app || ''
      };

      // 2. Dati FormData per Google Sheet (devono corrispondere ai campi del form)
      const sheetFormData = new FormData();
      sheetFormData.append('name', userData.nome);
      sheetFormData.append('email', userData.email);
      sheetFormData.append('telefono', userData.telefono);
      sheetFormData.append('message', fullMessage);
      sheetFormData.append('tipo_richiesta', userData.tipo.toLowerCase());
      sheetFormData.append('_captcha', 'false');

      try {
        // 3. Eseguiamo tutte le chiamate in parallelo per efficienza
        const sheetPromise = fetch(googleScriptURL, {
          method: "POST",
          body: sheetFormData
        }).then(res => res.json()).catch(err => console.error("❌ Errore invio a Google Sheet dal chatbot:", err));

        const telegramPromise = fetch('https://marcello-bot.onrender.com/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonPayload)
        }).catch(err => console.error("❌ Errore invio a Telegram dal chatbot:", err));

        const emailPromise = fetch('https://marcello-bot.onrender.com/send_email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jsonPayload)
        }).catch(err => console.error("❌ Errore invio a Brevo (email) dal chatbot:", err));

        // Aspettiamo che tutte le chiamate siano state tentate
        await Promise.all([sheetPromise, telegramPromise, emailPromise]);

        botReply("✅ Perfetto! Ho inviato la tua richiesta. Ti risponderemo presto.");

      } catch (error) {
        console.error("Errore generale nell'invio dal chatbot:", error);
        botReply("⚠️ C'è stato un piccolo problema tecnico, ma puoi comunque chiamarci al numero nel sito.");
      }
    };

    const processStep = (msg) => {
      switch(step) {
        case 0: // Nome
          userData.nome = msg;
          step++;
          botReply(`Piacere, ${userData.nome}! Di cosa hai bisogno oggi?`);
          handleOptions(['Preventivo', 'Appuntamento', 'Informazioni']);
          break;
        case 1: // Tipo
          userData.tipo = msg;
          step++;
          if (msg.toLowerCase().includes('appuntamento')) {
            botReply("Ottimo. Per quando vorresti prenotare? (O descrivi la tua disponibilità)");
          } else if (msg.toLowerCase().includes('preventivo')) {
            botReply("D'accordo. Descrivimi brevemente il tipo di lavorazione.");
          } else {
            botReply("Dimmi pure, cosa vorresti sapere?");
          }
          break;
        case 2: // Messaggio
          userData.messaggio = msg;
          step++;
          
          let replyText = "Grazie. Lasciami un'email o un numero di telefono per ricontattarti.";
          
          // Se è una richiesta di appuntamento, prova a capire la data
          if (userData.tipo.toLowerCase().includes('appuntamento')) {
              const parsedDate = parseDateTimeFromString(msg);
              if (parsedDate) {
                  userData.data_app = parsedDate;
                  replyText = `Ok, ho segnato la richiesta per il <b>${parsedDate}</b>. Ora lasciami un'email o un numero di telefono per ricontattarti.`;
              }
          }
          botReply(replyText);
          break;
        case 3: // Contatto
          if (isValidEmail(msg)) {
            userData.email = msg;
            userData.telefono = '';
            step++;
            sendToBackend();
            inputField.disabled = true;
            sendBtn.disabled = true;
          } else if (isValidPhone(msg)) {
            userData.telefono = msg;
            userData.email = '';
            step++;
            sendToBackend();
            inputField.disabled = true;
            sendBtn.disabled = true;
          } else {
            botReply("Hmm, non sembra un'email o un numero di telefono valido. Per favore, inserisci un contatto corretto per poterti ricontattare.");
          }
          break;
      }
    };

    const handleInput = (text = null) => {
      const msg = text || inputField.value.trim();
      if (!msg) return;

      appendMessage(msg, 'outgoing');
      inputField.value = '';
      
      // Rimuovi vecchie opzioni se presenti
      const oldOptions = document.querySelectorAll('.chat-options');
      oldOptions.forEach(el => el.remove());

      processStep(msg);
    };

    sendBtn.addEventListener('click', () => handleInput());
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleInput();
    });
  }
  // --- FINE CODICE CHATBOT ---
});