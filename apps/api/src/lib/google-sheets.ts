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

export function extractSheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? urlOrId;
}

export async function createCandidateSheet(templateSheetId: string): Promise<{ sheetId: string; sheetUrl: string }> {
  const auth = getAuth();
  const drive = google.drive({ version: 'v3', auth });

  const copy = await drive.files.copy({
    fileId: templateSheetId,
    requestBody: { name: `Candidate Assessment - ${new Date().toISOString()}` },
  });
  const sheetId = copy.data.id!;

  await drive.permissions.create({
    fileId: sheetId,
    requestBody: { type: 'anyone', role: 'writer' },
  });

  return {
    sheetId,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
  };
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
