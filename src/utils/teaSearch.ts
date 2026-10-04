import { TeaVariety } from '../types';

/**
 * Normalizes text for multi-lingual tea search:
 * - strips diacritics / pinyin tone marks (e.g. Lóng Jǐng -> long jing)
 * - unifies Russian vowels: ё -> е, э -> е
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
 * e.g. "Да Хун Пао" -> "дахунпао", "Те Гуань Инь" -> "тегуаньинь"
 */
export function cleanTeaChars(str: string): string {
  return normalizeTeaText(str).replace(/[^a-zа-я0-9\u4e00-\u9fa5]/g, '');
}

/**
 * Phonetic vowel and consonant reducer for Russian & Pinyin tea names:
 * Tolerates:
 * - Unstressed / wrong vowels: о <-> а <-> я (e.g. "дохунпао" <-> "дахунпао", "поэр" <-> "пуэр")
 * - Front vowels: е <-> э <-> и <-> ы (e.g. "шен" <-> "шэн", "тегуанинь" <-> "тигуанинь", "пуер" <-> "пуэр")
 * - High vowels: у <-> ю
 * - Dropped or added soft/hard signs: ь, ъ (e.g. "тегуанинь" <-> "тегуаньинь", "даньцун" <-> "данцун")
 * - j / i interchange: й <-> и (e.g. "шоу мей" <-> "шоу мэй", "дянь хун" <-> "дян хун")
 * - Double consonants: нн -> н, сс -> с
 * - Sibilant and affricate phonetic variations: цз <-> з, ш <-> щ, чж <-> ч
 */
export function phoneticVowelReduce(str: string): string {
  if (!str) return '';
  return cleanTeaChars(str)
    .replace(/[оая]/g, 'а')
    .replace(/[еиы]/g, 'и')
    .replace(/[ую]/g, 'у')
    .replace(/[ьъ]/g, '')
    .replace(/й/g, 'и')
    .replace(/цз/g, 'з')
    .replace(/чж/g, 'ч')
    .replace(/щ/g, 'ш')
    .replace(/(.)\1+/g, '$1');
}

/**
 * Damerau-Levenshtein distance:
 * Calculates edit distance supporting insertions, deletions, substitutions,
 * and transpositions of adjacent characters (e.g. "лнуцзин" vs "лунцзин").
 */
export function damerauLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const la = a.length;
  const lb = b.length;

  if (Math.abs(la - lb) > 3) return Math.abs(la - lb);

  const dp: number[][] = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
      // transposition of adjacent characters
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }

  return dp[la][lb];
}

export interface ParsedSearchQuery {
  rawQ: string;
  normQ: string;
  compactQuery: string;
  phonCompactQuery: string;
  tokens: {
    tok: string;
    cleanTok: string;
    phonTok: string;
    isHanzi: boolean;
    len: number;
    maxDist: number;
  }[];
}

const parsedQueryCache = new Map<string, ParsedSearchQuery | null>();

export function parseSearchQuery(query: string): ParsedSearchQuery | null {
  if (!query || !query.trim()) return null;
  const cached = parsedQueryCache.get(query);
  if (cached !== undefined) return cached;

  const rawQ = query.trim();
  const normQ = normalizeTeaText(rawQ);
  if (!normQ) {
    parsedQueryCache.set(query, null);
    return null;
  }

  const qTokens = normQ.split(/[\s,./\\_\-+;:()«»"'\\[\]]+/).filter(t => t.length > 0);
  if (qTokens.length === 0) {
    parsedQueryCache.set(query, null);
    return null;
  }

  const compactQuery = cleanTeaChars(rawQ);
  const phonCompactQuery = phoneticVowelReduce(rawQ);

  const tokens = qTokens.map(tok => {
    const cleanTok = cleanTeaChars(tok);
    const phonTok = phoneticVowelReduce(cleanTok);
    const isHanzi = /[\u4e00-\u9fa5]/.test(tok);
    const len = cleanTok.length;
    const maxDist = len >= 8 ? 2 : 1;
    return { tok, cleanTok, phonTok, isHanzi, len, maxDist };
  }).filter(t => t.cleanTok.length > 0 || t.isHanzi);

  if (tokens.length === 0) {
    parsedQueryCache.set(query, null);
    return null;
  }

  // Keep cache small
  if (parsedQueryCache.size > 100) {
    parsedQueryCache.clear();
  }

  const result: ParsedSearchQuery = { rawQ, normQ, compactQuery, phonCompactQuery, tokens };
  parsedQueryCache.set(query, result);
  return result;
}

/**
 * Checks whether a single search token matches a target word.
 * Typo tolerance is strictly limited to words of similar length to prevent
 * accidental matching of unrelated long words.
 */
export function matchTokenAgainstWord(token: string, word: string): boolean {
  if (!token || !word) return false;

  const cleanTok = cleanTeaChars(token);
  const cleanWord = cleanTeaChars(word);
  if (!cleanTok || !cleanWord) return false;

  // 1. Exact match
  if (cleanWord === cleanTok) return true;

  // 1-character tokens: strictly exact match to avoid matching random vowels
  if (cleanTok.length === 1) {
    return false;
  }

  // 2-character tokens: prefix match only on short words (<= 4 chars)
  if (cleanTok.length === 2) {
    return cleanWord.startsWith(cleanTok) && cleanWord.length <= 4;
  }

  // 2. Prefix match for tokens >= 3 chars
  if (cleanWord.startsWith(cleanTok)) return true;

  // 3. Phonetic vowel-reduced match (accounts for wrong vowels, soft signs, unstressed reduction)
  const phonTok = phoneticVowelReduce(cleanTok);
  const phonWord = phoneticVowelReduce(cleanWord);
  if (phonWord === phonTok || (phonTok.length >= 3 && phonWord.startsWith(phonTok))) {
    return true;
  }

  // 4. Damerau-Levenshtein typo tolerance: strictly for full words of similar length
  const lenDiff = Math.abs(cleanWord.length - cleanTok.length);
  const maxDist = cleanTok.length >= 8 ? 2 : 1;
  if (cleanTok.length >= 4 && lenDiff <= maxDist) {
    if (damerauLevenshtein(cleanTok, cleanWord) <= maxDist) return true;
    if (damerauLevenshtein(phonTok, phonWord) <= maxDist) return true;
  }

  return false;
}

export interface PrecomputedSearchIndex {
  searchFieldsJoined: string;
  phoneticFieldsJoined: string;
  words: string[];
  phoneticWords: string[];
  joinedAliases: string[];
  phoneticAliases: string[];
  nameZh: string;
}

const teaIndexCache = new WeakMap<TeaVariety, PrecomputedSearchIndex>();

export function getTeaSearchIndex(tea: TeaVariety): PrecomputedSearchIndex {
  let idx = teaIndexCache.get(tea);
  if (idx) return idx;

  const searchFields: string[] = [
    tea.nameRu,
    tea.transcriptionRu || '',
    tea.nameZh || '',
    tea.namePinyin || '',
    tea.typeNameRu,
    tea.origin,
    tea.cultivar,
    ...(tea.generalExamplesRu || []),
    tea.id
  ];

  const rawJoined = searchFields.join(' ');
  const normJoined = normalizeTeaText(rawJoined);
  const phonJoined = phoneticVowelReduce(rawJoined);

  const rawWords = normJoined
    .split(/[\s,./\\_\-+;:()«»"'\\[\]]+/)
    .map(w => cleanTeaChars(w))
    .filter(w => w.length > 0);
  const words = Array.from(new Set(rawWords));
  const phoneticWords = words.map(w => phoneticVowelReduce(w));

  const rawAliases = [
    ...((tea.transcriptionRu || '').split('/')),
    tea.nameRu,
    tea.nameZh || '',
    tea.namePinyin || '',
    tea.id,
    ...(tea.generalExamplesRu || [])
  ]
    .map(a => cleanTeaChars(a))
    .filter(Boolean);
  const joinedAliases = Array.from(new Set(rawAliases));
  const phoneticAliases = joinedAliases.map(a => phoneticVowelReduce(a));

  idx = {
    searchFieldsJoined: normJoined,
    phoneticFieldsJoined: phonJoined,
    words,
    phoneticWords,
    joinedAliases,
    phoneticAliases,
    nameZh: tea.nameZh || ''
  };

  teaIndexCache.set(tea, idx);
  return idx;
}

/**
 * Checks whether a given tea matches the search query.
 *
 * Fully supports:
 * - Typo tolerance & character transpositions (e.g. "лнуцзин" -> "лунцзин", "пуре" -> "пуэр")
 * - Wrong vowels & phonetic reduction (e.g. "дохунпао" -> "дахунпао", "поэр" -> "пуэр", "тягуаньинь" -> "тегуаньинь")
 * - Missing / extra soft signs (e.g. "тегуанинь" -> "тегуаньинь", "даньцун" -> "данцун")
 * - Joined vs spaced vs hyphenated writing:
 *   e.g. "дахунпао", "да хун пао", "да-хун-пао", "байхаоиньчжэнь", "шупуэр", "лаобаньчжан"
 * - Chinese Hanzi characters & Pinyin (e.g. "大红袍", "Da Hong Pao", "Tie Guan Yin")
 * - Factory / Recipe numbers (e.g. "7572", "7542", "7262", "0532", "8653")
 * - Cultivars, regions, tea classifications ("улун", "пуэр", "зеленый", "белый", "красный", "хэй ча")
 */
export function matchTeaSearch(tea: TeaVariety, query: string): boolean {
  if (!query || !query.trim()) return true;

  const parsed = parseSearchQuery(query);
  if (!parsed) return true;

  const index = getTeaSearchIndex(tea);

  // 1. Ultra-fast direct full-query match
  if (index.searchFieldsJoined.includes(parsed.normQ)) {
    return true;
  }

  // 2. Fast joined alias match (e.g. "дахунпао", "тегуаньинь")
  if (parsed.compactQuery.length >= 4) {
    const cLen = parsed.compactQuery.length;
    const maxDist = cLen >= 8 ? 2 : 1;
    for (let i = 0; i < index.joinedAliases.length; i++) {
      const alias = index.joinedAliases[i];
      if (alias.includes(parsed.compactQuery)) return true;

      const phonAlias = index.phoneticAliases[i];
      if (phonAlias.includes(parsed.phonCompactQuery)) return true;

      if (Math.abs(alias.length - cLen) <= maxDist) {
        if (damerauLevenshtein(parsed.compactQuery, alias) <= maxDist) return true;
        if (damerauLevenshtein(parsed.phonCompactQuery, phonAlias) <= maxDist) return true;
      }
    }
  }

  // 3. Token-by-token matching: Every token in the user's query must match at least one element of the tea
  for (let t = 0; t < parsed.tokens.length; t++) {
    const { tok, cleanTok, phonTok, isHanzi, len, maxDist } = parsed.tokens[t];

    // Fast check: direct substring in normalized fields
    if (len >= 3 && index.searchFieldsJoined.includes(cleanTok)) {
      continue;
    }

    // Chinese Hanzi character match
    if (isHanzi && index.nameZh.includes(tok)) {
      continue;
    }

    // Fast check: phonetic substring in phonetic fields
    if (phonTok.length >= 3 && index.phoneticFieldsJoined.includes(phonTok)) {
      continue;
    }

    // Word-level prefix & fuzzy match
    let tokenMatched = false;
    for (let i = 0; i < index.words.length; i++) {
      const w = index.words[i];
      if (w === cleanTok) { tokenMatched = true; break; }
      if (len >= 3 && w.startsWith(cleanTok)) { tokenMatched = true; break; }

      const pw = index.phoneticWords[i];
      if (pw === phonTok) { tokenMatched = true; break; }
      if (phonTok.length >= 3 && pw.startsWith(phonTok)) { tokenMatched = true; break; }

      // Typo tolerance: strictly for full words of similar length
      const lenDiff = Math.abs(w.length - len);
      if (len >= 4 && lenDiff <= maxDist) {
        if (damerauLevenshtein(cleanTok, w) <= maxDist || damerauLevenshtein(phonTok, pw) <= maxDist) {
          tokenMatched = true;
          break;
        }
      }
    }
    if (tokenMatched) continue;

    // Compacted alias match
    for (let i = 0; i < index.joinedAliases.length; i++) {
      const alias = index.joinedAliases[i];
      if (alias === cleanTok || alias.startsWith(cleanTok)) { tokenMatched = true; break; }
      if (len >= 4 && alias.includes(cleanTok)) { tokenMatched = true; break; }

      const phonAlias = index.phoneticAliases[i];
      if (phonAlias.includes(phonTok)) { tokenMatched = true; break; }

      if (Math.abs(alias.length - len) <= maxDist && damerauLevenshtein(cleanTok, alias) <= maxDist) {
        tokenMatched = true;
        break;
      }
    }

    if (!tokenMatched) {
      return false;
    }
  }

  return true;
}

export interface SensoryCategoryGroup {
  id: string;
  nameRu: string;
  icon: string;
  popularTags: string[];
}

export const POPULAR_SENSORY_GROUPS: SensoryCategoryGroup[] = [
  {
    id: 'honey_sweet',
    nameRu: 'Медовые & Сладкие',
    icon: '🍯',
    popularTags: ['мёд', 'карамель', 'патока', 'тростниковый сахар', 'кленовый сироп', 'финик', 'изюм']
  },
  {
    id: 'floral',
    nameRu: 'Цветочные & Орхидейные',
    icon: '🌸',
    popularTags: ['орхидея', 'жасмин', 'гардения', 'сирень', 'белые цветы', 'лилия', 'пион', 'роза', 'османтус']
  },
  {
    id: 'fruity',
    nameRu: 'Фруктовые & Ягодные',
    icon: '🍑',
    popularTags: ['персик', 'абрикос', 'слива', 'яблоко', 'виноград', 'манго', 'вишня', 'инжир', 'земляника', 'чернослив', 'цитрус']
  },
  {
    id: 'chocolate_nutty',
    nameRu: 'Шоколадно-Ореховые',
    icon: '🍫',
    popularTags: ['тёмный шоколад', 'какао', 'грецкий орех', 'миндаль', 'фундук', 'жареный каштан', 'арахис']
  },
  {
    id: 'woody_pine',
    nameRu: 'Древесно-Смолистые & Хвойные',
    icon: '🌲',
    popularTags: ['хвоя', 'камфора', 'сосновая смола', 'древесный мох', 'кора дуба', 'ладан', 'кедр', 'бальзам']
  },
  {
    id: 'roasted_smoke',
    nameRu: 'Печёные & Копчёные',
    icon: '🔥',
    popularTags: ['дым костра', 'печёный хлеб', 'жареный рис', 'ржаная корочка', 'солод', 'древесный уголь']
  },
  {
    id: 'creamy_umami',
    nameRu: 'Сливочные & Умами',
    icon: '🥛',
    popularTags: ['сливки', 'молоко', 'сливочный пломбир', 'умами', 'водоросли нори', 'варёная кукуруза', 'бульон']
  },
  {
    id: 'herbal_fresh',
    nameRu: 'Свежие & Травянистые',
    icon: '🌿',
    popularTags: ['свежескошенная трава', 'шпинат', 'молодой бамбук', 'эвкалипт', 'мята', 'клевер', 'огурец']
  }
];

/**
 * Matches a tea specifically by its sensory / flavor notes
 */
export function matchTeaBySensory(
  tea: TeaVariety, 
  sensoryQuery: string
): { matches: boolean; matchedNotes: string[] } {
  if (!sensoryQuery || !sensoryQuery.trim()) {
    return { matches: true, matchedNotes: [] };
  }

  const normQ = normalizeTeaText(sensoryQuery.trim());
  const qTokens = normQ.split(/[\s,./\\_\-+;:()«»"'\\[\]]+/).filter(t => t.length > 0);
  if (qTokens.length === 0) return { matches: true, matchedNotes: [] };

  const notes = tea.keySensoryNotes || [];
  const matchedNotes: string[] = [];

  const allTokensMatch = qTokens.every(tok => {
    const cleanTok = cleanTeaChars(tok);
    if (!cleanTok) return true;

    let foundForTok = false;
    for (const note of notes) {
      const normNote = normalizeTeaText(note);
      const cleanNote = cleanTeaChars(normNote);
      if (cleanNote.includes(cleanTok) || normNote.includes(tok) || matchTokenAgainstWord(cleanTok, cleanNote)) {
        foundForTok = true;
        if (!matchedNotes.includes(note)) {
          matchedNotes.push(note);
        }
      }
    }
    return foundForTok;
  });

  return {
    matches: allTokensMatch && matchedNotes.length > 0,
    matchedNotes
  };
}
