import { TeaVariety } from '../types';

/**
 * Normalizes text for robust multi-lingual tea search:
 * - strips diacritics / pinyin tone marks (e.g. Lóng Jǐng -> long jing)
 * - unifies Russian vowels: ё -> е, э -> е (e.g. шен matches шэн, зеленый matches зелёный)
 * - lowercases
 */
export function normalizeTeaText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip tone marks
    .replace(/ё/g, 'е')
    .replace(/э/g, 'е');
}

/**
 * Strips all non-alphanumeric characters for joined phrase search
 * e.g. "Да Хун Пао" -> "дахунпао"
 */
export function cleanTeaChars(str: string): string {
  return normalizeTeaText(str).replace(/[^a-zа-я0-9\u4e00-\u9fa5]/g, '');
}

/**
 * Checks whether a given tea matches the search query.
 *
 * Search criteria:
 * - Russian name (e.g. "Брови Долголетия", "Большой Красный Халат", "Колодец Дракона")
 * - Russian transcription & aliases (e.g. "Шоу Мэй", "Да Хун Пао", "Дахунпао", "Лунцзин", "Шэн Пуэр", "Да И 7262")
 * - Chinese characters (e.g. "老班章", "大红袍", "寿眉")
 * - Pinyin (e.g. "Da Hong Pao", "Long Jing", "Shou Mei")
 * - Type and classification (e.g. "улун", "пуэр", "габа", "белый", "красный", "зеленый")
 * - Factory / Recipe numbers (e.g. "7262", "0532", "7542", "7572", "9978", "8653")
 * - Cultivars and geographic regions (e.g. "Мэнхай", "Уишань", "Алишань", "Иу", "Баньчжан")
 * - Key sensory descriptors (e.g. "шоколад", "камфора", "орхидея", "чернослив", "мед")
 *
 * NOTE: Academic biochemical descriptions (`scientificDescription`) are intentionally excluded
 * to prevent false positives from technical chemical terms (such as "теабровинины" matching "брови",
 * "теарубигины" matching "рубин", "полисахариды" matching "сахар", etc.).
 */
export function matchTeaSearch(tea: TeaVariety, query: string): boolean {
  if (!query || !query.trim()) return true;

  const rawQ = query.trim();
  const normQ = normalizeTeaText(rawQ);
  if (!normQ) return true;

  // Split query into individual search tokens
  const qTokens = normQ.split(/[\s,./\\_\-+;:()«»"'\\[\]]+/).filter(t => t.length > 0);
  if (qTokens.length === 0) return true;

  // Searchable text sources
  const searchFields: string[] = [
    tea.nameRu,
    tea.transcriptionRu || '',
    tea.nameZh || '',
    tea.namePinyin || '',
    tea.typeNameRu,
    tea.origin,
    tea.cultivar,
    ...(tea.keySensoryNotes || []),
    ...(tea.generalExamplesRu || []),
    tea.id
  ];

  // Tokenize tea text into word list for word-prefix and exact-word matching
  const words: string[] = normalizeTeaText(searchFields.join(' '))
    .split(/[\s,./\\_\-+;:()«»"'\\[\]]+/)
    .filter(Boolean);

  // Extract distinct joined aliases for Chinese compound names typed without spaces (e.g. "дахунпао", "лаобаньчжан")
  const joinedAliases: string[] = [
    ...((tea.transcriptionRu || '').split('/')),
    tea.nameRu,
    tea.nameZh || '',
    tea.namePinyin || '',
    ...(tea.generalExamplesRu || [])
  ]
    .map(a => cleanTeaChars(a))
    .filter(Boolean);

  // Every token entered by user must match the tea
  return qTokens.every(tok => {
    const cleanTok = cleanTeaChars(tok);
    if (!cleanTok) return true;

    // 1. Chinese Hanzi characters
    if (/[\u4e00-\u9fa5]/.test(tok)) {
      if ((tea.nameZh || '').includes(tok)) return true;
    }

    // 2. Word prefix / exact word match
    // For very short tokens (<= 2 chars), require exact word match or short word prefix to avoid noise
    const matchesWord = words.some(w => {
      if (cleanTok.length <= 2) {
        return w === tok || (w.length <= 4 && w.startsWith(tok));
      }
      return w.startsWith(tok) || w === tok;
    });
    if (matchesWord) return true;

    // 3. Compacted alias match for joined transliterations (e.g. "дахунпао", "шоумэй", "тегуаньинь")
    const matchesAlias = joinedAliases.some(alias => {
      return (
        alias === cleanTok ||
        alias.startsWith(cleanTok) ||
        (cleanTok.length >= 5 && alias.includes(cleanTok))
      );
    });
    if (matchesAlias) return true;

    return false;
  });
}
