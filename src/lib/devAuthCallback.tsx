import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function devAuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL parameters
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) {
          setError("No authentication code found");
          return;
        }

        // Exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          setError(error.message);
          console.error("Error exchanging code:", error);
          return;
        }

        // Redirect to home on success
        window.location.href = "/";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Auth callback error:", err);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex items-center justify-center h-full">
      {error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : (
        <div>Signing you in, yohan...</div>
      )}
    </div>
  );
}
