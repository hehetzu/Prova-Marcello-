import requests

# Script per testare il bot localmente
# Istruzioni:
# 1. Avvia il bot in un terminale con: python app.py
# 2. Esegui questo script in un NUOVO terminale con: python test_request.py

url = "http://127.0.0.1:5000/webhook"

payload = {
    "nome": "Test Sicurezza",
    "email": "test@example.com",
    "telefono": "3330000000",
    "messaggio": "Ciao! Se leggi questo messaggio, il file .env funziona correttamente.",
    "data": "01/01/2025 15:00"
}

try:
    print(f"Invio richiesta a {url}...")
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        print("✅ SUCCESSO! Il server ha risposto 200 OK.")
        print("   Controlla il tuo Telegram (e guarda il terminale del server per conferme).")
    else:
        print(f"❌ ERRORE! Il server ha risposto con codice: {response.status_code}")
        print(f"   Dettagli: {response.text}")
        
except Exception as e:
    print(f"\n❌ ERRORE DI CONNESSIONE: {e}")
    print("   1. Assicurati che 'app.py' sia acceso in un'altra finestra.")
    print("   2. Assicurati di non scrivere in quella finestra, ma in questa.")