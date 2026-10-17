import { requestUrl } from "obsidian";

export interface Pronunciation {
  ipa?: string;
  pos?: string;
}

const cache = new Map<string, Promise<Pronunciation>>();

/** Tra IPA + từ loại từ Free Dictionary API khi note không ghi sẵn. Lỗi mạng thì trả về rỗng. */
export function lookupPronunciation(word: string): Promise<Pronunciation> {
  const key = word.toLowerCase();
  let result = cache.get(key);
  if (!result) {
    result = fetchPronunciation(key);
    cache.set(key, result);
  }
  return result;
}

async function fetchPronunciation(word: string): Promise<Pronunciation> {
  try {
    const res = await requestUrl({
      url: `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      throw: false,
    });
    if (res.status !== 200) return {};
    const entry = res.json?.[0];
    const ipa = entry?.phonetic || entry?.phonetics?.find((p: { text?: string }) => p.text)?.text;
    return { ipa, pos: entry?.meanings?.[0]?.partOfSpeech };
  } catch {
    return {};
  }
}

/** Đọc từ bằng giọng tiếng Anh có sẵn của hệ điều hành */
export function speak(word: string) {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}
