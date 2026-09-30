import React, { useState, useMemo } from 'react';
import { TeaVariety, BlendComponentItem, InitialTastingSessionData, canTeaAge } from '../types';
import { calculateTeaBlend, BLEND_PRESET_RECIPES } from '../utils/teaBlendCalculator';
import { isTeaArchetype } from '../data/teaData';
import { 
  FlaskConical, 
  Plus, 
  Trash2, 
  Sparkles, 
  Flame, 
  Droplet, 
  Coffee, 
  Search, 
  X,
  Layers,
  Award,
  Zap,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  Clock
} from 'lucide-react';
import { matchTeaSearch } from '../utils/teaSearch';

export interface SavedTeaBlend {
  id: string;
  name: string;
  components: BlendComponentItem[];
  savedAt: string;
  totalMassG: number;
}

interface TeaBlendStudioProps {
  allTeaMap: Map<string, TeaVariety>;
  onApplyBlend: (compositeTea: TeaVariety) => void;
  onLogBlendToJournal?: (sessionData: InitialTastingSessionData) => void;
}

const SAVED_BLENDS_STORAGE_KEY = 'gongfu_saved_tea_blends_v1';

export const TeaBlendStudio: React.FC<TeaBlendStudioProps> = ({
  allTeaMap,
  onApplyBlend,
  onLogBlendToJournal
}) => {
  // Initial blend components: User starts with empty customizable slots to select varieties
  const [components, setComponents] = useState<BlendComponentItem[]>([
    { teaId: '', weightG: 3.0 },
    { teaId: '', weightG: 3.0 }
  ]);

  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  
  // Tea selector modal / picker state
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [pickerSearchQuery, setPickerSearchQuery] = useState<string>('');
  const [pickerTypeFilter, setPickerTypeFilter] = useState<string>('all');

  // Saved blends in localStorage
  const [savedBlends, setSavedBlends] = useState<SavedTeaBlend[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_BLENDS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [customBlendNameInput, setCustomBlendNameInput] = useState<string>('');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<boolean>(false);

  // Real-time scientific calculation of the blend (automatically updates upon any change)
  const blendResult = useMemo(() => {
    return calculateTeaBlend(components, allTeaMap);
  }, [components, allTeaMap]);

  // Load a classic preset blend
  const handleLoadPreset = (presetId: string) => {
    const preset = BLEND_PRESET_RECIPES.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(presetId);
    const newItems: BlendComponentItem[] = preset.components.map((c: { teaId: string; ratioPercent: number }) => ({
      teaId: c.teaId,
      weightG: Math.round(((c.ratioPercent / 100) * 6.0) * 10) / 10
    }));
    setComponents(newItems);
  };

  // Load user saved blend
  const handleLoadSavedBlend = (blend: SavedTeaBlend) => {
    setActivePresetId(null);
    setComponents(blend.components.map((c: BlendComponentItem) => ({ ...c })));
  };

  // Delete user saved blend
  const handleDeleteSavedBlend = (blendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = savedBlends.filter((b) => b.id !== blendId);
    setSavedBlends(next);
    try {
      localStorage.setItem(SAVED_BLENDS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  // Save current blend
  const handleOpenSaveModal = () => {
    if (!blendResult) return;
    const defaultName = blendResult.compositeTeaVariety.nameRu.replace('Купаж: ', '').trim();
    setCustomBlendNameInput(defaultName || `Авторский купаж #${savedBlends.length + 1}`);
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveBlend = () => {
    if (!blendResult) return;
    const newBlend: SavedTeaBlend = {
      id: `blend_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: customBlendNameInput.trim() || `Авторский купаж #${savedBlends.length + 1}`,
      components: components.filter((c) => Boolean(c.teaId)),
      savedAt: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      totalMassG: blendResult.totalMassG
    };

    const next = [newBlend, ...savedBlends];
    setSavedBlends(next);
    try {
      localStorage.setItem(SAVED_BLENDS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }

    setIsSaveModalOpen(false);
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 3000);
  };

  // Reset to empty custom blend
  const handleResetBlend = () => {
    setActivePresetId(null);
    setComponents([
      { teaId: '', weightG: 3.0 },
      { teaId: '', weightG: 3.0 }
    ]);
  };

  // Modify weight of a component
  const handleWeightChange = (index: number, newWeight: number) => {
    const clamped = Math.max(0.5, Math.min(15, Math.round(newWeight * 10) / 10));
    setComponents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], weightG: clamped };
      return next;
    });
    setActivePresetId(null);
  };

  // Modify vintage year of a component
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const handleVintageYearChange = (index: number, year: number) => {
    setComponents((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], vintageYear: year };
      return next;
    });
    setActivePresetId(null);
  };

  // Remove a component (min 2 slots kept)
  const handleRemoveComponent = (index: number) => {
    if (components.length <= 2) {
      // Clear the slot instead of deleting
      setComponents((prev) => {
        const next = [...prev];
        next[index] = { teaId: '', weightG: 3.0 };
        return next;
      });
    } else {
      setComponents((prev) => prev.filter((_, i) => i !== index));
    }
    setActivePresetId(null);
  };

  // Open tea picker
  const handleOpenPicker = (indexToReplace: number | -1) => {
    setPickerIndex(indexToReplace);
    setPickerSearchQuery('');
    setPickerTypeFilter('all');
  };

  // Select tea from picker
  const handleSelectTeaFromPicker = (tea: TeaVariety) => {
    if (pickerIndex === null) return;
    setActivePresetId(null);

    if (pickerIndex === -1) {
      // Add new component
      setComponents((prev) => [...prev, { teaId: tea.id, weightG: 2.0 }]);
    } else {
      // Replace existing component
      setComponents((prev) => {
        const next = [...prev];
        next[pickerIndex] = { ...next[pickerIndex], teaId: tea.id };
        return next;
      });
    }
    setPickerIndex(null);
  };

  const favoriteIds = useMemo(() => {
    try {
      const saved = localStorage.getItem('gongfu_tea_favorite_ids_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((id: string) => allTeaMap.has(id));
      }
    } catch {}
    return [];
  }, [allTeaMap]);

  // Filtered teas for picker
  const allTeasArray = useMemo(() => Array.from(allTeaMap.values()), [allTeaMap]);
  const pickerTeas = useMemo(() => {
    return allTeasArray.filter((tea) => {
      // Only specific teas or custom blends (no generic archetypes in custom blending)
      if (tea.categoryGroup === 'generic') return false;

      if (pickerTypeFilter === 'favorites') {
        if (!favoriteIds.includes(tea.id)) return false;
      } else if (pickerTypeFilter !== 'all') {
        if (pickerTypeFilter === 'oolong' && !tea.type.includes('oolong')) return false;
        else if (pickerTypeFilter === 'gaba' && !tea.type.startsWith('gaba')) return false;
        else if (pickerTypeFilter === 'puerh' && !tea.type.includes('puerh') && tea.type !== 'heicha') return false;
        else if (pickerTypeFilter !== 'oolong' && pickerTypeFilter !== 'gaba' && pickerTypeFilter !== 'puerh' && tea.type !== pickerTypeFilter) {
          return false;
        }
      }
      return matchTeaSearch(tea, pickerSearchQuery);
    });
  }, [allTeasArray, pickerSearchQuery, pickerTypeFilter, favoriteIds]);

  // Color mapping by tea type for the visual composition bar
  const getTeaTypeColor = (type: string) => {
    switch (type) {
      case 'green': return 'bg-emerald-500';
      case 'white': return 'bg-amber-200';
      case 'yellow': return 'bg-yellow-400';
      case 'oolong_ball':
      case 'oolong_strip': return 'bg-teal-600';
      case 'gaba_oolong':
      case 'gaba_red': return 'bg-purple-600';
      case 'red': return 'bg-rose-600';
      case 'sheng_puerh': return 'bg-lime-700';
      case 'shou_puerh': return 'bg-amber-950';
      case 'heicha': return 'bg-stone-800';
      default: return 'bg-amber-700';
    }
  };

  const selectedCount = components.filter((c) => Boolean(c.teaId)).length;

  return (
    <div className="space-y-4">
      {/* Compact Classic Blends & Actions Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 sm:px-4 rounded-xl bg-stone-50 border border-stone-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>Классические купажи:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BLEND_PRESET_RECIPES.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-amber-800 text-white border-amber-800 font-bold shadow-2xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                  title={preset.descriptionRu}
                >
                  {preset.titleRu}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {blendResult && (
            <button
              type="button"
              onClick={handleOpenSaveModal}
              className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Сохранить текущий купаж в коллекцию"
            >
              <Bookmark className="w-3 h-3 text-amber-700" />
              <span>Сохранить купаж</span>
            </button>
          )}

          {selectedCount > 0 && (
            <button
              type="button"
              onClick={handleResetBlend}
              className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Очистить состав купажа"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Очистить</span>
            </button>
          )}

          {blendResult && onLogBlendToJournal && (
            <button
              type="button"
              onClick={() => {
                onLogBlendToJournal({
                  tea: blendResult.compositeTeaVariety,
                  waterTempC: blendResult.optimalTempC,
                  teaMassG: blendResult.totalMassG,
                  waterVolumeMl: blendResult.recommendedWaterVolumeMl,
                  steepsCount: blendResult.recommendedSteeps,
                  steepScheduleSec: blendResult.steepScheduleSec,
                  vesselUsed: blendResult.recommendedVesselRu?.split('(')[0]?.trim() || `Гайвань ${blendResult.recommendedWaterVolumeMl} мл`,
                  effectNote: blendResult.energyRelaxScorePercent < 35 ? 'Глубокий релакс' : blendResult.energyRelaxScorePercent > 65 ? 'Тонизирующий тонус' : 'Медитативная ясность',
                  userNotes: `Авторский купаж: ${blendResult.compositeTeaVariety.nameRu}. ${blendResult.synergySummaryRu}`,
                  tags: ['Авторский купаж', 'Гунфу Ча']
                });
              }}
              className="px-2.5 py-1.5 rounded-lg border border-stone-300 hover:border-amber-700 bg-white hover:bg-amber-50 text-stone-700 hover:text-amber-950 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Записать дегустацию этого купажа в дневник"
            >
              <Bookmark className="w-3 h-3 text-amber-700" />
              <span>Записать в дневник</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification for Saved Blend */}
      {savedSuccessMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <BookmarkCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Купаж успешно сохранён в вашу коллекцию!</span>
        </div>
      )}

      {/* Saved Blends Bar (if any saved) */}
      {savedBlends.length > 0 && (
        <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-800 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-amber-700" />
              <span>Мои сохранённые купажи ({savedBlends.length}):</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {savedBlends.map((blend) => (
              <div
                key={blend.id}
                onClick={() => handleLoadSavedBlend(blend)}
                className="group p-2 rounded-lg bg-stone-50 hover:bg-amber-50/70 border border-stone-200 hover:border-amber-300 transition-all flex items-center gap-2 cursor-pointer text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-stone-900 group-hover:text-amber-950 block">
                    {blend.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono">
                    <span>{blend.totalMassG}г</span>
                    <span>•</span>
                    <span>{blend.components.length} сортов</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {blend.savedAt}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDeleteSavedBlend(blend.id, e)}
                  className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 ml-1"
                  title="Удалить сохранённый купаж"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Left = Component Builder, Right = Live Scientific Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Component Editor (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-800" />
                <h3 className="text-sm font-bold text-stone-900">Состав купажа</h3>
              </div>
              <span className="text-xs font-mono font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                Итого: {blendResult?.totalMassG || components.reduce((a, b) => a + (b.teaId ? b.weightG : 0), 0)} г
              </span>
            </div>

            {/* Visual Proportion Bar (if at least one tea selected) */}
            {blendResult && (
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden flex shadow-inner">
                  {components.map((comp, idx) => {
                    const tea = allTeaMap.get(comp.teaId);
                    if (!tea) return null;
                    const pct = Math.round((comp.weightG / blendResult.totalMassG) * 100);
                    return (
                      <div
                        key={idx}
                        style={{ width: `${pct}%` }}
                        className={`${getTeaTypeColor(tea.type)} h-full transition-all duration-300 relative group`}
                        title={`${tea.nameRu}: ${comp.weightG}г (${pct}%)`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                  <span>0%</span>
                  <span>100% композиция</span>
                </div>
              </div>
            )}

            {/* Component Cards */}
            <div className="space-y-3">
              {components.map((comp, idx) => {
                const tea = comp.teaId ? allTeaMap.get(comp.teaId) : null;
                const pct = blendResult && comp.weightG && blendResult.totalMassG 
                  ? Math.round((comp.weightG / blendResult.totalMassG) * 100) 
                  : 0;

                if (!tea) {
                  // Empty slot - inviting user to pick
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/50 hover:bg-amber-50/40 hover:border-amber-300 transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-600 text-[11px] font-mono flex items-center justify-center font-bold">
                            #{idx + 1}
                          </span>
                          <span>Выберите чай</span>
                        </span>
                        {components.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveComponent(idx)}
                            className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Удалить слот"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenPicker(idx)}
                        className="w-full py-2.5 px-3 rounded-lg bg-white border border-stone-300 hover:border-amber-700 text-stone-700 hover:text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-amber-700" />
                        <span>Выбрать чай...</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-3 transition-all hover:border-amber-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className={`w-2 h-2 rounded-full ${getTeaTypeColor(tea.type)}`} />
                          <span className="font-semibold text-amber-900">{tea.typeNameRu}</span>
                          <span className="text-stone-400 font-serif italic text-[10px]">{tea.nameZh}</span>
                        </div>
                        <div className="text-xs sm:text-[13px] font-bold text-stone-900 truncate mt-0.5" title={tea.nameRu}>
                          {tea.nameRu.split('(')[0].trim()}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate mt-0.5">
                          {tea.origin.split(',')[0]} • Оптимум: {tea.optimalTemp}°C
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {pct > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-mono font-bold text-xs">
                            {pct}%
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(idx)}
                          className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Удалить из купажа"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Weight Controls & Vintage Year & Replace */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200/80">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenPicker(idx)}
                          className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline underline-offset-2 cursor-pointer"
                        >
                          Заменить чай...
                        </button>

                        {!isTeaArchetype(tea) && canTeaAge(tea) && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-stone-500 font-semibold">Год:</span>
                            <select
                              value={comp.vintageYear || tea.vintageYear || currentYear}
                              onChange={(e) => handleVintageYearChange(idx, Number(e.target.value))}
                              className="bg-white border border-stone-300 text-stone-900 font-mono font-bold text-[11px] rounded px-1 py-0.5 focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer max-w-full truncate"
                            >
                              {Array.from({ length: 51 }, (_, i) => currentYear - i).map((yr) => (
                                <option key={yr} value={yr}>
                                  {yr} {yr === currentYear ? '(Свежий)' : 'г.'}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleWeightChange(idx, comp.weightG - 0.5)}
                          className="w-6 h-6 rounded-md bg-white border border-stone-300 hover:bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-mono font-bold text-xs text-stone-900">
                          {comp.weightG} г
                        </span>
                        <button
                          type="button"
                          onClick={() => handleWeightChange(idx, comp.weightG + 0.5)}
                          className="w-6 h-6 rounded-md bg-white border border-stone-300 hover:bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add component button */}
            {components.length < 5 && (
              <button
                type="button"
                onClick={() => handleOpenPicker(-1)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-stone-300 hover:border-amber-600 hover:bg-amber-50/50 text-stone-600 hover:text-amber-900 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить ещё чай в купаж ({components.length}/5)</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Physical-Chemical & Kinetic Calculation (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          {blendResult ? (
            /* Live Calculated Scientific Optimum */
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <h3 className="text-sm font-bold text-stone-900">
                    Автоматический расчёт физико-химического оптимума
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Гунфу Ча компромисс
                </span>
              </div>

              {/* Key Trio: Temp, Water Volume, Vessel */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Temp */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                    <Flame className="w-3.5 h-3.5 text-amber-700" />
                    <span>Температура</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-black text-amber-950">
                    {blendResult.optimalTempC}°C
                  </div>
                  <div className="text-[10px] text-amber-800 leading-tight">
                    Термобаланс фракций
                  </div>
                </div>

                {/* Volume & Ratio */}
                <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/90 space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-sky-900">
                    <Droplet className="w-3.5 h-3.5 text-sky-700" />
                    <span>Объём воды</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-mono font-black text-sky-950">
                    {blendResult.recommendedWaterVolumeMl} мл
                  </div>
                  <div className="text-[10px] text-sky-800 leading-tight">
                    Гидромодуль 1:{blendResult.recommendedRatio}
                  </div>
                </div>

                {/* Vessel */}
                <div className="p-3 rounded-xl bg-stone-100/70 border border-stone-200 space-y-1 sm:col-span-1">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-800">
                    <Coffee className="w-3.5 h-3.5 text-stone-600" />
                    <span>Посуда</span>
                  </div>
                  <div className="text-xs font-bold text-stone-900 leading-snug line-clamp-2">
                    {blendResult.recommendedVesselRu.split('(')[0].trim()}
                  </div>
                  <div className="text-[10px] text-stone-500 leading-tight">
                    Оптимальная теплоёмкость
                  </div>
                </div>
              </div>

              {/* Thermodynamic Rationale Note */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed space-y-1">
                <span className="font-bold text-stone-900 block">Термодинамическое обоснование:</span>
                <p>{blendResult.tempRationaleRu}</p>
              </div>

              {/* Chemical Synergy Meters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Meter 1: Tannin Buffering */}
                <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Буферизация терпкости</span>
                    </span>
                    <span className="font-mono font-bold text-stone-900">
                      {blendResult.tanninBufferingScorePercent}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${blendResult.tanninBufferingScorePercent}%` }}
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    />
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {blendResult.tanninBufferingScorePercent > 75 
                      ? 'Мягкий бархатный настой, полисахариды сглаживают горечь'
                      : 'Отчётливый структурированный танинный каркас'}
                  </div>
                </div>

                {/* Meter 2: Aroma Harmony */}
                <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Гармония букета</span>
                    </span>
                    <span className="font-mono font-bold text-stone-900">
                      {blendResult.aromaHarmonyScorePercent}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${blendResult.aromaHarmonyScorePercent}%` }}
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    />
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {blendResult.aromaHarmonyScorePercent >= 90
                      ? 'Идеальная синергия ароматических монотерпенов'
                      : 'Сложный контрастный вкусовой аккорд'}
                  </div>
                </div>
              </div>

              {/* Bioactive Compounds Ratios */}
              <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/70 text-xs text-amber-950 space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-700" />
                    <span>Биоактивный баланс купажа:</span>
                  </span>
                  <span className="font-mono text-[11px] text-amber-900">
                    L-Теанин/Кофеин: {blendResult.theanineToCaffeineRatio}
                  </span>
                </div>
                <p className="text-[11px] text-stone-700 leading-relaxed">
                  {blendResult.synergySummaryRu}
                </p>
              </div>

              {/* Synthesized Aroma & Flavor Accord */}
              <div className="space-y-2.5 pt-2 border-t border-stone-200">
                <span className="text-xs font-bold text-stone-900 block">
                  Синтезированный вкусовой аккорд купажа:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Top Notes */}
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                      Верхние летучие ноты
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {blendResult.dominantFlavorNotes.map((note, nIdx) => (
                        <span key={nIdx} className="text-[10px] font-semibold bg-white border border-amber-300 text-amber-950 px-1.5 py-0.5 rounded shadow-2xs">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Heart Notes */}
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">
                      Ноты тела (Сердце)
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {blendResult.secondaryFlavorNotes.map((note, nIdx) => (
                        <span key={nIdx} className="text-[10px] font-medium bg-white border border-stone-200 text-stone-800 px-1.5 py-0.5 rounded">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Finish Notes */}
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Послевкусие (Хуэйгань)
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {blendResult.finishNotes.map((note, nIdx) => (
                        <span key={nIdx} className="text-[10px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Steep Schedule Preview */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-stone-900">
                    Рекомендуемый тайминг проливов ({blendResult.recommendedSteeps} проливов):
                  </span>
                  <span className="text-[11px] text-stone-500 font-mono">
                    Суммарно: ~{blendResult.steepScheduleSec.reduce((a, b) => a + b, 0)} сек
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {blendResult.steepScheduleSec.map((sec, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1 rounded-md bg-stone-100 border border-stone-200 text-center font-mono text-xs"
                    >
                      <span className="text-[9px] text-stone-400 block font-sans">#{idx + 1}</span>
                      <span className="font-bold text-stone-900">{sec}с</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Big CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onApplyBlend(blendResult.compositeTeaVariety)}
                  className="w-full py-2.5 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-950 font-bold text-xs shadow-2xs transition-all flex items-center justify-center cursor-pointer"
                >
                  <span>Заварить купаж в симуляторе</span>
                </button>
              </div>
            </div>
          ) : (
            /* Empty / Starter Guide Card when teas are not chosen yet */
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5 text-center sm:text-left">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Автоматический расчёт параметров купажирования
                  </h3>
                  <p className="text-xs text-stone-500">
                    Выберите как минимум 2 сорта чая слева или воспользуйтесь классическим рецептом вверху
                  </p>
                </div>
              </div>

              {/* Informative Preview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Flame className="w-3.5 h-3.5 text-amber-700" />
                    <span>Термодинамический компромисс</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Расчёт идеальной температуры воды для защиты нежных аминокислот без потери плотности выдержанных сортов.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Droplet className="w-3.5 h-3.5 text-sky-700" />
                    <span>Гидромодуль и тайминг</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Вычисление точного объёма воды и посуды, а также адаптивной кривой секунд каждого пролива.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Буферизация танинов</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Оценка связывания агрессивных катехинов растворимыми полисахаридами для гладкого бархатного тела.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Синтез вкусового букета</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Объединение эфирных масел и ароматических терпенов в гармоничный многослойный вкусовой аккорд.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 text-left">
                <span className="font-bold block mb-0.5">Быстрый старт:</span>
                Кликните на «+ Выбрать сорт» в слотах слева, чтобы выбрать любые чаи из каталога, либо нажмите на один из классических рецептов (например, «Императорский бархат» или «Огненный Феникс»).
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Blend Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <Bookmark className="w-4 h-4 text-amber-800" />
                <h3 className="text-sm font-bold text-stone-900">
                  Сохранить авторский купаж
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 block">
                Название купажа:
              </label>
              <input
                type="text"
                value={customBlendNameInput}
                onChange={(e) => setCustomBlendNameInput(e.target.value)}
                placeholder="Например: Мой вечерний пуэр-бархат..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-amber-700 focus:outline-hidden focus:ring-1 focus:ring-amber-700/30 font-medium"
                autoFocus
              />
              <p className="text-[11px] text-stone-500">
                Купаж будет сохранён в локальную память браузера вместе с граммовками и расчётными параметрами.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveBlend}
                className="px-4 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-2xs cursor-pointer"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tea Selector Modal for choosing any of the 501 teas */}
      {pickerIndex !== null && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-800" />
                <h3 className="text-sm font-bold text-stone-900">
                  {pickerIndex === -1 ? 'Добавить чай в купаж' : 'Выбрать чай для купажа'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPickerIndex(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search and Filter */}
            <div className="p-4 border-b border-stone-200 space-y-2.5 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Поиск среди сортов (название, пиньинь, регион)..."
                  value={pickerSearchQuery}
                  onChange={(e) => setPickerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-stone-300 focus:border-amber-700 focus:outline-hidden focus:ring-1 focus:ring-amber-700/30"
                  autoFocus
                />
                {pickerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPickerSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Type pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'favorites', label: '⭐ Избранные' },
                  { id: 'green', label: 'Зелёный' },
                  { id: 'white', label: 'Белый' },
                  { id: 'oolong', label: 'Улун' },
                  { id: 'gaba', label: 'ГАБА' },
                  { id: 'red', label: 'Красный' },
                  { id: 'puerh', label: 'Пуэр / Хэйча' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPickerTypeFilter(f.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 border cursor-pointer ${
                      pickerTypeFilter === f.id
                        ? 'bg-amber-900 text-white border-amber-900'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 max-h-[50vh]">
              {pickerTeas.length === 0 ? (
                <div className="p-8 text-center text-stone-500 text-xs">
                  Сортов по вашему запросу не найдено
                </div>
              ) : (
                pickerTeas.slice(0, 100).map((tea) => {
                  const isAlreadyInBlend = components.some((c) => c.teaId === tea.id);
                  return (
                    <button
                      key={tea.id}
                      type="button"
                      onClick={() => handleSelectTeaFromPicker(tea)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isAlreadyInBlend
                          ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                          : 'bg-stone-50/60 hover:bg-amber-50/40 border-stone-200 text-stone-800'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className={`w-2 h-2 rounded-full ${getTeaTypeColor(tea.type)}`} />
                          <span className="font-semibold text-amber-900">{tea.typeNameRu}</span>
                          <span className="text-stone-400 font-serif italic text-[10px]">{tea.nameZh}</span>
                        </div>
                        <div className="text-xs font-bold text-stone-900 truncate mt-0.5">
                          {tea.nameRu}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate mt-0.5">
                          {tea.origin} • Оптимум: {tea.optimalTemp}°C
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {isAlreadyInBlend ? (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                            В купаже
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1">
                            <span>Выбрать</span>
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-stone-200 bg-stone-50 text-right">
              <button
                type="button"
                onClick={() => setPickerIndex(null)}
                className="px-4 py-1.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
