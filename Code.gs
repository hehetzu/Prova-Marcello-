// Code.gs

// Nomi dei fogli
var SHEET_APPUNTAMENTI = "Appuntamenti";
var SHEET_PREVENTIVI = "Preventivi";

function doGet(e) {
  var params = e.parameter;
  
  // Controllo disponibilità per il calendario del sito: ?date=dd/mm/yyyy
  if (params.date) {
    return checkAvailability(params.date);
  }
  
  return ContentService.createTextOutput(JSON.stringify({status: "alive", message: "Google Script attivo"}))
    .setMimeType(ContentService.MimeType.JSON);
}
765
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // Aspetta fino a 10 secondi per evitare conflitti di scrittura
  } catch (e) {
    return responseJSON("error", "Server occupato, riprova tra qualche secondo.");
  }

  try {
    var data;
    var ss = SpreadsheetApp.getActiveSpreadsheet(); // Definiamo ss qui
    
    // Gestione JSON (da Python/Bot) o Form Data (dal Sito)
    if (e.postData && e.postData.type == "application/json") {
      try {
        data = JSON.parse(e.postData.contents);
      } catch(err) {
        data = e.parameter; // Fallback
      }
    } else {
      data = e.parameter;
    }

    // --- AZIONE: TRACKING VISITE (Counter Semplificato) ---
    // Lo mettiamo qui all'inizio per intercettare subito questa azione specifica
    if (data.action == "track_visit") {
      var sheetVisite = ss.getSheetByName("Visite");
      if (!sheetVisite) {
        sheetVisite = ss.insertSheet("Visite");
        sheetVisite.getRange("A1").setValue("TOTALE VISITE:");
        sheetVisite.getRange("B1").setValue(0);
        sheetVisite.getRange("A1:B1").setFontWeight("bold").setFontSize(14);
      }
      
      var cell = sheetVisite.getRange("B1");
      cell.setValue((Number(cell.getValue()) || 0) + 1);
      
      return responseJSON("success", "Visita contata");
    }

    var sheetApp = ss.getSheetByName(SHEET_APPUNTAMENTI);
    var sheetPrev = ss.getSheetByName(SHEET_PREVENTIVI);

    // Se i fogli non esistono, li crea automaticamente (Setup iniziale)
    if (!sheetApp) {
      sheetApp = ss.insertSheet(SHEET_APPUNTAMENTI);
      // Intestazioni: A=Timestamp, B=Nome, C=Email, D=Telefono, E=Data, F=Ora, G=Stato, H=Messaggio, I=Tipo
      sheetApp.appendRow(["Timestamp", "Nome", "Email", "Telefono", "Data", "Ora", "Stato", "Messaggio", "Tipo"]);
    }
    if (!sheetPrev) {
      sheetPrev = ss.insertSheet(SHEET_PREVENTIVI);
      sheetPrev.appendRow(["Timestamp", "Nome", "Email", "Telefono", "Messaggio", "Tipo"]);
    }

    // --- AZIONE: CANCELLA RIGA (Per i test automatici) ---
    if (data.action == "delete_row") {
      return deleteRow(sheetApp, data.date, data.time);
    }

    // --- AZIONE: AGGIORNA STATO (Dal Bot Telegram) ---
    if (data.action == "update_status") {
      return updateStatus(sheetApp, data.date, data.time, data.status);
    }

    // --- AZIONE: NUOVA PRENOTAZIONE / PREVENTIVO (Dal Sito) ---
    var tipo = data.tipo_richiesta || "preventivo";

    if (tipo == "appuntamento") {
      var date = data.data_appuntamento;
      var time = data.ora_appuntamento;

      // 1. Controllo Doppia Prenotazione
      if (isBooked(sheetApp, date, time)) {
        return responseJSON("error", "Orario " + time + " del " + date + " già occupato.");
      }

      // 2. Salvataggio Appuntamento
      // Nota: Aggiungiamo l'apice "'" davanti a data e ora per forzare il formato testo ed evitare conversioni automatiche di Google
      sheetApp.appendRow([
        new Date(),
        data.name,
        data.email,
        data.phone || data.telefono,
        "'" + date, 
        "'" + time,
        "In Attesa", // Stato iniziale
        data.message,
        tipo
      ]);

      return responseJSON("success", "Appuntamento richiesto con successo");

    } else {
      // Salvataggio Preventivo
      sheetPrev.appendRow([
        new Date(),
        data.name,
        data.email,
        data.phone || data.telefono,
        data.message,
        tipo
      ]);
      return responseJSON("success", "Richiesta preventivo salvata");
    }

  } catch (err) {
    return responseJSON("error", "Errore interno script: " + err.toString());
  } finally {
    lock.releaseLock();
  }
}

// --- FUNZIONI DI SUPPORTO ---

function responseJSON(result, message, extra) {
  var payload = {
    result: result,
    message: message
  };
  if (extra) {
    for (var key in extra) {
      payload[key] = extra[key];
    }
  }
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function isBooked(sheet, dateStr, timeStr) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  
  // Prende colonna E (Data), F (Ora), G (Stato) -> Indici relativi 0, 1, 2
  var data = sheet.getRange(2, 5, lastRow - 1, 3).getValues(); 
  
  for (var i = 0; i < data.length; i++) {
    var rowDate = String(data[i][0]).replace(/'/g, "").trim();
    var rowTime = String(data[i][1]).replace(/'/g, "").trim();
    var rowStatus = String(data[i][2]);

    // Se data e ora coincidono e NON è stato rifiutato, allora è occupato
    if (rowDate == dateStr && rowTime == timeStr && rowStatus != "Rifiutato") {
      return true;
    }
  }
  return false;
}

function updateStatus(sheet, dateStr, timeStr, newStatus) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return responseJSON("error", "Nessun dato trovato");

  var range = sheet.getRange(2, 5, lastRow - 1, 3); // Col E, F, G
  // Get all data to retrieve client info
  var allDataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  var allData = allDataRange.getValues();

  for (var i = 0; i < allData.length; i++) {
    var rowDate = String(allData[i][4]).replace(/'/g, "").trim(); // Colonna E (Data)
    var rowTime = String(allData[i][5]).replace(/'/g, "").trim(); // Colonna F (Ora)

    if (rowDate == dateStr && rowTime == timeStr) {
      // Aggiorna la colonna G (Stato) che è la colonna 7
      sheet.getRange(i + 2, 7).setValue(newStatus);
      
      var clientName = allData[i][1];  // Colonna B (Nome)
      var clientEmail = allData[i][2]; // Colonna C (Email)

      // Restituisce i dati del cliente nel JSON di successo
      return responseJSON("success", "Stato aggiornato a " + newStatus, {
        clientName: clientName,
        clientEmail: clientEmail
      });
    }
  }

  return responseJSON("error", "Prenotazione non trovata per " + dateStr + " " + timeStr);
}

function deleteRow(sheet, dateStr, timeStr) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return responseJSON("success", "Foglio già vuoto");

  var data = sheet.getRange(2, 5, lastRow - 1, 2).getValues(); // Col E, F
  var deleted = false;
  
  // Iteriamo al contrario per cancellare senza sballare gli indici
  for (var i = data.length - 1; i >= 0; i--) {
    var rowDate = String(data[i][0]).replace(/'/g, "").trim();
    var rowTime = String(data[i][1]).replace(/'/g, "").trim();
    
    // Normalizzazione per confronto date (es. toglie zeri iniziali se necessario)
    var normalizedRowDate = rowDate.replace(/^0/, "").replace(/\/0/g, "/");
    var normalizedInputDate = dateStr.replace(/^0/, "").replace(/\/0/g, "/");

    if ((rowDate == dateStr || normalizedRowDate == normalizedInputDate) && rowTime == timeStr) {
      sheet.deleteRow(i + 2);
      deleted = true;
    }
  }
  
  return responseJSON("success", deleted ? "Riga eliminata" : "Nessuna riga trovata da eliminare");
}

function checkAvailability(dateStr) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_APPUNTAMENTI);
  if (!sheet) return responseJSON("success", "Sheet not found", {bookedSlots: []});

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return responseJSON("success", "Empty", {bookedSlots: []});

  var data = sheet.getRange(2, 5, lastRow - 1, 3).getValues(); // E, F, G
  var booked = [];

  for (var i = 0; i < data.length; i++) {
    var rowDate = String(data[i][0]).replace(/'/g, "").trim();
    var rowTime = String(data[i][1]).replace(/'/g, "").trim();
    var rowStatus = String(data[i][2]);

    if (rowDate == dateStr && rowStatus != "Rifiutato") {
      booked.push({
        time: rowTime,
        status: (rowStatus == "Confermato" ? "confirmed" : "pending")
      });
    }
  }
  
  return responseJSON("success", "Slots retrieved", {bookedSlots: booked});
}