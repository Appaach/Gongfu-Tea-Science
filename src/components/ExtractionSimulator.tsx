import { useState, useMemo, useCallback, memo } from 'react';
import { 
  TEA_VARIETIES, 
  GENERIC_TEA_ARCHETYPES, 
  ALL_TEA_OPTIONS, 
  WATER_HARDNESS_PRESETS,
  VESSEL_MATERIALS,
  OPTIMIZATION_PRESETS
} from '../data/teaData';
import { 
  simulateGongfuExtraction, 
  optimizeBrewingParametersMulti,
  calculateAdaptiveCustomBrewing
} from '../utils/extractionKinetics';
import { matchTeaSearch } from '../utils/teaSearch';

interface SteepBubbleCardProps {
  idx: number;
  steepNum: number;
  isSelected: boolean;
  baselineSec: number;
  statusObj?: { deviationSec: number; isAdaptedReference?: boolean };
  userVal: number | null;
  effectiveSec: number;
  isCustomTimingMode: boolean;
  onSelect: (idx: number) => void;
  onSetCustomTime: (idx: number, timeSec: number | null) => void;
}

// Unified, memoized steep bubble card for both Standard and Custom timing modes
const SteepBubbleCard = memo(function SteepBubbleCard({
  idx,
  steepNum,
  isSelected,
  baselineSec,
  statusObj,
  userVal,
  effectiveSec,
  isCustomTimingMode,
  onSelect,
  onSetCustomTime,
}: SteepBubbleCardProps) {
  const isCustom = userVal !== null && userVal !== undefined && userVal > 0;
  const isAdapted = !isCustom && Boolean(statusObj?.isAdaptedReference);

  // Local typing draft state so input changes never cause full-app re-renders
  const [localDraft, setLocalDraft] = useState<string | null>(null);

  const displayVal = localDraft !== null
    ? localDraft
    : (isCustom ? String(userVal) : String(effectiveSec));

  return (
    <div
      onClick={() => onSelect(idx)}
      className={`group relative rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer select-none shadow-2xs ${
        isSelected
          ? 'ring-2 ring-amber-800 border-amber-800 bg-amber-50/40 shadow-xs'
          : ''
      } ${
        isCustom
          ? 'bg-amber-100/80 border-amber-400/80 text-amber-950'
          : isAdapted
          ? 'bg-amber-50/80 border-amber-300 text-amber-900 hover:bg-amber-50'
          : 'bg-white border-stone-200 hover:border-amber-300 hover:bg-amber-50/20 text-stone-800'
      }`}
    >
      {/* Top: Steep Number & Status Badge */}
      <div className="flex items-center justify-between gap-1">
        <span className={`text-[11px] font-bold font-mono ${
          isSelected ? 'text-amber-950 font-black' : isCustom ? 'text-amber-950' : isAdapted ? 'text-amber-900' : 'text-stone-700'
        }`}>
          #{steepNum}
        </span>

        {isCustomTimingMode ? (
          isCustom ? (
            <div className="flex items-center space-x-1">
              <span className="text-[9px] uppercase tracking-wider font-bold bg-amber-800 text-amber-50 px-1 py-0.2 rounded leading-none">
                факт
              </span>
              <button
                type="button"
                title="Стереть и вернуть эталон"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalDraft(null);
                  onSetCustomTime(idx, null);
                }}
                className="w-3.5 h-3.5 rounded-full bg-amber-200/90 hover:bg-amber-300 text-amber-900 text-[9px] font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : isAdapted ? (
            <span className="text-[9px] uppercase tracking-wider font-bold bg-amber-200/90 text-amber-900 border border-amber-300/80 px-1 py-0.2 rounded leading-none">
              адапт
            </span>
          ) : (
            <span className="text-[9px] text-stone-400 font-medium px-0.5 leading-none">
              эталон
            </span>
          )
        ) : (
          <span className="text-[9px] text-stone-400 font-medium px-0.5 leading-none">
            эталон
          </span>
        )}
      </div>

      {/* Center: Exposure time or Interactive Input */}
      <div 
        className="my-1 flex items-center justify-center space-x-1"
        onClick={(e) => isCustomTimingMode && e.stopPropagation()}
      >
        {isCustomTimingMode ? (
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={displayVal}
            placeholder={String(baselineSec)}
            onFocus={() => {
              onSelect(idx);
              if (localDraft === null) {
                setLocalDraft(isCustom ? String(userVal) : String(effectiveSec));
              }
            }}
            onChange={(e) => {
              const filtered = e.target.value.replace(/\D/g, '');
              setLocalDraft(filtered);
            }}
            onBlur={() => {
              if (localDraft !== null) {
                const clean = localDraft.trim();
                if (clean === '' || Number(clean) <= 0 || isNaN(Number(clean))) {
                  onSetCustomTime(idx, null);
                } else {
                  const valNum = Math.min(600, Math.max(1, parseInt(clean, 10)));
                  onSetCustomTime(idx, valNum);
                }
                setLocalDraft(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              } else if (e.key === 'Escape') {
                setLocalDraft(null);
              }
            }}
            className={`w-11 text-center font-mono font-bold text-sm py-0.5 px-0.5 rounded-md border focus:outline-hidden transition-all ${
              isCustom
                ? 'bg-white border-amber-400 text-amber-950 focus:ring-2 focus:ring-amber-500/40 shadow-2xs'
                : isAdapted
                ? 'bg-white border-amber-300 text-amber-900 focus:ring-2 focus:ring-amber-400/40'
                : 'bg-stone-50 border-stone-200 text-stone-800 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30'
            } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
          />
        ) : (
          <span className={`text-sm font-mono font-bold ${
            isSelected ? 'text-amber-950 font-black' : 'text-stone-800'
          }`}>
            {effectiveSec}
          </span>
        )}
        <span className="text-xs font-mono font-bold text-amber-900/60 select-none">
          с
        </span>
      </div>

      {/* Bottom: Benchmark comparison if custom/adapted, or uniform spacing */}
      {isCustomTimingMode && (isCustom || isAdapted) ? (
        <div className="pt-0.5 border-t border-amber-200/50 text-center flex items-center justify-center gap-1 leading-none">
          <span className="text-[9.5px] text-stone-400">
            эт: <strong className="font-mono text-stone-600 font-medium">{baselineSec}с</strong>
          </span>
          {isCustom && statusObj && statusObj.deviationSec !== 0 && (
            <span className={`text-[9px] font-mono font-bold ${
              statusObj.deviationSec > 0 ? 'text-amber-800' : 'text-amber-700'
            }`}>
              {statusObj.deviationSec > 0 ? `+${statusObj.deviationSec}` : `${statusObj.deviationSec}`}
            </span>
          )}
          {isAdapted && statusObj && statusObj.deviationSec !== 0 && (
            <span className={`text-[9px] font-mono font-bold ${
              statusObj.deviationSec > 0 ? 'text-amber-700' : 'text-amber-600'
            }`}>
              {statusObj.deviationSec > 0 ? `+${statusObj.deviationSec}` : `${statusObj.deviationSec}`}
            </span>
          )}
        </div>
      ) : (
        <div className="pt-0.5 text-center flex items-center justify-center leading-none opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] text-stone-400 font-medium">пролив</span>
        </div>
      )}
    </div>
  );
});
import { 
  TeaVariety, 
  TeaCategoryGroup, 
  WaterHardnessLevel, 
  VesselMaterialType, 
  OptimizationGoal 
} from '../types';
import { 
  Flame, 
  Droplet, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  ShieldAlert, 
  Info, 
  TrendingUp, 
  Award,
  Hash,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Clock,
  Waves,
  Coffee,
  Feather,
  ChevronDown,
  ChevronUp,
  Check,
  Search,
  X,
  Lightbulb,
  CheckCircle
} from 'lucide-react';

export const ExtractionSimulator: React.FC = () => {
  // Tea Category Tab: 'generic' (archetypes) first, then 'specific' (popular teas)
  const [activeCategoryTab, setActiveCategoryTab] = useState<TeaCategoryGroup>('generic');
  const [selectedTeaId, setSelectedTeaId] = useState<string>('generic_oolong_ball');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Find active tea from the comprehensive list
  const selectedTea = useMemo(() => {
    return ALL_TEA_OPTIONS.find((t) => t.id === selectedTeaId) || GENERIC_TEA_ARCHETYPES[0];
  }, [selectedTeaId]);

  // Key Environmental Parameters (Water Hardness & Vessel Material)
  const [waterHardness, setWaterHardness] = useState<WaterHardnessLevel>('optimal');
  const [vesselMaterial, setVesselMaterial] = useState<VesselMaterialType>('porcelain');
  const [isVesselDropdownOpen, setIsVesselDropdownOpen] = useState(false);
  const [isGoalDropdownOpen, setIsGoalDropdownOpen] = useState(false);

  // Filtered generic archetypes based on search query and category filter
  const filteredGenericTeas = useMemo(() => {
    return GENERIC_TEA_ARCHETYPES.filter((tea) => {
      if (selectedTypeFilter !== 'all') {
        if (selectedTypeFilter === 'oolong' && !tea.type.includes('oolong')) return false;
        else if (selectedTypeFilter === 'gaba' && !tea.type.startsWith('gaba')) return false;
        else if (selectedTypeFilter === 'puerh' && !tea.type.includes('puerh')) return false;
        else if (selectedTypeFilter !== 'oolong' && selectedTypeFilter !== 'gaba' && selectedTypeFilter !== 'puerh' && tea.type !== selectedTypeFilter) {
          return false;
        }
      }
      return matchTeaSearch(tea, searchQuery);
    });
  }, [searchQuery, selectedTypeFilter]);

  // Filtered popular teas based on search query and category filter
  const filteredPopularTeas = useMemo(() => {
    return TEA_VARIETIES.filter((tea) => {
      if (selectedTypeFilter !== 'all') {
        if (selectedTypeFilter === 'oolong' && !tea.type.includes('oolong')) return false;
        else if (selectedTypeFilter === 'gaba' && !tea.type.startsWith('gaba')) return false;
        else if (selectedTypeFilter === 'puerh' && !tea.type.includes('puerh')) return false;
        else if (selectedTypeFilter !== 'oolong' && selectedTypeFilter !== 'gaba' && selectedTypeFilter !== 'puerh' && tea.type !== selectedTypeFilter) {
          return false;
        }
      }
      return matchTeaSearch(tea, searchQuery);
    });
  }, [searchQuery, selectedTypeFilter]);

  // Unified Multi-Parameter Optimizer State (Single source of truth)
  const [fixVolume, setFixVolume] = useState<boolean>(true);
  const [fixedVolumeVal, setFixedVolumeVal] = useState<number>(selectedTea.defaultVolume);

  const [fixMass, setFixMass] = useState<boolean>(false);
  const [fixedMassVal, setFixedMassVal] = useState<number>(selectedTea.defaultMass);

  const [fixTemp, setFixTemp] = useState<boolean>(false);
  const [fixedTempVal, setFixedTempVal] = useState<number>(selectedTea.optimalTemp);

  const [fixSteeps, setFixSteeps] = useState<boolean>(false);
  const [fixedSteepsVal, setFixedSteepsVal] = useState<number>(selectedTea.recommendedSteeps || 8);

  // Temporary string state while typing to allow clearing the inputs completely with backspace/delete
  const [rawVolumeStr, setRawVolumeStr] = useState<string | null>(null);
  const [rawMassStr, setRawMassStr] = useState<string | null>(null);
  const [rawTempStr, setRawTempStr] = useState<string | null>(null);
  const [rawSteepsStr, setRawSteepsStr] = useState<string | null>(null);

  const [optimizationGoal, setOptimizationGoal] = useState<OptimizationGoal>('balanced');
  const [selectedSteepIndex, setSelectedSteepIndex] = useState<number>(0);

  // When tea changes, update default parameters and non-fixed inputs
  const handleTeaChange = (tea: TeaVariety) => {
    setSelectedTeaId(tea.id);
    setSelectedSteepIndex(0);

    setRawVolumeStr(null);
    setRawMassStr(null);
    setRawTempStr(null);
    setRawSteepsStr(null);

    if (!fixVolume) setFixedVolumeVal(tea.defaultVolume);
    if (!fixMass) setFixedMassVal(tea.defaultMass);
    if (!fixTemp) setFixedTempVal(tea.optimalTemp);
    if (!fixSteeps) setFixedSteepsVal(tea.recommendedSteeps || 8);
  };

  const handleCategoryTabChange = (tab: TeaCategoryGroup) => {
    setActiveCategoryTab(tab);
    if (tab === 'generic') {
      handleTeaChange(GENERIC_TEA_ARCHETYPES[0]);
    } else if (tab === 'specific') {
      handleTeaChange(TEA_VARIETIES[0]);
    }
  };

  const resetToOptimized = () => {
    setFixVolume(true);
    setFixedVolumeVal(selectedTea.defaultVolume);
    setFixMass(false);
    setFixedMassVal(selectedTea.defaultMass);
    setFixTemp(false);
    setFixedTempVal(selectedTea.optimalTemp);
    setFixSteeps(false);
    setFixedSteepsVal(selectedTea.recommendedSteeps || 8);
    setRawVolumeStr(null);
    setRawMassStr(null);
    setRawTempStr(null);
    setRawSteepsStr(null);
    setOptimizationGoal('balanced');
    setWaterHardness('optimal');
    setVesselMaterial('porcelain');
    setSelectedSteepIndex(0);
  };

  // Dynamic Multi-Parameter Optimization (Single unified solver)
  const activeOptimization = useMemo(() => {
    return optimizeBrewingParametersMulti(
      selectedTea,
      {
        fixVolume,
        fixedVolume: fixedVolumeVal,
        fixMass,
        fixedMass: fixedMassVal,
        fixTemp,
        fixedTemp: fixedTempVal,
        fixSteeps,
        fixedSteeps: fixedSteepsVal
      },
      optimizationGoal,
      waterHardness,
      vesselMaterial
    );
  }, [
    selectedTea,
    fixVolume,
    fixedVolumeVal,
    fixMass,
    fixedMassVal,
    fixTemp,
    fixedTempVal,
    fixSteeps,
    fixedSteepsVal,
    optimizationGoal,
    waterHardness,
    vesselMaterial
  ]);

  // Derived active brewing parameters (Always live and in sync with optimizer)
  const waterVolume = activeOptimization.recommendedWaterVolume;
  const leafMass = activeOptimization.recommendedLeafMass;
  const waterTemp = activeOptimization.recommendedWaterTemp;
  const steepsCount = activeOptimization.recommendedSteepCount;
  const ratio = activeOptimization.recommendedRatio;
  const isGongfuRatio = ratio >= 10 && ratio <= 25;
  const fixedCount = (fixVolume ? 1 : 0) + (fixMass ? 1 : 0) + (fixTemp ? 1 : 0) + (fixSteeps ? 1 : 0);

  // Dynamic adaptive steep durations computed in real-time by kinetics model (always active)
  const computedAdaptiveDurations = activeOptimization.recommendedDurations;

  // Custom Steeps Timing Mode ("Своё время") State
  const [isCustomTimingMode, setIsCustomTimingMode] = useState<boolean>(false);
  const [customSteepTimes, setCustomSteepTimes] = useState<(number | null)[]>([]);
  // Local keyboard typing drafts for direct in-bubble editing
  const [steepDrafts, setSteepDrafts] = useState<{ [steepIndex: number]: string }>({});

  // Adaptive Recalculation Engine for User-defined Steeps
  const adaptiveCustomBrewing = useMemo(() => {
    if (!isCustomTimingMode) return null;
    return calculateAdaptiveCustomBrewing(
      selectedTea,
      steepsCount,
      waterTemp,
      leafMass,
      waterVolume,
      waterHardness,
      optimizationGoal,
      customSteepTimes
    );
  }, [
    isCustomTimingMode,
    selectedTea,
    steepsCount,
    waterTemp,
    leafMass,
    waterVolume,
    waterHardness,
    optimizationGoal,
    customSteepTimes
  ]);

  // Effective durations and flags feeding into the chemical simulation
  const effectiveDurations = useMemo(() => {
    if (isCustomTimingMode && adaptiveCustomBrewing) {
      return adaptiveCustomBrewing.combinedDurations;
    }
    return computedAdaptiveDurations;
  }, [isCustomTimingMode, adaptiveCustomBrewing, computedAdaptiveDurations]);

  const effectiveCustomFlags = useMemo(() => {
    if (isCustomTimingMode && adaptiveCustomBrewing) {
      return adaptiveCustomBrewing.customFlags;
    }
    return undefined;
  }, [isCustomTimingMode, adaptiveCustomBrewing]);

  const handleSetCustomSteepTime = useCallback((steepIndex: number, timeSec: number | null) => {
    setCustomSteepTimes((prev) => {
      const next = [...prev];
      while (next.length < steepsCount) {
        next.push(null);
      }
      next[steepIndex] = timeSec;
      return next;
    });
  }, [steepsCount]);

  const handleResetAllCustomTimes = useCallback(() => {
    setCustomSteepTimes(new Array(steepsCount).fill(null));
    setSteepDrafts({});
  }, [steepsCount]);

  // Run dynamic simulation based on Noyes-Whitney, Arrhenius & environmental factors
  const simulationResults = useMemo(() => {
    return simulateGongfuExtraction(
      selectedTea, 
      leafMass, 
      waterVolume, 
      waterTemp, 
      effectiveDurations, 
      steepsCount,
      waterHardness,
      vesselMaterial,
      effectiveCustomFlags
    );
  }, [
    selectedTea, 
    leafMass, 
    waterVolume, 
    waterTemp, 
    effectiveDurations, 
    steepsCount,
    waterHardness,
    vesselMaterial,
    effectiveCustomFlags
  ]);

  const safeSteepIndex = Math.min(selectedSteepIndex, Math.max(0, simulationResults.length - 1));
  const currentSteepData = simulationResults[safeSteepIndex] || simulationResults[0];

  // Visual liquor color based on tea type and steep progression
  const getLiquorColor = (tea: TeaVariety, steepNum: number) => {
    const factor = Math.min(1, 0.4 + (steepNum * 0.08));
    switch (tea.type) {
      case 'green':
        return `rgba(180, 210, 110, ${factor * 0.9})`;
      case 'white':
        return `rgba(225, 215, 140, ${factor * 0.85})`;
      case 'yellow':
        return `rgba(235, 195, 90, ${factor * 0.9})`;
      case 'oolong_ball':
      case 'oolong_strip':
        return `rgba(220, 160, 60, ${factor * 0.9})`;
      case 'red':
        return `rgba(180, 70, 30, ${factor * 0.95})`;
      case 'sheng_puerh':
        return `rgba(190, 145, 45, ${factor * 0.9})`;
      case 'shou_puerh':
        return `rgba(110, 35, 15, ${factor * 0.98})`;
      case 'heicha':
        return `rgba(95, 42, 18, ${factor * 0.98})`;
      default:
        return `rgba(217, 119, 6, ${factor})`;
    }
  };

  // Simple, human-friendly leaf morphology guide for tea lovers
  const getLeafMorphologyInfo = (morphology: string) => {
    switch (morphology) {
      case 'tight_ball':
        return {
          title: 'Сферическая скрутка (шарики)',
          sub: 'Те Гуань Инь, Дун Дин, Тайваньские улуны',
          simpleDesc: 'Листья туго скручены в плотные жемчужины. В первых 1–2 проливах вода лишь смачивает поверхность, поэтому чай кажется лёгким. К 3–4 проливу шарик полностью раскрывается и отдаёт максимальный, самый насыщенный вкус.',
          userTip: 'Не бойтесь, если 1-й пролив мягкий — настоящий пик вкуса раскроется на 3-м проливе.'
        };
      case 'twisted_strip':
        return {
          title: 'Продольная скрутка (жгутики и полосы)',
          sub: 'Да Хун Пао, Утесные улуны, Дань Цуны, Дянь Хун',
          simpleDesc: 'Длинные скрученные листья с открытой структурой. Вода сразу омывает всю поверхность листа, поэтому густой аромат и яркий вкус выходят моментально с первых секунд заваривания.',
          userTip: 'Вкус выходит мгновенно — делайте первые проливы быстрыми (8–10 сек).'
        };
      case 'bud_needle':
      case 'needle':
        return {
          title: 'Цельные почки и типсы (иглы)',
          sub: 'Бай Хао Инь Чжэнь (Серебряные иглы), Цзинь Цзюнь Мэй',
          simpleDesc: 'Нежнейшие весенние почки, покрытые густым серебристым пушком. Этот пушок защищает почку и не даёт ей отдавать горечь, поэтому настой остаётся бархатистым, сладким и свежим очень долго.',
          userTip: 'Даёт сладкий, мягкий настой без терпкости, выдерживает много деликатных проливов.'
        };
      case 'flat_pressed':
      case 'flat':
        return {
          title: 'Плоский приплюснутый лист',
          sub: 'Си Ху Лун Цзин (Колодец Дракона), Тайпин Хоукуй',
          simpleDesc: 'Листья обжарены в горячем котле до гладкой плоской формы. Из-за минимальной толщины листа сладкие аминокислоты (умами) переходят в чашку практически сразу.',
          userTip: 'Идеален для быстрых проливов прохладной водой (75–80°C).'
        };
      case 'pressed_cake':
      case 'compressed_cake':
        return {
          title: 'Прессованный лист (блин, кирпич, точа)',
          sub: 'Шэн Пуэр, Шу Пуэр, выдержанный белый чай',
          simpleDesc: 'Чай спрессован под давлением. Первые 1–2 пролива нужны, чтобы прессованный кусочек напитался влагой и бережно расслоился на отдельные листочки.',
          userTip: 'Первый быстрый пролив («промывка») раскрывает прессовку перед основным чаепитием.'
        };
      case 'broken_leaf':
        return {
          title: 'Мелкий или ломаный лист',
          sub: 'Мелколистовые чаи, ганпаудер',
          simpleDesc: 'Клеточная структура листа нарушена, поэтому кофеин и терпкие танины выходят в 2–3 раза быстрее обычного.',
          userTip: 'Сливайте настой мгновенно (5–8 секунд), чтобы не перетерпчить настой.'
        };
      case 'large_open':
      default:
        return {
          title: 'Крупный цельный свободный лист',
          sub: 'Шоу Мэй, Белый чай, крупные красные чаи',
          simpleDesc: 'Объёмные цельные листья сохранили естественную форму. Они отдают полезные вещества ровно, постепенно и стабильно от чашки к чашке.',
          userTip: 'Надёжный, ровный вкус на протяжении 8–10 проливов.'
        };
    }
  };

  const morphologyInfo = getLeafMorphologyInfo(selectedTea.leafMorphology);

  // Cumulative yield and extracted compounds
  const lastSteepYield = simulationResults.length > 0 
    ? simulationResults[simulationResults.length - 1].cumulativeExtractionYieldPercent 
    : 0;

  const totalCaffeineExtracted = simulationResults.reduce((acc, curr) => acc + (curr.caffeineConcentration * (waterVolume / 100)), 0).toFixed(1);
  const totalTheanineExtracted = simulationResults.reduce((acc, curr) => acc + (curr.theanineConcentration * (waterVolume / 100)), 0).toFixed(1);

  // Responsive SVG Dimensions for Kinetics Multi-Curve
  const svgWidth = Math.max(650, simulationResults.length * 60 + 80);
  const svgHeight = 230;
  const padding = { top: 25, right: 35, bottom: 46, left: 45 };
  const chartW = svgWidth - padding.left - padding.right;
  const chartH = svgHeight - padding.top - padding.bottom;

  // Find max concentration across all compounds
  const maxConcentration = useMemo(() => {
    let max = 10;
    simulationResults.forEach((d) => {
      max = Math.max(
        max, 
        d.theanineConcentration, 
        d.caffeineConcentration, 
        d.catechinsConcentration, 
        d.polysaccharidesConcentration
      );
    });
    return Math.ceil(max * 1.15);
  }, [simulationResults]);

  const getX = (index: number) => {
    if (simulationResults.length <= 1) return padding.left + chartW / 2;
    return padding.left + (index / (simulationResults.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padding.top + chartH - (val / maxConcentration) * chartH;
  };

  // Helper for generating ultra-smooth cubic Bezier spline SVG paths
  const generateSmoothPath = (pts: { x: number; y: number }[]): string => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2) {
      return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
    }
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const { theaninePath, caffeinePath, catechinsPath, polysaccharidesPath } = useMemo(() => {
    const theanineCoords = simulationResults.map((d, i) => ({ x: getX(i), y: getY(d.theanineConcentration) }));
    const caffeineCoords = simulationResults.map((d, i) => ({ x: getX(i), y: getY(d.caffeineConcentration) }));
    const catechinsCoords = simulationResults.map((d, i) => ({ x: getX(i), y: getY(d.catechinsConcentration) }));
    const polysaccharidesCoords = simulationResults.map((d, i) => ({ x: getX(i), y: getY(d.polysaccharidesConcentration) }));

    return {
      theaninePath: generateSmoothPath(theanineCoords),
      caffeinePath: generateSmoothPath(caffeineCoords),
      catechinsPath: generateSmoothPath(catechinsCoords),
      polysaccharidesPath: generateSmoothPath(polysaccharidesCoords),
    };
  }, [simulationResults, maxConcentration, chartW, chartH]);

  return (
    <div className="space-y-6">
      {/* Top Utility Bar: Base Selector (Generic First, Popular Teas Second) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 sm:px-4 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-bold text-stone-800">База сортов:</span>
          <div className="flex rounded-lg bg-stone-100 p-0.5 border border-stone-200">
            {/* 1. Общие архетипы (First) */}
            <button
              id="category-tab-generic"
              onClick={() => handleCategoryTabChange('generic')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeCategoryTab === 'generic'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Общие архетипы ({GENERIC_TEA_ARCHETYPES.length})
            </button>
            {/* 2. Популярные чаи (Second) */}
            <button
              id="category-tab-specific"
              onClick={() => handleCategoryTabChange('specific')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeCategoryTab === 'specific'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Популярные чаи ({TEA_VARIETIES.length})
            </button>
          </div>
        </div>

        {/* Search & Filter Bar - Shown only for Popular Teas */}
        {activeCategoryTab === 'specific' ? (
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Поиск по названию, культивару, региону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50/70 focus:bg-white focus:border-amber-700 focus:outline-hidden focus:ring-1 focus:ring-amber-700/30 transition-all text-stone-900 placeholder:text-stone-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5"
                  title="Очистить поиск"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-stone-500 font-medium hidden sm:block">
            Категории и архетипы для любых китайских чаев
          </div>
        )}
      </div>

      {/* Quick Category Filter Pills - Only shown for Popular Teas tab */}
      {activeCategoryTab === 'specific' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider shrink-0 mr-1">Фильтр:</span>
          {[
            { id: 'all', label: 'Все' },
            { id: 'green', label: 'Зелёный' },
            { id: 'white', label: 'Белый' },
            { id: 'yellow', label: 'Жёлтый' },
            { id: 'oolong', label: 'Улун' },
            { id: 'gaba', label: 'Габа' },
            { id: 'red', label: 'Красный' },
            { id: 'puerh', label: 'Пуэр / Хэйча' }
          ].map((filter) => {
            const isActive = selectedTypeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedTypeFilter(filter.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 border ${
                  isActive
                    ? 'bg-amber-900 text-white border-amber-900 shadow-2xs'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Tea Selection Grid */}
      <div className="space-y-3">
        {activeCategoryTab === 'generic' ? (
          filteredGenericTeas.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
              <p className="text-xs text-stone-500 font-medium">По вашему запросу архитипов не найдено</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTypeFilter('all');
                }}
                className="text-xs font-semibold text-amber-800 hover:underline"
              >
                Сбросить фильтры поиска
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-2">
              {filteredGenericTeas.map((tea) => {
                const isSelected = tea.id === selectedTeaId;
                return (
                  <button
                    key={tea.id}
                    id={`tea-generic-${tea.id}`}
                    onClick={() => handleTeaChange(tea)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between min-w-0 ${
                      isSelected
                        ? 'border-amber-700 bg-amber-50/90 text-stone-900 shadow-xs ring-1 ring-amber-700/30'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs sm:text-[13px] font-bold text-stone-900 leading-snug line-clamp-2" title={tea.nameRu}>
                        {tea.nameRu}
                      </div>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-1.5 font-serif italic truncate">
                      {tea.nameZh}
                    </div>
                  </button>
                );
              })}
            </div>
          )
        ) : filteredPopularTeas.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-2xl border border-stone-200 space-y-2">
            <p className="text-xs text-stone-500 font-medium">По вашему запросу сортов не найдено</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTypeFilter('all');
              }}
              className="text-xs font-semibold text-amber-800 hover:underline"
            >
              Сбросить фильтры поиска
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-1.5 sm:gap-2">
            {filteredPopularTeas.map((tea) => {
              const isSelected = tea.id === selectedTeaId;
              return (
                <button
                  key={tea.id}
                  id={`tea-select-${tea.id}`}
                  onClick={() => handleTeaChange(tea)}
                  className={`p-2 sm:p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between min-w-0 ${
                    isSelected
                      ? 'border-amber-700 bg-amber-50/90 text-stone-900 shadow-xs ring-1 ring-amber-700/30'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[11px] sm:text-xs font-medium text-amber-800 truncate">
                      {tea.typeNameRu}
                    </div>
                    <div className="text-xs sm:text-[13px] font-bold text-stone-900 truncate mt-0.5" title={tea.nameRu}>
                      {tea.nameRu.split('(')[0].trim()}
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-400 mt-1.5 font-serif italic truncate">
                    {tea.nameZh}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Tea Info Card with Plain-Language Leaf Morphology */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row gap-6 items-start min-w-0 max-w-full overflow-hidden">
        <div className="flex-1 space-y-3 min-w-0 max-w-full">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 font-serif break-words">
              {selectedTea.nameRu} {selectedTea.nameZh && `(${selectedTea.nameZh})`}
            </h3>
            <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium max-w-full break-words">
              {selectedTea.origin}
            </span>
            <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium max-w-full break-words">
              Ферментация: {selectedTea.oxidationLevel}
            </span>
            {selectedTea.categoryGroup === 'generic' && (
              <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium shrink-0">
                Общий архетип
              </span>
            )}
          </div>

          <p className="text-sm text-stone-600 leading-relaxed break-words">
            {selectedTea.scientificDescription}
          </p>

          {selectedTea.generalExamplesRu && (
            <div className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex flex-wrap items-center gap-1.5 min-w-0">
              <span className="font-semibold text-stone-900 shrink-0">Подходит для сортов:</span>
              {selectedTea.generalExamplesRu.map((ex, idx) => (
                <span key={idx} className="inline-flex items-center bg-white px-2 py-0.5 rounded-md border border-stone-200 text-stone-800 text-[11px] max-w-full break-words text-left">
                  {ex}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-1 min-w-0">
            {selectedTea.keySensoryNotes.map((note, i) => (
              <span
                key={i}
                className="inline-flex items-center text-xs px-2.5 py-1 bg-stone-50 text-stone-700 border border-stone-200 rounded-lg font-medium max-w-full break-words"
              >
                {note}
              </span>
            ))}
          </div>
        </div>

        {/* Right side box: Vessel and Plain-Language Morphology explanation */}
        <div className="w-full lg:w-84 max-w-full bg-stone-50/90 border border-stone-200 rounded-xl p-4 text-xs space-y-3 shrink-0 min-w-0 overflow-hidden">
          <div className="space-y-1 min-w-0">
            <div className="font-semibold text-stone-900 flex items-center space-x-1.5 min-w-0">
              <Award className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="break-words">Рекомендованная посуда:</span>
            </div>
            <p className="text-stone-600 leading-relaxed break-words">
              {selectedTea.recommendedVesselRu}
            </p>
          </div>

          {/* Simple Leaf Morphology Explanation */}
          <div className="pt-2.5 border-t border-stone-200/80 space-y-1.5 min-w-0">
            <div className="flex items-center space-x-1.5 text-stone-900 font-bold min-w-0">
              <Feather className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="break-words">Форма листа: {morphologyInfo.title}</span>
            </div>
            <p className="text-stone-600 leading-relaxed text-[11px] break-words">
              {morphologyInfo.simpleDesc}
            </p>
            <div className="text-[11px] text-amber-900 bg-amber-100/60 p-2 rounded-lg border border-amber-200/60 font-medium break-words min-w-0">
              💡 <strong>Совет мастера:</strong> {morphologyInfo.userTip}
            </div>
          </div>
        </div>
      </div>

      {/* Main Controls & Simulation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Unified Brewing Parameters & Scientific Optimizer (4 cols) */}
        <div className="lg:col-span-4 space-y-5 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-700/10 text-amber-800 flex items-center justify-center shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm leading-tight flex items-center space-x-1.5">
                  <span>Оптимизатор параметров</span>
                </h4>
                <div className="text-[11px] text-stone-500">
                  {fixedCount === 0 
                    ? 'Все параметры свободны (авто-расчёт)' 
                    : `Зафиксировано: ${fixedCount} из 4`}
                </div>
              </div>
            </div>

            <button
              id="reset-params-btn"
              onClick={resetToOptimized}
              className="text-xs text-amber-800 hover:text-amber-950 px-2 py-1 rounded-lg hover:bg-amber-50 flex items-center space-x-1 font-medium transition-colors"
              title="Сбросить все параметры к рекомендованному оптимуму"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>К оптимуму</span>
            </button>
          </div>

          {/* Target Profile / Goal Preset Selector: Expandable Dropdown */}
          <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Метод пролива и цель вкуса:</span>
              </span>
            </div>

            {/* Dropdown Trigger Box */}
            <div className="relative">
              {(() => {
                const currentPreset = OPTIMIZATION_PRESETS.find(p => p.id === optimizationGoal) || OPTIMIZATION_PRESETS[0];
                return (
                  <button
                    type="button"
                    id="optimization-goal-dropdown-btn"
                    onClick={() => setIsGoalDropdownOpen(!isGoalDropdownOpen)}
                    className="w-full p-2.5 bg-white rounded-lg border-2 border-stone-200 hover:border-amber-700/60 focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 text-left transition-all flex items-center justify-between shadow-2xs gap-2"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-7 h-7 rounded bg-amber-100/70 text-amber-900 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-900 truncate">
                          {currentPreset.nameRu}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate mt-0.5">
                          {currentPreset.tempOffsetC !== 0 
                            ? `Температурный сдвиг: ${currentPreset.tempOffsetC > 0 ? '+' : ''}${currentPreset.tempOffsetC}°C` 
                            : 'Оптимальный температурный профиль'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 text-stone-400">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isGoalDropdownOpen ? 'rotate-180 text-amber-800' : ''}`} />
                    </div>
                  </button>
                );
              })()}

              {/* Expandable Dropdown Menu List */}
              {isGoalDropdownOpen && (
                <div className="mt-1.5 bg-white rounded-xl border border-stone-200 shadow-xl p-1.5 space-y-1 z-30 animate-in fade-in slide-in-from-top-1 duration-150 max-h-80 overflow-y-auto">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 py-0.5">
                    Выберите стиль экстракции:
                  </div>

                  {OPTIMIZATION_PRESETS.map((preset) => {
                    const isSelected = optimizationGoal === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setOptimizationGoal(preset.id as OptimizationGoal);
                          setIsGoalDropdownOpen(false);
                        }}
                        className={`w-full p-2 rounded-lg text-left text-xs transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-50 border border-amber-300 text-amber-950 font-medium shadow-2xs'
                            : 'hover:bg-stone-50 text-stone-700 border border-transparent'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-stone-900 break-words">
                              {preset.nameRu}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-stone-500 leading-relaxed">
                            {preset.descriptionRu}
                          </p>
                        </div>

                        {preset.tempOffsetC !== 0 && (
                          <div className="flex flex-col items-end gap-1 shrink-0 text-[10px] font-mono">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${preset.tempOffsetC > 0 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                              {preset.tempOffsetC > 0 ? `+${preset.tempOffsetC}` : preset.tempOffsetC}°C
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <p className="text-[10px] text-stone-500 leading-tight pt-0.5">
              {OPTIMIZATION_PRESETS.find(p => p.id === optimizationGoal)?.descriptionRu}
            </p>
          </div>

          {/* 4 Interactive Parameters with Lock / Free switches */}
          <div className="space-y-3.5">
            {/* 1. Water Volume */}
            <div className={`p-3 rounded-xl border transition-all ${
              fixVolume ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-400/20' : 'bg-stone-50/70 border-stone-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="water-volume-input" className="text-xs font-bold text-stone-800 flex items-center space-x-1.5">
                  <Droplet className="w-3.5 h-3.5 text-blue-600" />
                  <span>Объём сосуда (мл)</span>
                </label>
                <button
                  type="button"
                  id="toggle-fix-volume-btn"
                  onClick={() => {
                    if (!fixVolume) setFixedVolumeVal(waterVolume);
                    setFixVolume(!fixVolume);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 transition-all ${
                    fixVolume 
                      ? 'bg-amber-700 text-white shadow-xs' 
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                  title={fixVolume ? 'Зафиксирован: значение задано вами' : 'Свободен: вычисляется алгоритмом'}
                >
                  {fixVolume ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-stone-500" />}
                  <span>{fixVolume ? 'Зафиксирован' : 'Авто (свободен)'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    id="water-volume-input"
                    type="number"
                    step="5"
                    min="20"
                    max="1000"
                    placeholder={String(selectedTea.defaultVolume)}
                    value={rawVolumeStr !== null ? rawVolumeStr : waterVolume}
                    onChange={(e) => {
                      setRawVolumeStr(e.target.value);
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        setFixVolume(true);
                        setFixedVolumeVal(val);
                      }
                    }}
                    onBlur={() => {
                      if (rawVolumeStr === null) return;
                      const trimmed = rawVolumeStr.trim();
                      if (trimmed === '' || isNaN(parseFloat(trimmed)) || parseFloat(trimmed) <= 0) {
                        // User cleared input -> reset to optimal recommended default volume
                        setFixedVolumeVal(selectedTea.defaultVolume);
                        setFixVolume(true);
                      } else {
                        const clamped = Math.max(20, Math.min(1000, Math.round(parseFloat(trimmed))));
                        setFixedVolumeVal(clamped);
                        setFixVolume(true);
                      }
                      setRawVolumeStr(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className={`w-24 h-8 text-center font-mono font-bold text-sm rounded border ${
                      fixVolume 
                        ? 'bg-white text-stone-900 border-amber-400 ring-1 ring-amber-300' 
                        : 'bg-stone-100 text-stone-700 border-stone-300'
                    }`}
                  />
                  <span className="text-xs text-stone-500 font-semibold">мл</span>
                  <div className="flex-1 text-[11px] text-right font-mono text-stone-500">
                    {fixVolume ? 'Фикс. объём' : 'Рассчитан по массе'}
                  </div>
                </div>

                <input
                  id="water-volume-slider"
                  type="range"
                  min="40"
                  max="350"
                  step="5"
                  value={Math.min(350, Math.max(40, waterVolume))}
                  onChange={(e) => {
                    setRawVolumeStr(null);
                    setFixVolume(true);
                    setFixedVolumeVal(Number(e.target.value));
                  }}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="flex flex-wrap gap-1 text-[10px]">
                  {[80, 100, 110, 120, 150, 180, 200].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setRawVolumeStr(null);
                        setFixVolume(true);
                        setFixedVolumeVal(v);
                      }}
                      className={`px-1.5 py-0.5 rounded font-mono border ${
                        waterVolume === v && fixVolume
                          ? 'bg-amber-800 text-white border-amber-800 font-bold'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Leaf Mass */}
            <div className={`p-3 rounded-xl border transition-all ${
              fixMass ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-400/20' : 'bg-stone-50/70 border-stone-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="leaf-mass-input" className="text-xs font-bold text-stone-800 flex items-center space-x-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Масса листа (г)</span>
                </label>
                <button
                  type="button"
                  id="toggle-fix-mass-btn"
                  onClick={() => {
                    setRawMassStr(null);
                    if (!fixMass) setFixedMassVal(leafMass);
                    setFixMass(!fixMass);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 transition-all ${
                    fixMass 
                      ? 'bg-amber-700 text-white shadow-xs' 
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                  title={fixMass ? 'Зафиксирована: задана вами' : 'Свободна: вычисляется из гидромодуля'}
                >
                  {fixMass ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-stone-500" />}
                  <span>{fixMass ? 'Зафиксирована' : 'Авто (свободна)'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    id="leaf-mass-input"
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="50"
                    placeholder={String(selectedTea.defaultMass)}
                    value={rawMassStr !== null ? rawMassStr : leafMass}
                    onChange={(e) => {
                      setRawMassStr(e.target.value);
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        setFixMass(true);
                        setFixedMassVal(val);
                      }
                    }}
                    onBlur={() => {
                      if (rawMassStr === null) return;
                      const trimmed = rawMassStr.trim();
                      if (trimmed === '' || isNaN(parseFloat(trimmed)) || parseFloat(trimmed) <= 0) {
                        // User cleared input -> reset to optimal recommended leaf mass
                        setFixedMassVal(selectedTea.defaultMass);
                        setFixMass(true);
                      } else {
                        const clamped = Math.max(0.5, Math.min(50, Math.round(parseFloat(trimmed) * 10) / 10));
                        setFixedMassVal(clamped);
                        setFixMass(true);
                      }
                      setRawMassStr(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className={`w-24 h-8 text-center font-mono font-bold text-sm rounded border ${
                      fixMass 
                        ? 'bg-white text-stone-900 border-amber-400 ring-1 ring-amber-300' 
                        : 'bg-stone-100 text-stone-700 border-stone-300'
                    }`}
                  />
                  <span className="text-xs text-stone-500 font-semibold">г</span>
                  <div className="flex-1 text-[11px] text-right font-mono text-stone-500">
                    {fixMass ? 'Фикс. порция' : 'Рассчитана по объёму'}
                  </div>
                </div>

                <input
                  id="leaf-mass-slider"
                  type="range"
                  min="2"
                  max="25"
                  step="0.5"
                  value={Math.min(25, Math.max(2, leafMass))}
                  onChange={(e) => {
                    setRawMassStr(null);
                    setFixMass(true);
                    setFixedMassVal(Number(e.target.value));
                  }}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                <div className="flex flex-wrap gap-1 text-[10px]">
                  {[3, 4, 5, 6, 7, 7.5, 8, 10].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setRawMassStr(null);
                        setFixMass(true);
                        setFixedMassVal(m);
                      }}
                      className={`px-1.5 py-0.5 rounded font-mono border ${
                        leafMass === m && fixMass
                          ? 'bg-amber-800 text-white border-amber-800 font-bold'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {m}г
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Water Temperature */}
            <div className={`p-3 rounded-xl border transition-all ${
              fixTemp ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-400/20' : 'bg-stone-50/70 border-stone-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="water-temp-input" className="text-xs font-bold text-stone-800 flex items-center space-x-1.5">
                  <Flame className="w-3.5 h-3.5 text-red-600" />
                  <span>Температура воды (°C)</span>
                </label>
                <button
                  type="button"
                  id="toggle-fix-temp-btn"
                  onClick={() => {
                    setRawTempStr(null);
                    if (!fixTemp) setFixedTempVal(waterTemp);
                    setFixTemp(!fixTemp);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 transition-all ${
                    fixTemp 
                      ? 'bg-amber-700 text-white shadow-xs' 
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                  title={fixTemp ? 'Зафиксирована: задана вручную' : 'Оптимум: рекомендована для данного сорта'}
                >
                  {fixTemp ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-stone-500" />}
                  <span>{fixTemp ? 'Зафиксирована' : 'Оптимум сорта'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <input
                      id="water-temp-input"
                      type="number"
                      step="1"
                      min="50"
                      max="100"
                      placeholder={String(selectedTea.optimalTemp)}
                      value={rawTempStr !== null ? rawTempStr : waterTemp}
                      onChange={(e) => {
                        setRawTempStr(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          setFixTemp(true);
                          setFixedTempVal(val);
                        }
                      }}
                      onBlur={() => {
                        if (rawTempStr === null) return;
                        const trimmed = rawTempStr.trim();
                        if (trimmed === '' || isNaN(parseFloat(trimmed)) || parseFloat(trimmed) <= 0) {
                          // User cleared input -> reset to optimal recommended temperature
                          setFixedTempVal(selectedTea.optimalTemp);
                          setFixTemp(true);
                        } else {
                          const clamped = Math.max(50, Math.min(100, Math.round(parseFloat(trimmed))));
                          setFixedTempVal(clamped);
                          setFixTemp(true);
                        }
                        setRawTempStr(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className={`w-20 h-8 text-center font-mono font-bold text-base rounded border ${
                        fixTemp
                          ? 'bg-white text-stone-900 border-amber-400 ring-1 ring-amber-300'
                          : 'bg-stone-100 text-stone-700 border-stone-300'
                      }`}
                    />
                    <span className="text-xs font-semibold text-stone-600">°C</span>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    Оптимум сорта: <strong className="text-stone-700">{selectedTea.optimalTemp}°C</strong>
                  </span>
                </div>

                <input
                  id="water-temp-slider"
                  type="range"
                  min="65"
                  max="100"
                  step="1"
                  value={waterTemp}
                  onChange={(e) => {
                    setRawTempStr(null);
                    setFixTemp(true);
                    setFixedTempVal(Number(e.target.value));
                  }}
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />

                <div className="flex flex-wrap gap-1 text-[10px]">
                  {[75, 80, 85, 90, 95, 100].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setRawTempStr(null);
                        setFixTemp(true);
                        setFixedTempVal(t);
                      }}
                      className={`px-1.5 py-0.5 rounded font-mono border ${
                        waterTemp === t && fixTemp
                          ? 'bg-amber-800 text-white border-amber-800 font-bold'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {t}°C
                    </button>
                  ))}
                </div>

                {waterTemp < selectedTea.tempRange[0] && (
                  <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-start space-x-1.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                    <span>Температура ниже оптимума. Тайминг проливов автоматически продлён.</span>
                  </div>
                )}
                {waterTemp > selectedTea.tempRange[1] && (
                  <div className="text-xs text-rose-800 bg-rose-50 p-2 rounded-lg border border-rose-200 flex items-start space-x-1.5">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>Выше оптимума! Ускорен выход вяжущих танинов EGCG.</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Steep Count */}
            <div className={`p-3 rounded-xl border transition-all ${
              fixSteeps ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-400/20' : 'bg-stone-50/70 border-stone-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="steeps-count-input" className="text-xs font-bold text-stone-800 flex items-center space-x-1.5">
                  <Hash className="w-3.5 h-3.5 text-amber-800" />
                  <span>Количество проливов</span>
                </label>
                <button
                  type="button"
                  id="toggle-fix-steeps-btn"
                  onClick={() => {
                    setRawSteepsStr(null);
                    if (!fixSteeps) setFixedSteepsVal(steepsCount);
                    setFixSteeps(!fixSteeps);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1 transition-all ${
                    fixSteeps 
                      ? 'bg-amber-700 text-white shadow-xs' 
                      : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                  }`}
                  title={fixSteeps ? 'Зафиксировано: задано вами' : 'Авто: рассчитано по ресурсу листа'}
                >
                  {fixSteeps ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-stone-500" />}
                  <span>{fixSteeps ? 'Зафиксировано' : 'Авто (ресурс листа)'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      id="steep-decrement-btn"
                      onClick={() => {
                        setRawSteepsStr(null);
                        setFixSteeps(true);
                        setFixedSteepsVal(Math.max(1, steepsCount - 1));
                      }}
                      className="w-7 h-7 rounded bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <input
                      id="steeps-count-input"
                      type="number"
                      min="1"
                      max="40"
                      placeholder={String(selectedTea.recommendedSteeps || 8)}
                      value={rawSteepsStr !== null ? rawSteepsStr : steepsCount}
                      onChange={(e) => {
                        setRawSteepsStr(e.target.value);
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1) {
                          setFixSteeps(true);
                          setFixedSteepsVal(val);
                        }
                      }}
                      onBlur={() => {
                        if (rawSteepsStr === null) return;
                        const trimmed = rawSteepsStr.trim();
                        if (trimmed === '' || isNaN(parseInt(trimmed, 10)) || parseInt(trimmed, 10) <= 0) {
                          // User cleared input -> reset to optimal recommended steep count
                          setFixedSteepsVal(selectedTea.recommendedSteeps || 8);
                          setFixSteeps(true);
                        } else {
                          const clamped = Math.max(1, Math.min(40, parseInt(trimmed, 10)));
                          setFixedSteepsVal(clamped);
                          setFixSteeps(true);
                        }
                        setRawSteepsStr(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className={`w-16 h-7 text-center font-bold text-sm rounded border font-mono ${
                        fixSteeps
                          ? 'bg-white text-stone-900 border-amber-400 ring-1 ring-amber-300'
                          : 'bg-stone-100 text-stone-700 border-stone-300'
                      }`}
                    />
                    <button
                      type="button"
                      id="steep-increment-btn"
                      onClick={() => {
                        setRawSteepsStr(null);
                        setFixSteeps(true);
                        setFixedSteepsVal(Math.min(40, steepsCount + 1));
                      }}
                      className="w-7 h-7 rounded bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono">
                    {fixSteeps ? 'Фиксировано' : `Ресурс сорта (~${selectedTea.recommendedSteeps || 8})`}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 text-[10px]">
                  {[5, 8, 10, 12, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setRawSteepsStr(null);
                        setFixSteeps(true);
                        setFixedSteepsVal(num);
                      }}
                      className={`px-2 py-0.5 rounded font-mono border ${
                        steepsCount === num && fixSteeps
                          ? 'bg-amber-800 text-white border-amber-800 font-bold'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Parameters: Mineralization & Vessel */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h5 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center space-x-1">
              <Waves className="w-3.5 h-3.5 text-blue-600" />
              <span>Минерализация воды (TDS)</span>
            </h5>
            <div className="grid grid-cols-3 gap-1.5">
              {WATER_HARDNESS_PRESETS.map((preset) => (
                <button
                  key={preset.level}
                  type="button"
                  onClick={() => setWaterHardness(preset.level)}
                  className={`p-2 rounded-lg text-left text-xs border transition-all ${
                    waterHardness === preset.level
                      ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="text-[11px] leading-tight truncate">{preset.nameRu.split('(')[0]}</div>
                  <div className="text-[10px] text-stone-400 font-mono mt-0.5">{preset.tdsPpmRange}</div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 italic">
              {WATER_HARDNESS_PRESETS.find(h => h.level === waterHardness)?.scientificImpactRu}
            </p>
          </div>

          {/* Vessel Material: Expandable Dropdown Selector */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center space-x-1">
                <Coffee className="w-3.5 h-3.5 text-amber-700" />
                <span>Материал посуды (Теплофизика)</span>
              </h5>
            </div>

            {/* Dropdown Trigger Box */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsVesselDropdownOpen(!isVesselDropdownOpen)}
                className="w-full p-3 bg-white rounded-xl border-2 border-stone-200 hover:border-amber-700/60 focus:outline-hidden focus:ring-2 focus:ring-amber-800/30 text-left transition-all flex items-center justify-between shadow-2xs gap-2"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-900 flex items-center justify-center shrink-0">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                      {VESSEL_MATERIALS.find(v => v.id === vesselMaterial)?.nameRu}
                    </div>
                    <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-mono text-[10px]">
                        ΔT: -{VESSEL_MATERIALS.find(v => v.id === vesselMaterial)?.heatLossPerSteepC}°C
                      </span>
                      {(VESSEL_MATERIALS.find(v => v.id === vesselMaterial)?.tanninAdsorptionFactor || 0) > 0 && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono text-[10px]">
                          -{Math.round((VESSEL_MATERIALS.find(v => v.id === vesselMaterial)?.tanninAdsorptionFactor || 0) * 100)}% танинов
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 text-stone-400">
                  <span className="text-[11px] hidden sm:inline text-stone-500">
                    {isVesselDropdownOpen ? 'Свернуть' : 'Выбрать материал'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isVesselDropdownOpen ? 'rotate-180 text-amber-800' : ''}`} />
                </div>
              </button>

              {/* Expandable Dropdown Menu List */}
              {isVesselDropdownOpen && (
                <div className="mt-2 bg-white rounded-xl border border-stone-200 shadow-xl p-2 space-y-1 z-30 animate-in fade-in slide-in-from-top-1 duration-150 max-h-96 overflow-y-auto">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 py-1">
                    Выберите тип чайника / гайвани:
                  </div>

                  {VESSEL_MATERIALS.map((vessel) => {
                    const isSelected = vesselMaterial === vessel.id;
                    return (
                      <button
                        key={vessel.id}
                        type="button"
                        onClick={() => {
                          setVesselMaterial(vessel.id);
                          setIsVesselDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-lg text-left text-xs transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-50 border border-amber-300 text-amber-950 font-medium shadow-2xs'
                            : 'hover:bg-stone-50 text-stone-700 border border-transparent'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs sm:text-sm text-stone-900 break-words">
                              {vessel.nameRu}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                            {vessel.scientificImpactRu}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 text-[10px] font-mono">
                          <span className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
                            ΔT: -{vessel.heatLossPerSteepC}°C
                          </span>
                          {vessel.tanninAdsorptionFactor > 0 ? (
                            <span className="bg-emerald-100/70 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                              -{Math.round(vessel.tanninAdsorptionFactor * 100)}% танинов
                            </span>
                          ) : vessel.id === 'metal_silver' ? (
                            <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                              Ag⁺ ионы
                            </span>
                          ) : vessel.id === 'cast_iron' ? (
                            <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                              Теплоёмкость
                            </span>
                          ) : (
                            <span className="text-stone-400">Нейтрально</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 break-words">
              <span className="font-semibold text-stone-800">Теплофизический эффект: </span>
              {VESSEL_MATERIALS.find(v => v.id === vesselMaterial)?.scientificImpactRu}
            </div>
          </div>

          {/* 1. Гидромодуль: Пропорция чая и воды */}
          <div className="p-4 rounded-xl border border-amber-200/80 bg-linear-to-br from-amber-50/70 via-white to-stone-50 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
              <div className="flex items-center space-x-2 min-w-0">
                <Scale className="w-4 h-4 text-amber-800 shrink-0" />
                <h5 className="text-xs font-bold text-stone-900 truncate">
                  Гидромодуль
                </h5>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-sm bg-amber-100 text-amber-950 px-2.5 py-1 rounded-lg border border-amber-200">
                  1 : {ratio}
                </span>
                <span className="block text-[9px] text-stone-400 font-mono mt-0.5">
                  1 г на {ratio} мл
                </span>
              </div>
            </div>

            {/* Карточка текущей пропорции с разбором */}
            <div className="space-y-2.5 text-xs text-stone-700">
              <div className="flex items-center justify-between bg-white/90 p-2.5 rounded-lg border border-stone-200/80 text-xs">
                <span className="text-stone-600 font-medium">Текущая раскладка:</span>
                <span className="font-bold text-stone-900 font-mono">
                  {leafMass} г на {waterVolume} мл
                </span>
              </div>

              {/* Понятное объяснение выбранного режима */}
              <div className="p-3 bg-white/95 rounded-lg border border-amber-200/70 text-xs space-y-1.5">
                {ratio <= 15 ? (
                  <>
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
                      <span>Плотный метод проливов (Классика Гунфу Ча): 1:{ratio}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Много чайного листа на малый объём посуды. Чай заваривается быстрыми проливами по 5–15 секунд, давая густой, концентрированный настой и максимальное число проливов (8–15 раз).
                    </p>
                  </>
                ) : ratio <= 24 ? (
                  <>
                    <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                      <span>Деликатные мягкие проливы (Лёгкий баланс): 1:{ratio}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Сбалансированное соотношение для мягкого вкуса без намёка на горечь. Идеально раскрывает тонкие цветочные и фруктовые ароматы нежных белых, зелёных и молодых шэн пуэров.
                    </p>
                  </>
                ) : ratio <= 45 ? (
                  <>
                    <div className="font-bold text-blue-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                      <span>Умеренное настаивание (Типод / Кофейник / Френч-пресс): 1:{ratio}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Средняя концентрация листа. Настаивается 40–90 секунд, позволяя быстро приготовить 2–4 чашки сбалансированного чая за один раз.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-purple-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0"></span>
                      <span>Европейское заваривание в кружке / Большом чайнике: 1:{ratio}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      Малая щепотка сухого листа на большую кружку (250–350 мл). Заливается один раз горячей водой и настаивается 3–5 минут.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 2. Окно «Корректность» (Размещено под гидромодулем) */}
          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-3.5">
            {/* Header with Score */}
            <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
              <div className="flex items-center space-x-2 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  activeOptimization.diagnostics.overallStatusType === 'optimal'
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeOptimization.diagnostics.overallStatusType === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {activeOptimization.diagnostics.overallStatusType === 'optimal' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : activeOptimization.diagnostics.overallStatusType === 'warning' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-stone-900 truncate">
                    Корректность
                  </h5>
                  <span className={`text-[10px] font-semibold block truncate ${
                    activeOptimization.diagnostics.overallStatusType === 'optimal'
                      ? 'text-emerald-700'
                      : activeOptimization.diagnostics.overallStatusType === 'warning'
                      ? 'text-amber-800'
                      : 'text-rose-700'
                  }`}>
                    {activeOptimization.diagnostics.overallStatusRu}
                  </span>
                </div>
              </div>

              {/* Quality Score Badge */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-stone-400 font-medium">Оценка:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                  activeOptimization.diagnostics.overallScorePercent >= 85
                    ? 'bg-emerald-100 text-emerald-800'
                    : activeOptimization.diagnostics.overallScorePercent >= 70
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-rose-100 text-rose-900'
                }`}>
                  {activeOptimization.diagnostics.overallScorePercent}%
                </span>
              </div>
            </div>

            {/* Diagnostic Checks Accordion / Item List */}
            <div className="space-y-2">
              {activeOptimization.diagnostics.checks.map((check) => (
                <div
                  key={check.id}
                  className={`p-2.5 rounded-lg border text-xs space-y-1 transition-all ${
                    check.status === 'optimal'
                      ? 'bg-emerald-50/40 border-emerald-200/60'
                      : check.status === 'warning'
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-rose-50/70 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-stone-900 text-[11px] flex items-center gap-1.5">
                      {check.status === 'optimal' ? (
                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : check.status === 'warning' ? (
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                      )}
                      <span>{check.titleRu}</span>
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      check.status === 'optimal'
                        ? 'bg-emerald-100 text-emerald-800'
                        : check.status === 'warning'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}>
                      {check.status === 'optimal' ? 'Оптимум' : check.status === 'warning' ? 'Внимание' : 'Сбой'}
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-600 leading-snug">
                    {check.descriptionRu}
                  </div>

                  {check.recommendationRu && (
                    <div className="text-[11px] font-medium text-amber-950 bg-amber-100/50 p-1.5 rounded border border-amber-200/50 mt-1">
                      💡 {check.recommendationRu}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Practical Flavor Improvement Recommendations / Практические советы по улучшению вкуса */}
            {activeOptimization.diagnostics.flavorImprovementRecommendations.length > 0 && (
              <div className="pt-2 border-t border-stone-100 space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-800">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Рекомендации по улучшению вкуса:</span>
                </div>
                <div className="space-y-1.5">
                  {activeOptimization.diagnostics.flavorImprovementRecommendations.map((rec, rIdx) => (
                    <div
                      key={rIdx}
                      className="text-[11px] text-stone-700 bg-amber-50/60 border border-amber-200/70 p-2 rounded-lg leading-relaxed flex items-start gap-1.5"
                    >
                      <span className="text-amber-800 font-bold shrink-0">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cumulative Totals according to ISO 9768 */}
          <div className="pt-2 border-t border-stone-100 text-xs space-y-2 text-stone-600">
            <div className="flex justify-between">
              <span>Суммарный выход экстракта (ISO 9768):</span>
              <span className="font-mono font-bold text-amber-900">{lastSteepYield}% от сухой массы</span>
            </div>
            <div className="flex justify-between">
              <span>Суммарно извлечено кофеина:</span>
              <span className="font-mono font-bold text-stone-900">{totalCaffeineExtracted} мг</span>
            </div>
            <div className="flex justify-between">
              <span>Суммарно извлечено L-теанина:</span>
              <span className="font-mono font-bold text-emerald-800">{totalTheanineExtracted} мг</span>
            </div>
          </div>
        </div>

        {/* Right Column: 1. UNIFIED STEEPS + CUP DEEP DIVE WINDOW -> 2. KINETIC CURVES AT VERY BOTTOM */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. SINGLE UNIFIED CARD: STEEPS, TIMINGS & DETAILED CHEMICAL PROFILE */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
            {/* Window Top Header & Steeps Selector */}
            <div className="space-y-4 border-b border-stone-100 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <Clock className="w-4 h-4 text-amber-800" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 text-base font-serif">
                      Проливы, тайминги и химический профиль пиалы
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      Хронометраж экстракции, концентрация биоактивных веществ и баланс вкуса
                    </p>
                  </div>
                </div>

                {/* Custom Time Checkbox Option ("Своё время") */}
                <label className="flex items-center space-x-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3 py-2 rounded-xl cursor-pointer transition-all select-none self-start sm:self-auto shrink-0 group">
                  <input
                    type="checkbox"
                    id="toggle-custom-steep-times"
                    checked={isCustomTimingMode}
                    onChange={(e) => {
                      setIsCustomTimingMode(e.target.checked);
                      if (e.target.checked && customSteepTimes.length === 0) {
                        setCustomSteepTimes(new Array(steepsCount).fill(null));
                      }
                    }}
                    className="w-4 h-4 rounded text-amber-800 focus:ring-amber-700 border-stone-300 cursor-pointer accent-amber-800"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <span>Своё время</span>
                      {isCustomTimingMode && (
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-amber-800 text-white px-1.5 py-0.5 rounded">
                          Вкл
                        </span>
                      )}
                    </span>
                  </div>
                </label>
              </div>

              {/* Status and guidance header when "Своё время" is checked */}
              {isCustomTimingMode && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start space-x-2.5">
                      <div className="w-6 h-6 rounded-lg bg-amber-800 text-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-950 flex flex-wrap items-center gap-2">
                          <span>Ввод фактического времени пролива для последующей корректировки</span>
                          {adaptiveCustomBrewing && adaptiveCustomBrewing.userSteepsCount > 0 && (
                            <span className="text-[10px] font-semibold bg-amber-200/90 text-amber-950 border border-amber-300 px-2 py-0.5 rounded-full">
                              Изменено: {adaptiveCustomBrewing.userSteepsCount} из {steepsCount}
                            </span>
                          )}
                        </div>
                        {adaptiveCustomBrewing && adaptiveCustomBrewing.userSteepsCount > 0 && (
                          <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                            {adaptiveCustomBrewing.summaryMessageRu}
                          </p>
                        )}
                      </div>
                    </div>

                    {adaptiveCustomBrewing && adaptiveCustomBrewing.userSteepsCount > 0 && (
                      <button
                        type="button"
                        onClick={handleResetAllCustomTimes}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-900 hover:text-amber-950 bg-white/90 border border-amber-200 hover:bg-white px-2.5 py-1 rounded-lg transition-colors shrink-0 self-start sm:self-center shadow-2xs cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Сбросить все к эталонам</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Ergonomic Steeps Deck & Bubbles */}
              <div className="pt-0.5">
                <div className="grid gap-2 grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 transition-all">
                  {simulationResults.map((d, idx) => {
                    const baselineSec = adaptiveCustomBrewing?.steepStatus[idx]?.baselineSec ?? computedAdaptiveDurations[idx] ?? 10;
                    const statusObj = adaptiveCustomBrewing?.steepStatus[idx];
                    const userVal = customSteepTimes[idx];

                    return (
                      <SteepBubbleCard
                        key={d.steepNumber}
                        idx={idx}
                        steepNum={d.steepNumber}
                        isSelected={idx === selectedSteepIndex}
                        baselineSec={baselineSec}
                        statusObj={statusObj}
                        userVal={userVal}
                        effectiveSec={d.timeSec}
                        isCustomTimingMode={isCustomTimingMode}
                        onSelect={setSelectedSteepIndex}
                        onSetCustomTime={handleSetCustomSteepTime}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Selected Steep Deep-Dive Profile */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  {/* Visual Cup Color Rendering */}
                  <div 
                    className="w-14 h-14 rounded-full border-4 border-stone-100 shadow-inner flex items-center justify-center relative shrink-0"
                    style={{
                      backgroundColor: getLiquorColor(selectedTea, currentSteepData.steepNumber),
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.15)'
                    }}
                    title={`Цвет настоя на ${currentSteepData.steepNumber}-м проливе`}
                  >
                    <span className="text-[10px] font-bold text-stone-900 bg-white/80 px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                      #{currentSteepData.steepNumber}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-lg font-bold text-stone-900 font-serif flex flex-wrap items-center gap-2">
                      <span>Пролив #{currentSteepData.steepNumber}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-md font-mono font-bold ${
                        currentSteepData.isCustomUserTime
                          ? 'bg-amber-200 text-amber-950 border border-amber-300'
                          : currentSteepData.isAdaptedReference
                          ? 'bg-amber-100/80 text-amber-900 border border-amber-200'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        Экспозиция: {currentSteepData.timeSec} секунд
                        {currentSteepData.isCustomUserTime && ' (своё время)'}
                        {currentSteepData.isAdaptedReference && ' (адаптировано)'}
                      </span>
                    </h5>

                    {/* Inline steep custom time status & reset if Custom Timing Mode is enabled */}
                    {isCustomTimingMode && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {currentSteepData.isCustomUserTime ? (
                          <div className="flex items-center gap-2 bg-amber-100/90 border border-amber-300 text-amber-950 px-2.5 py-1 rounded-lg text-xs">
                            <span className="font-semibold">
                              Задано вручную: <strong className="font-mono">{currentSteepData.timeSec}с</strong> (исходный эталон {computedAdaptiveDurations[safeSteepIndex] || 10}с)
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                handleSetCustomSteepTime(safeSteepIndex, null);
                                setSteepDrafts(prev => {
                                  const next = { ...prev };
                                  delete next[safeSteepIndex];
                                  return next;
                                });
                              }}
                              className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline ml-1 cursor-pointer"
                            >
                              Сбросить на эталон
                            </button>
                          </div>
                        ) : currentSteepData.isAdaptedReference ? (
                          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg text-xs">
                            <span>
                              Скорректированный эталон: <strong className="font-mono">{currentSteepData.timeSec}с</strong> (базовый {computedAdaptiveDurations[safeSteepIndex] || 10}с)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 text-stone-700 px-2.5 py-1 rounded-lg text-xs">
                            <span>
                              Эталонное время: <strong className="font-mono">{currentSteepData.timeSec}с</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-stone-600 mt-1.5 max-w-lg">
                      {currentSteepData.keyNotes}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-stone-100 sm:pl-4">
                  <div className="text-xs text-stone-400">Интенсивность аромата</div>
                  <div className="text-xl font-bold font-mono text-amber-700">
                    {currentSteepData.volatilesIntensity} / 100
                  </div>
                </div>
              </div>

              {/* Scientific Metrics Badge Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50/80 p-3.5 rounded-xl border border-stone-200">
                <div>
                  <div className="text-[11px] text-stone-500">TDS (Сухой остаток)</div>
                  <div className="text-base font-bold font-mono text-stone-900 mt-0.5">
                    {currentSteepData.tdsPpm} <span className="text-xs font-normal text-stone-500">ppm (мг/л)</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-stone-500">Выход экстракта (ISO 9768)</div>
                  <div className="text-base font-bold font-mono text-amber-800 mt-0.5">
                    {currentSteepData.cumulativeExtractionYieldPercent}% <span className="text-xs font-normal text-stone-500">листа</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-stone-500">Индекс баланса (Теанин / Танины)</div>
                  <div className="text-base font-bold font-mono text-emerald-800 mt-0.5">
                    {currentSteepData.theanineToCatechinsRatio} <span className="text-xs font-normal text-stone-500">{currentSteepData.theanineToCatechinsRatio > 0.25 ? '(Умами+)' : '(Танины+)'}</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-stone-500">Время экспозиции</div>
                  <div className="text-base font-bold font-mono text-stone-800 mt-0.5">
                    {currentSteepData.timeSec} сек
                  </div>
                </div>
              </div>

              {/* Peer-reviewed reference note for this steep */}
              {currentSteepData.scientificReferenceRu && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Обоснование динамики данного пролива: </span>
                    <span className="italic">{currentSteepData.scientificReferenceRu}</span>
                  </div>
                </div>
              )}

              {/* Chemical Concentrations in this steep */}
              <div>
                <div className="text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Фракционированный химический состав пиалы (мг / 100 мл):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                    <div className="text-[11px] text-emerald-800 font-medium">L-Теанин (Умами)</div>
                    <div className="text-lg font-bold font-mono text-emerald-950 mt-0.5">
                      {currentSteepData.theanineConcentration} <span className="text-xs font-normal">мг</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                    <div className="text-[11px] text-blue-800 font-medium">Кофеин (Бодрость)</div>
                    <div className="text-lg font-bold font-mono text-blue-950 mt-0.5">
                      {currentSteepData.caffeineConcentration} <span className="text-xs font-normal">мг</span>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
                    <div className="text-[11px] text-rose-800 font-medium">Катехины (Танины)</div>
                    <div className="text-lg font-bold font-mono text-rose-950 mt-0.5">
                      {currentSteepData.catechinsConcentration} <span className="text-xs font-normal">мг</span>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
                    <div className="text-[11px] text-purple-800 font-medium">Полисахариды (Тело)</div>
                    <div className="text-lg font-bold font-mono text-purple-950 mt-0.5">
                      {currentSteepData.polysaccharidesConcentration} <span className="text-xs font-normal">мг</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sensory Balance Bars */}
              <div className="space-y-3 pt-2 min-w-0">
                <div className="text-xs font-semibold text-stone-700 uppercase tracking-wider break-words">
                  Сенсорный баланс вкуса (шкала органолептической оценки 0 – 10 по GB/T 23776):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 min-w-0">
                  {/* Umami */}
                  <div className="min-w-0">
                    <div className="flex justify-between text-xs mb-1 min-w-0 gap-2">
                      <span className="font-medium text-stone-700 break-words min-w-0">Умами / Сладковатость аминокислот</span>
                      <span className="font-mono font-bold text-emerald-700 shrink-0">{currentSteepData.sensoryScores.umami}</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${(currentSteepData.sensoryScores.umami / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Sweetness */}
                  <div className="min-w-0">
                    <div className="flex justify-between text-xs mb-1 min-w-0 gap-2">
                      <span className="font-medium text-stone-700 break-words min-w-0">Сладость и послевкусие («Хуэй Гань»)</span>
                      <span className="font-mono font-bold text-amber-700 shrink-0">{currentSteepData.sensoryScores.sweetness}</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${(currentSteepData.sensoryScores.sweetness / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Bitterness */}
                  <div className="min-w-0">
                    <div className="flex justify-between text-xs mb-1 min-w-0 gap-2">
                      <span className="font-medium text-stone-700 break-words min-w-0">Горечь (кофеин + окисленные флавоноиды)</span>
                      <span className="font-mono font-bold text-stone-700 shrink-0">{currentSteepData.sensoryScores.bitterness}</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stone-600 rounded-full transition-all duration-300"
                        style={{ width: `${(currentSteepData.sensoryScores.bitterness / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Astringency */}
                  <div className="min-w-0">
                    <div className="flex justify-between text-xs mb-1 min-w-0 gap-2">
                      <span className="font-medium text-stone-700 break-words min-w-0">Терпкость (вяжущие катехины EGCG)</span>
                      <span className="font-mono font-bold text-rose-700 shrink-0">{currentSteepData.sensoryScores.astringency}</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-300"
                        style={{ width: `${(currentSteepData.sensoryScores.astringency / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="min-w-0">
                    <div className="flex justify-between text-xs mb-1 min-w-0 gap-2">
                      <span className="font-medium text-stone-700 break-words min-w-0">Тело / Шелковистость («Ча Тан»)</span>
                      <span className="font-mono font-bold text-purple-700 shrink-0">{currentSteepData.sensoryScores.body}</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${(currentSteepData.sensoryScores.body / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Aroma */}
                  <div className="min-w-0">
                    <div className="flex justify-between text-xs mb-1 min-w-0 gap-2">
                      <span className="font-medium text-stone-700 break-words min-w-0">Ароматическая диффузия («Ча Сян»)</span>
                      <span className="font-mono font-bold text-orange-700 shrink-0">{currentSteepData.sensoryScores.aroma}</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-300"
                        style={{ width: `${(currentSteepData.sensoryScores.aroma / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. KINETIC CURVES VISUALIZATION (MOVED TO THE VERY BOTTOM AS REQUESTED) */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="font-bold text-stone-900 text-base flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-amber-700" />
                  <span>Кинетические кривые экстракции ({steepsCount} {steepsCount === 1 ? 'пролив' : (steepsCount < 5 ? 'пролива' : 'проливов')})</span>
                </h4>
                <p className="text-xs text-stone-500">
                  Динамика концентрации соединений в каждом отдельном проливе (мг / 100 мл)
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span className="text-stone-700 font-medium">L-Теанин</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span className="text-stone-700 font-medium">Кофеин</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  <span className="text-stone-700 font-medium">Катехины (EGCG)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  <span className="text-stone-700 font-medium">Полисахариды (TPS)</span>
                </div>
                {isCustomTimingMode && (
                  <>
                    <div className="w-px h-3.5 bg-stone-300 mx-0.5"></div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-amber-800"></span>
                      <span className="text-amber-950 font-bold">Ваш факт</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span className="text-amber-800 font-bold">Адаптировано</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* SVG Multi-curve Chart with horizontal scroll when many steeps */}
            <div className="w-full overflow-x-auto pb-2 border border-stone-100 rounded-xl p-1 bg-stone-50/50">
              <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                style={{ width: `${svgWidth}px`, minWidth: '100%', height: `${svgHeight}px` }} 
                className="select-none"
              >
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratioVal, i) => {
                  const y = padding.top + chartH * (1 - ratioVal);
                  const valLabel = Math.round(maxConcentration * ratioVal);
                  return (
                    <g key={i}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={svgWidth - padding.right}
                        y2={y}
                        stroke="#e7e5e4"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padding.left - 6}
                        y={y + 3}
                        fontSize="9"
                        fill="#78716c"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {valLabel}
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Steeps & Vertical Grid Lines with Selected Steep Stripe */}
                {simulationResults.map((d, i) => {
                  const x = getX(i);
                  const isSelected = i === selectedSteepIndex;
                  const stripeWidth = Math.min(9, Math.max(5, Math.round((chartW / Math.max(1, simulationResults.length - 1)) * 0.125)));
                  return (
                    <g key={i} className="cursor-pointer" onClick={() => setSelectedSteepIndex(i)}>
                      {/* Vertical highlight stripe for the selected steep (slender 2x narrower gray column) */}
                      {isSelected && (
                        <rect
                          x={x - stripeWidth / 2}
                          y={padding.top}
                          width={stripeWidth}
                          height={chartH}
                          fill="rgba(148, 163, 184, 0.2)"
                          stroke="rgba(100, 116, 139, 0.35)"
                          strokeWidth={1}
                          rx={2}
                        />
                      )}
                      <line
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={padding.top + chartH}
                        stroke={isSelected ? '#64748b' : '#f5f5f4'}
                        strokeWidth={isSelected ? 1.5 : 1}
                        strokeDasharray={isSelected ? '3 3' : undefined}
                      />
                      <text
                        x={x}
                        y={padding.top + chartH + 16}
                        fontSize="10"
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        fill={isSelected ? '#334155' : '#78716c'}
                        textAnchor="middle"
                      >
                        #{d.steepNumber} ({d.timeSec}с)
                      </text>
                      {d.isCustomUserTime && (
                        <text
                          x={x}
                          y={padding.top + chartH + 27}
                          fontSize="8.5"
                          fontWeight="bold"
                          fill="#92400e"
                          textAnchor="middle"
                        >
                          факт
                        </text>
                      )}
                      {d.isAdaptedReference && (
                        <text
                          x={x}
                          y={padding.top + chartH + 27}
                          fontSize="8.5"
                          fontWeight="bold"
                          fill="#d97706"
                          textAnchor="middle"
                        >
                          адапт
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Smooth Continuous Spline Data curves */}
                <path
                  d={theaninePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={caffeinePath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={catechinsPath}
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="3.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={polysaccharidesPath}
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points for current selected steep */}
                {simulationResults.map((d, i) => {
                  const x = getX(i);
                  const isSelected = i === selectedSteepIndex;
                  return (
                    <g key={i} className="cursor-pointer" onClick={() => setSelectedSteepIndex(i)}>
                      {/* Invisible wider target for clicking */}
                      <rect
                        x={x - 18}
                        y={padding.top}
                        width="36"
                        height={chartH}
                        fill="transparent"
                      />
                      <circle
                        cx={x}
                        cy={getY(d.theanineConcentration)}
                        r={isSelected ? 5.5 : 3.5}
                        fill="#10b981"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={x}
                        cy={getY(d.caffeineConcentration)}
                        r={isSelected ? 5.5 : 3.5}
                        fill="#2563eb"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={x}
                        cy={getY(d.catechinsConcentration)}
                        r={isSelected ? 6 : 4}
                        fill="#e11d48"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx={x}
                        cy={getY(d.polysaccharidesConcentration)}
                        r={isSelected ? 5.5 : 3.5}
                        fill="#9333ea"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
            <p className="text-[11px] text-stone-500 italic">
              * Кликните по точке любого пролива на графике или по кнопке пролива выше, чтобы увидеть детальный профиль чашки.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
