import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { format } from "date-fns";

// Fetch coins from DB
export async function fetchCoins(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_ai_balance')
    .select('coins')
    .eq('user_id', userId)
    .single();
  if (error) {
    console.error("Error fetching coins:", error);
    return 0;
  }
  return data?.coins || 0;
}

// Decrement coins via RPC
export async function decrementCoins(userId: string, amount: number = 1): Promise<void> {
  const { error } = await supabase.rpc('decrement_coins', { uid: userId, amount });
  if (error) {
    console.error("Error decrementing coins:", error);
  } else {
    window.dispatchEvent(new CustomEvent('coinsDecremented'));
  }
}

// Hook to use coins and auto-update
export function useCoins(userId: string | null) {
  const [coins, setCoins] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    
    const load = async () => {
      const coinsValue = await fetchCoins(userId);
      setCoins(coinsValue);
    };

    load();

    window.addEventListener('coinsDecremented', () => load());
    return () => window.removeEventListener('coinsDecremented', () => load());
  }, [userId]);

  return coins;
}

export async function getScoreboard(userId: string) {
  const { data, error } = await supabase.rpc("get_top_runs", { uid: userId });
  
  if (error || !data) {
    console.error("Error fetching scoreboard:", error);
    return { scores: [], times: [] };
  }

  const scores = data.map((record: { final_score: number }) => record.final_score);
  const times = data.map((record: { ended_at: string }) => 
    format(new Date(record.ended_at), "MMM d, yyyy HH:mm")
  );
  
  return { scores, times };
}