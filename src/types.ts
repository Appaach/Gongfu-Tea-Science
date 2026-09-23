export type TeaType = 
  | 'green' 
  | 'white' 
  | 'yellow' 
  | 'oolong_ball' 
  | 'oolong_strip' 
  | 'red' 
  | 'sheng_puerh' 
  | 'shou_puerh'
  | 'heicha'
  | 'gaba_oolong'
  | 'gaba_red'
  | 'custom';

export type TeaCategoryGroup = 'specific' | 'generic';

export interface TeaVariety {
  id: string;
  nameRu: string;
  transcriptionRu?: string; // Chinese pinyin transcription in Cyrillic for shop searching (e.g. "Да Хун Пао", "Лунцзин")
  nameZh: string;
  namePinyin: string;
  type: TeaType;
  typeNameRu: string;
  origin: string;
  cultivar: string;
  oxidationLevel: string; // e.g. "0%", "15-20%", "40-60%", "100%", "Постферментация"
  leafMorphology: 'flat' | 'needle' | 'twisted_strip' | 'tight_ball' | 'compressed_cake';
  optimalTemp: number; // in Celsius
  tempRange: [number, number];
  defaultMass: number; // in grams
  defaultVolume: number; // in ml
  recommendedVesselRu: string;
  keySensoryNotes: string[];
  scientificDescription: string;
  recommendedSteeps: number;
  categoryGroup?: TeaCategoryGroup;
  generalExamplesRu?: string[]; // Examples of teas matching this general archetype
}

export interface ChemicalCompoundInfo {
  id: string;
  nameRu: string;
  nameEn: string;
  chemicalFormula: string;
  molecularWeight: string;
  solubilityTempThreshold: string;
  sensoryRoleRu: string;
  extractionBehaviorRu: string;
  primaryTeas: string[];
}

export interface SteepKineticData {
  steepNumber: number;
  timeSec: number;
  theanineConcentration: number; // mg/100ml
  caffeineConcentration: number; // mg/100ml
  catechinsConcentration: number; // mg/100ml
  polysaccharidesConcentration: number; // mg/100ml
  volatilesIntensity: number; // score 0-100
  tdsPpm: number; // Total Dissolved Solids in mg/L (ppm)
  cumulativeExtractionYieldPercent: number; // % of total dry leaf mass extracted so far
  theanineToCatechinsRatio: number; // Umami-to-astringency balance index
  sensoryScores: {
    umami: number; // 0-10
    sweetness: number; // 0-10
    bitterness: number; // 0-10
    astringency: number; // 0-10
    body: number; // 0-10
    aroma: number; // 0-10
  };
  keyNotes: string;
  scientificReferenceRu: string;
  isCustomUserTime?: boolean; // Duration was entered manually by the user
  isAdaptedReference?: boolean; // Duration was dynamically adapted by algorithm based on user's actual past steeps
}

export interface ResearchPaper {
  id: string;
  titleRu: string;
  titleEn: string;
  authors: string;
  journal: string;
  year: number;
  doi?: string;
  keyFindingRu: string;
  methodologyRu: string;
  practicalApplicationRu: string;
  category: 'temperature' | 'kinetics' | 'caffeine' | 'aroma' | 'ratio';
}

export type WaterHardnessLevel = 'soft' | 'optimal' | 'hard';

export interface WaterHardnessInfo {
  level: WaterHardnessLevel;
  nameRu: string;
  tdsPpmRange: string;
  extractionMultiplier: number;
  scientificImpactRu: string;
}

export type VesselMaterialType = 
  | 'ceramic_regular'
  | 'glass_regular'
  | 'porcelain' 
  | 'ceramic_thick' 
  | 'yixing_clay' 
  | 'glass' 
  | 'metal_silver' 
  | 'cast_iron' 
  | 'thermos';

export interface VesselMaterialInfo {
  id: VesselMaterialType;
  nameRu: string;
  heatLossPerSteepC: number;
  tanninAdsorptionFactor: number;
  bestForRu: string;
  scientificImpactRu: string;
}

export type OptimizationGoal = 'balanced' | 'umami_sweetness' | 'body_density' | 'aroma_peak' | 'max_longevity';

export interface OptimizationPreset {
  id: OptimizationGoal;
  nameRu: string;
  targetRatio: number; // e.g. 15 for 1:15
  tempOffsetC: number; // e.g. -3 for cooler (theanine) or +2 for hotter (body)
  timeFactor: number; // multiplier on base durations
  descriptionRu: string;
}

export interface FormulaVariable {
  symbol: string;
  nameRu: string;
  unitRu: string;
  descriptionRu: string;
  colorClass?: string;
}

export interface ScientificModelExplanation {
  id: string;
  equationName: string;
  subTitleRu: string;
  academicDisciplineRu: string;
  formulaLatex: string;
  canonicalFormRu?: string;
  variables: FormulaVariable[];
  textbookDerivationRu: string;
  descriptionRu: string;
  sourcePaper: string;
}

export interface ChemicalKineticProperty {
  id: string;
  nameRu: string;
  nameEn: string;
  formula: string;
  molecularWeight: number; // g/mol
  activationEnergy: number; // kJ/mol
  k_rate: number; // s^-1 base rate at 85°C
  diffusionSpeedRatio: string;
  tasteRoleRu: string;
  temperatureSensitivityRu: string;
  colorClass: string;
}
