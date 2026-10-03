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

/**
 * Checks whether a single search token matches a target word, taking into account:
 * 1. Exact match
 * 2. Prefix match
 * 3. Phonetic vowel-reduced match (wrong vowels, soft sign missing, etc.)
 * 4. Damerau-Levenshtein typo tolerance:
 *    - len <= 4: exact or phonetic match only (no destructive fuzzy matching for short words)
 *    - len 5..7: 1 typo / transposition / substitution
 *    - len >= 8: up to 2 typos / transpositions / substitutions
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

  // 4. Damerau-Levenshtein typo tolerance (requires at least 4 chars on both sides to avoid short-word collisions)
  if (cleanTok.length >= 4 && cleanWord.length >= 4) {
    const maxAllowedDist = cleanTok.length >= 8 ? 2 : 1;

    if (damerauLevenshtein(cleanTok, cleanWord) <= maxAllowedDist) return true;

    if (cleanWord.length > cleanTok.length) {
      const wordPrefix = cleanWord.slice(0, cleanTok.length);
      if (damerauLevenshtein(cleanTok, wordPrefix) <= maxAllowedDist) {
        return true;
      }
    }
  }

  return false;
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

  const rawQ = query.trim();
  const normQ = normalizeTeaText(rawQ);
  if (!normQ) return true;

  // Split query into individual search tokens
  const qTokens = normQ.split(/[\s,./\\_\-+;:()«»"'\\[\]]+/).filter(t => t.length > 0);
  if (qTokens.length === 0) return true;

  // Entire query collapsed with spaces and non-alphanumerics removed
  const compactQuery = cleanTeaChars(rawQ);
  const phonCompactQuery = phoneticVowelReduce(rawQ);

  // Searchable text sources
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

  // Tokenize tea text into word list for word-prefix and exact-word matching
  const words: string[] = normalizeTeaText(searchFields.join(' '))
    .split(/[\s,./\\_\-+;:()«»"'\\[\]]+/)
    .filter(Boolean);

  // Extract distinct joined aliases for Chinese compound names
  const joinedAliases: string[] = [
    ...((tea.transcriptionRu || '').split('/')),
    tea.nameRu,
    tea.nameZh || '',
    tea.namePinyin || '',
    tea.id,
    ...(tea.generalExamplesRu || [])
  ]
    .map(a => cleanTeaChars(a))
    .filter(Boolean);

  // 1. FAST-PATH: Joined query matching (for joined queries like "дахунпао", "шупуэр", "тегуаньинь", "байхаоиньчжэнь")
  if (compactQuery.length >= 4) {
    const matchesJoined = joinedAliases.some(alias => {
      // Substring match
      if (alias.includes(compactQuery)) return true;

      // Phonetic reduced match
      const phonAlias = phoneticVowelReduce(alias);
      if (phonAlias.includes(phonCompactQuery)) return true;

      // Damerau-Levenshtein against joined alias
      const maxDist = compactQuery.length >= 8 ? 2 : 1;
      if (Math.abs(alias.length - compactQuery.length) <= 2) {
        if (damerauLevenshtein(compactQuery, alias) <= maxDist) return true;
        if (damerauLevenshtein(phonCompactQuery, phonAlias) <= maxDist) return true;
      }

      return false;
    });

    if (matchesJoined) return true;
  }

  // 2. TOKEN-BY-TOKEN MATCHING: Every token in the user's query must match at least one element of the tea
  return qTokens.every(tok => {
    const cleanTok = cleanTeaChars(tok);
    if (!cleanTok) return true;

    // A. Chinese Hanzi characters match
    if (/[\u4e00-\u9fa5]/.test(tok)) {
      if ((tea.nameZh || '').includes(tok)) return true;
    }

    // B. Word-level fuzzy match (handles typos, wrong vowels, transpositions, prefixes)
    const matchesWord = words.some(w => matchTokenAgainstWord(cleanTok, w));
    if (matchesWord) return true;

    // C. Compacted alias match for Chinese compound transliterations
    const matchesAlias = joinedAliases.some(alias => {
      if (alias === cleanTok || alias.startsWith(cleanTok)) return true;
      if (cleanTok.length >= 4 && alias.includes(cleanTok)) return true;

      const phonAlias = phoneticVowelReduce(alias);
      const phonTok = phoneticVowelReduce(cleanTok);
      if (phonAlias.includes(phonTok)) return true;

      const maxDist = cleanTok.length >= 8 ? 2 : 1;
      if (cleanTok.length >= 5 && damerauLevenshtein(cleanTok, alias.slice(0, cleanTok.length)) <= maxDist) {
        return true;
      }

      return false;
    });
    if (matchesAlias) return true;

    return false;
  });
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
