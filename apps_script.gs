// Google Apps Script: deploy as Web App (Execute as: Me, Who has access: Anyone)
// This accepts a POST with JSON and appends rows to the first sheet.

function doPost(e){
  try{
    const ss = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID'); // replace with your sheet id
    const sheet = ss.getSheets()[0];
    const payload = JSON.parse(e.postData.contents);
    const ts = new Date();
    // Row format: timestamp, event, email, name, extra
    const row = [ts.toISOString(), payload.event||'', payload.email||'', payload.name||'', JSON.stringify(payload)];
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }catch(err){
    return ContentService.createTextOutput(JSON.stringify({success:false,error:String(err)})).setMimeType(ContentService.MimeType.JSON);
  }
}
