import { google } from 'googleapis';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

export async function readSheetCells(sheetId: string, refs: string[]): Promise<{ ref: string; value: string }[]> {
  if (refs.length === 0) return [];

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: sheetId,
    ranges: refs,
  });

  return (response.data.valueRanges ?? []).map((vr, i) => ({
    ref: refs[i],
    value: vr.values?.[0]?.[0]?.toString() ?? '',
  }));
}

export async function deleteSheet(sheetId: string): Promise<void> {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  try {
    await drive.files.delete({ fileId: sheetId });
  } catch (err: any) {
    if (err?.status === 404 || err?.code === 404) return;
    throw err;
  }
}
