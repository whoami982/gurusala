const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

let client = null;

function loadCredentials() {
  if (process.env.GOOGLE_CREDENTIALS_FILE) {
    try {
      const filePath = path.resolve(__dirname, '..', process.env.GOOGLE_CREDENTIALS_FILE.replace('./', ''));
      const creds = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      console.log('✅ Credentials loaded from file');
      return creds;
    } catch (e) {
      console.error('❌ Failed to read credentials file:', e.message);
      return null;
    }
  }
  if (process.env.GOOGLE_CREDENTIALS) {
    try {
      const raw = process.env.GOOGLE_CREDENTIALS.trim().replace(/^\uFEFF/, '');
      return JSON.parse(raw);
    } catch { return null; }
  }
  return null;
}

async function getClient() {
  if (client) return client;
  if (!process.env.GOOGLE_SHEET_ID) return null;
  const creds = loadCredentials();
  if (!creds) return null;
  try {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    client = google.sheets({ version: 'v4', auth: await auth.getClient() });
    console.log('✅ Google Sheets connected as:', creds.client_email);
    return client;
  } catch (e) {
    console.error('❌ Google auth failed:', e.message);
    return null;
  }
}

async function appendRow(tab, values) {
  const sheets = await getClient();
  if (!sheets) return false;
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${tab}!A:Z`,
      valueInputOption: 'RAW',
      resource: { values: [values] }
    });
    console.log(`✅ Row written to "${tab}" tab`);
    return true;
  } catch (e) {
    console.error('❌ Sheet write failed:', e.message);
    if (e.message.includes('Unable to parse range')) console.error(`   → Make sure sheet has a tab named "${tab}"`);
    if (e.message.includes('403')) console.error('   → Share the sheet with the service account email');
    return false;
  }
}

async function readRows(tab) {
  const sheets = await getClient();
  if (!sheets) return [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${tab}!A:Z`
    });
    const rows = res.data.values || [];
    return rows.length < 2 ? [] : rows.slice(1);
  } catch { return []; }
}

async function updateRow(tab, rowIndex, values) {
  const sheets = await getClient();
  if (!sheets) return false;
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${tab}!A${rowIndex + 2}:Z${rowIndex + 2}`,
      valueInputOption: 'RAW',
      resource: { values: [values] }
    });
    return true;
  } catch { return false; }
}

module.exports = { appendRow, readRows, updateRow };
