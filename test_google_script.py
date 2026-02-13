import requests
import time

# URL dello script Google da testare
GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwoeUyQyflLQEajTgYLfK47mzyBZuaemDWWKVpfhwPZTvS9iZ0ekt0KDtusjLkHYNm1/exec"

def clean_slate():
    """Pulisce preventivamente le righe di test per evitare errori di 'Già occupato'"""
    print("--- Pulizia Preventiva Iniziale ---")
    # Elenco delle date usate nei test
    targets = [
        {"date": "01/01/2030", "time": "10:00"},
        {"date": "02/01/2030", "time": "09:00"}
    ]
    
    for t in targets:
        try:
            requests.post(GOOGLE_SCRIPT_URL, json={"action": "delete_row", "date": t["date"], "time": t["time"]})
            # Tentativo extra per date formattate senza zeri (es. 1/1/2030)
            normalized_date = t["date"].replace("/0", "/").lstrip("0")
            requests.post(GOOGLE_SCRIPT_URL, json={"action": "delete_row", "date": normalized_date, "time": t["time"]})
        except:
            pass
    print("   Ambiente pulito. Inizio test...\n")
    time.sleep(2)

def test_form_submission():
    """Testa l'inserimento di una nuova prenotazione (come fa il sito web)"""
    print("--- Test 1: Nuova Prenotazione (Simulazione Sito) ---")
    
    # Dati simulati del form
    form_data = {
        "name": "Test Verifica Script",
        "email": "test@verifica.com",
        "phone": "0000000000",
        "message": "Questo è un test automatico per verificare l'URL.",
        "data_appuntamento": "01/01/2030", # Data futura lontana per non confondere
        "ora_appuntamento": "10:00",
        "tipo_richiesta": "appuntamento"
    }
    
    try:
        print(f"Invio dati a: {GOOGLE_SCRIPT_URL}...")
        response = requests.post(GOOGLE_SCRIPT_URL, data=form_data)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            # Controllo se Google ha restituito una pagina di errore HTML mascherata da 200 OK
            if "<!DOCTYPE html>" in response.text or "TypeError" in response.text:
                print("❌ ERRORE CRITICO: Lo script ha restituito un errore HTML invece dei dati.")
                print("   CAUSA: Stai usando la VECCHIA versione dello script che non sa creare i fogli mancanti.")
                print("   SOLUZIONE: Vai su Google Script -> Distribuisci -> Gestisci -> Modifica -> Seleziona 'Nuova versione' -> Distribuisci.")
            else:
                print("✅ SUCCESSO: Google Script ha risposto 200 OK.")
                print("   -> Controlla il Foglio 'Appuntamenti': dovresti vedere 'Data e Ora' uniti nella colonna E.")
        else:
            print(f"❌ ERRORE: Codice {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ ERRORE DI CONNESSIONE: {e}")

def test_json_update():
    """Testa l'aggiornamento di stato (come fa il Bot Python quando clicchi Accetta)"""
    print("\n--- Test 2: Aggiornamento Stato (Simulazione Bot Python) ---")
    
    json_payload = {
        "action": "update_status",
        "date": "01/01/2030",
        "time": "10:00",
        "status": "Confermato"
    }
    
    try:
        response = requests.post(GOOGLE_SCRIPT_URL, json=json_payload)
        
        print(f"Status Code: {response.status_code}")
        print(f"Risposta: {response.text}")
        
        if response.status_code == 200 and "success" in response.text:
            print("✅ SUCCESSO: Stato aggiornato correttamente.")
            print("   -> Controlla il Foglio 'Appuntamenti': la colonna 'Stato' (G) dovrebbe essere 'Confermato'.")
        elif "Non disponi dell'autorizzazione" in response.text or "Authorization" in response.text:
            print("❌ ERRORE PERMESSI GOOGLE:")
            print("   Lo script non ha il permesso di inviare email.")
            print("   SOLUZIONE: Vai nell'editor Google Script, crea ed esegui questa funzione per accettare i permessi:")
            print("   function auth() { MailApp.getRemainingDailyQuota(); }")
        else:
            print("❌ ERRORE o riga non trovata (verifica la risposta sopra).")
            if "non trovato" in response.text:
                print("   ⚠️  POSSIBILE CAUSA: Formattazione Data nel Foglio Google.")
                print("      Assicurati che la colonna 'Data e Ora' (E) sia formattata come 'Testo normale'.")
                print("      Se Google converte '01/01/2030' in '1/1/2030', lo script non trova la corrispondenza.")
            
    except Exception as e:
        print(f"❌ ERRORE DI CONNESSIONE: {e}")

def test_delete_row():
    """Testa l'eliminazione della riga di prova per pulire il foglio"""
    print("\n--- Test 3: Pulizia (Eliminazione Riga di Prova) ---")
    
    json_payload = {
        "action": "delete_row",
        "date": "01/01/2030",
        "time": "10:00"
    }
    
    try:
        response = requests.post(GOOGLE_SCRIPT_URL, json=json_payload)
        
        print(f"Status Code: {response.status_code}")
        print(f"Risposta: {response.text}")
        
        if response.status_code == 200 and "success" in response.text:
            print("✅ SUCCESSO: Dati di prova eliminati dal foglio.")
        else:
            print("❌ ERRORE: Impossibile eliminare la riga (forse lo script Google non è aggiornato?).")
            
    except Exception as e:
        print(f"❌ ERRORE DI CONNESSIONE: {e}")

def test_quote_submission():
    """Testa l'inserimento di un preventivo (dovrebbe andare nel foglio 'Preventivi')"""
    print("\n--- Test 4: Richiesta Preventivo (Foglio 'Preventivi') ---")
    
    form_data = {
        "name": "Test Preventivo",
        "email": "preventivo@test.com",
        "phone": "111222333",
        "message": "Vorrei un preventivo per una protesi.",
        "tipo_richiesta": "preventivo"
    }
    
    try:
        response = requests.post(GOOGLE_SCRIPT_URL, data=form_data)
        if response.status_code == 200:
            if "<!DOCTYPE html>" in response.text:
                print("❌ ERRORE CRITICO: Lo script ha restituito un errore HTML.")
                print("   CAUSA: Probabilmente non hai fatto 'Nuova Versione' durante la distribuzione.")
            else:
                print("✅ SUCCESSO: Preventivo inviato.")
                print(f"   Risposta Server: {response.text}")
                print("   -> Controlla il foglio 'Preventivi': dovresti vedere solo Data, Nome, Email, Telefono e Messaggio.")
        else:
            print(f"❌ ERRORE: {response.status_code}")
    except Exception as e:
        print(f"❌ ERRORE: {e}")

def test_double_booking():
    """Testa il blocco delle doppie prenotazioni"""
    print("\n--- Test 5: Doppia Prenotazione (Controllo Conflitti) ---")
    
    # Dati per la prenotazione
    booking_data = {
        "name": "Utente A",
        "email": "a@test.com",
        "phone": "333111",
        "message": "Prenotazione A",
        "data_appuntamento": "02/01/2030", 
        "ora_appuntamento": "09:00",
        "tipo_richiesta": "appuntamento"
    }

    # 1. Prima prenotazione (dovrebbe riuscire)
    print("1. Invio prima prenotazione...")
    try:
        res1 = requests.post(GOOGLE_SCRIPT_URL, data=booking_data)
        if res1.status_code == 200 and "success" in res1.text:
            print("✅ Prima prenotazione riuscita.")
        elif "<!DOCTYPE html>" in res1.text:
            print("❌ ERRORE CRITICO: Errore HTML dallo script Google (controlla distribuzione).")
            return
        elif "Occupato" in res1.text or "occupato" in res1.text:
            print("⚠️  ATTENZIONE: La prima prenotazione risulta già occupata.")
            print("    Il test continuerà, ma significa che la pulizia iniziale non ha cancellato la riga vecchia.")
            print("    (Questo conferma comunque che il controllo conflitti funziona!)")
        else:
            print(f"❌ Errore prima prenotazione: {res1.text}")
            return
    except Exception as e:
        print(f"❌ Errore connessione: {e}")
        return

    print("   Attendo 2 secondi...")
    time.sleep(2)

    # 2. Seconda prenotazione (dovrebbe fallire)
    print("2. Invio seconda prenotazione (stesso orario)...")
    booking_data["name"] = "Utente B (Conflitto)"
    try:
        res2 = requests.post(GOOGLE_SCRIPT_URL, data=booking_data)
        
        # Controllo preventivo se la risposta è HTML (errore Google) invece di JSON
        if "<!DOCTYPE html>" in res2.text:
            print("❌ ERRORE CRITICO: Errore HTML dallo script Google (controlla distribuzione).")
            print(f"   Preview: {res2.text[:100]}...")
            return

        try:
            data2 = res2.json()
        except ValueError:
            print(f"❌ ERRORE: La risposta del server non è un JSON valido. Status: {res2.status_code}")
            print(f"   Contenuto: {res2.text[:200]}")
            return

        if data2.get("result") == "error":
            print(f"✅ SUCCESSO: Il sistema ha bloccato la doppia prenotazione.")
            print(f"   Messaggio ricevuto: {data2.get('message')}")
        else:
            print(f"❌ FALLITO: Il sistema ha accettato la seconda prenotazione! (Risposta: {res2.text})")
            print("   ⚠️  POSSIBILE CAUSA: Formattazione Data o Script non aggiornato.")
            print("      1. Controlla che la colonna 'Data e Ora' (E) nel foglio sia 'Testo normale'.")
            print("      2. Assicurati di aver fatto 'Nuova distribuzione' nello script Google.")
            
    except Exception as e:
        print(f"❌ Errore connessione: {e}")

    # Pulizia
    print("3. Pulizia dati test...")
    time.sleep(2)
    requests.post(GOOGLE_SCRIPT_URL, json={
        "action": "delete_row",
        "date": "02/01/2030",
        "time": "09:00"
    })
    # Eseguiamo una seconda cancellazione per sicurezza, nel caso il test abbia fallito e creato un duplicato
    requests.post(GOOGLE_SCRIPT_URL, json={
        "action": "delete_row",
        "date": "02/01/2030",
        "time": "09:00"
    })

if __name__ == "__main__":
    clean_slate() # Esegue la pulizia prima di tutto
    test_form_submission()
    print("Attendo 3 secondi per permettere a Google di salvare...")
    time.sleep(3)
    test_json_update()
    print("Attendo 3 secondi prima di pulire...")
    time.sleep(3)
    test_delete_row()
    print("Attendo 3 secondi...")
    time.sleep(3)
    test_quote_submission()
    print("Attendo 3 secondi...")
    time.sleep(3)
    test_double_booking()