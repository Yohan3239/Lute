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

export async function TopupCoins(userId: string, amount: number) {
  if (!await canClaimMonthlyReward(userId)) return;

  const { error } = await supabase.rpc('topup_coins', { uid: userId, amount });
  if (error) {
    console.error("Error topping up coins:", error);
  } else {
    console.log((`Topped up ${amount} coins for user ${userId}`));
    window.dispatchEvent(new CustomEvent('coinsDecremented'));
  }
}

async function canClaimMonthlyReward(userId: string): Promise<boolean> {
  const today = new Date();
  
  // Only allow claiming on the first of the month
  if (today.getDate() !== 1) {
    return false;
  }
  
  const { data: lastClaimDateRecord, error } = await supabase.from('user_ai_balance').select('last_refill').eq('user_id', userId).single();
  if (error) {
    console.error("Error fetching last refill date:", error);
    return false;
  }
  const lastClaimDate = lastClaimDateRecord?.last_refill;
  
  if (!lastClaimDate) {
    return true; // First time claiming
  }
  
  // Parse the timestamp and compare dates
  const lastClaimDateObj = new Date(lastClaimDate);
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const lastClaimString = `${lastClaimDateObj.getUTCFullYear()}-${String(lastClaimDateObj.getUTCMonth() + 1).padStart(2, '0')}-${String(lastClaimDateObj.getUTCDate()).padStart(2, '0')}`;
  
  // Only allow if last claim was on a different day
  return lastClaimString !== todayString;
}

export async function getIsProUser(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('get_is_pro', { uid: userId });
  if (error) {
    console.error("Error fetching pro status:", error);
    return false;
  }
  return data || false;
}