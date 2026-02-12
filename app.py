from flask import Flask, request
import requests
import os
import json
import urllib.parse

app = Flask(__name__)

# Inserisci qui il tuo token e chat_id Telegram
TELEGRAM_TOKEN = "8026656517:AAEaT7Yah7qQ2JOJ1ozh7lJ-RY7YgvETaIA"
TELEGRAM_CHAT_ID = "147586543"

@app.route("/webhook", methods=["POST"])
def webhook():
    data = request.json
    nome = data.get("nome", "Non specificato")
    email = data.get("email", "Non specificata")
    telefono = data.get("telefono", "")
    messaggio = data.get("messaggio", "")
    data_app = data.get("data", "")

    # Determina il titolo in base alla presenza della data
    titolo = "📅 *Nuovo Appuntamento*" if data_app else "📄 *Richiesta Preventivo/Info*"

    text = f"{titolo}\n\n"
    text += f"*Nome:* {nome}\n"
    text += f"*Email:* {email}\n"
    if telefono:
        text += f"*Telefono:* {telefono}\n"
    if data_app:
        text += f"*Data richiesta:* {data_app}\n"
    text += f"\n*Messaggio:*\n{messaggio}\n"

    # Preparazione Link WhatsApp e Email con testi preimpostati
    clean_phone = telefono.replace(" ", "").replace("-", "") if telefono else ""
    wa_text = f"Ciao {nome}, ho ricevuto la tua richiesta dal sito. Come posso aiutarti?"
    wa_url = f"https://wa.me/{clean_phone}?text={urllib.parse.quote(wa_text)}"
    
    mail_subject = "Risposta alla tua richiesta - Laboratorio Roso Marcello"
    mail_body = f"Gentile {nome},\n\nAbbiamo ricevuto la tua richiesta dal sito web.\n\nCordiali saluti,\nLaboratorio Odontotecnico Roso Marcello"
    mail_url = f"mailto:{email}?subject={urllib.parse.quote(mail_subject)}&body={urllib.parse.quote(mail_body)}"
    
    # Aggiungiamo il link email nel testo (i bottoni Telegram non supportano "mailto:")
    text += f"\n[📧 Clicca qui per rispondere via Email]({mail_url})"

    # Creazione Bottoni (Inline Keyboard)
    buttons = []
    if clean_phone:
        buttons.append({"text": "💬 WhatsApp", "url": wa_url})
    
    # Se c'è il telefono, mostriamo il bottone WhatsApp
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "Markdown"
    }
    
    if buttons:
        payload["reply_markup"] = json.dumps({"inline_keyboard": [buttons]})

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    requests.post(url, data=payload)

    return {"status": "ok"}, 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))