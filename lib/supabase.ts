import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Same Supabase project the web app (uni-nest-market) uses.
// Set these in a .env file (see .env.example) and load them with
// EXPO_PUBLIC_ prefixes so they're available at build time.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    "[Supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
      "Copy .env.example to .env and fill in the values from your Supabase project.",
  );
}

// expo-secure-store has a 2048 byte value limit per key, but Supabase session
// objects can be larger, so we chunk long values across multiple SecureStore
// keys instead of reaching for AsyncStorage (which is unencrypted).
const CHUNK_SIZE = 1800;

const ChunkedSecureStore = {
  async getItem(key: string) {
    const chunkCountRaw = await SecureStore.getItemAsync(`${key}_chunks`);
    if (!chunkCountRaw) return SecureStore.getItemAsync(key);
    const chunkCount = Number(chunkCountRaw);
    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, i) => SecureStore.getItemAsync(`${key}_${i}`)),
    );
    return chunks.every((c) => c !== null) ? chunks.join("") : null;
  },
  async setItem(key: string, value: string) {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      await SecureStore.deleteItemAsync(`${key}_chunks`);
      return;
    }
    const chunks = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) chunks.push(value.slice(i, i + CHUNK_SIZE));
    await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(`${key}_${i}`, c)));
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunks.length));
  },
  async removeItem(key: string) {
    const chunkCountRaw = await SecureStore.getItemAsync(`${key}_chunks`);
    if (chunkCountRaw) {
      const chunkCount = Number(chunkCountRaw);
      await Promise.all(Array.from({ length: chunkCount }, (_, i) => SecureStore.deleteItemAsync(`${key}_${i}`)));
      await SecureStore.deleteItemAsync(`${key}_chunks`);
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const options: SupabaseClientOptions<"public"> = {
  auth: {
    storage: ChunkedSecureStore,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, options);
