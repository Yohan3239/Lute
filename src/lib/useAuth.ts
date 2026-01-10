import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

declare global {
  interface Window {
    authAPI: {
      onOAuthCallback(arg0: (url: any) => Promise<void>): unknown;
      openExternal: (url: string) => Promise<void>;
    };
  }
}
export const listenForOAuth = () => {
  window.authAPI.onOAuthCallback(async (url) => {
    console.log("OAuth callback received:", url);
    try {
      new URL(url);
    } catch (error) {
      console.error("Invalid URL received in OAuth callback:", url);
      return;
    }
    const code = new URL(url).searchParams.get("code");
    if (!code) {
      console.error("No code found in OAuth callback URL");
      return;
    }
    await supabase.auth.exchangeCodeForSession(code);
  });
};

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Only call getSession once - it contains the user data
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserId(data.session?.user.id ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const isDevEnv = import.meta.env.DEV;
    // For web: this works directly.
    // For Electron: you may need an external browser + deep link later.
    const {data, error} = await supabase.auth.signInWithOAuth({ 
      provider: "google", 
      options: { 
        redirectTo: isDevEnv ? "http://localhost:5173/#/auth-callback" : "lute://auth-callback", 
        skipBrowserRedirect: !isDevEnv,
        queryParams: {
          prompt: 'select_account' // Force account picker
        }
      } 
    });
    if (error) {
      console.error("Error during sign-in:", error);
    }
    else if (data.url && !isDevEnv) {
      await window.authAPI.openExternal(data.url);
  };
  }


  const signOut = async () => supabase.auth.signOut();

  return { user, userId, loading, signInWithGoogle, signOut };

}
