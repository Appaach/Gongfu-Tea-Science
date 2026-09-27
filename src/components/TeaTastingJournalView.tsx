import React, { useState, useMemo, useEffect } from 'react';
import { TastingJournalEntry, TeaVariety, InitialTastingSessionData } from '../types';
import { TEA_VARIETIES, GENERIC_TEA_ARCHETYPES, getTeaEffect } from '../data/teaData';
import { 
  BookOpen, 
  Plus, 
  Star, 
  Trash2, 
  Search, 
  X, 
  Sparkles, 
  Flame, 
  Scale, 
  Droplet, 
  Coffee, 
  Clock, 
  Download, 
  ArrowRight,
  ChevronRight,
  Layers,
  Sliders,
  Edit3,
  Printer,
  FileText,
  Check,
  Tag,
  Upload
} from 'lucide-react';
import { matchTeaSearch } from '../utils/teaSearch';

const JOURNAL_STORAGE_KEY = 'gongfu_tasting_journal_v1';

interface TeaTastingJournalViewProps {
  onSelectTeaToBrew?: (tea: TeaVariety) => void;
  initialSessionData?: InitialTastingSessionData | null;
  initialNewTea?: TeaVariety | null;
}

export const TeaTastingJournalView: React.FC<TeaTastingJournalViewProps> = ({
  onSelectTeaToBrew,
  initialSessionData,
  initialNewTea
}) => {
  const allTeas = useMemo(() => [...GENERIC_TEA_ARCHETYPES, ...TEA_VARIETIES], []);
  const teaMap = useMemo(() => new Map(allTeas.map((t) => [t.id, t])), [allTeas]);

  // Custom blend teas created on the fly
  const [customBlends, setCustomBlends] = useState<TeaVariety[]>([]);

  const [entries, setEntries] = useState<TastingJournalEntry[]>(() => {
    try {
      const stored = localStorage.getItem(JOURNAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [isNewModalOpen, setIsNewModalOpen] = useState(Boolean(initialSessionData || initialNewTea));
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [printingEntry, setPrintingEntry] = useState<TastingJournalEntry | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number>(0);

  // Tea Picker Sub-Modal State
  const [isTeaPickerOpen, setIsTeaPickerOpen] = useState<boolean>(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState<string>('');
  const [pickerTypeFilter, setPickerTypeFilter] = useState<string>('all');

  // Form State
  const initialTea = initialSessionData?.tea || initialNewTea || allTeas[0];
  const [selectedTea, setSelectedTea] = useState<TeaVariety>(initialTea);
  
  const [rating, setRating] = useState<number>(5);
  const [vesselUsed, setVesselUsed] = useState<string>(
    initialSessionData?.vesselUsed || initialTea.recommendedVesselRu?.split('(')[0]?.trim() || 'Фарфоровая гайвань 120 мл'
  );
  const [waterTempC, setWaterTempC] = useState<number>(
    initialSessionData?.waterTempC || initialTea.optimalTemp || 95
  );
  const [teaMassG, setTeaMassG] = useState<number>(
    initialSessionData?.teaMassG || initialTea.defaultMass || 5.0
  );
  const [waterVolumeMl, setWaterVolumeMl] = useState<number>(
    initialSessionData?.waterVolumeMl || initialTea.defaultVolume || 100
  );
  const [steepsCount, setSteepsCount] = useState<number>(
    initialSessionData?.steepsCount || initialTea.recommendedSteeps || 7
  );
  const [steepScheduleSec, setSteepScheduleSec] = useState<number[]>(
    initialSessionData?.steepScheduleSec || []
  );

  const [sweetnessScore, setSweetnessScore] = useState<number>(8);
  const [astringencyScore, setAstringencyScore] = useState<number>(4);
  const [bodyScore, setBodyScore] = useState<number>(8);
  const [huiGanScore, setHuiGanScore] = useState<number>(8);
  const [effectNote, setEffectNote] = useState<string>(
    initialSessionData?.effectNote || getTeaEffect(initialTea).nameRu
  );
  const [userNotes, setUserNotes] = useState<string>(initialSessionData?.userNotes || '');
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>(
    initialSessionData?.tags || (initialTea.categoryGroup === 'blend' ? ['Авторский купаж', 'Гунфу Ча'] : ['Гунфу Ча'])
  );

  // Sync if new initialSessionData passed
  useEffect(() => {
    if (initialSessionData) {
      const t = initialSessionData.tea;
      setSelectedTea(t);
      setEditingEntryId(null);
      if (t.categoryGroup === 'blend' && !allTeas.some((item) => item.id === t.id)) {
        setCustomBlends((prev) => [...prev.filter((p) => p.id !== t.id), t]);
      }
      setWaterTempC(initialSessionData.waterTempC || t.optimalTemp || 95);
      setTeaMassG(initialSessionData.teaMassG || t.defaultMass || 5.0);
      setWaterVolumeMl(initialSessionData.waterVolumeMl || t.defaultVolume || 100);
      setSteepsCount(initialSessionData.steepsCount || t.recommendedSteeps || 7);
      setSteepScheduleSec(initialSessionData.steepScheduleSec || []);
      setVesselUsed(initialSessionData.vesselUsed || t.recommendedVesselRu?.split('(')[0]?.trim() || 'Фарфоровая гайвань 120 мл');
      setEffectNote(initialSessionData.effectNote || getTeaEffect(t).nameRu);
      setUserNotes(initialSessionData.userNotes || '');
      setTags(initialSessionData.tags || (t.categoryGroup === 'blend' ? ['Авторский купаж', 'Гунфу Ча'] : ['Гунфу Ча']));
      setIsNewModalOpen(true);
    }
  }, [initialSessionData, allTeas]);

  const combinedTeaList = useMemo(() => {
    return [...customBlends, ...allTeas];
  }, [customBlends, allTeas]);

  const selectedTeaEffect = getTeaEffect(selectedTea);

  const filteredPickerTeas = useMemo(() => {
    return combinedTeaList.filter((tea) => {
      if (pickerTypeFilter !== 'all') {
        if (pickerTypeFilter === 'generic' && tea.categoryGroup !== 'generic') return false;
        if (pickerTypeFilter === 'blend' && tea.categoryGroup !== 'blend') return false;
        if (pickerTypeFilter === 'oolong' && !tea.type.includes('oolong')) return false;
        if (pickerTypeFilter === 'gaba' && !tea.type.startsWith('gaba')) return false;
        if (pickerTypeFilter === 'puerh' && !tea.type.includes('puerh') && tea.type !== 'heicha') return false;
        if (pickerTypeFilter !== 'generic' && pickerTypeFilter !== 'blend' && pickerTypeFilter !== 'oolong' && pickerTypeFilter !== 'gaba' && pickerTypeFilter !== 'puerh' && tea.type !== pickerTypeFilter) {
          return false;
        }
      }
      return matchTeaSearch(tea, pickerSearchQuery);
    });
  }, [combinedTeaList, pickerSearchQuery, pickerTypeFilter]);

  const handlePickTea = (tea: TeaVariety) => {
    setSelectedTea(tea);
    setWaterTempC(tea.optimalTemp || 95);
    setTeaMassG(tea.defaultMass || 5);
    setWaterVolumeMl(tea.defaultVolume || 100);
    setSteepsCount(tea.recommendedSteeps || 7);
    setSteepScheduleSec([]);
    setVesselUsed(tea.recommendedVesselRu?.split('(')[0]?.trim() || 'Фарфоровая гайвань 120 мл');
    setEffectNote(getTeaEffect(tea).nameRu);
    setIsTeaPickerOpen(false);
  };

  const handleOpenNewModal = (teaToLog?: TeaVariety) => {
    const t = teaToLog || selectedTea;
    setSelectedTea(t);
    setEditingEntryId(null);
    setWaterTempC(t.optimalTemp || 95);
    setTeaMassG(t.defaultMass || 5);
    setWaterVolumeMl(t.defaultVolume || 100);
    setSteepsCount(t.recommendedSteeps || 7);
    setSteepScheduleSec([]);
    setRating(5);
    setUserNotes('');
    setTags(t.categoryGroup === 'blend' ? ['Авторский купаж', 'Гунфу Ча'] : ['Гунфу Ча']);
    setIsNewModalOpen(true);
  };

  const handleEditEntry = (entry: TastingJournalEntry) => {
    setEditingEntryId(entry.id);
    const existingTea = combinedTeaList.find((t) => t.id === entry.teaId) || {
      id: entry.teaId,
      nameRu: entry.teaNameRu,
      nameZh: entry.teaNameZh || '',
      namePinyin: '',
      type: 'custom',
      typeNameRu: entry.teaTypeNameRu,
      categoryGroup: entry.isBlend ? 'blend' : 'specific',
      origin: 'Из личного дневника',
      cultivar: 'Мультисортовой сбор',
      optimalTemp: entry.waterTempC,
      tempRange: [entry.waterTempC - 5, entry.waterTempC + 5],
      defaultMass: entry.teaMassG,
      defaultVolume: entry.waterVolumeMl,
      recommendedSteeps: entry.steepsCount,
      oxidationLevel: 'Сбалансированный',
      leafMorphology: 'twisted_strip',
      scientificDescription: entry.userNotes || '',
      generalExamplesRu: entry.blendComponents,
      recommendedVesselRu: entry.vesselUsed,
      keySensoryNotes: entry.sensoryNotes
    } as TeaVariety;

    setSelectedTea(existingTea);
    setRating(entry.rating);
    setVesselUsed(entry.vesselUsed);
    setWaterTempC(entry.waterTempC);
    setTeaMassG(entry.teaMassG);
    setWaterVolumeMl(entry.waterVolumeMl);
    setSteepsCount(entry.steepsCount);
    setSteepScheduleSec(entry.steepScheduleSec || []);
    setSweetnessScore(entry.sweetnessScore);
    setAstringencyScore(entry.astringencyScore);
    setBodyScore(entry.bodyScore);
    setHuiGanScore(entry.huiGanScore);
    setEffectNote(entry.effectNote);
    setUserNotes(entry.userNotes);
    setTags(entry.tags || []);
    setIsNewModalOpen(true);
  };

  const handleSaveEntry = () => {
    const isBlend = selectedTea.categoryGroup === 'blend';
    const entryData: TastingJournalEntry = {
      id: editingEntryId || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      teaId: selectedTea.id,
      teaNameRu: selectedTea.nameRu,
      teaNameZh: selectedTea.nameZh,
      teaTypeNameRu: selectedTea.typeNameRu,
      dateIso: editingEntryId ? (entries.find(e => e.id === editingEntryId)?.dateIso || new Date().toISOString()) : new Date().toISOString(),
      rating,
      vesselUsed,
      waterTempC,
      teaMassG,
      waterVolumeMl,
      steepsCount,
      steepScheduleSec: steepScheduleSec.length > 0 ? steepScheduleSec : undefined,
      isBlend,
      blendComponents: isBlend ? selectedTea.generalExamplesRu : undefined,
      sensoryNotes: selectedTea.keySensoryNotes || [],
      sweetnessScore,
      astringencyScore,
      bodyScore,
      huiGanScore,
      effectNote,
      userNotes: userNotes.trim(),
      tags
    };

    let next: TastingJournalEntry[];
    if (editingEntryId) {
      next = entries.map((e) => (e.id === editingEntryId ? entryData : e));
    } else {
      next = [entryData, ...entries];
    }

    setEntries(next);
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    setIsNewModalOpen(false);
    setEditingEntryId(null);
  };

  const handleDeleteEntry = (id: string) => {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    try {
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleAddTag = () => {
    if (!customTagInput.trim()) return;
    if (!tags.includes(customTagInput.trim())) {
      setTags([...tags, customTagInput.trim()]);
    }
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tea_tasting_journal_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    if (entries.length === 0) return;
    const headers = ["Дата", "Сорт", "Иероглифы", "Оценка", "Температура", "Масса_г", "Объем_мл", "Посуда", "Проливов", "Заметки"];
    const rows = entries.map(e => [
      `"${new Date(e.dateIso).toLocaleDateString('ru-RU')}"`,
      `"${(e.teaNameRu || '').replace(/"/g, '""')}"`,
      `"${(e.teaNameZh || '').replace(/"/g, '""')}"`,
      e.rating,
      e.waterTempC,
      e.teaMassG,
      e.waterVolumeMl,
      `"${(e.vesselUsed || '').replace(/"/g, '""')}"`,
      e.steepsCount,
      `"${(e.userNotes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tea_journal_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEntries((prev) => {
            const map = new Map(prev.map(item => [item.id, item]));
            parsed.forEach(item => {
              if (item && item.id) map.set(item.id, item);
            });
            const merged = Array.from(map.values());
            try {
              localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(merged));
            } catch {
              // ignore
            }
            return merged;
          });
          alert(`Успешно импортировано ${parsed.length} записей!`);
        } else {
          alert('Файл JSON пуст или имеет некорректный формат.');
        }
      } catch (err) {
        alert('Ошибка при чтении файла JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (ratingFilter > 0 && entry.rating < ratingFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = entry.teaNameRu.toLowerCase().includes(q);
        const matchNotes = (entry.userNotes || '').toLowerCase().includes(q);
        const matchTags = (entry.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchNotes && !matchTags) return false;
      }
      return true;
    });
  }, [entries, ratingFilter, searchQuery]);

  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const avgRating = Math.round((entries.reduce((a, b) => a + b.rating, 0) / entries.length) * 10) / 10;
    return {
      total: entries.length,
      avgRating
    };
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
            Личный дегустационный архив
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif mt-0.5">
            Дневник дегустаций и купажей
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Сохранение актуальных настроек, редактирование записей, печать дегустационных листов и экспортирование результатов.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Import JSON button */}
          <label
            className="px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Импортировать дневник из файла JSON"
          >
            <Upload className="w-3.5 h-3.5 text-stone-600" />
            <span>Импорт</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </label>

          {entries.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportJson}
                className="px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Экспортировать дневник в файл JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Экспортировать дневник в таблицу CSV (Excel)"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>CSV (Excel)</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Сохранить дневник в PDF файл или отправить на печать"
              >
                <Download className="w-3.5 h-3.5 text-amber-800" />
                <span>PDF</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => handleOpenNewModal()}
            className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Записать дегустацию</span>
          </button>
        </div>
      </div>

      {/* Stats and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-bold text-stone-800">
            Записей: <strong className="font-mono text-amber-900">{entries.length}</strong>
          </span>
          {stats && (
            <span className="text-stone-500 flex items-center gap-1">
              • Средняя оценка: <strong className="text-amber-700">{stats.avgRating}</strong>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по сорту, купажу или тегам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-stone-300 bg-white focus:border-amber-700 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1 text-xs">
            {[0, 4, 5].map((stars) => (
              <button
                key={stars}
                type="button"
                onClick={() => setRatingFilter(stars)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                  ratingFilter === stars
                    ? 'bg-amber-800 text-white border-amber-800'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {stars === 0 ? 'Все' : `${stars}★+`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Journal Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-900">
            {entries.length === 0 ? 'В вашем дневнике пока нет записей' : 'По вашему фильтру ничего не найдено'}
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {entries.length === 0 
              ? 'Нажмите «Записать в дневник» прямо из симулятора или студии купажей, чтобы сохранить актуальные параметры заваривания и время всех проливов.'
              : 'Попробуйте сбросить поисковый запрос или фильтр по звёздам.'}
          </p>
          {entries.length === 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleOpenNewModal()}
                className="px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить первое чаепитие</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => {
            const teaObj = teaMap.get(entry.teaId) || combinedTeaList.find((t) => t.id === entry.teaId);
            return (
              <div
                key={entry.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3 hover:border-amber-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-amber-900">
                          {entry.teaTypeNameRu}
                        </span>
                        {entry.isBlend && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-100 text-purple-900 font-bold border border-purple-200">
                            Авторский купаж
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-stone-900 font-serif">
                        {entry.teaNameRu}
                      </h4>
                      <div className="text-[10px] text-stone-400 font-mono">
                        {new Date(entry.dateIso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <div className="flex items-center bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < entry.rating ? 'fill-amber-400 text-amber-500' : 'text-stone-300'}`}
                          />
                        ))}
                      </div>

                      {/* Action buttons: Edit, Print, Delete */}
                      <button
                        type="button"
                        onClick={() => handleEditEntry(entry)}
                        className="p-1 text-stone-400 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Редактировать запись"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPrintingEntry(entry)}
                        className="p-1 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                        title="Печать карточки"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Удалить запись"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quick params badges */}
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                      {entry.waterTempC}°C
                    </span>
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                      {entry.teaMassG}г / {entry.waterVolumeMl}мл
                    </span>
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {entry.steepsCount} проливов
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-sans">
                      {entry.effectNote}
                    </span>
                  </div>

                  {/* Actual Steep Times from Simulator */}
                  {entry.steepScheduleSec && entry.steepScheduleSec.length > 0 && (
                    <div className="p-2 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                      <div className="flex items-center space-x-1 text-[10px] font-bold text-stone-700">
                        <Clock className="w-3 h-3 text-amber-700" />
                        <span>Время проливов:</span>
                      </div>
                      <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                        {entry.steepScheduleSec.map((sec, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-stone-800 font-bold"
                          >
                            #{sIdx + 1}: {sec}с
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Blend components if available */}
                  {entry.blendComponents && entry.blendComponents.length > 0 && (
                    <div className="p-2 rounded-xl bg-purple-50/50 border border-purple-200/60 space-y-1 text-[11px]">
                      <span className="font-bold text-purple-900 block">Состав купажа:</span>
                      <div className="flex flex-wrap gap-1">
                        {entry.blendComponents.map((comp, cIdx) => (
                          <span key={cIdx} className="bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-950 font-medium">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sensory scores progress */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 text-[10px]">
                    <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 block">Сладость</span>
                      <strong className="text-amber-900">{entry.sweetnessScore}/10</strong>
                    </div>
                    <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 block">Плотность</span>
                      <strong className="text-stone-900">{entry.bodyScore}/10</strong>
                    </div>
                    <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 block">Хуэйгань</span>
                      <strong className="text-emerald-900">{entry.huiGanScore}/10</strong>
                    </div>
                    <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200">
                      <span className="text-stone-500 block">Терпкость</span>
                      <strong className="text-stone-800">{entry.astringencyScore}/10</strong>
                    </div>
                  </div>

                  {/* Notes text */}
                  {entry.userNotes && (
                    <div className="p-2.5 rounded-xl bg-amber-50/40 border border-amber-200/60 text-xs text-stone-700 leading-relaxed italic">
                      "{entry.userNotes}"
                    </div>
                  )}

                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {entry.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {onSelectTeaToBrew && (
                  <div className="pt-2 border-t border-stone-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (teaObj) {
                          onSelectTeaToBrew(teaObj);
                        } else {
                          const dummyVariety: TeaVariety = {
                            id: entry.teaId,
                            nameRu: entry.teaNameRu,
                            nameZh: entry.teaNameZh || '拼配茶',
                            namePinyin: 'Pīnpèi',
                            type: 'custom',
                            typeNameRu: entry.teaTypeNameRu,
                            categoryGroup: entry.isBlend ? 'blend' : 'specific',
                            origin: 'Из личного дневника',
                            cultivar: 'Мультисортовой сбор',
                            optimalTemp: entry.waterTempC,
                            tempRange: [entry.waterTempC - 5, entry.waterTempC + 5],
                            defaultMass: entry.teaMassG,
                            defaultVolume: entry.waterVolumeMl,
                            recommendedSteeps: entry.steepsCount,
                            oxidationLevel: 'Кастомный уровень',
                            leafMorphology: 'twisted_strip',
                            scientificDescription: entry.userNotes || 'Сорт сохранён из личного дневника дегустаций.',
                            generalExamplesRu: entry.blendComponents,
                            recommendedVesselRu: entry.vesselUsed || 'Гайвань 120 мл',
                            keySensoryNotes: entry.sensoryNotes || ['Сбалансированное тело', 'Послевкусие']
                          };
                          onSelectTeaToBrew(dummyVariety);
                        }
                      }}
                      className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Заварить в симуляторе</span>
                      <Sparkles className="w-3 h-3 text-amber-600" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New / Edit Tasting Log Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full my-auto shadow-2xl border border-stone-200 p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-amber-800" />
                <h3 className="text-sm font-bold text-stone-900">
                  {editingEntryId ? 'Редактирование записи дегустации' : 'Запись чайной дегустации'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditingEntryId(null);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Aesthetic Tea Selector Card with Picker Trigger */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">
                Выбранный сорт или купаж:
              </label>
              
              <div className="p-3 rounded-xl border-2 border-amber-800/30 bg-amber-50/40 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-amber-900">
                      {selectedTea.typeNameRu} {selectedTea.categoryGroup === 'generic' && '• Архетип'}
                    </span>
                    {selectedTea.categoryGroup === 'blend' && (
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-purple-100 text-purple-900 font-bold border border-purple-200">
                        Авторский купаж
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-stone-950 font-serif truncate">
                    {selectedTea.nameRu} {selectedTea.nameZh && `(${selectedTea.nameZh})`}
                  </div>
                  <div className="text-[11px] text-stone-500 truncate">
                    {selectedTea.origin.split(',')[0]} • {selectedTeaEffect.nameRu}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTeaPickerOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:border-amber-700 text-amber-950 text-xs font-bold shrink-0 flex items-center gap-1 shadow-2xs hover:bg-amber-100/50 transition-all cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-amber-700" />
                  <span>Выбрать...</span>
                </button>
              </div>
            </div>

            {/* Active Steep Schedule transferred from Simulator */}
            {steepScheduleSec.length > 0 && (
              <div className="p-3 bg-amber-100/50 rounded-xl border border-amber-300/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-950">
                    <Sliders className="w-3.5 h-3.5 text-amber-800" />
                    <span>Параметры и секунды проливов:</span>
                  </div>
                  <span className="text-[10px] bg-amber-800 text-white px-2 py-0.5 rounded-full font-mono font-bold">
                    {steepScheduleSec.length} проливов
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 font-mono text-xs">
                  {steepScheduleSec.map((sec, idx) => (
                    <span key={idx} className="bg-white px-2 py-0.5 rounded-md border border-amber-300 text-amber-950 font-bold">
                      #{idx + 1}: {sec}с
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Star Rating */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 block">
                Ваша оценка (1–5 звёзд):
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setRating(starVal)}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${starVal <= rating ? 'fill-amber-400 text-amber-500' : 'text-stone-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Brewing Params Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600 block">Вода (°C)</label>
                <input
                  type="number"
                  value={waterTempC}
                  onChange={(e) => setWaterTempC(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded-lg border border-stone-300 font-mono text-xs font-bold text-amber-900 bg-stone-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600 block">Масса (г)</label>
                <input
                  type="number"
                  step="0.5"
                  value={teaMassG}
                  onChange={(e) => setTeaMassG(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded-lg border border-stone-300 font-mono text-xs font-bold text-stone-900 bg-stone-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600 block">Объём (мл)</label>
                <input
                  type="number"
                  value={waterVolumeMl}
                  onChange={(e) => setWaterVolumeMl(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded-lg border border-stone-300 font-mono text-xs font-bold text-stone-900 bg-stone-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600 block">Проливов</label>
                <input
                  type="number"
                  value={steepsCount}
                  onChange={(e) => setSteepsCount(Number(e.target.value))}
                  className="w-full px-2 py-1 rounded-lg border border-stone-300 font-mono text-xs font-bold text-stone-900 bg-stone-50"
                />
              </div>
            </div>

            {/* Sensory Sliders */}
            <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-xs font-bold text-stone-800 block">
                Сенсорная калибровка чашки (от 1 до 10):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>Сладость / Карамель:</span>
                    <strong className="font-mono text-amber-900">{sweetnessScore}</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={sweetnessScore}
                    onChange={(e) => setSweetnessScore(Number(e.target.value))}
                    className="w-full accent-amber-800 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>Плотность тела:</span>
                    <strong className="font-mono text-amber-900">{bodyScore}</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={bodyScore}
                    onChange={(e) => setBodyScore(Number(e.target.value))}
                    className="w-full accent-amber-800 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>Хуэйгань (послевкусие):</span>
                    <strong className="font-mono text-emerald-900">{huiGanScore}</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={huiGanScore}
                    onChange={(e) => setHuiGanScore(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px]">
                    <span>Терпкость / Танины:</span>
                    <strong className="font-mono text-stone-800">{astringencyScore}</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={astringencyScore}
                    onChange={(e) => setAstringencyScore(Number(e.target.value))}
                    className="w-full accent-stone-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Notes textarea */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 block">
                Личные впечатления и дегустационные заметки:
              </label>
              <textarea
                rows={3}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Опишите аромат из гайвани, прогрев листа, изменения от 1-го к 6-му проливу..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:border-amber-700 focus:outline-hidden"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">
                Теги чаепития:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Добавить тег (например: утро, глина, с друзьями)..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stone-300"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    onClick={() => handleRemoveTag(t)}
                    className="text-[10px] bg-amber-50 text-amber-950 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                    title="Кликните чтобы удалить"
                  >
                    <span>#{t}</span>
                    <X className="w-2.5 h-2.5" />
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditingEntryId(null);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveEntry}
                className="px-4 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold shadow-2xs cursor-pointer"
              >
                {editingEntryId ? 'Сохранить изменения' : 'Сохранить в дневник'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Sheet Modal */}
      {printingEntry && (
        <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-stone-300 animate-in fade-in zoom-in-95 print:p-0 print:shadow-none print:border-none print:max-w-none">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 print:hidden">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-amber-800" />
                <h3 className="text-sm font-bold text-stone-900">
                  Дегустационный лист для печати
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Печать (Ctrl+P)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingEntry(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Content Sheet */}
            <div className="p-6 border-2 border-stone-900 rounded-xl space-y-4 bg-amber-50/20 font-serif text-stone-900 print:border-stone-800">
              <div className="flex justify-between items-start border-b-2 border-stone-900 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-sans font-bold tracking-widest text-amber-900">
                    Gongfu Cha Extraction Laboratory • Tasting Record
                  </span>
                  <h2 className="text-xl font-bold mt-0.5">
                    {printingEntry.teaNameRu} {printingEntry.teaNameZh && `(${printingEntry.teaNameZh})`}
                  </h2>
                  <div className="text-xs font-sans text-stone-600">
                    Категория: <strong>{printingEntry.teaTypeNameRu}</strong> {printingEntry.isBlend && '• Авторский купаж'}
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-stone-600">
                  <div>Дата: {new Date(printingEntry.dateIso).toLocaleDateString('ru-RU')}</div>
                  <div className="text-amber-800 font-bold mt-1">
                    {'★'.repeat(printingEntry.rating)}{'☆'.repeat(5 - printingEntry.rating)}
                  </div>
                </div>
              </div>

              {/* Brewing Spec Table */}
              <div className="grid grid-cols-4 gap-2 font-sans text-xs border border-stone-300 p-3 rounded-lg bg-white">
                <div>
                  <span className="text-stone-500 text-[10px] block uppercase">Температура</span>
                  <strong className="text-amber-900 font-mono text-sm">{printingEntry.waterTempC}°C</strong>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block uppercase">Заварка</span>
                  <strong className="font-mono text-sm">{printingEntry.teaMassG} г</strong>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block uppercase">Вода</span>
                  <strong className="font-mono text-sm">{printingEntry.waterVolumeMl} мл</strong>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block uppercase">Проливов</span>
                  <strong className="font-mono text-sm">{printingEntry.steepsCount}</strong>
                </div>
              </div>

              {/* Vessel */}
              <div className="text-xs font-sans text-stone-700">
                Посуда: <strong>{printingEntry.vesselUsed}</strong>
              </div>

              {/* Steep Schedule Table */}
              {printingEntry.steepScheduleSec && printingEntry.steepScheduleSec.length > 0 && (
                <div className="space-y-1.5 font-sans">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-800 block">
                    Хронометр проливов (секунды):
                  </span>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 font-mono text-xs text-center">
                    {printingEntry.steepScheduleSec.map((sec, idx) => (
                      <div key={idx} className="p-1.5 rounded border border-stone-300 bg-white">
                        <div className="text-[9px] text-stone-400">#{idx + 1}</div>
                        <div className="font-bold text-amber-950">{sec}с</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blend Components */}
              {printingEntry.blendComponents && printingEntry.blendComponents.length > 0 && (
                <div className="space-y-1 font-sans text-xs">
                  <span className="font-bold text-purple-900 uppercase">Компоненты купажа:</span>
                  <div className="flex flex-wrap gap-1">
                    {printingEntry.blendComponents.map((c, i) => (
                      <span key={i} className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-purple-950">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sensory Evaluation */}
              <div className="space-y-1 font-sans">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-800 block">
                  Сенсорная органолептика чашки:
                </span>
                <div className="grid grid-cols-4 gap-2 text-xs text-center">
                  <div className="p-2 border border-stone-200 rounded bg-stone-50">
                    <span className="text-[10px] text-stone-500 block">Сладость</span>
                    <strong className="text-amber-900 font-mono text-sm">{printingEntry.sweetnessScore}/10</strong>
                  </div>
                  <div className="p-2 border border-stone-200 rounded bg-stone-50">
                    <span className="text-[10px] text-stone-500 block">Плотность</span>
                    <strong className="text-stone-900 font-mono text-sm">{printingEntry.bodyScore}/10</strong>
                  </div>
                  <div className="p-2 border border-stone-200 rounded bg-stone-50">
                    <span className="text-[10px] text-stone-500 block">Хуэйгань</span>
                    <strong className="text-emerald-900 font-mono text-sm">{printingEntry.huiGanScore}/10</strong>
                  </div>
                  <div className="p-2 border border-stone-200 rounded bg-stone-50">
                    <span className="text-[10px] text-stone-500 block">Терпкость</span>
                    <strong className="text-stone-800 font-mono text-sm">{printingEntry.astringencyScore}/10</strong>
                  </div>
                </div>
              </div>

              {/* Master Notes */}
              {printingEntry.userNotes && (
                <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-lg text-xs italic font-serif">
                  "{printingEntry.userNotes}"
                </div>
              )}

              {/* Footer Stamp */}
              <div className="pt-2 border-t border-stone-300 text-[10px] font-sans text-stone-500 flex justify-between items-center">
                <span>Подпись мастера: __________________</span>
                <span>Эффект: {printingEntry.effectNote}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tea Selector Sub-Modal */}
      {isTeaPickerOpen && (
        <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-amber-800" />
                <h3 className="text-sm font-bold text-stone-900">
                  Выберите сорт или купаж для дегустации
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTeaPickerOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-stone-200 space-y-2 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Поиск по названию или региону..."
                  value={pickerSearchQuery}
                  onChange={(e) => setPickerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-300 focus:border-amber-700 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                {[
                  { id: 'all', label: 'Все' },
                  { id: 'blend', label: 'Купажи' },
                  { id: 'generic', label: 'Архетипы' },
                  { id: 'green', label: 'Зелёный' },
                  { id: 'white', label: 'Белый' },
                  { id: 'oolong', label: 'Улун' },
                  { id: 'gaba', label: 'ГАБА' },
                  { id: 'red', label: 'Красный' },
                  { id: 'puerh', label: 'Пуэр / Хэйча' },
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

            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 max-h-[50vh]">
              {filteredPickerTeas.slice(0, 100).map((tea) => {
                const isCurrent = tea.id === selectedTea.id;
                const eff = getTeaEffect(tea);
                return (
                  <button
                    key={tea.id}
                    type="button"
                    onClick={() => handlePickTea(tea)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-100/70 border-amber-400'
                        : 'border-stone-200 hover:border-amber-300 bg-stone-50/50 hover:bg-amber-50/40'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-amber-900">
                          {tea.typeNameRu} {tea.categoryGroup === 'generic' && '• Архетип'}
                        </span>
                        {tea.categoryGroup === 'blend' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-bold border border-purple-200">
                            Купаж
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-stone-900 truncate">
                        {tea.nameRu} {tea.nameZh && `(${tea.nameZh})`}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {tea.origin.split(',')[0]} • Оптимум: {tea.optimalTemp}°C • {eff.nameRu}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
