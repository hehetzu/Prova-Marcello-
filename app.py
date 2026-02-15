from flask import Flask, request
from flask_cors import CORS
import requests
import os
import json
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app) # Abilita CORS per permettere al sito di inviare dati al bot

# Inserisci qui il tuo token e chat_id Telegram
TELEGRAM_TOKEN = os.environ.get("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID")

# URL del Google Script (Lo stesso usato nel frontend, mettilo qui o nel .env)
GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwoeUyQyflLQEajTgYLfK47mzyBZuaemDWWKVpfhwPZTvS9iZ0ekt0KDtusjLkHYNm1/exec"

if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
    print("❌ ERRORE CRITICO: Token o Chat ID non trovati!")
    print("   Assicurati di aver creato il file .env nella stessa cartella di app.py")

@app.route("/", methods=["GET"])
def index():
    """Health check per Render/Heroku"""
    return "Bot Telegram attivo 🤖 (v2.1 - Test Finale)", 200

@app.route("/webhook", methods=["POST"])
def webhook():
    data = request.json
    if not data:
        return {"status": "ignored", "message": "No JSON data"}, 200

    # --- GESTIONE CALLBACK (Click sui bottoni) ---
    if "callback_query" in data:
        callback = data["callback_query"]
        
        # 0. Rispondi SUBITO a Telegram (ferma la rotellina di caricamento)
        # Lo facciamo come prima cosa assoluta per evitare timeout visivi
        try:
            requests.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/answerCallbackQuery", json={
                "callback_query_id": callback["id"],
                "text": "🔄 Elaborazione in corso..."
            }, timeout=5)
        except Exception as e:
            print(f"Errore nella answerCallbackQuery: {e}")

        chat_id = callback["message"]["chat"]["id"]
        message_id = callback["message"]["message_id"]
        data_str = callback["data"] # Es: "confirm|12/02/2024|14:00"
        print(f"🔹 Callback ricevuta: {data_str}")

        try:
            action, date_app, time_app = data_str.split("|")
        except ValueError:
            print(f"❌ Errore formato callback data: {data_str}")
            return {"status": "error", "message": "Invalid callback data"}, 200
        
        new_status = "Confermato" if action == "confirm" else "Rifiutato"
        emoji = "✅" if action == "confirm" else "❌"

        # 1. Aggiorna Google Sheet
        try:
            requests.post(GOOGLE_SCRIPT_URL, json={
                "action": "update_status",
                "date": date_app,
                "time": time_app,
                "status": new_status
            }, timeout=10)
            print(f"✅ Aggiornamento Google Sheet (con timeout): {date_app} {time_app} -> {new_status}")
        except Exception as e:
            print(f"Errore aggiornamento Sheet: {e}")

        # 2. Rimuovi solo i bottoni dal messaggio originale (lascia il testo invariato)
        try:
            requests.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/editMessageReplyMarkup", json={
                "chat_id": chat_id,
                "message_id": message_id,
                "reply_markup": {"inline_keyboard": []}
            }, timeout=10)
        except Exception as e:
            print(f"Errore rimozione bottoni: {e}")

        # 3. Invia un NUOVO messaggio di conferma
        requests.post(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage", json={
            "chat_id": chat_id,
            "text": f"{emoji} Appuntamento {new_status.upper()}"
        })

        return {"status": "ok"}, 200

    # --- GESTIONE MESSAGGIO NORMALE (Dal sito) ---
    # Se riceviamo un update standard di Telegram (es. un messaggio in chat), lo ignoriamo per evitare loop
    if "message" in data or "update_id" in data:
        return {"status": "ignored"}, 200

    print("📩 Richiesta ricevuta dal sito/test...")
    nome = data.get("nome", "Non specificato")
    email = data.get("email", "Non specificata")
    telefono = data.get("telefono", "")
    messaggio = data.get("messaggio", "")
    data_app = data.get("data", "")

    # Estrai data e ora separatamente se possibile (assumendo formato "dd/mm/yyyy hh:mm")
    date_only = ""
    time_only = ""
    if data_app and " " in data_app:
        parts = data_app.split(" ")
        date_only = parts[0]
        time_only = parts[1]

    # Determina il titolo in base alla presenza della data
    titolo = "📅 Nuovo Appuntamento" if data_app else "📄 Richiesta Preventivo/Info"

    text = f"{titolo}\n\n"
    text += f"Nome: {nome}\n"
    text += f"Email: {email}\n"
    if telefono:
        text += f"Telefono: {telefono}\n"
    if data_app:
        text += f"Data richiesta: {data_app}\n"
    text += f"\nMessaggio:\n{messaggio}\n"

    # Preparazione Link WhatsApp e Email con testi preimpostati
    clean_phone = telefono.replace(" ", "").replace("-", "") if telefono else ""
    wa_text = f"Ciao {nome}, ho ricevuto la tua richiesta dal sito. Come posso aiutarti?"
    wa_url = f"https://wa.me/{clean_phone}?text={urllib.parse.quote(wa_text)}"
    
    mail_subject = "Risposta alla tua richiesta - Laboratorio Roso Marcello"
    mail_body = f"Gentile {nome},\n\nAbbiamo ricevuto la tua richiesta dal sito web.\n\nCordiali saluti,\nLaboratorio Odontotecnico Roso Marcello"
    mail_url = f"mailto:{email}?subject={urllib.parse.quote(mail_subject)}&body={urllib.parse.quote(mail_body)}"
    
    # Aggiungiamo il link email nel testo (i bottoni Telegram non supportano "mailto:")
    text += f"\n📧 Rispondi via Email: {email}"

    # Creazione Bottoni (Inline Keyboard)
    keyboard = []
    if clean_phone:
        keyboard.append([{"text": "💬 WhatsApp", "url": wa_url}])
    
    # Se è un appuntamento, aggiungi bottoni Accetta/Rifiuta
    if data_app and date_only and time_only:
        print(f"🔘 Aggiungo bottoni per: {date_only} - {time_only}")
        callback_data_confirm = f"confirm|{date_only}|{time_only}"
        callback_data_reject = f"reject|{date_only}|{time_only}"
        keyboard.append([
            {"text": "✅ Accetta", "callback_data": callback_data_confirm},
            {"text": "❌ Rifiuta", "callback_data": callback_data_reject}
        ])

    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text
    }
    
    if keyboard:
        payload["reply_markup"] = json.dumps({"inline_keyboard": keyboard})

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    response = requests.post(url, data=payload, timeout=10)
    
    if response.status_code != 200:
        print(f"❌ Errore Telegram: {response.text}")
    else:
        print("✅ Messaggio inviato a Telegram con successo!")

    return {"status": "ok"}, 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))