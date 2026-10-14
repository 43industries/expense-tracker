import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore values should stay under ~2 KB, but a Supabase session (access + refresh
// token + user) is usually bigger, so it is split across several keys.
const CHUNK_SIZE = 1800;

const countKey = (key: string) => `${key}.count`;
const chunkKey = (key: string, i: number) => `${key}.${i}`;

async function removeItem(key: string): Promise<void> {
  const count = Number(await SecureStore.getItemAsync(countKey(key)));
  await Promise.all(
    Array.from({ length: count || 0 }, (_, i) => SecureStore.deleteItemAsync(chunkKey(key, i))),
  );
  await SecureStore.deleteItemAsync(countKey(key));
}

async function getItem(key: string): Promise<string | null> {
  const count = Number(await SecureStore.getItemAsync(countKey(key)));
  if (!count) return null;
  const chunks = await Promise.all(
    Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(chunkKey(key, i))),
  );
  if (chunks.some((c) => c === null)) return null;
  return chunks.join('');
}

async function setItem(key: string, value: string): Promise<void> {
  await removeItem(key);
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK_SIZE) {
    chunks.push(value.slice(i, i + CHUNK_SIZE));
  }
  await Promise.all(chunks.map((c, i) => SecureStore.setItemAsync(chunkKey(key, i), c)));
  await SecureStore.setItemAsync(countKey(key), String(chunks.length));
}

// SecureStore has no web implementation; browsers only offer localStorage.
const webStorage = {
  getItem: async (key: string) =>
    typeof localStorage === 'undefined' ? null : localStorage.getItem(key),
  setItem: async (key: string, value: string) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  },
};

export const secureStorage =
  Platform.OS === 'web' ? webStorage : { getItem, setItem, removeItem };
