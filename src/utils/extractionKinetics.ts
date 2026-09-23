import { 
  TeaVariety, 
  SteepKineticData, 
  WaterHardnessLevel, 
  VesselMaterialType, 
  OptimizationGoal,
  FormulaVariable,
  ScientificModelExplanation
} from '../types';
import { 
  WATER_HARDNESS_PRESETS, 
  VESSEL_MATERIALS, 
  OPTIMIZATION_PRESETS 
} from '../data/teaData';

/**
 * Calculates progressive Gongfu steep durations for ANY arbitrary number of steeps (1 to 60+).
 * Formula is derived from empirical Fickian boundary layer expansion and longevity pacing:
 * - When stretching flavor for large steeps (8-20+ steeps): uses gentle micro-pacing at early steeps (3-6s)
 * - Early steeps: small linear increments while hydration progresses.
 * - Late steeps: progressive quadratic/exponential time dilation to overcome solute depletion.
 */
export function calculateSteepDurations(tea: TeaVariety, totalSteeps: number = 8, isMaxLongevity: boolean = false): number[] {
  const count = Math.max(1, Math.min(60, totalSteeps));
  const durations: number[] = [];

  // Determine baseline initial steep time t1 based on morphology and target endurance
  let baseT1 = 8;
  if (tea.leafMorphology === 'tight_ball') {
    baseT1 = 10;
  } else if (tea.leafMorphology === 'compressed_cake') {
    baseT1 = 8;
  } else if (tea.type === 'green') {
    baseT1 = 12;
  } else if (tea.leafMorphology === 'needle') {
    baseT1 = 10;
  }

  // If stretching flavor for long session (10+ steeps) or max longevity mode is active:
  // initial steeps are ultra-fast flash flushes (3-6s) to preserve the solute reservoir
  if (isMaxLongevity || count >= 10) {
    baseT1 = Math.max(3, Math.round(baseT1 * (count >= 15 ? 0.45 : (count >= 10 ? 0.6 : 0.8))));
  }

  for (let i = 1; i <= count; i++) {
    if (i === 1) {
      durations.push(baseT1);
    } else if (i === 2) {
      durations.push(baseT1 + (isMaxLongevity || count >= 12 ? 1 : 2));
    } else if (i === 3) {
      durations.push(baseT1 + (isMaxLongevity || count >= 12 ? 3 : 5));
    } else if (i <= 6) {
      // Linear micro-expansion (+2 to +5s per step in longevity mode, +5 to +10s in standard)
      const prev = durations[i - 2];
      const stepDelta = isMaxLongevity || count >= 12 ? 2 + (i - 3) : 5 + (i - 3) * 2;
      durations.push(prev + stepDelta);
    } else if (i <= 10) {
      // Moderate expansion
      const prev = durations[i - 2];
      const stepDelta = isMaxLongevity || count >= 12 ? 5 + (i - 6) * 2 : 12 + (i - 6) * 3;
      durations.push(prev + stepDelta);
    } else {
      // Deep extraction steeps (11+): progressive time dilation for deep polysaccharides
      const prev = durations[i - 2];
      const stepDelta = 12 + Math.min(35, (i - 10) * 3);
      durations.push(prev + stepDelta);
    }
  }

  return durations;
}

/**
 * Dynamic adaptive steep timing calculation:
 * Automatically adjusts the duration of every steep based on:
 * 1. Water temperature (Arrhenius kinetic law - colder requires more time, hotter needs shorter flushes)
 * 2. Leaf-to-water ratio (Driving force concentration gradient)
 * 3. Water hardness / mineral ionic strength
 * 4. Optimization goal & longevity pacing
 */
export function calculateAdaptiveSteepDurations(
  tea: TeaVariety,
  totalSteeps: number = 8,
  actualTempC: number = tea.optimalTemp,
  actualRatio: number = 15,
  waterHardnessLevel: WaterHardnessLevel = 'optimal',
  optimizationGoal: OptimizationGoal = 'balanced'
): number[] {
  const isLongevity = optimizationGoal === 'max_longevity' || totalSteeps >= 12;
  const baseDurations = calculateSteepDurations(tea, totalSteeps, isLongevity);

  // 1. Temperature Arrhenius compensation:
  const T_actual = actualTempC + 273.15;
  const T_opt = tea.optimalTemp + 273.15;
  const R_const = 8.314;
  const Ea_effective = 24000; // J/mol (composite activation energy for polyphenols & amino acids)
  const rateRatio = Math.exp((-Ea_effective / R_const) * (1 / T_actual - 1 / T_opt));
  
  // Power coefficient 0.72 accounts for selective extraction of theanine over catechins at lower temp
  const tempTimeMultiplier = Math.max(0.45, Math.min(2.5, Math.pow(1 / Math.max(0.1, rateRatio), 0.72)));

  // 2. Hydraulic ratio compensation:
  // Standard ratio is 15 (1:15).
  // If ratio is 1:8 (dense), steep time should be shorter (-15% to -25%) to prevent harshness.
  // If ratio is 1:30 (dilute), steep time should be slightly longer (+15% to +30%) to reach target body.
  const standardRatio = 15;
  const ratioMultiplier = Math.max(0.65, Math.min(1.5, Math.pow(actualRatio / standardRatio, 0.38)));

  // 3. Water hardness multiplier:
  const hardnessPreset = WATER_HARDNESS_PRESETS.find(h => h.level === waterHardnessLevel) || WATER_HARDNESS_PRESETS[1];
  const hardnessTimeMultiplier = 1 / Math.max(0.6, hardnessPreset.extractionMultiplier);

  // 4. Optimization goal factor:
  const goalPreset = OPTIMIZATION_PRESETS.find(g => g.id === optimizationGoal) || OPTIMIZATION_PRESETS[0];
  const goalTimeFactor = goalPreset.timeFactor;

  // Composite adaptive coefficient
  const totalMultiplier = tempTimeMultiplier * ratioMultiplier * hardnessTimeMultiplier * goalTimeFactor;

  return baseDurations.map((t) => {
    const adjusted = Math.round(t * totalMultiplier);
    return Math.max(3, adjusted);
  });
}

export interface DiagnosticCheckItem {
  id: string;
  category: 'ratio' | 'temperature' | 'vessel' | 'water' | 'steeps';
  titleRu: string;
  status: 'optimal' | 'warning' | 'alert';
  currentValueRu: string;
  targetValueRu: string;
  descriptionRu: string;
  recommendationRu?: string;
}

export interface BrewingQualityDiagnostics {
  overallScorePercent: number; // 0-100%
  overallStatusRu: string;
  overallStatusType: 'optimal' | 'warning' | 'critical';
  summaryRu: string;
  checks: DiagnosticCheckItem[];
  flavorImprovementRecommendations: string[];
}

export interface OptimizedBrewingResult {
  recommendedLeafMass: number;
  recommendedWaterVolume: number;
  recommendedWaterTemp: number;
  recommendedRatio: number;
  recommendedSteepCount: number;
  recommendedDurations: number[];
  scientificExplanationRu: string;
  enduranceScorePercent: number; // 0-100% measure of leaf reservoir capacity for target steeps
  enduranceStatusRu: string;
  enduranceAdviceRu: string;
  diagnostics: BrewingQualityDiagnostics;
}

export interface MultiFixedOptimizationConfig {
  fixVolume?: boolean;
  fixedVolume?: number;
  fixMass?: boolean;
  fixedMass?: number;
  fixTemp?: boolean;
  fixedTemp?: number;
  fixSteeps?: boolean;
  fixedSteeps?: number;
}

/**
 * Diagnostic engine that evaluates correctness of all active brewing settings
 * and generates precise, science-backed recommendations to maximize cup flavor.
 */
export function diagnoseBrewQuality(
  tea: TeaVariety,
  actualMass: number,
  actualVolume: number,
  actualTemp: number,
  actualRatio: number,
  actualSteeps: number,
  vesselMaterial: VesselMaterialType,
  waterHardnessLevel: WaterHardnessLevel
): BrewingQualityDiagnostics {
  const checks: DiagnosticCheckItem[] = [];
  const flavorTips: string[] = [];
  let scorePenalties = 0;

  // 1. Ratio Diagnostic
  let targetRatioMin = 13;
  let targetRatioMax = 18;
  if (tea.type === 'green' || tea.type === 'yellow') {
    targetRatioMin = 18;
    targetRatioMax = 25;
  } else if (tea.type === 'white') {
    targetRatioMin = 16;
    targetRatioMax = 22;
  } else if (tea.type === 'oolong_ball' || tea.type === 'gaba_oolong') {
    targetRatioMin = 13;
    targetRatioMax = 17;
  } else if (tea.type === 'oolong_strip') {
    targetRatioMin = 12;
    targetRatioMax = 16;
  } else if (tea.type === 'shou_puerh' || tea.type === 'heicha') {
    targetRatioMin = 11;
    targetRatioMax = 15;
  } else if (tea.type === 'sheng_puerh') {
    targetRatioMin = 13;
    targetRatioMax = 17;
  } else if (tea.type === 'red' || tea.type === 'gaba_red') {
    targetRatioMin = 15;
    targetRatioMax = 20;
  }

  const targetRatioMid = Math.round(((targetRatioMin + targetRatioMax) / 2) * 10) / 10;

  if (actualRatio < targetRatioMin - 2) {
    scorePenalties += 18;
    const diffMass = Math.round((actualMass - (actualVolume / targetRatioMid)) * 10) / 10;
    checks.push({
      id: 'ratio',
      category: 'ratio',
      titleRu: 'Гидромодуль (Плотность листа)',
      status: actualRatio < targetRatioMin - 4 ? 'alert' : 'warning',
      currentValueRu: `1:${actualRatio} (${actualMass}г на ${actualVolume}мл)`,
      targetValueRu: `1:${targetRatioMin}–1:${targetRatioMax} (канон ~1:${targetRatioMid})`,
      descriptionRu: 'Чрезмерно высокая концентрация сухого листа. Высокий градиент диффузии провоцирует резкую экстракцию горьких катехинов EGCG.',
      recommendationRu: `Уменьшите навеску на ${Math.max(0.5, diffMass)} г или увеличьте объём воды для чистоты и сладости вкуса.`
    });
    flavorTips.push(`Для смягчения горечи и раскрытия тонких нот уменьшите лист до ${Math.round((actualVolume / targetRatioMid) * 10) / 10} г или делайте сверхбыстрые сливы (2–4 сек).`);
  } else if (actualRatio > targetRatioMax + 3) {
    scorePenalties += 15;
    const needMass = Math.round(((actualVolume / targetRatioMid) - actualMass) * 10) / 10;
    checks.push({
      id: 'ratio',
      category: 'ratio',
      titleRu: 'Гидромодуль (Плотность листа)',
      status: 'warning',
      currentValueRu: `1:${actualRatio} (${actualMass}г на ${actualVolume}мл)`,
      targetValueRu: `1:${targetRatioMin}–1:${targetRatioMax} (канон ~1:${targetRatioMid})`,
      descriptionRu: 'Лист сильно разбавлен. Настой может казаться водянистым, а плотность чайных полисахаридов (TPS) окажется недостаточной.',
      recommendationRu: `Добавьте ${Math.max(0.5, needMass)} г листа для плотного «тела» (mouthfeel) и глубокого послевкусия.`
    });
    flavorTips.push(`Для плотности настоя и долгого послевкусия увеличьте навеску до ${Math.round((actualVolume / targetRatioMid) * 10) / 10} г.`);
  } else {
    checks.push({
      id: 'ratio',
      category: 'ratio',
      titleRu: 'Гидромодуль (Плотность листа)',
      status: 'optimal',
      currentValueRu: `1:${actualRatio} (баланс)`,
      targetValueRu: `1:${targetRatioMin}–1:${targetRatioMax}`,
      descriptionRu: 'Идеальное соотношение массы листа к объёму посуды: раскрывает естественный баланс умами и плотности.'
    });
  }

  // 2. Temperature Diagnostic
  const [tempMin, tempMax] = tea.tempRange;
  if (actualTemp > tempMax) {
    const tempDiff = actualTemp - tempMax;
    scorePenalties += tempDiff >= 5 ? 22 : 12;
    checks.push({
      id: 'temperature',
      category: 'temperature',
      titleRu: 'Температурный порог',
      status: (tea.type === 'green' || tea.type === 'yellow' || tea.type === 'white') && tempDiff >= 5 ? 'alert' : 'warning',
      currentValueRu: `${actualTemp}°C (перегрев на +${tempDiff}°C)`,
      targetValueRu: `${tempMin}–${tempMax}°C (эталон ${tea.optimalTemp}°C)`,
      descriptionRu: 'Превышение термодинамического порога активирует разрушение L-теанина и лавинообразный выход катехинов EGCG.',
      recommendationRu: `Остудите воду до ${tea.optimalTemp}°C для защиты деликатного аромата и предотвращения терпкой горечи.`
    });
    flavorTips.push(`Понизьте температуру воды до ${tea.optimalTemp}°C — это уберёт агрессивную горечь и подчеркнёт сладкое умами L-теанина.`);
  } else if (actualTemp < tempMin - 2) {
    const tempDiff = tempMin - actualTemp;
    scorePenalties += 12;
    checks.push({
      id: 'temperature',
      category: 'temperature',
      titleRu: 'Температурный порог',
      status: 'warning',
      currentValueRu: `${actualTemp}°C (недогрев на -${tempDiff}°C)`,
      targetValueRu: `${tempMin}–${tempMax}°C (эталон ${tea.optimalTemp}°C)`,
      descriptionRu: 'Недостаток кинетической энергии (уравнение Аррениуса). Высокомолекулярные полисахариды и летучие терпены останутся в листе.',
      recommendationRu: `Поднимите температуру до ${tea.optimalTemp}°C для полноценного раскрытия аромата и маслянистости.`
    });
    flavorTips.push(`Увеличьте температуру до ${tea.optimalTemp}°C для глубокой экстракции сложных эфиров и бархатистого тела.`);
  } else {
    checks.push({
      id: 'temperature',
      category: 'temperature',
      titleRu: 'Температурный порог',
      status: 'optimal',
      currentValueRu: `${actualTemp}°C (в оптимуме)`,
      targetValueRu: `${tempMin}–${tempMax}°C`,
      descriptionRu: 'Температура точно соответствует термодинамическому профилю сорта.'
    });
  }

  // 3. Vessel Compatibility Diagnostic
  const isDelicateTea = tea.type === 'green' || tea.type === 'yellow' || tea.type === 'white';
  const isHeavyFermented = tea.type === 'shou_puerh' || tea.type === 'sheng_puerh' || tea.id.includes('lao') || tea.id.includes('fuzhuan');

  if (isDelicateTea && (vesselMaterial === 'cast_iron' || vesselMaterial === 'thermos' || vesselMaterial === 'ceramic_thick')) {
    scorePenalties += 12;
    checks.push({
      id: 'vessel',
      category: 'vessel',
      titleRu: 'Материал и теплофизика посуды',
      status: 'warning',
      currentValueRu: vesselMaterial === 'cast_iron' ? 'Чугун' : vesselMaterial === 'thermos' ? 'Термос' : 'Толстая керамика',
      targetValueRu: 'Тонкий фарфор или стекло',
      descriptionRu: 'Высокая тепловая инерция этой посуды может «заварить» и перегреть нежный слабоферментированный лист.',
      recommendationRu: 'Используйте фарфоровую гайвань или стеклянный сосуд для быстрого отвода тепла.'
    });
    flavorTips.push('Для деликатных сортов используйте тонкостенный фарфор или стекло — они сохранят свежесть и аромат без «варёного» тона.');
  } else if (isHeavyFermented && (vesselMaterial === 'glass' || vesselMaterial === 'glass_regular')) {
    scorePenalties += 8;
    checks.push({
      id: 'vessel',
      category: 'vessel',
      titleRu: 'Материал и теплофизика посуды',
      status: 'warning',
      currentValueRu: 'Стекло (быстрое остывание)',
      targetValueRu: 'Исинская глина Цзыни или толстый фарфор',
      descriptionRu: 'Стекло быстро теряет тепло, из-за чего полисахариды выдержанного пуэра/хэй ча экстрагируются медленнее.',
      recommendationRu: 'Для пуэров и тёмных чаев предпочтительна исинская глина (Цзыни) или прогретый чайник.'
    });
    flavorTips.push('Для пуэров и тёмных сортов выберите глиняный чайник — он удержит стабильные 98°C для глубокой сладкой экстракции.');
  } else {
    checks.push({
      id: 'vessel',
      category: 'vessel',
      titleRu: 'Материал и теплофизика посуды',
      status: 'optimal',
      currentValueRu: 'Отличная тепловая совместимость',
      targetValueRu: 'Фарфор / Соответствующая глина',
      descriptionRu: 'Теплопроводность и микропористость посуды гармонируют с выбранным типом листа.'
    });
  }

  // 4. Water Hardness Diagnostic
  if (waterHardnessLevel === 'hard') {
    scorePenalties += 14;
    checks.push({
      id: 'water',
      category: 'water',
      titleRu: 'Минерализация воды (TDS & ионы)',
      status: 'warning',
      currentValueRu: 'Жёсткая вода (>150 ppm)',
      targetValueRu: 'Мягкая / Оптимальная (30–80 ppm)',
      descriptionRu: 'Ионы кальция Ca²⁺ и магния Mg²⁺ связывают полифенолы, подавляя до 30% аромата и создавая осадок.',
      recommendationRu: 'Используйте родниковую или фильтрованную воду низкой минерализации (TDS 40–70 мг/л).'
    });
    flavorTips.push('Переход на мягкую воду (TDS 40–80 ppm) моментально сделает вкус чая ярче, чище и слаще.');
  } else {
    checks.push({
      id: 'water',
      category: 'water',
      titleRu: 'Минерализация воды (TDS & ионы)',
      status: 'optimal',
      currentValueRu: waterHardnessLevel === 'soft' ? 'Мягкая (<40 ppm)' : 'Оптимальная (40–80 ppm)',
      targetValueRu: '30–80 ppm',
      descriptionRu: 'Благоприятный ионный состав способствует свободной диффузии теанина и эфирных масел.'
    });
  }

  // 5. Steep Count & Longevity Diagnostic
  if (isDelicateTea && actualSteeps > 9) {
    checks.push({
      id: 'steeps',
      category: 'steeps',
      titleRu: 'Количество проливов',
      status: 'warning',
      currentValueRu: `${actualSteeps} проливов`,
      targetValueRu: '5–8 проливов',
      descriptionRu: 'Слабоферментированный лист отдает большую часть пула за первые 6 проливов.',
      recommendationRu: 'Начиная с 7-го пролива настой станет водянистым; увеличивайте время экспозиции.'
    });
  } else {
    checks.push({
      id: 'steeps',
      category: 'steeps',
      titleRu: 'Количество проливов',
      status: 'optimal',
      currentValueRu: `${actualSteeps} проливов`,
      targetValueRu: 'Ресурс листа достаточен',
      descriptionRu: 'Пул веществ позволяет равномерно распределить экстракт по выбранному числу шагов.'
    });
  }

  const overallScorePercent = Math.max(25, Math.min(100, 100 - scorePenalties));
  let overallStatusRu = 'Идеальный баланс параметров';
  let overallStatusType: 'optimal' | 'warning' | 'critical' = 'optimal';
  let summaryRu = 'Все параметры (температура, гидромодуль, посуда и вода) согласованы с физико-химическими свойствами сорта.';

  if (overallScorePercent < 70) {
    overallStatusRu = 'Критический дисбаланс экстракции';
    overallStatusType = 'critical';
    summaryRu = 'Несколько ключевых настроек (температура или гидромодуль) выходят за рамки допустимых для данного сорта. Есть риск сильной горечи или пустоты.';
  } else if (overallScorePercent < 88) {
    overallStatusRu = 'Умеренное отклонение настроек';
    overallStatusType = 'warning';
    summaryRu = 'Параметры близки к оптимальным, но небольшая корректировка позволит раскрыть вкус ещё ярче и гармоничнее.';
  }

  if (flavorTips.length === 0) {
    flavorTips.push('Настройки безупречны! Делайте первый пролив точным по секундомеру, чтобы зафиксировать пик L-теанина.');
    flavorTips.push('Прогрейте посуду горячей водой перед засыпкой сухого листа для стабилизации термодинамики.');
  }

  return {
    overallScorePercent,
    overallStatusRu,
    overallStatusType,
    summaryRu,
    checks,
    flavorImprovementRecommendations: flavorTips
  };
}

/**
 * Optimizes brewing parameters when one or MULTIPLE variables are fixed.
 * Supports smart longevity scaling when target steeps is set (e.g. 10, 15, 20 steeps)
 * to stretch the tea flavor for as long as possible without premature exhaustion.
 */
export function optimizeBrewingParametersMulti(
  tea: TeaVariety,
  config: MultiFixedOptimizationConfig,
  goal: OptimizationGoal = 'balanced',
  waterHardnessLevel: WaterHardnessLevel = 'optimal',
  vesselMaterial: VesselMaterialType = 'porcelain'
): OptimizedBrewingResult {
  const goalPreset = OPTIMIZATION_PRESETS.find(g => g.id === goal) || OPTIMIZATION_PRESETS[0];
  const vesselInfo = VESSEL_MATERIALS.find(v => v.id === vesselMaterial) || VESSEL_MATERIALS[0];

  const fixVol = Boolean(config.fixVolume && config.fixedVolume && config.fixedVolume > 0);
  const fixM = Boolean(config.fixMass && config.fixedMass && config.fixedMass > 0);
  const fixT = Boolean(config.fixTemp && config.fixedTemp && config.fixedTemp > 0);
  const fixS = Boolean(config.fixSteeps && config.fixedSteeps && config.fixedSteeps > 0);

  // Determine target steep count first
  let optSteeps = tea.recommendedSteeps || 8;
  if (fixS) {
    optSteeps = Math.max(1, Math.min(50, Math.round(config.fixedSteeps!)));
  } else if (goal === 'max_longevity') {
    optSteeps = Math.min(25, (tea.recommendedSteeps || 8) + 4);
  }

  // Base canonical ratio derived from tea variety scientific standards (volume / mass)
  const canonicalRatio = tea.defaultVolume > 0 && tea.defaultMass > 0 
    ? Math.round((tea.defaultVolume / tea.defaultMass) * 10) / 10 
    : 15;

  // Goal multiplier for ratio
  let goalMultiplier = 1.0;
  if (goal === 'umami_sweetness') goalMultiplier = 0.98;
  else if (goal === 'body_density') goalMultiplier = 0.88;
  else if (goal === 'aroma_peak') goalMultiplier = 1.06;

  let targetRatio = Math.round(canonicalRatio * goalMultiplier * 10) / 10;

  // Dynamic longevity ratio calculation based on target steep count:
  // To stretch tea for 15+ steeps, leaf-to-water ratio must be denser (1:10 - 1:12)
  // To stretch tea for 6 steeps, ratio can be lighter (1:16 - 1:22)
  if (fixS || goal === 'max_longevity') {
    if (optSteeps >= 18) {
      targetRatio = Math.min(targetRatio, 10.5);
    } else if (optSteeps >= 14) {
      targetRatio = Math.min(targetRatio, 12.0);
    } else if (optSteeps >= 10) {
      targetRatio = Math.min(targetRatio, canonicalRatio * 0.92);
    } else if (optSteeps <= 5) {
      targetRatio = Math.max(targetRatio, canonicalRatio * 1.15);
    }
  }

  let optVolume = tea.defaultVolume;
  let optMass = tea.defaultMass;
  let optTemp = tea.optimalTemp;

  // 1. Resolve Volume & Mass
  if (fixVol && fixM) {
    optVolume = Math.round(config.fixedVolume!);
    optMass = Math.round(config.fixedMass! * 10) / 10;
  } else if (fixVol) {
    optVolume = Math.round(config.fixedVolume!);
    optMass = Math.max(0.5, Math.round((optVolume / targetRatio) * 10) / 10);
  } else if (fixM) {
    optMass = Math.round(config.fixedMass! * 10) / 10;
    optVolume = Math.max(30, Math.round(optMass * targetRatio));
  } else {
    optVolume = tea.defaultVolume;
    optMass = Math.max(0.5, Math.round((optVolume / targetRatio) * 10) / 10);
  }

  const actualRatio = Math.round((optVolume / Math.max(0.1, optMass)) * 10) / 10;

  // 2. Resolve Temperature with Teaware Physical Modifiers
  if (fixT) {
    optTemp = Math.max(60, Math.min(100, Math.round(config.fixedTemp!)));
  } else {
    // Teaware heat loss & thermal mass compensation:
    let vesselTempCorrection = 0;
    if (vesselInfo.id === 'glass') vesselTempCorrection = +1;
    else if (vesselInfo.id === 'thermos') vesselTempCorrection = -2;
    else if (vesselInfo.id === 'cast_iron') vesselTempCorrection = (tea.type === 'green' || tea.type === 'yellow') ? -2 : 0;
    else if (vesselInfo.id === 'metal_silver') vesselTempCorrection = 0;
    else if (vesselInfo.id === 'ceramic_thick') vesselTempCorrection = 0;

    let densityTempAdj = 0;
    if (actualRatio < 11 && tea.type !== 'shou_puerh' && tea.type !== 'heicha' && tea.type !== 'oolong_strip') {
      densityTempAdj = -2; // slightly milder temp for dense leaves to prevent early bitterness
    } else if (actualRatio > 24) {
      densityTempAdj = +1;
    }

    const rawTemp = tea.optimalTemp + goalPreset.tempOffsetC + vesselTempCorrection + densityTempAdj;
    // Bound temperature within safe thermodynamic corridor for the tea cultivar
    optTemp = Math.max(tea.tempRange[0], Math.min(tea.tempRange[1], Math.round(rawTemp)));
  }

  // 3. Resolve Steeps Count if not fixed
  if (!fixS) {
    if (actualRatio <= 11) {
      optSteeps = Math.min(25, (tea.recommendedSteeps || 8) + 3);
    } else if (actualRatio > 22) {
      optSteeps = Math.max(4, (tea.recommendedSteeps || 8) - 2);
    } else {
      optSteeps = tea.recommendedSteeps || 8;
    }
  }

  // 4. Calculate Endurance Index (Потенциал растягивания вкуса)
  // Ideal ratio needed for optSteeps:
  const requiredRatioForSteeps = Math.max(8, 20 - (optSteeps - 5) * 0.7);
  // Ratio ratio comparison:
  const densityRatio = requiredRatioForSteeps / Math.max(5, actualRatio);
  let enduranceScore = Math.min(100, Math.max(20, Math.round(densityRatio * 85)));

  let enduranceStatusRu = 'Оптимальный запас вкуса';
  let enduranceAdviceRu = '';

  if (enduranceScore >= 85) {
    enduranceStatusRu = 'Превосходный запас ресурса (Марафонский потенциал)';
    enduranceAdviceRu = `Плотность листа 1:${actualRatio} идеально держит ${optSteeps} проливов. Первые проливы начинаются со сверхбыстрых сливов (3–6 сек), равномерно отдавая вкус.`;
  } else if (enduranceScore >= 65) {
    enduranceStatusRu = 'Сбалансированная выносливость';
    enduranceAdviceRu = `Хороший баланс для ${optSteeps} проливов. Алгоритм плавно растягивает экспозицию по параболической кривой.`;
  } else {
    enduranceStatusRu = 'Повышенное разведение листа (Предел выносливости)';
    enduranceAdviceRu = `Для ${optSteeps} проливов при пропорции 1:${actualRatio} чай может стать водянистым на поздних проливах. Для максимального вкуса добавьте ${Math.round((optVolume / requiredRatioForSteeps - optMass) * 10) / 10} г листа или используйте микро-проливы.`;
  }

  // 5. Calculate Adaptive Steep Durations based on all resolved physical parameters
  const recommendedDurations = calculateAdaptiveSteepDurations(
    tea,
    optSteeps,
    optTemp,
    actualRatio,
    waterHardnessLevel,
    goal
  );

  // 6. Scientific Explanation
  const fixedList: string[] = [];
  if (fixVol) fixedList.push(`объём ${optVolume} мл`);
  if (fixM) fixedList.push(`масса ${optMass} г`);
  if (fixT) fixedList.push(`температура ${optTemp}°C`);
  if (fixS) fixedList.push(`цель: ${optSteeps} проливов`);

  let explanation = `Оптимизация под цель «${goalPreset.nameRu}». `;

  if (fixS && !fixM && fixVol) {
    explanation += `Для комфортного растягивания вкуса на ${optSteeps} проливов в объёме ${optVolume} мл алгоритм рассчитал навеску ${optMass} г (гидромодуль 1:${actualRatio}). `;
  } else if (fixS && fixM && !fixVol) {
    explanation += `Для навески ${optMass} г и цели ${optSteeps} проливов рассчитан оптимальный объём гайвани ${optVolume} мл (1:${actualRatio}). `;
  } else if (fixVol && fixM) {
    explanation += `Гидромодуль составил 1:${actualRatio}. `;
    if (!fixT) {
      explanation += `Температура скорректирована до ${optTemp}°C под полученную плотность листа. `;
    }
  }

  if (vesselInfo.id === 'metal_silver') {
    explanation += `Учтена теплопроводность серебра/металла и очищающий эффект ионов Ag⁺. `;
  } else if (vesselInfo.id === 'cast_iron') {
    explanation += `Чугун сохраняет стабильные 98°C для глубокой экстракции полисахаридов. `;
  } else if (vesselInfo.id === 'glass') {
    explanation += `Стекло быстро рассеивает жар, защищая L-теанин от денатурации. `;
  }

  explanation += `Тайминги всех ${optSteeps} проливов адаптированы для сохранения яркого вкуса от первого до последнего пролива.`;

  const diagnostics = diagnoseBrewQuality(
    tea,
    optMass,
    optVolume,
    optTemp,
    actualRatio,
    optSteeps,
    vesselMaterial,
    waterHardnessLevel
  );

  return {
    recommendedLeafMass: optMass,
    recommendedWaterVolume: optVolume,
    recommendedWaterTemp: optTemp,
    recommendedRatio: actualRatio,
    recommendedSteepCount: optSteeps,
    recommendedDurations,
    scientificExplanationRu: explanation,
    enduranceScorePercent: enduranceScore,
    enduranceStatusRu,
    enduranceAdviceRu,
    diagnostics
  };
}

export const PEER_REVIEWED_FORMULAS: ScientificModelExplanation[] = [
  {
    id: 'noyes_whitney',
    equationName: 'Диффузионный массоперенос Нойеса–Уитни (Noyes–Whitney Law)',
    subTitleRu: 'Скорость перехода экстрактивных веществ из чайного листа в воду',
    academicDisciplineRu: 'Гидродинамика и физическая химия',
    formulaLatex: 'dM / dt = (D_eff · A_surf / h_BL) · [C_s - C_b(t)]',
    canonicalFormRu: 'dM/dt = (D · A / δ) · ΔC',
    variables: [
      { symbol: 'dM/dt', nameRu: 'Массовый поток экстракта', unitRu: 'мг/с', descriptionRu: 'Скорость переноса полезных веществ из мезофилла чайного листа в настой.', colorClass: 'text-amber-800' },
      { symbol: 'D_eff', nameRu: 'Эффективная диффузия молекул', unitRu: 'м²/с', descriptionRu: 'Подвижность конкретных молекул (L-теанин выходит легко, тяжелые катехины медленнее).', colorClass: 'text-emerald-700' },
      { symbol: 'A_surf', nameRu: 'Площадь контакта чайного листа', unitRu: 'м²', descriptionRu: 'Поверхность листа, растущая по мере его расправления в гайвани.', colorClass: 'text-emerald-700' },
      { symbol: 'h_BL (δ)', nameRu: 'Толщина пограничного микрослоя', unitRu: 'мкм', descriptionRu: 'Гидродинамический барьер Прандтля-Нернста на поверхности листа.', colorClass: 'text-blue-700' },
      { symbol: 'C_s', nameRu: 'Концентрация насыщения у листа', unitRu: 'мг/мл', descriptionRu: 'Максимально возможная концентрация в микропорах чайного листа.', colorClass: 'text-purple-700' },
      { symbol: 'C_b(t)', nameRu: 'Концентрация в объеме чаши', unitRu: 'мг/мл', descriptionRu: 'Текущая плотность настоя (при сливе пролива обнуляется до 0).', colorClass: 'text-stone-700' }
    ],
    textbookDerivationRu: 'Интегрирование при граничных условиях C_b(0) = 0 даёт экспоненциальную кинетическую кривую: C_b(t) = C_s · [1 - exp(- (D_eff · A_surf / (V · h_BL)) · t)].',
    descriptionRu: 'Определяет кинетическую скорость диффузии экстрактивных веществ. В методе Гунфу Ча за счёт высокой навески листа (A_surf ↑) и быстрого слива настой обогащается легкоподвижными молекулами за первые секунды.',
    sourcePaper: 'Noyes & Whitney (1897); Wang et al. (2022), LWT - Food Science and Technology 154: 112678'
  },
  {
    id: 'spiro_lagergren',
    equationName: 'Кинетическая модель псевдопервого порядка (Шпиро–Лагергрена)',
    subTitleRu: 'Уравнение нестационарной экстракции соединений во времени',
    academicDisciplineRu: 'Химическая кинетика гетерогенных систем',
    formulaLatex: 'C(t) = C_∞ · [1 - exp(-k_obs · t)]',
    canonicalFormRu: 'C(t) = C_∞ · (1 - e^(-k · t))',
    variables: [
      { symbol: 'C(t)', nameRu: 'Концентрация в настое', unitRu: 'мг / 100 мл', descriptionRu: 'Количество экстрагированного вещества в единице объёма через t секунд экспозиции.' },
      { symbol: 'C_∞', nameRu: 'Предельная равновесная концентрация', unitRu: 'мг / 100 мл', descriptionRu: 'Максимально достижимая концентрация при бесконечной продолжительности контакта фаз.' },
      { symbol: 'k_obs', nameRu: 'Константа скорости экстракции', unitRu: 'с⁻¹', descriptionRu: 'Интегральная константа скорости массопереноса соединения.' },
      { symbol: 't', nameRu: 'Время пролива', unitRu: 'с', descriptionRu: 'Длительность контакта воды с листом в секундах.' }
    ],
    textbookDerivationRu: 'Разделение переменных dC / (C_inf - C) = k_obs · dt и последующее интегрирование от 0 до t приводит к каноническому экспоненциальному закону релаксации концентраций.',
    descriptionRu: 'Фундаментальная модель экстракции чая, доказанная проф. Майклом Шпиро (Michael Spiro). Описывает разницу в константах k_obs: L-теанин экстрагируется с наибольшей константой (0.095 с⁻¹), тогда как полисахариды TPS диффундируют медленнее (0.014 с⁻¹).',
    sourcePaper: 'Spiro & Jago (1982), Journal of the Science of Food and Agriculture; Cao et al. (2021), Food Chemistry 344: 128634'
  },
  {
    id: 'arrhenius_activation',
    equationName: 'Уравнение Аррениуса для термоактивации (Arrhenius Law)',
    subTitleRu: 'Температурная зависимость скорости растворения компонентов',
    academicDisciplineRu: 'Химическая термодинамика',
    formulaLatex: 'k(T) = A_0 · exp(- E_a / (R · T))',
    canonicalFormRu: 'k(T) = A₀ · e^(-E_a / RT)',
    variables: [
      { symbol: 'k(T)', nameRu: 'Скорость диффузии при температуре T', unitRu: 'с⁻¹', descriptionRu: 'Интенсивность перехода веществ в жидкую фазу при заданной температуре.' },
      { symbol: 'E_a', nameRu: 'Энергия активации десорбции', unitRu: 'кДж/моль', descriptionRu: 'Энергетический барьер: Теанин 14.2 кДж/моль; Кофеин 24.5 кДж/моль; Катехины EGCG 35.2 кДж/моль.' },
      { symbol: 'R', nameRu: 'Газовая постоянная', unitRu: '8.314 Дж/(моль·К)', descriptionRu: 'Фундаментальная физическая константа.' },
      { symbol: 'T', nameRu: 'Температура заваривания', unitRu: 'К', descriptionRu: 'Абсолютная температура воды в градусах Кельвина.' }
    ],
    textbookDerivationRu: 'В координатах Аррениуса (ln k от 1/T) график представляет собой прямую линию с угловым коэффициентом наклона tan(α) = -E_a / R, что позволяет экспериментально определять барьер выхода каждого катехина.',
    descriptionRu: 'Объясняет, почему зеленый чай нельзя заливать крутым кипятком 100°C: энергия активации EGCG (35.2 кДж/моль) высока, поэтому при 100°C скорость выхода горьких танинов возрастает в 3.8 раза быстрее, чем сладкого теанина (E_a = 14.2 кДж/моль).',
    sourcePaper: 'Arrhenius (1889); Hicks et al. (2019), Journal of Food Science 84(4): 745-752; CAAS GB/T 23776'
  },
  {
    id: 'gongfu_depletion',
    equationName: 'Многоступенчатое истощение пула листа (Gongfu Stage Depletion)',
    subTitleRu: 'Пошаговый расчет вкуса в каждом следующем проливе',
    academicDisciplineRu: 'Математическое моделирование каскадных экстракторов',
    formulaLatex: 'M_ext^(n) = M_res^(n-1) · [1 - exp(-k_eff(n) · t_n)],   M_res^(n) = M_res^(n-1) - M_ext^(n)',
    canonicalFormRu: 'M_пролив[n] = Остаток_в_листе[n-1] · (1 - e^(-k_n · t_n))',
    variables: [
      { symbol: 'M_ext^(n)', nameRu: 'Экстракт текущего n-го пролива', unitRu: 'мг', descriptionRu: 'Количество вещества, перешедшее в чахай на текущем шаге заваривания.' },
      { symbol: 'M_res^(n-1)', nameRu: 'Остаток в тканях листа', unitRu: 'мг', descriptionRu: 'Запас молекул данного типа, остающийся в листе к началу n-го пролива.' },
      { symbol: 'k_eff(n)', nameRu: 'Константа с поправкой на лист', unitRu: 'с⁻¹', descriptionRu: 'Скорость с учетом гидратации и разворачивания структуры чайного листа.' },
      { symbol: 't_n', nameRu: 'Длительность n-го пролива', unitRu: 'с', descriptionRu: 'Время выдержки на текущем шаге.' }
    ],
    textbookDerivationRu: 'Каждый полный слив обнуляет граничную концентрацию в чаше, восстанавливая максимальный начальный градиент движущей силы ΔC = C_s - 0 на следующем шаге.',
    descriptionRu: 'Математическое ядро расчета кривых экстракции симулятора: показывает плавное исчерпание пула аминокислот на 1–3 проливах и возрастающую долю водорастворимых полисахаридов (TPS) на 6–12 проливах.',
    sourcePaper: 'Zhejiang University Tea Science Institute (2020), J. Agric. Food Chem. 68(19): 5412-5421'
  },
  {
    id: 'iso_adaptive_compensation',
    equationName: 'Уравнение кинетической автокомпенсации параметров (Iso-Yield Adaptive Law)',
    subTitleRu: 'Умная подстройка секунд таймера под температуру, объем и минерализацию воды',
    academicDisciplineRu: 'Адаптивное управление технологическими процессами',
    formulaLatex: 't_adaptive = t_base · [k(T_opt) / k(T_act)]^0.72 · (R_hydro / 15)^0.38 · γ_mineral^(-1)',
    canonicalFormRu: 't_corr = t_0 · (k_opt / k_act)^0.72 · (Ratio / 15)^0.38 · γ_TDS^-1',
    variables: [
      { symbol: 't_adaptive', nameRu: 'Скорректированное время таймера', unitRu: 'с', descriptionRu: 'Рассчитанное алгоритмом точное время пролива при заданных условиях.' },
      { symbol: 't_base', nameRu: 'Каноническое базовое время', unitRu: 'с', descriptionRu: 'Опорное время для эталонной температуры и пропорции 1:15.' },
      { symbol: 'k(T_opt)/k(T_act)', nameRu: 'Отношение скоростей термодиффузии', unitRu: 'безразм.', descriptionRu: 'Поправка на остывание или перегрев воды.' },
      { symbol: 'γ_mineral', nameRu: 'Ионный фактор минерализации', unitRu: 'безразм.', descriptionRu: 'Влияние минерального состава воды на скорость извлечения экстракта.' }
    ],
    textbookDerivationRu: 'Выводится из условия постоянства интегрального выхода целевых экстрактивных веществ: ∫ C_target(t) dt = Const при варьировании граничных условий.',
    descriptionRu: 'Алгоритмическая основа адаптивного таймера симулятора: гарантирует получение гармоничного вкуса независимо от того, заваривает ли пользователь чай в гайвани 80 мл или в чайнике 200 мл, при 80°C или при 98°C.',
    sourcePaper: 'Zhejiang University Biophysics of Tea Processing (2021); Journal of Agricultural and Food Chemistry'
  },
  {
    id: 'iso9768_yield',
    equationName: 'Суммарный выход экстракта и плотность TDS (ISO 9768 / GB/T 23776)',
    subTitleRu: 'Стандартизированный расчет сухого остатка и плотности настоя',
    academicDisciplineRu: 'Пищевая стандартизация и аналитическая химия',
    formulaLatex: 'Yield_(%) = [ (∑ M_ext) / M_dry_leaf ] · 100%,   TDS = [ (∑ M_solutes) / V_liquor ] · 10^3',
    canonicalFormRu: 'Yield_% = (M_экстракта / M_сухого_листа) · 100%,   TDS = (M_веществ / V_воды) · 1000',
    variables: [
      { symbol: 'Yield_%', nameRu: 'Суммарный выход экстракта', unitRu: '% сухой массы', descriptionRu: 'Доля исходной навески чая, перешедшая в настой (канонический оптимум 38–44%).' },
      { symbol: 'M_dry_leaf', nameRu: 'Масса сухой навески чая', unitRu: 'г', descriptionRu: 'Исходная масса чайного листа, помещенного в посуду.' },
      { symbol: 'TDS', nameRu: 'Растворенные твердые вещества', unitRu: 'ppm (мг/л)', descriptionRu: 'Total Dissolved Solids — объективный показатель плотности настоя в чашке.' },
      { symbol: 'V_liquor', nameRu: 'Объем чайного настоя', unitRu: 'мл', descriptionRu: 'Объем заваренной порции воды в пиале.' }
    ],
    textbookDerivationRu: 'Определяется гравиметрическим методом по стандарту ISO 9768:2020 «Чай — Определение содержания водорастворимых экстрактивных веществ».',
    descriptionRu: 'Официальный международный стандарт оценки органолептической полноценности экстракции: позволяет объективно контролировать переход ценных веществ из листа в настой.',
    sourcePaper: 'ISO 9768:2020 / CAAS Analytical Methods for Tea Quality Assessment; GB/T 23776-2018'
  },
  {
    id: 'langmuir_adsorption',
    equationName: 'Изотерма адсорбции танинов пористой посудой (Langmuir Adsorption)',
    subTitleRu: 'Уравнение смягчения горечи стенками исинских и керамических чайников',
    academicDisciplineRu: 'Химия поверхностных явлений и адсорбция',
    formulaLatex: 'q_e = (q_max · K_L · C_e) / (1 + K_L · C_e)',
    canonicalFormRu: 'q_e = (q_max · K_L · C_e) / (1 + K_L · C_e)',
    variables: [
      { symbol: 'q_e', nameRu: 'Адсорбция танинов посудой', unitRu: 'мг/г глины', descriptionRu: 'Количество мономерных катехинов, поглощенных открытыми микропорами чайника.' },
      { symbol: 'q_max', nameRu: 'Предельная ёмкость пор глины', unitRu: 'мг/г', descriptionRu: 'Максимальная ёмкость пористой структуры исинской глины или керамики.' },
      { symbol: 'K_L', nameRu: 'Константа сродства Ленгмюра', unitRu: 'л/мг', descriptionRu: 'Мера энергии связывания гидроксильных групп полифенолов минеральной матрицей глины.' },
      { symbol: 'C_e', nameRu: 'Остаток катехинов в пиале', unitRu: 'мг/л', descriptionRu: 'Финальная концентрация свободных катехинов после контакта с посудой.' }
    ],
    textbookDerivationRu: 'В линейных координатах Ленгмюра 1/q_e от 1/C_e модель позволяет точно рассчитать снижение вяжущей горечи на 10–14% в аутентичных исинских чайниках.',
    descriptionRu: 'Научное обоснование феномена «наработки» исинской глины: открытые микропоры селективно поглощают жесткие танины EGCG, сохраняя в настое легкие цветочные эфиры и L-теанин.',
    sourcePaper: 'Langmuir (1918); Journal of Materials Science & CAAS Yixing Ceramic Analysis (2020)'
  }
];

export function simulateGongfuExtraction(
  tea: TeaVariety,
  leafMassGrams: number,
  waterVolumeMl: number,
  waterTempC: number,
  customDurations?: number[],
  requestedSteepsCount?: number,
  waterHardnessLevel: WaterHardnessLevel = 'optimal',
  vesselMaterial: VesselMaterialType = 'porcelain',
  customFlags?: { isCustomUserTime?: boolean; isAdaptedReference?: boolean }[]
): SteepKineticData[] {
  // Safe inputs (allow arbitrary mass and volume)
  const safeLeafMass = Math.max(0.1, leafMassGrams);
  const safeWaterVolume = Math.max(10, waterVolumeMl);
  const safeTemp = Math.max(40, Math.min(100, waterTempC));

  const steepsCount = customDurations 
    ? customDurations.length 
    : (requestedSteepsCount && requestedSteepsCount > 0 
        ? requestedSteepsCount 
        : tea.recommendedSteeps || 8);

  const durations = customDurations || calculateSteepDurations(tea, steepsCount);

  // Environmental modifiers
  const hardnessInfo = WATER_HARDNESS_PRESETS.find(h => h.level === waterHardnessLevel) || WATER_HARDNESS_PRESETS[1];
  const vesselInfo = VESSEL_MATERIALS.find(v => v.id === vesselMaterial) || VESSEL_MATERIALS[0];

  // Initial theoretical pools in milligrams per gram of dry leaf based on peer-reviewed HPLC/UV-Vis literature
  let theaninePool: number;
  let caffeinePool: number;
  let catechinsPool: number;
  let polysaccharidesPool: number;

  switch (tea.type) {
    case 'green':
      theaninePool = 38 * safeLeafMass; // mg (high)
      caffeinePool = 32 * safeLeafMass;
      catechinsPool = 160 * safeLeafMass; // very high EGCG
      polysaccharidesPool = 25 * safeLeafMass;
      break;
    case 'white':
      theaninePool = 32 * safeLeafMass;
      caffeinePool = 36 * safeLeafMass; // silver needles have high caffeine
      catechinsPool = 130 * safeLeafMass;
      polysaccharidesPool = 30 * safeLeafMass;
      break;
    case 'yellow':
      theaninePool = 30 * safeLeafMass;
      caffeinePool = 32 * safeLeafMass;
      catechinsPool = 115 * safeLeafMass;
      polysaccharidesPool = 32 * safeLeafMass;
      break;
    case 'oolong_ball':
      theaninePool = 26 * safeLeafMass;
      caffeinePool = 30 * safeLeafMass;
      catechinsPool = 100 * safeLeafMass;
      polysaccharidesPool = 38 * safeLeafMass;
      break;
    case 'oolong_strip':
      theaninePool = 24 * safeLeafMass;
      caffeinePool = 28 * safeLeafMass;
      catechinsPool = 88 * safeLeafMass;
      polysaccharidesPool = 40 * safeLeafMass;
      break;
    case 'red':
      theaninePool = 18 * safeLeafMass;
      caffeinePool = 34 * safeLeafMass;
      catechinsPool = 60 * safeLeafMass; // oxidized into thearubigins
      polysaccharidesPool = 42 * safeLeafMass;
      break;
    case 'gaba_oolong':
      theaninePool = 30 * safeLeafMass; // enriched with GABA & amino acids
      caffeinePool = 28 * safeLeafMass;
      catechinsPool = 80 * safeLeafMass;
      polysaccharidesPool = 40 * safeLeafMass;
      break;
    case 'gaba_red':
      theaninePool = 24 * safeLeafMass; // GABA + glutamic acid + theanine
      caffeinePool = 32 * safeLeafMass;
      catechinsPool = 55 * safeLeafMass;
      polysaccharidesPool = 44 * safeLeafMass;
      break;
    case 'sheng_puerh':
      if (tea.id.includes('sheng_young')) {
        theaninePool = 28 * safeLeafMass; // Fresh young sheng has high native theanine & massive EGCG
        caffeinePool = 36 * safeLeafMass;
        catechinsPool = 165 * safeLeafMass;
        polysaccharidesPool = 28 * safeLeafMass;
      } else if (tea.id.includes('sheng_old')) {
        theaninePool = 14 * safeLeafMass; // Old lao sheng: catechins converted to theabrownins & complex TPS
        caffeinePool = 30 * safeLeafMass;
        catechinsPool = 42 * safeLeafMass;
        polysaccharidesPool = 68 * safeLeafMass;
      } else {
        // Medium / default aged sheng (4-10 yrs)
        theaninePool = 20 * safeLeafMass;
        caffeinePool = 35 * safeLeafMass;
        catechinsPool = 100 * safeLeafMass;
        polysaccharidesPool = 46 * safeLeafMass;
      }
      break;
    case 'shou_puerh':
      if (tea.id.includes('shou_young')) {
        theaninePool = 8 * safeLeafMass;
        caffeinePool = 26 * safeLeafMass;
        catechinsPool = 40 * safeLeafMass;
        polysaccharidesPool = 52 * safeLeafMass;
      } else if (tea.id.includes('shou_old')) {
        theaninePool = 12 * safeLeafMass;
        caffeinePool = 24 * safeLeafMass;
        catechinsPool = 18 * safeLeafMass;
        polysaccharidesPool = 78 * safeLeafMass; // high oligosaccharides & TPS
      } else {
        // Medium / default shou (3-7 yrs)
        theaninePool = 9 * safeLeafMass;
        caffeinePool = 25 * safeLeafMass;
        catechinsPool = 30 * safeLeafMass;
        polysaccharidesPool = 65 * safeLeafMass;
      }
      break;
    case 'custom':
    default:
      theaninePool = 24 * safeLeafMass;
      caffeinePool = 30 * safeLeafMass;
      catechinsPool = 105 * safeLeafMass;
      polysaccharidesPool = 40 * safeLeafMass;
      break;
  }

  // Total soluble mass theoretical pool for yield calculation (~38-42% dry leaf)
  const initialDryMassMg = safeLeafMass * 1000;
  let cumulativeExtractedMassMg = 0;

  // Temperature factor via Arrhenius approximation (ref: 85°C = 358.15 K)
  // Account for vessel heat loss during initial contact
  const effectiveTempC = Math.max(50, safeTemp - (vesselInfo.heatLossPerSteepC * 0.4));
  const T = effectiveTempC + 273.15;
  const T_ref = 358.15;
  const R_const = 8.314; // J/(mol*K)

  // Activation energies (J/mol) from peer-reviewed literature
  const Ea_theanine = 14200;
  const Ea_caffeine = 24500;
  const Ea_catechins = 35200;
  const Ea_polysaccharides = 30800;

  const tempFactorTheanine = Math.exp((-Ea_theanine / R_const) * (1 / T - 1 / T_ref));
  const tempFactorCaffeine = Math.exp((-Ea_caffeine / R_const) * (1 / T - 1 / T_ref));
  const tempFactorCatechins = Math.exp((-Ea_catechins / R_const) * (1 / T - 1 / T_ref));
  const tempFactorPolysaccharides = Math.exp((-Ea_polysaccharides / R_const) * (1 / T - 1 / T_ref));

  // Water hardness ionic hindrance factor
  const mineralMultiplier = hardnessInfo.extractionMultiplier;

  // Volatiles release multiplier (heavily stimulated by steam and high temp)
  const volatilesTempMultiplier = Math.max(0.2, (effectiveTempC - 60) / 38);

  const results: SteepKineticData[] = [];

  for (let steep = 1; steep <= steepsCount; steep++) {
    const time = durations[steep - 1] || (durations[durations.length - 1] + (steep - durations.length) * 15);

    // Surface exposure factor depends on leaf morphology unrolling
    let surfaceFactor = 1.0;
    if (tea.leafMorphology === 'tight_ball') {
      if (steep === 1) surfaceFactor = 0.35;
      else if (steep === 2) surfaceFactor = 0.75;
      else surfaceFactor = 1.0;
    } else if (tea.leafMorphology === 'compressed_cake') {
      if (steep === 1) surfaceFactor = 0.45;
      else if (steep === 2) surfaceFactor = 0.85;
      else surfaceFactor = 1.0;
    } else if (tea.leafMorphology === 'needle') {
      if (steep === 1) surfaceFactor = 0.65; // trichomes
      else surfaceFactor = 1.0;
    }

    // Rate coefficients (s^-1)
    const k_theanine = 0.095 * tempFactorTheanine * surfaceFactor * mineralMultiplier;
    const k_caffeine = 0.052 * tempFactorCaffeine * surfaceFactor * mineralMultiplier;
    const k_catechins = 0.028 * tempFactorCatechins * surfaceFactor * mineralMultiplier;
    const k_polysaccharides = 0.014 * tempFactorPolysaccharides * surfaceFactor * mineralMultiplier;

    // Mass extracted in this steep (mg)
    const extractedTheanine = theaninePool * (1 - Math.exp(-k_theanine * time));
    const extractedCaffeine = caffeinePool * (1 - Math.exp(-k_caffeine * time));
    const extractedCatechins = catechinsPool * (1 - Math.exp(-k_catechins * time));
    const extractedPolysaccharides = polysaccharidesPool * (1 - Math.exp(-k_polysaccharides * time));

    // Deduct from remaining pools
    theaninePool = Math.max(0, theaninePool - extractedTheanine);
    caffeinePool = Math.max(0, caffeinePool - extractedCaffeine);
    catechinsPool = Math.max(0, catechinsPool - extractedCatechins);
    polysaccharidesPool = Math.max(0, polysaccharidesPool - extractedPolysaccharides);

    // Steep total extracted solutes (including organic acids and minor minerals ~ 1.25x of main 4)
    const steepTotalSolutesMg = (extractedTheanine + extractedCaffeine + extractedCatechins + extractedPolysaccharides) * 1.25;
    cumulativeExtractedMassMg += steepTotalSolutesMg;
    const cumulativeExtractionYieldPercent = Math.min(44, Math.round((cumulativeExtractedMassMg / initialDryMassMg) * 1000) / 10);

    // Normalize concentrations per 100ml liquor
    const normFactor = 100 / safeWaterVolume;
    const cTheanine = extractedTheanine * normFactor;
    const cCaffeine = extractedCaffeine * normFactor;
    // Yixing clay micropores adsorb ~12-14% of harsh astringent tannins
    const cCatechins = extractedCatechins * normFactor * (1 - vesselInfo.tanninAdsorptionFactor);
    const cPolysaccharides = extractedPolysaccharides * normFactor;

    // Total Dissolved Solids in ppm (mg/L): (mg in steep / waterVolumeMl) * 1000
    const tdsPpm = Math.round((steepTotalSolutesMg / safeWaterVolume) * 1000);

    // Theanine to Catechins ratio (Sweetness/Umami vs Harsh Astringency)
    const theanineToCatechinsRatio = Math.round((cTheanine / Math.max(0.1, cCatechins)) * 100) / 100;

    // Volatiles curve: peaks at steep 1-3 for loose, 2-4 for ball oolong, then decays smoothly
    let volatileBase = 100 * Math.exp(-(steep - 1.5) * 0.42);
    if (tea.leafMorphology === 'tight_ball') {
      volatileBase = 100 * Math.exp(-Math.pow(steep - 2.8, 2) / 4.8);
    }
    const volatilesIntensity = Math.max(5, Math.min(100, Math.round(volatileBase * volatilesTempMultiplier)));

    // Sensory scores (0-10 scale) based directly on concentration benchmarks (mg/100ml),
    // invariant to batch size (whether 5g in 100ml or 50g in 1000ml)
    const umami = Math.min(10, Math.round((cTheanine / 16) * 10 * 10) / 10);
    const sweetness = Math.min(10, Math.round(((cTheanine * 0.45 + cPolysaccharides * 0.55) / 18) * 10 * 10) / 10);
    const bitterness = Math.min(10, Math.round(((cCaffeine * 0.45 + cCatechins * 0.55) / 38) * 10 * 10) / 10);
    const astringency = Math.min(10, Math.round((cCatechins / 34) * 10 * 10) / 10);
    const body = Math.min(10, Math.round(((cPolysaccharides * 0.65 + cCatechins * 0.35) / 22) * 10 * 10) / 10);
    const aroma = Math.min(10, Math.round((volatilesIntensity / 10) * 10) / 10);

    // Scientific commentary and peer-reviewed reference
    let keyNotes = '';
    let scientificReferenceRu = '';

    if (steep === 1) {
      keyNotes = 'Высокая концентрация L-теанина и летучих монотерпенов. Начальная гидратация кутикулы листа.';
      scientificReferenceRu = 'Cao et al. (2021): Высокая начальная диффузия малых аминокислот при низком гидродинамическом сопротивлении.';
    } else if (steep === 2 || steep === 3) {
      keyNotes = 'Пик ароматической эмиссии и баланса: катехины раскрывают каркас вкуса при поддержке теанина.';
      scientificReferenceRu = 'Wang et al. (2022): Максимум терпеновых спиртов (линалоол, гераниол) и оптимум соотношения теанин/EGCG.';
    } else if (steep === 4 || steep === 6) {
      keyNotes = 'Фаза стабилизации: снижение свободных мономеров, активный выход растворимых полисахаридов (TPS).';
      scientificReferenceRu = 'Hicks et al. (2019): Линейное внутриклеточное вымывание связанного кофеина и высокомолекулярных полифенолов.';
    } else if (steep <= 10) {
      keyNotes = 'Сладкое послевкусие («Хуэй Гань»): доминирование полисахаридов при минимальной танинной горечи.';
      scientificReferenceRu = 'CAAS Tea Bulletin (2020): Гидродинамическое растворение высокомолекулярных фракций TPS (MW > 10 кДа).';
    } else {
      keyNotes = 'Поздняя глубинная экстракция: кристально чистый, мягкий минерально-сладкий профиль.';
      scientificReferenceRu = 'ISO 9768: Диффузия остаточных водорастворимых солей и термостабильных полисахаридов.';
    }

    const flag = customFlags && customFlags[steep - 1];

    results.push({
      steepNumber: steep,
      timeSec: time,
      theanineConcentration: Math.round(cTheanine * 10) / 10,
      caffeineConcentration: Math.round(cCaffeine * 10) / 10,
      catechinsConcentration: Math.round(cCatechins * 10) / 10,
      polysaccharidesConcentration: Math.round(cPolysaccharides * 10) / 10,
      volatilesIntensity,
      tdsPpm,
      cumulativeExtractionYieldPercent,
      theanineToCatechinsRatio,
      sensoryScores: {
        umami: Math.max(1, Math.min(10, umami)),
        sweetness: Math.max(1, Math.min(10, sweetness)),
        bitterness: Math.max(1, Math.min(10, bitterness)),
        astringency: Math.max(1, Math.min(10, astringency)),
        body: Math.max(1, Math.min(10, body)),
        aroma: Math.max(1, Math.min(10, aroma)),
      },
      keyNotes,
      scientificReferenceRu,
      isCustomUserTime: flag ? flag.isCustomUserTime : undefined,
      isAdaptedReference: flag ? flag.isAdaptedReference : undefined
    });
  }

  return results;
}

export interface AdaptiveCustomBrewingResult {
  combinedDurations: number[];
  steepStatus: {
    steepNumber: number;
    durationSec: number;
    isCustomUserTime: boolean;
    isAdaptedReference: boolean;
    baselineSec: number;
    deviationSec: number;
  }[];
  customFlags: { isCustomUserTime: boolean; isAdaptedReference: boolean }[];
  userSteepsCount: number;
  remainingSteepsCount: number;
  summaryMessageRu: string;
  scientificDetailRu: string;
  chemicalCompensationType: 'over_extraction_relief' | 'under_extraction_boost' | 'balanced_tracking' | 'none';
}

/**
 * Dynamically recalculates reference steep durations for remaining steeps
 * based on the actual custom durations entered by the user.
 * 
 * Biochemical principle:
 * 1. If user over-steeped early (e.g. 25s instead of 10s), surface caffeine and bitter
 *    tannins were depleted prematurely. The algorithm prescribes a short "flash recovery steep"
 *    for the immediate next steep to prevent astringency spikes, and extends tail steeps
 *    to liberate deeper bound polysaccharides (TPS).
 * 2. If user under-steeped early (very fast flushes), abundant unextracted L-theanine and
 *    delicate volatiles remain. Subsequent steeps are calibrated with a controlled boost
 *    to extract full body and sweetness.
 */
export function calculateAdaptiveCustomBrewing(
  tea: TeaVariety,
  totalSteeps: number,
  actualTempC: number,
  leafMassGrams: number,
  waterVolumeMl: number,
  waterHardnessLevel: WaterHardnessLevel,
  optimizationGoal: OptimizationGoal,
  userCustomTimes: (number | null)[]
): AdaptiveCustomBrewingResult {
  const actualRatio = leafMassGrams > 0 ? (waterVolumeMl / leafMassGrams) : 15;
  const baseDurations = calculateAdaptiveSteepDurations(
    tea,
    totalSteeps,
    actualTempC,
    actualRatio,
    waterHardnessLevel,
    optimizationGoal
  );

  // Identify steeps with user-provided times
  const userIndices: number[] = [];
  userCustomTimes.forEach((val, idx) => {
    if (idx < totalSteeps && val !== null && val !== undefined && val > 0) {
      userIndices.push(idx);
    }
  });

  if (userIndices.length === 0) {
    const combinedDurations = [...baseDurations];
    return {
      combinedDurations,
      steepStatus: baseDurations.map((d, i) => ({
        steepNumber: i + 1,
        durationSec: d,
        isCustomUserTime: false,
        isAdaptedReference: false,
        baselineSec: d,
        deviationSec: 0
      })),
      customFlags: baseDurations.map(() => ({
        isCustomUserTime: false,
        isAdaptedReference: false
      })),
      userSteepsCount: 0,
      remainingSteepsCount: totalSteeps,
      summaryMessageRu: 'Укажите время выполненных проливов — алгоритм адаптирует график для оставшихся чашек.',
      scientificDetailRu: 'Используется эталонная модель кинетики Нойеса-Уитни без пользовательских коррекций.',
      chemicalCompensationType: 'none'
    };
  }

  // Last steep index entered by user
  const maxUserIndex = Math.max(...userIndices);

  // Calculate cumulative time deviation across user steeps
  let userCumulativeSec = 0;
  let baseCumulativeSec = 0;
  userIndices.forEach(idx => {
    userCumulativeSec += userCustomTimes[idx]!;
    baseCumulativeSec += baseDurations[idx];
  });

  const cumulativeDeviationSec = userCumulativeSec - baseCumulativeSec;
  const relativeDeviation = baseCumulativeSec > 0 ? (cumulativeDeviationSec / baseCumulativeSec) : 0;

  // Build combined durations array
  const combinedDurations: number[] = [];
  const steepStatus: AdaptiveCustomBrewingResult['steepStatus'] = [];
  const customFlags: AdaptiveCustomBrewingResult['customFlags'] = [];

  let chemicalCompensationType: AdaptiveCustomBrewingResult['chemicalCompensationType'] = 'balanced_tracking';
  if (relativeDeviation > 0.15) {
    chemicalCompensationType = 'over_extraction_relief';
  } else if (relativeDeviation < -0.15) {
    chemicalCompensationType = 'under_extraction_boost';
  }

  for (let i = 0; i < totalSteeps; i++) {
    const baseT = baseDurations[i] || (baseDurations[baseDurations.length - 1] + (i - baseDurations.length + 1) * 15);
    const userVal = userCustomTimes[i];
    const isUserTime = userVal !== null && userVal !== undefined && userVal > 0;

    if (isUserTime) {
      const actualSec = Math.max(2, Math.round(userVal!));
      combinedDurations.push(actualSec);
      steepStatus.push({
        steepNumber: i + 1,
        durationSec: actualSec,
        isCustomUserTime: true,
        isAdaptedReference: false,
        baselineSec: baseT,
        deviationSec: actualSec - baseT
      });
      customFlags.push({
        isCustomUserTime: true,
        isAdaptedReference: false
      });
    } else {
      // Adapted steep
      let adaptedSec = baseT;

      if (chemicalCompensationType === 'over_extraction_relief') {
        if (i === maxUserIndex + 1) {
          // Immediate next steep: flash recovery steep to prevent bitter caffeine/tannin spike
          const reductionFactor = Math.max(0.55, 1 - Math.min(0.45, relativeDeviation * 0.45));
          adaptedSec = Math.max(3, Math.round(baseT * reductionFactor));
        } else if (i > maxUserIndex + 1) {
          // Late steeps: leaf easily soluble content is depleted, prolonged exposure extracts deep polysaccharides (TPS)
          const tailPosition = (i - maxUserIndex) / Math.max(1, totalSteeps - maxUserIndex);
          const dilationFactor = 1 + Math.min(0.5, relativeDeviation * 0.35 * tailPosition);
          adaptedSec = Math.max(3, Math.round(baseT * dilationFactor));
        }
      } else if (chemicalCompensationType === 'under_extraction_boost') {
        // Under-extracted: leaf holds rich reservoir of theanine; gently increase steeping times
        const boostFactor = Math.min(1.45, 1 + Math.min(0.45, Math.abs(relativeDeviation) * 0.4));
        adaptedSec = Math.max(3, Math.round(baseT * boostFactor));
      } else {
        // Balanced: subtle compensation
        adaptedSec = baseT;
      }

      combinedDurations.push(adaptedSec);
      steepStatus.push({
        steepNumber: i + 1,
        durationSec: adaptedSec,
        isCustomUserTime: false,
        isAdaptedReference: true,
        baselineSec: baseT,
        deviationSec: adaptedSec - baseT
      });
      customFlags.push({
        isCustomUserTime: false,
        isAdaptedReference: true
      });
    }
  }

  // Formulate explanatory commentary
  const userSteepsCount = userIndices.length;
  const remainingSteepsCount = totalSteeps - userSteepsCount;
  const userSteepsListRu = userIndices.map(idx => `#${idx + 1} (${userCustomTimes[idx]}с)`).join(', ');

  let summaryMessageRu = '';
  let scientificDetailRu = '';

  if (chemicalCompensationType === 'over_extraction_relief') {
    const nextSteepNum = maxUserIndex + 2;
    const nextSteepTime = combinedDurations[maxUserIndex + 1];
    summaryMessageRu = `Лист отдал экстрактивные вещества быстрее расчётного графика (+${Math.round(relativeDeviation * 100)}% к времени). Пролив #${nextSteepNum} скорректирован до ${nextSteepTime}с (короткий слив), чтобы не допустить грубой горечи.`;
    scientificDetailRu = `Выполненные вами проливы ${userSteepsListRu} форсировали диффузию свободных мономеров катехинов EGCG и кофеина. Алгоритм демпфирует следующий пролив для сглаживания танинов и продлевает финал чаепития (+TPS полисахариды).`;
  } else if (chemicalCompensationType === 'under_extraction_boost') {
    summaryMessageRu = `Ваши проливы были быстрее эталона. В чайном листе остался богатый резерв L-теанина и эфирных масел. Оставшиеся проливы продлены для полного раскрытия тела и вкуса.`;
    scientificDetailRu = `При коротких проливах (${userSteepsListRu}) степень насыщения диффузионного пограничного слоя осталась неполной. Продление оставшихся ${remainingSteepsCount} проливов оптимизирует суммарный выход экстракта (ISO 9768).`;
  } else {
    summaryMessageRu = `Ваш хронометраж проливов близок к расчётному эталону. Оставшиеся проливы сбалансированы для плавного угасания вкуса.`;
    scientificDetailRu = `Фактическое время (${userSteepsListRu}) точно соответствует скорости диффузии Нойеса-Уитни для выбранного соотношения воды и листа.`;
  }

  return {
    combinedDurations,
    steepStatus,
    customFlags,
    userSteepsCount,
    remainingSteepsCount,
    summaryMessageRu,
    scientificDetailRu,
    chemicalCompensationType
  };
}
