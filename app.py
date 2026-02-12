from flask import Flask, request
import requests
import os

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

    text = f"📩 *Nuova richiesta dal sito*\n\n"
    text += f"*Nome:* {nome}\n*Email:* {email}\n"
    if telefono:
        text += f"*Telefono:* {telefono}\n"
    if data_app:
        text += f"*Appuntamento:* {data_app}\n"
    text += f"*Messaggio:* {messaggio}\n\n"
    text += f"[Chat WhatsApp](https://wa.me/{telefono}) | [Invia Email](mailto:{email})"

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    requests.post(url, data={"chat_id": TELEGRAM_CHAT_ID, "text": text, "parse_mode": "Markdown"})

    return {"status": "ok"}, 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))