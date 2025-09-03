import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import axios from 'axios';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
  }
  const userId = user.id;

  if (!code) {
    return NextResponse.json({ error: 'Authorization code not found.' }, { status: 400 });
  }

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/callback/google',
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in } = response.data;

    // Encrypt and store tokens in Supabase Vault or a secure table
    // This is a conceptual example. Use Supabase Vault for production.
    const { error } = await supabase
      .from('user_service_connections')
      .upsert({
        user_id: userId,
        service: 'google',
        access_token: access_token, // Encrypt this value
        refresh_token: refresh_token, // Encrypt this value
        expires_at: new Date(Date.now() + expires_in * 1000),
      });

    if (error) {
      throw error;
    }

    // Redirect user to a success page
    return NextResponse.redirect(new URL('/connections/success?service=google', request.url));

  } catch (error) {
    console.error('Error exchanging Google auth code:', error);
    return NextResponse.json({ error: 'Failed to authenticate with Google.' }, { status: 500 });
  }
}
