const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export function getGoogleAuthUrl(callbackUrl: string, state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCodeForUser(code: string, callbackUrl: string): Promise<GoogleUser> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json() as any;
  if (!tokens.access_token) throw new Error(`OAuth token exchange failed: ${tokens.error_description ?? tokens.error}`);

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const u = await userRes.json() as any;
  return { id: u.id, email: u.email, name: u.name ?? u.email, picture: u.picture };
}
