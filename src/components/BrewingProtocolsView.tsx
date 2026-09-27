import React, { useState } from 'react';
import { GENERIC_TEA_ARCHETYPES, UNIVERSAL_BREWING_RULES } from '../data/teaData';
import { 
  Layers, 
  Sparkles, 
  Compass, 
  CheckCircle2, 
  XCircle, 
  Activity,
  Waves,
  HelpCircle,
  Coffee
} from 'lucide-react';

export const BrewingProtocolsView: React.FC = () => {
  const [selectedGuideCategory, setSelectedGuideCategory] = useState<string>(GENERIC_TEA_ARCHETYPES[0].id);
  const [subSection, setSubSection] = useState<'all' | 'comparison' | 'universal' | 'archetypes' | 'blending'>('all');

  const activeCategoryGuide = GENERIC_TEA_ARCHETYPES.find(a => a.id === selectedGuideCategory) || GENERIC_TEA_ARCHETYPES[0];

  return (
    <div className="space-y-6 max-w-full">
      {/* Unified Light Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 min-w-0 max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4 min-w-0">
          <div className="space-y-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-stone-900 break-words">
              Методы заваривания
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl break-words">
              Сравнительный анализ Гунфу Ча и европейского настаивания, биофизический алгоритм экстракции и технологические карты для категорий чая.
            </p>
          </div>

          <div className="text-left sm:text-right sm:border-l sm:border-stone-100 sm:pl-4 self-start sm:self-center shrink-0 min-w-0">
            <div className="text-[11px] text-stone-400 font-medium">Стандарты качества</div>
            <div className="text-base font-bold font-mono text-stone-800 break-words">
              GB/T 23776 • ISO 9768
            </div>
          </div>
        </div>

        {/* Sub-navigation Filter */}
        <div className="flex flex-wrap gap-2 min-w-0">
          {[
            { id: 'all', label: 'Все разделы' },
            { id: 'comparison', label: 'Сравнение методов' },
            { id: 'universal', label: 'Универсальный алгоритм' },
            { id: 'archetypes', label: `${GENERIC_TEA_ARCHETYPES.length} категорий (архетипов)` },
            { id: 'blending', label: 'Купажирование и синергия сортов' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubSection(tab.id as any)}
              className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                subSection === tab.id
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. GONGFU VS LIU GEN VS CUP BREWING VS WESTERN COMPARISON & FICK'S LAW */}
      {(subSection === 'all' || subSection === 'comparison') && (
        <div className="space-y-4 min-w-0 max-w-full">
          <div className="flex items-center space-x-2 border-l-4 border-amber-700 pl-3 min-w-0">
            <h3 className="text-lg font-bold text-stone-900 font-serif break-words">
              1. Сравнительный анализ методов
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0 max-w-full overflow-hidden">
            {/* Gongfu Card */}
            <div className="bg-white border-2 border-amber-700/40 rounded-2xl p-5 shadow-xs space-y-4 relative min-w-0 max-w-full overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 min-w-0">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block truncate">
                      Классика Китая
                    </span>
                    <h4 className="text-base font-bold text-stone-900 font-serif break-words">
                      Гунфу Ча (100% слив)
                    </h4>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0 ml-2">
                    功夫
                  </div>
                </div>

                <div className="space-y-2 text-xs min-w-0">
                  <div className="flex items-start space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Слив: </strong>
                      <span className="text-stone-600">Полный слив до последней капли (100%).</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Время контакта: </strong>
                      <span className="text-stone-600">Короткое (5–25 секунд) с кинетическим ростом.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Режим диффузии: </strong>
                      <span className="text-stone-600">Сброс C_bulk в ноль на каждом шаге. Максимальный градиент ΔC.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Сенсорный профиль: </strong>
                      <span className="text-stone-600">Максимальная контрастность и динамика от пролива к проливу.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl text-[11px] text-amber-900 font-medium border border-amber-200/80 break-words min-w-0 mt-2">
                <strong>Идеально для:</strong> Улунов, Пуэров, Хэй Ча, плотных красных сортов.
              </div>
            </div>

            {/* Liu Gen Card */}
            <div className="bg-white border-2 border-emerald-700/40 rounded-2xl p-5 shadow-xs space-y-4 relative min-w-0 max-w-full overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 min-w-0">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block truncate">
                      Традиция Ханчжоу и Сычуани
                    </span>
                    <h4 className="text-base font-bold text-stone-900 font-serif break-words">
                      Лю Гэнь (Оставление корня)
                    </h4>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs shrink-0 ml-2">
                    留根
                  </div>
                </div>

                <div className="space-y-2 text-xs min-w-0">
                  <div className="flex items-start space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Слив: </strong>
                      <span className="text-stone-600">Сливается 60–75%, а 25–40% («корень») остаётся в посуде.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Время контакта: </strong>
                      <span className="text-stone-600">Умеренное (1-й пролив 40–60с, долив 15–30с).</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Режим диффузии: </strong>
                      <span className="text-stone-600">Буферизованная экстракция. Остаток удерживает C_bulk &gt; 0, сглаживая пик катехинов.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Сенсорный профиль: </strong>
                      <span className="text-stone-600">Шелковистая бархатистость без термошока и вкусовых провалов.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl text-[11px] text-emerald-900 font-medium border border-emerald-200/80 break-words min-w-0 mt-2">
                <strong>Идеально для:</strong> Зеленых чаев (Лунцзин, Билочунь), Белых почек (Иньчжэнь), нежных желтых чаев.
              </div>
            </div>

            {/* Lazy Cup Brewing Card */}
            <div className="bg-white border-2 border-amber-600/40 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 relative min-w-0 max-w-full overflow-hidden flex flex-col justify-between">
              <div className="space-y-3 min-w-0">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 min-w-0 gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block truncate">
                      «Ленивый» метод (Бэй Пао Фа)
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-stone-900 font-serif break-words">
                      Заваривание в кружке (杯泡法)
                    </h4>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                    杯泡
                  </div>
                </div>

                <div className="space-y-2 text-xs min-w-0">
                  <div className="flex items-start space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Посуда: </strong>
                      <span className="text-stone-600">Кружка или стакан (200–350 мл), чай прямо на дне.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Авто-корень (留根): </strong>
                      <span className="text-stone-600">Если не выпивать всё до дна (~1/3 остаётся) и долить — «корень» сгладит вкус.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Термодинамика: </strong>
                      <span className="text-stone-600">Закон Ньютона: открытое стекло остывает до 58°C, сдерживая вымывание катехинов.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Сенсорный профиль: </strong>
                      <span className="text-stone-600">Мягкий, постоянный, уютный настой без хлопот.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl text-[11px] text-amber-900 font-medium border border-amber-200/80 break-words min-w-0 mt-2">
                <strong>Идеально для:</strong> Зеленых чаев, Белых листьев, повседневного чаепития за работой.
              </div>
            </div>

            {/* Western Card */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4 relative min-w-0 max-w-full overflow-hidden flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5 min-w-0">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block truncate">
                      Западная методика
                    </span>
                    <h4 className="text-base font-bold text-stone-900 font-serif break-words">
                      Европейское настаивание
                    </h4>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs shrink-0 ml-2">
                    Запад
                  </div>
                </div>

                <div className="space-y-2 text-xs min-w-0">
                  <div className="flex items-start space-x-2 min-w-0">
                    <XCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Гидромодуль: </strong>
                      <span className="text-stone-600">1:50 – 1:100 (2–3 г на 250–300 мл кружку).</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 min-w-0">
                    <XCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Время контакта: </strong>
                      <span className="text-stone-600">Длительное (3–5 минут непрерывного контакта).</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 min-w-0">
                    <XCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Режим диффузии: </strong>
                      <span className="text-stone-600">Термодинамическое равновесие полного растворения.</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 min-w-0">
                    <XCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    <div className="break-words min-w-0">
                      <strong className="text-stone-900">Сенсорный профиль: </strong>
                      <span className="text-stone-600">Монолитная крепость, горечь и вяжущие ноты катехинов.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-stone-100 rounded-xl text-[11px] text-stone-700 font-medium border border-stone-200 break-words min-w-0 mt-2">
                <strong>Ограничение:</strong> Теряются тонкие эфирные ноты и динамика вкусовых слоев.
              </div>
            </div>
          </div>

          {/* Deep Dive into Differential Mass Transfer */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5 min-w-0 max-w-full overflow-hidden">
            <h4 className="text-base font-bold text-stone-900 font-serif flex items-center space-x-2 min-w-0">
              <Activity className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="break-words">Физика диффузионного пограничного слоя и закон Фика</span>
            </h4>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed break-words">
              Скорость переноса растворенного вещества из чайного листа через клеточную мембрану в окружающую воду 
              описывается уравнением Нойеса-Уитни:
            </p>

            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono text-center text-xs sm:text-sm text-stone-900 overflow-x-auto max-w-full">
              dM / dt = (D · A / h) · (Cₛ - Cᵦ)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs min-w-0">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 break-words min-w-0">
                <strong className="text-stone-900 block mb-0.5">D (Коэффициент диффузии): </strong>
                <span>Зависит от размера молекулы и температуры. L-теанин (174 г/моль) диффундирует в 2.6 раза быстрее крупного катехина EGCG (458 г/моль).</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 break-words min-w-0">
                <strong className="text-stone-900 block mb-0.5">(Cₛ - Cᵦ) (Движущий градиент ΔC): </strong>
                <span>Разница между растворимостью на поверхности листа и концентрацией в чашке. В проливах Cᵦ сбрасывается в ноль при каждом новом проливе!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. UNIVERSAL BREWING GUIDE (4 RULES) */}
      {(subSection === 'all' || subSection === 'universal') && (
        <div className="space-y-4 min-w-0 max-w-full">
          <div className="flex items-center space-x-2 border-l-4 border-amber-700 pl-3 min-w-0">
            <h3 className="text-lg font-bold text-stone-900 font-serif break-words">
              2. Универсальное руководство: Как заварить любой неизвестный чай
            </h3>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs min-w-0 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3 min-w-0">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
                  <Compass className="w-4 h-4 text-amber-800" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold text-stone-900 font-serif break-words">
                    Биофизический алгоритм для редких культиваров и сборов
                  </h4>
                  <p className="text-xs text-stone-500 break-words">
                    4 фундаментальных правила на основе градиента концентраций
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center text-xs bg-amber-50 text-amber-950 px-2.5 py-0.5 rounded-full font-medium self-start sm:self-auto border border-amber-200 shrink-0">
                4 правила Нойеса-Уитни
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 min-w-0">
              {UNIVERSAL_BREWING_RULES.map((rule) => (
                <div key={rule.stepNumber} className="bg-stone-50/70 p-4 rounded-xl border border-stone-200 space-y-2.5 flex flex-col justify-between min-w-0 max-w-full overflow-hidden">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-amber-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {rule.stepNumber}
                      </span>
                      <h5 className="text-xs font-bold text-stone-900 leading-tight break-words min-w-0">{rule.titleRu}</h5>
                    </div>
                    <div className="text-[11px] text-stone-600 leading-relaxed break-words">
                      <strong className="text-stone-800">Физика: </strong>{rule.scientificPrincipleRu}
                    </div>
                  </div>
                  <div className="text-xs text-stone-900 font-medium bg-white p-2 rounded-lg border border-stone-200 break-words min-w-0">
                    {rule.actionRu}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. INTERACTIVE CATEGORY GUIDE (ARCHETYPES ONLY) */}
      {(subSection === 'all' || subSection === 'archetypes') && (
        <div className="space-y-4 min-w-0 max-w-full">
          <div className="flex items-center space-x-2 border-l-4 border-amber-700 pl-3 min-w-0">
            <h3 className="text-lg font-bold text-stone-900 font-serif break-words">
              3. Регламенты по {GENERIC_TEA_ARCHETYPES.length} категориям (архетипам) чая
            </h3>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 min-w-0 max-w-full overflow-hidden">
            <p className="text-xs text-stone-500 break-words">
              Выберите категорию чая для просмотра температурного коридора, биохимического регламента и требований к посуде.
            </p>

            {/* Category Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 min-w-0">
              {GENERIC_TEA_ARCHETYPES.map((arch) => {
                const isSelected = selectedGuideCategory === arch.id;
                return (
                  <button
                    key={arch.id}
                    id={`guide-category-btn-${arch.id}`}
                    onClick={() => setSelectedGuideCategory(arch.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between min-w-0 ${
                      isSelected
                        ? 'bg-amber-800 text-white border-amber-800 shadow-xs ring-2 ring-amber-700/20'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold break-words leading-tight line-clamp-2 block">
                        {arch.nameRu}
                      </span>
                    </div>
                    <span className={`text-[10px] mt-1.5 font-serif italic truncate block ${
                      isSelected ? 'text-amber-200' : 'text-stone-400'
                    }`}>
                      {arch.nameZh}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Category Guide Detailed Card */}
            <div className="bg-stone-50/80 border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-4 min-w-0 max-w-full overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-3 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <h4 className="text-base sm:text-lg font-bold text-stone-900 font-serif break-normal">
                      {activeCategoryGuide.nameRu}
                    </h4>
                    <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium border border-amber-200 shrink-0 whitespace-nowrap">
                      {activeCategoryGuide.nameZh}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 break-normal">
                    {activeCategoryGuide.oxidationLevel} • Регионы: {activeCategoryGuide.origin}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs min-w-0 shrink-0">
                  <div className="bg-white px-2.5 py-1 rounded-xl border border-stone-200 shrink-0">
                    <span className="text-stone-400 block text-[10px]">Температура:</span>
                    <strong className="text-red-700 font-mono text-xs sm:text-sm">{activeCategoryGuide.optimalTemp}°C</strong>
                    <span className="text-stone-400 text-[10px] ml-1">({activeCategoryGuide.tempRange[0]}–{activeCategoryGuide.tempRange[1]}°C)</span>
                  </div>
                  <div className="bg-white px-2.5 py-1 rounded-xl border border-stone-200 shrink-0">
                    <span className="text-stone-400 block text-[10px]">Навеска на 100 мл:</span>
                    <strong className="text-stone-900 font-mono text-xs sm:text-sm">{activeCategoryGuide.defaultMass} г</strong>
                  </div>
                  <div className="bg-white px-2.5 py-1 rounded-xl border border-stone-200 shrink-0">
                    <span className="text-stone-400 block text-[10px]">Проливов:</span>
                    <strong className="text-amber-800 font-mono text-xs sm:text-sm">{activeCategoryGuide.recommendedSteeps}+</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs min-w-0">
                <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-1 min-w-0">
                  <span className="font-bold text-stone-900 flex items-center space-x-1.5 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="break-words">Биохимический регламент:</span>
                  </span>
                  <p className="text-stone-600 leading-relaxed break-words">
                    {activeCategoryGuide.scientificDescription}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-1 min-w-0">
                  <span className="font-bold text-stone-900 flex items-center space-x-1.5 min-w-0">
                    <Coffee className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="break-words">Посуда и теплофизика:</span>
                  </span>
                  <p className="text-stone-600 leading-relaxed break-words">
                    {activeCategoryGuide.recommendedVesselRu}
                  </p>
                  <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-100 break-words">
                    Форма листа:{' '}
                    <strong className="text-stone-700">
                      {activeCategoryGuide.leafMorphology === 'tight_ball' && 'Сферическая скрутка (шарики)'}
                      {activeCategoryGuide.leafMorphology === 'twisted_strip' && 'Продольная скрутка (жгутики)'}
                      {activeCategoryGuide.leafMorphology === 'needle' && 'Цельные почки (иглы)'}
                      {activeCategoryGuide.leafMorphology === 'flat' && 'Плоский приплюснутый лист'}
                      {activeCategoryGuide.leafMorphology === 'compressed_cake' && 'Прессованный лист'}
                      {!['tight_ball', 'twisted_strip', 'needle', 'flat', 'compressed_cake'].includes(activeCategoryGuide.leafMorphology) && 'Цельный лист'}
                    </strong>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-1 min-w-0">
                  <span className="font-bold text-stone-900 flex items-center space-x-1.5 min-w-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="break-words">Характерные сорта:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1 min-w-0">
                    {activeCategoryGuide.generalExamplesRu?.map((ex, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-stone-100 text-stone-700 text-[11px] border border-stone-200 max-w-full break-words text-left">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TEA BLENDING & SYNERGISTIC EXTRACTION PROTOCOL */}
      {(subSection === 'all' || subSection === 'blending') && (
        <div className="space-y-4 min-w-0 max-w-full">
          <div className="flex items-center space-x-2 border-l-4 border-amber-800 pl-3 min-w-0">
            <h3 className="text-lg font-bold text-stone-900 font-serif break-words">
              5. Купажирование и смешивание сортов (Tea Blending & Synergy Extraction)
            </h3>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
            {/* Introduction Card */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                Научный фундамент блендинга
              </span>
              <h4 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                Физико-химическая синергия фракций чайного листа в технике Гунфу Ча
              </h4>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Купажирование в традиции Гунфу Ча — это не просто механическое соединение разных видов чая, а создание управляемой биохимической системы, в которой растворимые полисахариды выдержанных фракций связывают избыточную терпкость полифенолов, а эфирные терпены слабоферментированных сортов выстраивают сложную полифонию верхних летучих нот.
              </p>
            </div>

            {/* 3 Main Principles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Principle 1 */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>1. Буферизация танинов</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Полисахариды (60–90 мг/г в Шу Пуэрах и Хэйча) образуют водородные мостики с вяжущими катехинами (EGCG), формируя коллоидные микромицеллы. Настой становится бархатным, плотным и лишённым сушащей агрессии.
                </p>
              </div>

              {/* Principle 2 */}
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-2">
                <div className="flex items-center space-x-2 text-sky-900 font-bold text-xs">
                  <Activity className="w-4 h-4 text-sky-700" />
                  <span>2. Температурный компромисс</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Температура заваривания купажа вычисляется по формуле взвешенной термодинамической защиты: <span className="font-mono font-bold text-stone-900 text-[11px]">T = min(T_i) + ΔT</span>. Это предотвращает температурный гидролиз L-теанина нежных сортов.
                </p>
              </div>

              {/* Principle 3 */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>3. Послойный вкусовой аккорд</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Разделение букета на 3 регистра: <strong>Верхние ноты</strong> (монотерпены линалоол, гераниол), <strong>Сердце букета</strong> (фенилэтиловый спирт, лактоны) и <strong>Хуэйгань / Послевкусие</strong> (теанин и пектины).
                </p>
              </div>
            </div>

            {/* 5 Master Rules */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                5 правил создания идеального купажа
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start space-x-2 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900">Пропорция База/Акцент: </strong>
                    <span className="text-stone-600">60–75% плотного базового листа (Шу, Красный, Тёмный улун) и 25–40% яркого ароматического акцента (Белый, ГАБА, Жасмин).</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900">Правильная укладка в посуду: </strong>
                    <span className="text-stone-600">Тяжёлый плотный прессованный лист укладывается на дно гайвани/чайника, а лёгкий рассыпной лист — наверх.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900">Выбор посуды: </strong>
                    <span className="text-stone-600">Для пуэрных и выдержанных блендов — пористая глина (Исин / Цзяньшуй). Для цветочно-улунных композиций — тонкостенный фарфор.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-stone-900">Стартовый пролив 5–8 сек: </strong>
                    <span className="text-stone-600">Первые 2 пролива выполняются быстро (flash steep), чтобы не перегрузить настой танинами перед раскрытием глубоких фракций.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Classical Benchmark Recipes */}
            <div className="space-y-3 pt-2 border-t border-stone-100">
              <h5 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Канонические сочетания (Бенчмарки)
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1.5">
                  <span className="font-bold text-stone-900 block text-xs">«Императорский бархат»</span>
                  <div className="text-[11px] text-amber-800 font-medium">Шу Пуэр 60% + Выдержанный Шоу Мэй 40%</div>
                  <p className="text-[11px] text-stone-600">Шоколадно-ореховая основа с медово-сухофруктовой сладостью и полным подавлением вяжущей горечи.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1.5">
                  <span className="font-bold text-stone-900 block text-xs">«Огненный Феникс»</span>
                  <div className="text-[11px] text-amber-800 font-medium">Да Хун Пао 65% + Чжэн Шань Сяо Чжун 35%</div>
                  <p className="text-[11px] text-stone-600">Минерально-утёсный каркас с глубокими нотами копчёного чернослива, пряностей и карамельного солода.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-1.5">
                  <span className="font-bold text-stone-900 block text-xs">«Дзен и Ноотропная ясность»</span>
                  <div className="text-[11px] text-amber-800 font-medium">ГАБА Улун 55% + Дянь Хун 45%</div>
                  <p className="text-[11px] text-stone-600">Высокая концентрация ГАМК и L-теанина для мягкого расслабления тела при абсолютной ментальной концентрации.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
