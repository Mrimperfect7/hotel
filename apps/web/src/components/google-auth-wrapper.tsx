'use client';
import { GoogleOAuthProvider } from '@react-oauth/google';

export function GoogleAuthWrapper({ children }: { children: React.ReactNode }) {
  // Use generic mock client ID if environment variable is missing, though login won't succeed in production.
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'mock-client-id-needs-real-one.apps.googleusercontent.com';
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      {children}
    </GoogleOAuthProvider>
  );
}
