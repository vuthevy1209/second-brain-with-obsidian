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

/** Nghỉ giữa 2 lượt đọc lặp lại */
const LOOP_PAUSE_MS = 900;
/** Tăng mỗi lần dừng đọc, để vòng đọc lặp cũ biết mình đã bị huỷ */
let loopId = 0;

/** Dừng mọi thứ đang đọc, kể cả vòng đọc lặp lại */
export function stopSpeaking() {
  loopId++;
  speechSynthesis.cancel();
}

/** Đọc từ bằng giọng tiếng Anh có sẵn của hệ điều hành */
export function speak(word: string) {
  stopSpeaking();
  speechSynthesis.speak(utterance(word, "en-US"));
}

/**
 * Đọc câu tiếng Anh rồi câu dịch tiếng Việt, lặp lại liên tục cho tới khi
 * gọi stopSpeaking() hoặc speak()/speakLoop() lần khác (Gõ nâng cao).
 */
export function speakLoop(english: string, vietnamese: string) {
  stopSpeaking();
  const id = loopId;
  const parts = [utterance(english, "en-US"), ...(vietnamese ? [utterance(vietnamese, "vi-VN")] : [])];
  const play = (i: number) => {
    if (id !== loopId) return;
    if (i === parts.length) {
      window.setTimeout(() => play(0), LOOP_PAUSE_MS);
      return;
    }
    // Bị huỷ thì cancel() bắn error/end; kiểm tra loopId ở đầu play() để dừng vòng lặp
    parts[i].onend = () => play(i + 1);
    parts[i].onerror = () => id === loopId && play(i + 1);
    speechSynthesis.speak(parts[i]);
  };
  play(0);
}

function utterance(text: string, lang: string): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.9;
  return u;
}
