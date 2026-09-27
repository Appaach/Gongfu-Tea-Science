import React, { useState } from 'react';
import { TeaVariety } from '../types';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Flame, 
  Scale, 
  Droplet, 
  Coffee, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Layers
} from 'lucide-react';
import { getTeaEffect } from '../data/teaData';

interface TeaCheatSheetModalProps {
  tea: TeaVariety;
  waterTemp: number;
  teaMass: number;
  waterVolume: number;
  steepsCount: number;
  steepSchedule?: number[];
  onClose: () => void;
}

export const TeaCheatSheetModal: React.FC<TeaCheatSheetModalProps> = ({
  tea,
  waterTemp,
  teaMass,
  waterVolume,
  steepsCount,
  steepSchedule: providedSchedule,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const ratio = Math.round((waterVolume / Math.max(0.1, teaMass)) * 10) / 10;
  const effect = getTeaEffect(tea);

  // Generate steep seconds curve if not fully passed
  const steepSchedule = providedSchedule && providedSchedule.length >= steepsCount
    ? providedSchedule.slice(0, steepsCount)
    : Array.from({ length: steepsCount }, (_, idx) => {
        if (idx === 0) return 8;
        if (idx === 1) return 6;
        if (idx === 2) return 8;
        return 8 + Math.round(Math.pow(idx - 2, 1.35) * 5);
      });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `🍵 ШПАРГАЛКА ДЛЯ ЧАБАНИ: ${tea.nameRu} ${tea.nameZh ? `(${tea.nameZh})` : ''}
📍 Регион: ${tea.origin}
📊 Параметры заваривания:
• Пропорция: ${teaMass}г на ${waterVolume}мл (1:${ratio})
• Температура воды: ${waterTemp}°C
• Посуда: ${tea.recommendedVesselRu.split('(')[0].trim()}
• Количество проливов: ${steepsCount}

⏱️ ТАЙМИНГ ПРОЛИВОВ:
${steepSchedule.map((sec, idx) => `Пролив #${idx + 1}: ${sec} сек`).join('\n')}

✨ Вкусовой профиль: ${(tea.keySensoryNotes || []).join(', ')}
🌿 Эффект: ${effect.nameRu} (${effect.badgeRu})
Рассчитано в AI Studio: Кинетика экстракции чая`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-auto shadow-2xl border border-stone-300 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header & Actions (Hidden on Print) */}
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-800" />
            <h3 className="text-sm font-bold text-stone-900">
              Шпаргалка для чабани / Памятка проливов
            </h3>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Скопировать рецепт в буфер обмена"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Скопировать</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Распечатать памятку"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Cheat-Sheet Card */}
        <div id="printable-cheat-sheet" className="p-6 overflow-y-auto space-y-5 bg-white text-stone-900">
          {/* Top Title Banner */}
          <div className="border-b-2 border-stone-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-amber-900 font-bold">
                {tea.typeNameRu} • Gongfu Cha Protocol
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-950 tracking-tight">
                {tea.nameRu}
              </h2>
              {tea.nameZh && (
                <div className="text-sm font-serif italic text-stone-500">
                  {tea.nameZh} {tea.namePinyin && `[${tea.namePinyin}]`}
                </div>
              )}
            </div>

            <div className="text-left sm:text-right text-xs space-y-0.5">
              <div className="font-semibold text-stone-800">{tea.origin}</div>
              <div className="text-[11px] text-stone-500">Ферментация: {tea.oxidationLevel}</div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-900">
                <Flame className="w-3 h-3 text-amber-700" />
                <span>Температура</span>
              </div>
              <div className="text-lg font-mono font-black text-amber-950 mt-0.5">
                {waterTemp}°C
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-stone-700">
                <Scale className="w-3 h-3 text-stone-600" />
                <span>Масса листа</span>
              </div>
              <div className="text-lg font-mono font-black text-stone-950 mt-0.5">
                {teaMass} г
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-sky-900">
                <Droplet className="w-3 h-3 text-sky-700" />
                <span>Объём воды</span>
              </div>
              <div className="text-lg font-mono font-black text-sky-950 mt-0.5">
                {waterVolume} мл
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-900">
                <Sparkles className="w-3 h-3 text-emerald-700" />
                <span>Гидромодуль</span>
              </div>
              <div className="text-lg font-mono font-black text-emerald-950 mt-0.5">
                1:{ratio}
              </div>
            </div>
          </div>

          {/* Vessel and Rinse Rule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200">
            <div className="space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-amber-800" />
                <span>Рекомендованная посуда:</span>
              </div>
              <p className="text-stone-600 leading-snug">
                {tea.recommendedVesselRu}
              </p>
            </div>

            <div className="space-y-1">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Прогрев и промыв листа (#0):</span>
              </div>
              <p className="text-stone-600 leading-snug">
                Прогрейте посуду кипятком. Нулевой пролив (пробуждение) 3–5 сек — слить не пробуя.
              </p>
            </div>
          </div>

          {/* Step-by-Step Steep Schedule Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-900 border-b border-stone-200 pb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-800" />
                <span>Пошаговая схема проливов ({steepsCount} чашек):</span>
              </span>
              <span className="text-[11px] font-mono text-stone-500 font-normal">
                Экспозиция в секундах
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {steepSchedule.map((sec, idx) => {
                let focusNote = 'Раскрытие L-теанина и эфиров';
                if (idx === 0) focusNote = 'Быстрый пролив (Flash steep)';
                else if (idx === 1) focusNote = 'Пик аромата и сладости';
                else if (idx === 2) focusNote = 'Баланс тела и структуры';
                else if (idx >= 3 && idx <= 5) focusNote = 'Глубокие танины и солод';
                else if (idx > 5) focusNote = 'Хуэйгань и полисахариды';

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/60 text-center space-y-1"
                  >
                    <div className="text-[10px] font-bold text-stone-500 font-mono">
                      Чашка #{idx + 1}
                    </div>
                    <div className="text-base font-mono font-black text-amber-900">
                      {sec} сек
                    </div>
                    <div className="text-[9px] text-stone-500 leading-tight line-clamp-2">
                      {focusNote}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flavor Notes & Effect */}
          <div className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-amber-950">Дескрипторы вкусового букета:</span>
              <span className="text-[11px] font-semibold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                Эффект: {effect.nameRu}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(tea.keySensoryNotes || []).map((note, nIdx) => (
                <span
                  key={nIdx}
                  className="bg-white border border-amber-200 text-amber-950 text-xs px-2 py-0.5 rounded-md font-medium"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-400">
            <span>Рассчитано на основе биохимической модели экстракции чая (ISO 9768 / CAAS)</span>
            <span>Gongfu Cha Master Guide</span>
          </div>
        </div>
      </div>
    </div>
  );
};
