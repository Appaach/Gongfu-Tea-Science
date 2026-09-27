import React, { useState, useMemo } from 'react';
import { TeaVariety, TeaType } from '../types';
import { TEA_VARIETIES, GENERIC_TEA_ARCHETYPES, getTeaEffect } from '../data/teaData';
import { 
  Scale, 
  Flame, 
  Droplet, 
  Sparkles, 
  Coffee, 
  Layers, 
  Search, 
  X, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Award
} from 'lucide-react';
import { matchTeaSearch } from '../utils/teaSearch';

interface TeaComparisonViewProps {
  onSelectTeaToBrew?: (tea: TeaVariety) => void;
  initialTeaAId?: string;
  initialTeaBId?: string;
}

export const TeaComparisonView: React.FC<TeaComparisonViewProps> = ({
  onSelectTeaToBrew,
  initialTeaAId,
  initialTeaBId
}) => {
  const allTeas = useMemo(() => [...GENERIC_TEA_ARCHETYPES, ...TEA_VARIETIES], []);
  const teaMap = useMemo(() => new Map(allTeas.map((t) => [t.id, t])), [allTeas]);

  // Default initial pair: Longjing vs Da Hong Pao (or Dahongpao vs Rougui)
  const [teaAId, setTeaAId] = useState<string>(initialTeaAId || 'longjing');
  const [teaBId, setTeaBId] = useState<string>(initialTeaBId || 'dahongpao');

  // Tea picker modal state
  const [pickerSlot, setPickerSlot] = useState<'A' | 'B' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const teaA = teaMap.get(teaAId) || allTeas[0];
  const teaB = teaMap.get(teaBId) || allTeas[1];

  const filteredPickerTeas = useMemo(() => {
    return allTeas.filter((tea) => {
      if (typeFilter !== 'all') {
        if (typeFilter === 'generic' && tea.categoryGroup !== 'generic') return false;
        if (typeFilter === 'oolong' && !tea.type.includes('oolong')) return false;
        if (typeFilter === 'gaba' && !tea.type.startsWith('gaba')) return false;
        if (typeFilter === 'puerh' && !tea.type.includes('puerh') && tea.type !== 'heicha') return false;
        if (typeFilter !== 'generic' && typeFilter !== 'oolong' && typeFilter !== 'gaba' && typeFilter !== 'puerh' && tea.type !== typeFilter) {
          return false;
        }
      }
      return matchTeaSearch(tea, searchQuery);
    });
  }, [allTeas, searchQuery, typeFilter]);

  const handleSelectPickerTea = (tea: TeaVariety) => {
    if (pickerSlot === 'A') setTeaAId(tea.id);
    if (pickerSlot === 'B') setTeaBId(tea.id);
    setPickerSlot(null);
  };

  // Approximate bio-chemical estimation for radar
  const getBiochemValues = (tea: TeaVariety) => {
    let theanine = 20;
    let caffeine = 30;
    let catechins = 120;
    let polysaccharides = 40;
    let aroma = 8;
    let sweetness = 7;
    let body = 7;
    let astringency = 6;
    let huigan = 7;

    switch (tea.type) {
      case 'green':
        theanine = 28; caffeine = 32; catechins = 160; polysaccharides = 25;
        aroma = 9; sweetness = 6; body = 6; astringency = 8; huigan = 8;
        break;
      case 'white':
        theanine = 34; caffeine = 34; catechins = 110; polysaccharides = 50;
        aroma = 8; sweetness = 9; body = 6; astringency = 4; huigan = 9;
        break;
      case 'yellow':
        theanine = 26; caffeine = 30; catechins = 130; polysaccharides = 35;
        aroma = 8; sweetness = 7; body = 7; astringency = 6; huigan = 7;
        break;
      case 'oolong_ball':
        theanine = 22; caffeine = 28; catechins = 135; polysaccharides = 40;
        aroma = 10; sweetness = 8; body = 7; astringency = 6; huigan = 9;
        break;
      case 'oolong_strip':
        theanine = 18; caffeine = 30; catechins = 120; polysaccharides = 45;
        aroma = 9; sweetness = 8; body = 8; astringency = 7; huigan = 9;
        break;
      case 'red':
        theanine = 14; caffeine = 33; catechins = 90; polysaccharides = 52;
        aroma = 8; sweetness = 9; body = 8; astringency = 6; huigan = 8;
        break;
      case 'sheng_puerh':
        theanine = 18; caffeine = 36; catechins = 155; polysaccharides = 38;
        aroma = 8; sweetness = 7; body = 9; astringency = 9; huigan = 10;
        break;
      case 'shou_puerh':
        theanine = 8; caffeine = 25; catechins = 60; polysaccharides = 88;
        aroma = 6; sweetness = 9; body = 10; astringency = 3; huigan = 8;
        break;
      case 'heicha':
        theanine = 8; caffeine = 24; catechins = 60; polysaccharides = 90;
        aroma = 6; sweetness = 8; body = 10; astringency = 3; huigan = 8;
        break;
      case 'gaba_oolong':
      case 'gaba_red':
        theanine = 26; caffeine = 26; catechins = 95; polysaccharides = 48;
        aroma = 9; sweetness = 9; body = 8; astringency = 4; huigan = 8;
        break;
    }

    return { theanine, caffeine, catechins, polysaccharides, aroma, sweetness, body, astringency, huigan };
  };

  const bioA = getBiochemValues(teaA);
  const bioB = getBiochemValues(teaB);

  const effectA = getTeaEffect(teaA);
  const effectB = getTeaEffect(teaB);

  // Radar Polygon coordinates (5 axes: Sweetness, Body, Aroma, Hui Gan, Structure/Astringency)
  const radarAxes = [
    { label: 'Сладость', key: 'sweetness', max: 10 },
    { label: 'Тело / Плотность', key: 'body', max: 10 },
    { label: 'Аромат (Эфиры)', key: 'aroma', max: 10 },
    { label: 'Хуэйгань (Послевкусие)', key: 'huigan', max: 10 },
    { label: 'Терпкость / Тонус', key: 'astringency', max: 10 },
  ];

  const getRadarCoords = (bio: typeof bioA, radius: number = 75) => {
    const cx = 110;
    const cy = 110;
    return radarAxes.map((axis, i) => {
      const angle = (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
      const val = (bio[axis.key as keyof typeof bio] as number) / axis.max;
      const r = val * radius;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
            Сравнительный физико-химический анализ
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-serif mt-0.5">
            Сравнение сортов чая (Side-by-Side)
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            Сопоставление термодинамики заваривания, энергии экстракции катехинов, L-теанина и органолептического профиля двух любых сортов из каталога.
          </p>
        </div>
      </div>

      {/* Dual Tea Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Tea A Selector */}
        <div className="bg-white border-2 border-amber-800/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-800 text-white font-mono font-bold text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Образец A
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-amber-900">{teaA.typeNameRu}</div>
            <h3 className="text-base sm:text-lg font-bold text-stone-950 font-serif leading-tight">
              {teaA.nameRu}
            </h3>
            {teaA.nameZh && (
              <div className="text-xs text-stone-500 font-serif italic">{teaA.nameZh}</div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
              {teaA.origin.split(',')[0]}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-medium">
              Оптимум: {teaA.optimalTemp}°C
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium">
              {effectA.nameRu}
            </span>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setPickerSlot('A')}
              className="w-full py-2 px-3 rounded-xl border border-stone-300 hover:border-amber-700 bg-stone-50 hover:bg-amber-50/50 text-stone-700 hover:text-amber-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Выбрать другой сорт для Образца A...</span>
            </button>
          </div>
        </div>

        {/* Tea B Selector */}
        <div className="bg-white border-2 border-sky-800/60 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-sky-800 text-white font-mono font-bold text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider">
            Образец B
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-sky-900">{teaB.typeNameRu}</div>
            <h3 className="text-base sm:text-lg font-bold text-stone-950 font-serif leading-tight">
              {teaB.nameRu}
            </h3>
            {teaB.nameZh && (
              <div className="text-xs text-stone-500 font-serif italic">{teaB.nameZh}</div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium">
              {teaB.origin.split(',')[0]}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-sky-50 text-sky-900 border border-sky-200 font-medium">
              Оптимум: {teaB.optimalTemp}°C
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium">
              {effectB.nameRu}
            </span>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setPickerSlot('B')}
              className="w-full py-2 px-3 rounded-xl border border-stone-300 hover:border-sky-700 bg-stone-50 hover:bg-sky-50/50 text-stone-700 hover:text-sky-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Выбрать другой сорт для Образца B...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Comparison Section: Dual Metrics & Overlaid Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Side-by-Side Parameter Matrix (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
            <Scale className="w-4 h-4 text-amber-800" />
            <h3 className="text-sm font-bold text-stone-900">
              Сравнительная матрица физических параметров
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 font-medium">
                  <th className="py-2 pr-2">Параметр</th>
                  <th className="py-2 px-2 text-amber-900 font-bold bg-amber-50/50 rounded-t-lg">
                    {teaA.nameRu.split('(')[0].trim()}
                  </th>
                  <th className="py-2 pl-2 text-sky-900 font-bold bg-sky-50/50 rounded-t-lg">
                    {teaB.nameRu.split('(')[0].trim()}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                <tr>
                  <td className="py-2.5 pr-2 text-stone-500">Группа и тип</td>
                  <td className="py-2.5 px-2 font-semibold text-stone-900 bg-amber-50/20">{teaA.typeNameRu}</td>
                  <td className="py-2.5 pl-2 font-semibold text-stone-900 bg-sky-50/20">{teaB.typeNameRu}</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-2 text-stone-500">Оптимальная температура воды</td>
                  <td className="py-2.5 px-2 font-bold text-amber-900 font-mono bg-amber-50/20">{teaA.optimalTemp}°C</td>
                  <td className="py-2.5 pl-2 font-bold text-sky-900 font-mono bg-sky-50/20">{teaB.optimalTemp}°C</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-2 text-stone-500">Стандартная масса / Объём</td>
                  <td className="py-2.5 px-2 font-mono bg-amber-50/20">{teaA.defaultMass}г / {teaA.defaultVolume}мл</td>
                  <td className="py-2.5 pl-2 font-mono bg-sky-50/20">{teaB.defaultMass}г / {teaB.defaultVolume}мл</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-2 text-stone-500">Гидромодуль (пропорция)</td>
                  <td className="py-2.5 px-2 font-mono font-bold bg-amber-50/20">1:{Math.round(teaA.defaultVolume / teaA.defaultMass)}</td>
                  <td className="py-2.5 pl-2 font-mono font-bold bg-sky-50/20">1:{Math.round(teaB.defaultVolume / teaB.defaultMass)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-2 text-stone-500">Потенциал проливов</td>
                  <td className="py-2.5 px-2 font-mono bg-amber-50/20">{teaA.recommendedSteeps || 8} проливов</td>
                  <td className="py-2.5 pl-2 font-mono bg-sky-50/20">{teaB.recommendedSteeps || 8} проливов</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-2 text-stone-500">Степень ферментации</td>
                  <td className="py-2.5 px-2 bg-amber-50/20">{teaA.oxidationLevel}</td>
                  <td className="py-2.5 pl-2 bg-sky-50/20">{teaB.oxidationLevel}</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-2 text-stone-500">Рекомендованная посуда</td>
                  <td className="py-2.5 px-2 text-[11px] bg-amber-50/20">{teaA.recommendedVesselRu.split('(')[0].trim()}</td>
                  <td className="py-2.5 pl-2 text-[11px] bg-sky-50/20">{teaB.recommendedVesselRu.split('(')[0].trim()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick Actions to simulate either */}
          {onSelectTeaToBrew && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => onSelectTeaToBrew(teaA)}
                className="py-2 px-3 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <span>Заварить Образец A</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onSelectTeaToBrew(teaB)}
                className="py-2 px-3 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <span>Заварить Образец B</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Superimposed Sensory Radar & Bioactive Bars (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Overlaid Radar Chart */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-800" />
                <h3 className="text-sm font-bold text-stone-900">
                  Наложение вкусовых профилей
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-mono">
                <span className="flex items-center gap-1 text-amber-900 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
                  A
                </span>
                <span className="flex items-center gap-1 text-sky-900 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
                  B
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <svg viewBox="0 0 220 220" className="w-56 h-56">
                {/* Background Web Rings */}
                {[0.25, 0.5, 0.75, 1.0].map((ring, idx) => (
                  <circle
                    key={idx}
                    cx="110"
                    cy="110"
                    r={75 * ring}
                    fill="none"
                    stroke="#e7e5e4"
                    strokeWidth="1"
                    strokeDasharray={idx < 3 ? '2 2' : 'none'}
                  />
                ))}

                {/* Axis lines & Labels */}
                {radarAxes.map((axis, i) => {
                  const angle = (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
                  const x = 110 + 75 * Math.cos(angle);
                  const y = 110 + 75 * Math.sin(angle);
                  const labelX = 110 + 94 * Math.cos(angle);
                  const labelY = 110 + 94 * Math.sin(angle);
                  return (
                    <g key={i}>
                      <line x1="110" y1="110" x2={x} y2={y} stroke="#d6d3d1" strokeWidth="1" />
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="text-[8px] fill-stone-600 font-sans font-semibold"
                      >
                        {axis.label.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}

                {/* Tea A Polygon (Amber) */}
                <polygon
                  points={getRadarCoords(bioA)}
                  fill="rgba(217, 119, 6, 0.35)"
                  stroke="#d97706"
                  strokeWidth="2"
                />

                {/* Tea B Polygon (Sky Blue) */}
                <polygon
                  points={getRadarCoords(bioB)}
                  fill="rgba(2, 132, 199, 0.35)"
                  stroke="#0284c7"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="text-[11px] text-stone-500 text-center">
              * Закрашенные многоугольники наглядно показывают доминанту вкуса и плотности настоя.
            </div>
          </div>

          {/* Bioactive Compounds Comparison Bars */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-700" />
                <span>Биохимическая плотность фракций (мг/г листа)</span>
              </span>
            </div>

            {/* Metric 1: L-Theanine */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>L-Теанин (релакс / умами)</span>
                <span className="font-mono text-[11px]">
                  <strong className="text-amber-800">{bioA.theanine}</strong> vs <strong className="text-sky-800">{bioB.theanine}</strong> мг/г
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(bioA.theanine / 40) * 100}%` }} className="h-full bg-amber-600 rounded-full" />
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(bioB.theanine / 40) * 100}%` }} className="h-full bg-sky-600 rounded-full" />
                </div>
              </div>
            </div>

            {/* Metric 2: Catechins / EGCG */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Катехины / EGCG (танины / антиоксиданты)</span>
                <span className="font-mono text-[11px]">
                  <strong className="text-amber-800">{bioA.catechins}</strong> vs <strong className="text-sky-800">{bioB.catechins}</strong> мг/г
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(bioA.catechins / 180) * 100}%` }} className="h-full bg-amber-600 rounded-full" />
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(bioB.catechins / 180) * 100}%` }} className="h-full bg-sky-600 rounded-full" />
                </div>
              </div>
            </div>

            {/* Metric 3: Polysaccharides */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-stone-600">
                <span>Полисахариды (сладость / плотность тела)</span>
                <span className="font-mono text-[11px]">
                  <strong className="text-amber-800">{bioA.polysaccharides}</strong> vs <strong className="text-sky-800">{bioB.polysaccharides}</strong> мг/г
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(bioA.polysaccharides / 100) * 100}%` }} className="h-full bg-amber-600 rounded-full" />
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(bioB.polysaccharides / 100) * 100}%` }} className="h-full bg-sky-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tea Selector Modal */}
      {pickerSlot !== null && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="text-sm font-bold text-stone-900">
                Выберите сорт чая для Образца {pickerSlot}
              </h3>
              <button
                type="button"
                onClick={() => setPickerSlot(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-300 focus:border-amber-700 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                {[
                  { id: 'all', label: 'Все' },
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
                    onClick={() => setTypeFilter(f.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 border cursor-pointer ${
                      typeFilter === f.id
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
              {filteredPickerTeas.slice(0, 100).map((tea) => (
                <button
                  key={tea.id}
                  type="button"
                  onClick={() => handleSelectPickerTea(tea)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 hover:border-amber-300 bg-stone-50/50 hover:bg-amber-50/40 text-left flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-[11px] font-semibold text-amber-900">
                      {tea.typeNameRu} {tea.categoryGroup === 'generic' && '• Архетип'}
                    </div>
                    <div className="text-xs font-bold text-stone-900 truncate">
                      {tea.nameRu}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {tea.origin} • Оптимум: {tea.optimalTemp}°C
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
