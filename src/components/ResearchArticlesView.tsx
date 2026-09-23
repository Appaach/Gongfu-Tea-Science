import React, { useState } from 'react';
import { RESEARCH_PAPERS } from '../data/researchPapers';
import { CHEMICAL_COMPOUNDS } from '../data/teaData';
import { PEER_REVIEWED_FORMULAS } from '../utils/extractionKinetics';
import { 
  BookOpen, 
  FlaskConical, 
  Filter, 
  Lightbulb, 
  Microchip, 
  Sparkles, 
  Atom, 
  Calculator, 
  Thermometer, 
  CheckCircle2,
  TestTube,
  Activity,
  HeartHandshake,
  Droplet,
  Coffee,
  ShieldAlert
} from 'lucide-react';

export interface ChemicalKineticProperty {
  compound: string;
  chemicalFormula: string;
  molecularWeight: string;
  activationEnergyEa: string;
  diffusionCoeff: string;
  tasteRole: string;
  optimalTempWindow: string;
  extractionPeakSteep: string;
  scientificNotes: string;
}

const CHEMICAL_PROPERTIES: ChemicalKineticProperty[] = [
  {
    compound: 'L-Теанин (L-Theanine)',
    chemicalFormula: 'C₇H₁₄N₂O₃',
    molecularWeight: '174.20 г/моль',
    activationEnergyEa: '14.2 кДж/моль',
    diffusionCoeff: '8.4 × 10⁻¹⁰ м²/с',
    tasteRole: 'Умами, бархатистая сладость, релаксация и стимуляция альфа-волн мозга',
    optimalTempWindow: '65°C – 82°C',
    extractionPeakSteep: '1 – 2 пролив (быстрый выход до 65% пула)',
    scientificNotes: 'Благодаря низкой энергии активации легко переходит в настой даже в теплой воде без разрушения.'
  },
  {
    compound: 'Кофеин (1,3,7-Триметилксантин)',
    chemicalFormula: 'C₈H₁₀N₄O₂',
    molecularWeight: '194.19 г/моль',
    activationEnergyEa: '24.5 кДж/моль',
    diffusionCoeff: '6.8 × 10⁻¹⁰ м²/с',
    tasteRole: 'Чистая бодрящая горечь, синергия с L-теанином (ясность ума без тремора)',
    optimalTempWindow: '80°C – 98°C',
    extractionPeakSteep: '2 – 5 пролив (равномерное линейное вымывание)',
    scientificNotes: 'Связан в комплексы с полифенолами; миф о "быстром удалении за 15 секунд" опровергнут (вымывается лишь 10–14%).'
  },
  {
    compound: 'Эпигаллокатехин-галлат (EGCG)',
    chemicalFormula: 'C₂₂H₁₈O₁₁',
    molecularWeight: '458.37 г/моль',
    activationEnergyEa: '35.2 кДж/моль',
    diffusionCoeff: '3.9 × 10⁻¹⁰ м²/с',
    tasteRole: 'Выраженная терпкость, вяжущий эффект (коагуляция белков слюны), антиоксидант',
    optimalTempWindow: '82°C – 88°C (критический порог)',
    extractionPeakSteep: '3 – 6 пролив (экспоненциальный рост при T > 85°C)',
    scientificNotes: 'Сложный галловый эфир; при температуре выше 88°C скорость диффузии резко возрастает, вызывая избыточную терпкость.'
  },
  {
    compound: 'Чайные полисахариды (TPS)',
    chemicalFormula: '(C₆H₁₀O₅)ₙ (гетерополимер)',
    molecularWeight: '> 10 000 – 100 000 Да',
    activationEnergyEa: '30.8 кДж/моль',
    diffusionCoeff: '0.9 × 10⁻¹⁰ м²/с',
    tasteRole: 'Плотность настоя ("тело", mouthfeel), сладкое возвратное послевкусие («Хуэй Гань»)',
    optimalTempWindow: '95°C – 100°C',
    extractionPeakSteep: '5 – 8+ пролив (длительная глубинная экстракция)',
    scientificNotes: 'Высокомолекулярные полимеры; требуют высокой температуры и гидратации для растворения из клеточных стенок.'
  },
  {
    compound: 'Летучие монотерпены (Линалоол, Гераниол)',
    chemicalFormula: 'C₁₀H₁₈O',
    molecularWeight: '154.25 г/моль',
    activationEnergyEa: 'Высокое давление паров (P_vap)',
    diffusionCoeff: 'Газофазная эмиссия (HS-SPME)',
    tasteRole: 'Цветочный, ландышевый, цитрусовый и мускатный верхний аромат («Ча Сян»)',
    optimalTempWindow: '88°C – 98°C',
    extractionPeakSteep: '1 – 3 пролив (быстрое испарение в чахэ и пиалу)',
    scientificNotes: 'Формируют первый ароматический аккорд Гунфу Ча; при долгом настаивании быстро улетучиваются и деградируют.'
  },
  {
    compound: 'Теарубигины и Теафлавины (TR / TF)',
    chemicalFormula: 'Полимерные окси-полифенолы',
    molecularWeight: '560 – 2000+ г/моль',
    activationEnergyEa: '28.4 кДж/моль',
    diffusionCoeff: '2.4 × 10⁻¹⁰ м²/с',
    tasteRole: 'Янтарно-красный цвет настоя, бархатная округлость и плотность красных чаев и пуэров',
    optimalTempWindow: '92°C – 100°C',
    extractionPeakSteep: '2 – 6 пролив',
    scientificNotes: 'Продукты окисления катехинов ферментом полифенолоксидазой; стабильны и менее вяжущие, чем свободный EGCG.'
  }
];

export const ResearchArticlesView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'all' | 'atlas' | 'water_vessel' | 'formulas' | 'constants' | 'papers'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Все статьи' },
    { id: 'kinetics', label: 'Кинетика проливов' },
    { id: 'temperature', label: 'Температурные пороги' },
    { id: 'caffeine', label: 'Миф о кофеине' },
    { id: 'aroma', label: 'Летучая ароматика' },
    { id: 'ratio', label: 'Гидромодуль' },
  ];

  const filteredPapers = selectedCategory === 'all'
    ? RESEARCH_PAPERS
    : RESEARCH_PAPERS.filter(p => p.category === selectedCategory);

  return (
    <div className="space-y-6 max-w-full">
      {/* Unified Light Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 min-w-0 max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4 min-w-0">
          <div className="space-y-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-stone-900 break-words">
              Биохимия и научная база
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-3xl break-words">
              Молекулярная природа вкуса, гидрохимия воды, термодинамика посуды и лабораторные исследования CAAS, JAFC и Food Chemistry.
            </p>
          </div>

          <div className="text-left sm:text-right sm:border-l sm:border-stone-100 sm:pl-4 self-start sm:self-center shrink-0 min-w-0">
            <div className="text-[11px] text-stone-400 font-medium">База публикаций</div>
            <div className="text-base font-bold font-mono text-stone-800 break-words">
              CAAS • JAFC • LWT
            </div>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex flex-wrap gap-2 min-w-0">
          <button
            onClick={() => setActiveSection('all')}
            className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === 'all'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            Все разделы
          </button>
          <button
            onClick={() => setActiveSection('atlas')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === 'atlas'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Химический атлас ({CHEMICAL_COMPOUNDS.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('water_vessel')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === 'water_vessel'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Вода и посуда</span>
          </button>
          <button
            onClick={() => setActiveSection('formulas')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === 'formulas'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Формулы и уравнения ({PEER_REVIEWED_FORMULAS.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('constants')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === 'constants'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            <Atom className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Константы и энергия Eₐ ({CHEMICAL_PROPERTIES.length})</span>
          </button>
          <button
            onClick={() => setActiveSection('papers')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeSection === 'papers'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Статьи ({RESEARCH_PAPERS.length})</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: CHEMICAL COMPOUNDS ATLAS */}
      {(activeSection === 'all' || activeSection === 'atlas') && (
        <section className="space-y-4 min-w-0 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-4 h-4 text-amber-800" />
              </div>
              <h3 className="text-lg font-bold font-serif text-stone-900 break-words">
                1. Атлас биоактивных и ароматических соединений
              </h3>
            </div>
            <span className="inline-flex items-center text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-full font-medium self-start sm:self-auto shrink-0">
              {CHEMICAL_COMPOUNDS.length} молекулярных групп
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
            {CHEMICAL_COMPOUNDS.map((compound) => (
              <div
                key={compound.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-amber-700/40 transition-all flex flex-col justify-between min-w-0 max-w-full overflow-hidden"
              >
                <div className="space-y-3.5 min-w-0">
                  {/* Dynamic Adaptive Header with Title & Metadata Chips */}
                  <div className="space-y-2.5 border-b border-stone-100 pb-3.5 min-w-0">
                    <div className="space-y-1 min-w-0">
                      <h4 
                        className="text-base sm:text-lg font-bold text-stone-900 font-serif leading-snug break-words hyphens-auto [overflow-wrap:anywhere]"
                        lang="ru"
                      >
                        {compound.nameRu}
                      </h4>
                      <div className="text-xs text-stone-400 italic break-words" lang="en">
                        {compound.nameEn}
                      </div>
                    </div>

                    {/* Adaptive Chemical Formula & Molar Weight Badges - Flow & Wrap Responsively */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 min-w-0">
                      <div className="inline-flex items-center text-xs font-mono bg-stone-100 text-stone-800 px-2.5 py-1 rounded-lg border border-stone-200 max-w-full break-all sm:break-normal">
                        <span className="text-[10px] text-stone-500 font-sans uppercase font-bold mr-1.5 shrink-0">Формула:</span>
                        <span className="font-semibold text-stone-900 break-words">{compound.chemicalFormula}</span>
                      </div>
                      <div className="inline-flex items-center text-xs font-mono bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 max-w-full whitespace-nowrap">
                        <span className="text-[10px] text-amber-700 font-sans uppercase font-bold mr-1.5 shrink-0">Масса:</span>
                        <span className="font-semibold text-amber-950">{compound.molecularWeight}</span>
                      </div>
                    </div>
                  </div>

                  {/* Temperature threshold */}
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start space-x-2 text-xs text-stone-800 min-w-0">
                    <Thermometer className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                    <div className="break-words hyphens-auto min-w-0">
                      <strong className="text-amber-950 font-semibold">Порог диффузии: </strong>
                      <span>{compound.solubilityTempThreshold}</span>
                    </div>
                  </div>

                  {/* Sensory Role */}
                  <div className="space-y-1 text-xs min-w-0">
                    <div className="font-semibold text-stone-800 flex items-center space-x-1.5">
                      <TestTube className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Влияние на вкус и букет («Ча Вэй»):</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed pl-5 break-words hyphens-auto">
                      {compound.sensoryRoleRu}
                    </p>
                  </div>

                  {/* Extraction behavior */}
                  <div className="space-y-1 text-xs min-w-0">
                    <div className="font-semibold text-stone-800 flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Поведение в кинетике проливов:</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed pl-5 break-words hyphens-auto">
                      {compound.extractionBehaviorRu}
                    </p>
                  </div>
                </div>

                {/* Primary Teas - Non-breaking structured bubble container */}
                <div className="pt-2.5 border-t border-stone-100 text-xs min-w-0">
                  <span className="text-stone-400 font-medium block mb-1.5">Характерно для сортов:</span>
                  <div className="flex flex-wrap gap-1.5 min-w-0">
                    {compound.primaryTeas.map((tea, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-[11px] px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg border border-stone-200 max-w-full break-words text-left"
                      >
                        {tea}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Synergistic bio-chemistry section */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-2.5 shadow-xs min-w-0">
            <h4 className="text-base font-bold text-stone-900 font-serif flex items-center space-x-2 min-w-0">
              <HeartHandshake className="w-5 h-5 text-amber-700 shrink-0" />
              <span className="break-words">Синергия L-теанина и кофеина: Нейрохимия «Чайного состояния» (Cha Qi)</span>
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed break-words">
              В отличие от кофе, где кофеин действует скачкообразно и может вызывать тремор, в чае кофеин образует устойчивые водородные комплексы с молекулами L-теанина и катехинов. L-теанин проникает через гематоэнцефалический барьер и активирует рецепторы GABA (ГАМК), повышая выработку дофамина и генерируя альфа-ритмы головного мозга (8–12 Гц). Это дает состояние спокойной фокусировки, чистоты восприятия и ясности без сосудистого спазма.
            </p>
          </div>
        </section>
      )}

      {/* SECTION 2: WATER TYPES HYDROCHEMISTRY & VESSEL PHYSICS */}
      {(activeSection === 'all' || activeSection === 'water_vessel') && (
        <section className="space-y-6 min-w-0 max-w-full">
          <div className="flex items-center space-x-2 border-l-4 border-amber-700 pl-3 min-w-0">
            <h3 className="text-lg font-bold text-stone-900 font-serif break-words">
              2. Гидрохимия, типы воды и теплофизика посуды
            </h3>
          </div>

          {/* Comprehensive Guide to Water Types */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 min-w-0 max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold shrink-0">
                  <Droplet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 font-serif text-base">
                    Типы воды и их влияние на экстракцию чая
                  </h4>
                  <p className="text-xs text-stone-500">
                    Вода составляет 99% настоя. Минеральный состав напрямую определяет скорость выхода и чистоту аромата.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="bg-blue-50 text-blue-900 px-2.5 py-1 rounded-lg border border-blue-200 font-semibold">
                  Оптимум: TDS 30–90 ppm
                </span>
              </div>
            </div>

            {/* 5 Types of Water Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Type 1: RO / Distilled */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                      TDS: 5 – 25 мг/л
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-semibold">
                      Слишком чистая
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                    1. Глубокий осмос / Дистиллят
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Агрессивный ненасыщенный растворитель. Извлекает вещества с максимальной скоростью, но настой может казаться плоским, «пустым» и лишённым бархатистого тела (mouthfeel) из-за отсутствия буферных солей магния и гидрокарбонатов.
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-stone-200 text-stone-700">
                  💡 <strong>Совет:</strong> Используйте реминерализатор или смешивайте с родниковой водой 4:1.
                </div>
              </div>

              {/* Type 2: Soft Spring / Glacial (Ideal) */}
              <div className="p-4 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/30 space-y-2.5 flex flex-col justify-between shadow-2xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold">
                      TDS: 30 – 80 мг/л
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                      ★ Золотой стандарт
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-emerald-950">
                    2. Талая / Мягкая родниковая
                  </h5>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    Идеальная среда для китайского чая. Низкое содержание кальция не связывает полифенолы, настой кристально чистый. Максимально раскрывает деликатный L-теанин (сладость умами) и летучие эфиры.
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-emerald-200 text-emerald-950">
                  ✨ <strong>Идеально для:</strong> Зелёных, белых чаёв, светлых улунов и молодых Шэнов.
                </div>
              </div>

              {/* Type 3: Bottled Drinking Water */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-800 font-bold">
                      TDS: 80 – 140 мг/л
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-semibold">
                      Сбалансированная
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                    3. Бутилированная питьевая
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Отличный доступный повседневный выбор. Небольшое содержание минералов дает плотный настой и округлость, слегка сглаживая чрезмерную терпкость плотных ферментированных сортов.
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-blue-200 text-blue-950">
                  🫖 <strong>Идеально для:</strong> Красных чаёв, тёмных улунов (Дахунпао), Шу Пуэров и Хэйча.
                </div>
              </div>

              {/* Type 4: Artesian / High Mineralization */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold">
                      TDS: 150 – 250+ мг/л
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                      Минерализованная
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                    4. Артезианская столовая вода
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Избыток солей кальция и гидрокарбонатов гасит природную свежесть и "запечатывает" поры чайного листа. Аромат становится глуховатым, а тонкие оттенки букета теряются.
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-amber-200 text-amber-950">
                  ⚠️ <strong>Эффект:</strong> Снижает ароматическую яркость на 20–35%.
                </div>
              </div>

              {/* Type 5: Tap Hard Water */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2.5 flex flex-col justify-between md:col-span-2 lg:col-span-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-rose-800 font-bold">
                      TDS: 250 – 500+ мг/л, хлор, Fe³⁺
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold">
                      ✕ Не рекомендуется
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-rose-950 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>5. Водопроводная неочищенная / Жесткая вода</span>
                  </h5>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    Ионы кальция Ca²⁺ и железа Fe³⁺ вступают в необратимую реакцию с катехинами чайного листа, образуя на поверхности остывающего чая маслянистую радужную плёнку (чайный налёт). Чай мгновенно мутнеет, появляется грубая горечь и металлический привкус.
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-rose-200 text-rose-950">
                  🚫 <strong>Вердикт:</strong> Обязательна фильтрация через качественный обратноосмотический или многоступенчатый умягчающий фильтр.
                </div>
              </div>
            </div>
          </div>

          {/* Comprehensive Guide to Vessel Physics & Materials */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5 min-w-0 max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold shrink-0">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 font-serif text-base">
                    Теплофизика посуды: материалы и динамика теплоотдачи
                  </h4>
                  <p className="text-xs text-stone-500">
                    Теплоёмкость, пористость и толщина стенок посуды формируют температурный градиент и сорбцию резких танинов.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold">
                  Диапазон ΔT: от -1.2°C до -6.5°C
                </span>
              </div>
            </div>

            {/* 8 Vessel Material Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Material 1: Porcelain */}
              <div className="p-4 rounded-xl border-2 border-amber-600/80 bg-amber-50/20 space-y-2.5 flex flex-col justify-between shadow-2xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-900 font-bold">
                      ΔT: -4.5°C • Пористость: 0%
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                      ★ Золотой стандарт аромата
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                    1. Тонкостенный фарфор (Гайвань / Чашка)
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Стекловидная глазурь исключает поглощение эфирных масел. Передаёт 100% честный и чистый спектр ароматических веществ. Быстрая теплоотдача при открытой крышке защищает лист от запаривания.
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-amber-200/80 text-amber-950">
                  ✨ <strong>Идеально для:</strong> Зелёные, белые, светлые улуны (Тегуаньинь, Алишань), молодые Шэны, ГАБА.
                </div>
              </div>

              {/* Material 2: Yixing Clay */}
              <div className="p-4 rounded-xl border-2 border-orange-700/80 bg-orange-50/30 space-y-2.5 flex flex-col justify-between shadow-2xs">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-orange-900 font-bold">
                      ΔT: -2.0°C • Поры 1.5–3.5 мкм
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-950 font-bold">
                      ★ Эталон для Пуэров
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                    2. Исинская глина Цзыша (Цзыни, Чжуни, Дуаньни)
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Двойная пористая структура действует как естественный молекулярный фильтр: адсорбирует до 14% резких танинов и тяжелых смол, удерживая кипяток (95–99°C) и обогащая настой бархатистой округлостью.
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-orange-200 text-orange-950">
                  ✨ <strong>Идеально для:</strong> Шу Пуэры, выдержанные Шэны, утёсные улуны Уишани (Да Хун Пао), Даньцуны.
                </div>
              </div>

              {/* Material 3: Borosilicate Glass */}
              <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/30 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-sky-800 font-bold">
                      ΔT: -6.5°C • Пористость: 0%
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 font-semibold">
                      Визуальный контроль & отвод тепла
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                    3. Боросиликатное термостекло (Колба / Типод / Стакан)
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Максимальный отвод избыточного тепла. Предохраняет нежные почки и тонкие листочки от термического ожога. Позволяет любоваться вертикальным танцем чайных почек («Шан Тоу»).
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-sky-200 text-sky-950">
                  ✨ <strong>Идеально для:</strong> Лунцзин, Билочунь, Тайпин Хоукуй, связанные цветочные чаи, типоды.
                </div>
              </div>

              {/* Material 4: Thick Clay */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-600 font-bold">
                      ΔT: -3.0°C • Высокая теплоёмкость
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-semibold">
                      Мягкий глубокий прогрев
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                    4. Плотная керамика (Цзяньшуй, Нисин, Чаочжоу)
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Плотная железистая глина с ручной полировкой. Обеспечивает равномерный глубокий прогрев чайного листа без резких термических провалов, подчеркивая густоту и медовую текстуру.
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-stone-200 text-stone-800">
                  ✨ <strong>Идеально для:</strong> Красные чаи (Дяньхун, Сяочжун), тайваньские улуны глубокого прогрева (Дун Дин).
                </div>
              </div>

              {/* Material 5: Silver & Titanium */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-800 font-bold">
                      ΔT: -4.0°C • Ионы Ag⁺
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-semibold">
                      Олигодинамический эффект
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                    5. Чистое серебро Ag 999 & Титан
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Ионы серебра Ag⁺ мягко снижают поверхностное натяжение воды, делая настой поразительно шелковистым и сладким на языке. Мгновенная теплопроводность ускоряет диффузию терпеноидов.
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-purple-200 text-purple-950">
                  ✨ <strong>Идеально для:</strong> Коллекционные белые чаи, высокогорные улуны, родниковая вода высокой чистоты.
                </div>
              </div>

              {/* Material 6: Cast Iron Tetsubin */}
              <div className="p-4 rounded-xl border border-stone-300 bg-stone-100/70 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-700 font-bold">
                      ΔT: -1.2°C • Экстремальная инерция
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-300 text-stone-800 font-semibold">
                      Сверхдолгое удержание кипятка
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                    6. Чугун (Тэцубин / Чугунный чайник)
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Огромная масса аккумулирует жар, поддерживая воду на уровне 98–99°C на протяжении всего процесса. Стимулирует полный гидролиз нерастворимых полисахаридов (TPS) в сладкие сахара.
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-stone-300 text-stone-800">
                  ✨ <strong>Идеально для:</strong> Кипячение воды, варка прессованного Хэй Ча (Фучжуань), старые Лао Шу Пуэры.
                </div>
              </div>

              {/* Material 7: Regular Mug Ceramic */}
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold">
                      ΔT: -3.8°C • Бытовая глазурь
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-medium">
                      Повседневный универсал
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                    7. Обычная бытовая керамика (Кружка / Большой чайник)
                  </h5>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Толстостенная бытовая посуда со средней теплоёмкостью. Применяется для разового настаивания (1:50–1:100) на 3–5 минут в домашних или офисных условиях.
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-stone-200 text-stone-700">
                  ☕ <strong>Рецепт:</strong> 2–3 г сухого листа на 250–350 мл горячей воды (85–92°C), разовый слив.
                </div>
              </div>

              {/* Material 8: Isothermal Thermos */}
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 space-y-2.5 flex flex-col justify-between md:col-span-2 lg:col-span-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold">
                      ΔT &lt; 0.5°C / час • Вакуумная изоляция
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                      ★ Метод длительного томления
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-stone-900">
                    8. Изотермический термос / Термопот (Томление и выдержка)
                  </h5>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    Длительное поддержание температуры 85–95°C в бескислородной среде запускает глубокий ферментативно-термический гидролиз: горькие танины деградируют, а связанные полисахариды превращаются в густой, сладкий, обволакивающий напиток с ароматом сушёного финика и мёда.
                  </p>
                </div>
                <div className="text-[11px] bg-white p-2 rounded-lg border border-emerald-300 text-emerald-950">
                  ✨ <strong>Идеально для:</strong> Выдержанный белый чай Лао Байча (Шоу Мэй от 3 лет), Хэй Ча, кирпичный Шу Пуэр (пропорция 1 г на 150–200 мл, 2–4 часа).
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Summary Matrix */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5 min-w-0 max-w-full overflow-hidden">
            <div className="flex items-center space-x-2 text-amber-800 min-w-0">
              <Droplet className="w-5 h-5 shrink-0" />
              <h4 className="font-bold text-stone-900 font-serif text-base break-words">
                Сводные физико-химические нормативы воды и посуды
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-200/80 flex justify-between items-center">
                  <span className="font-semibold text-stone-800">TDS (Общая минерализация):</span>
                  <span className="font-mono text-blue-900 font-bold">30 – 90 мг/л (ppm)</span>
                </div>
                <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-200/80 flex justify-between items-center">
                  <span className="font-semibold text-stone-800">Водородный показатель (pH):</span>
                  <span className="font-mono text-blue-900 font-bold">6.5 – 7.2 (нейтральный)</span>
                </div>
                <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-200/80 flex justify-between items-center">
                  <span className="font-semibold text-stone-800">Общая жесткость (GH):</span>
                  <span className="font-mono text-blue-900 font-bold">&lt; 2.5 °dH (до 1 мг-экв/л)</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/80 flex justify-between items-center">
                  <span className="font-semibold text-stone-800">Фарфор (Гайвань):</span>
                  <span className="font-mono text-amber-900 font-bold">ΔT -4.5°C • 0% сорбции</span>
                </div>
                <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/80 flex justify-between items-center">
                  <span className="font-semibold text-stone-800">Исинская глина (Цзыша):</span>
                  <span className="font-mono text-amber-900 font-bold">ΔT -2.0°C • сорбция танинов 14%</span>
                </div>
                <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/80 flex justify-between items-center">
                  <span className="font-semibold text-stone-800">Боросиликатное стекло:</span>
                  <span className="font-mono text-amber-900 font-bold">ΔT -6.5°C • быстрый отвод тепла</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 italic pt-1 border-t border-stone-100">
              * Правильный подбор пары «вода + материал посуды» позволяет раскрыть до 30–40% дополнительного ароматического потенциала чайного листа.
            </p>
          </div>
        </section>
      )}

      {/* SECTION 3: FORMULAS & EQUATIONS */}
      {(activeSection === 'all' || activeSection === 'formulas') && (
        <section className="space-y-4 min-w-0 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold shrink-0">
                <Calculator className="w-4 h-4 text-blue-800" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif text-stone-900 break-words">
                  3. Академические формулы и уравнения массопереноса
                </h3>
                <p className="text-xs text-stone-500">
                  Теоретическая физико-химическая база в канонической форме университетских учебников
                </p>
              </div>
            </div>
            <span className="inline-flex items-center text-xs bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium self-start sm:self-auto shrink-0">
              {PEER_REVIEWED_FORMULAS.length} уравнений кинетики
            </span>
          </div>

          <div className="space-y-6 min-w-0">
            {PEER_REVIEWED_FORMULAS.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs hover:border-amber-700/40 transition-all p-5 sm:p-6 space-y-4 min-w-0 max-w-full overflow-hidden"
              >
                {/* Header: Number, Name, Discipline */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-stone-100 pb-3 min-w-0">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-stone-900 text-amber-300 text-xs flex items-center justify-center font-mono font-bold shrink-0">
                        §{idx + 1}
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-stone-900 font-serif leading-snug break-words">
                        {item.equationName}
                      </h4>
                    </div>
                    {item.subTitleRu && (
                      <p className="text-xs text-stone-500 italic pl-8 break-words">
                        {item.subTitleRu}
                      </p>
                    )}
                  </div>

                  {item.academicDisciplineRu && (
                    <span className="inline-flex items-center self-start sm:self-auto text-[11px] font-semibold bg-stone-100 text-stone-700 px-2.5 py-1 rounded-lg border border-stone-200 shrink-0">
                      {item.academicDisciplineRu}
                    </span>
                  )}
                </div>

                {/* Clean Light-Themed Academic Formula Box */}
                <div className="p-4 sm:p-5 bg-stone-50/90 border border-stone-200 rounded-xl space-y-2.5 overflow-x-auto min-w-0">
                  <div className="flex items-center justify-between text-[11px] text-stone-500 font-semibold border-b border-stone-200/80 pb-1.5">
                    <span className="font-mono uppercase tracking-wider text-amber-900 font-bold">Каноническое уравнение</span>
                    <span className="font-mono text-[10px] text-stone-400">SI Units</span>
                  </div>

                  <div className="py-2 px-3 bg-white rounded-lg border border-stone-200/80 text-center sm:text-left">
                    <div className="font-mono text-base sm:text-lg font-bold text-stone-900 tracking-wide break-words">
                      {item.canonicalFormRu || item.formulaLatex}
                    </div>
                    {item.formulaLatex && item.canonicalFormRu && (
                      <div className="font-mono text-xs text-stone-500 mt-1">
                        LaTeX: <span className="text-stone-700">{item.formulaLatex}</span>
                      </div>
                    )}
                  </div>

                  {item.textbookDerivationRu && (
                    <div className="text-[11px] text-stone-600 pt-1">
                      <span className="font-semibold text-stone-800">Математический вывод: </span>
                      {item.textbookDerivationRu}
                    </div>
                  )}
                </div>

                {/* Physical Explanation */}
                <div className="text-xs sm:text-sm text-stone-700 leading-relaxed bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/60">
                  <strong className="text-amber-950 font-semibold">Физический смысл: </strong>
                  {item.descriptionRu}
                </div>

                {/* Variables & Dimensions Breakdown (Textbook style) */}
                {item.variables && item.variables.length > 0 && (
                  <div className="space-y-2 pt-1 min-w-0">
                    <div className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center space-x-1.5">
                      <span>Физические величины и обозначения в формуле:</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs min-w-0">
                      {item.variables.map((v, vIdx) => (
                        <div 
                          key={vIdx}
                          className="p-2.5 bg-white rounded-lg border border-stone-200/90 flex flex-col justify-between space-y-1 min-w-0"
                        >
                          <div className="flex items-center justify-between gap-1 min-w-0">
                            <span className="font-mono font-bold text-amber-900 text-xs sm:text-sm bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                              {v.symbol}
                            </span>
                            <span className="text-[10px] font-mono text-stone-500 shrink-0">
                              [{v.unitRu}]
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-stone-900 text-[11px] truncate">
                              {v.nameRu}
                            </div>
                            <div className="text-[11px] text-stone-600 leading-snug break-words">
                              {v.descriptionRu}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Citation */}
                <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 min-w-0">
                  <span className="font-serif italic text-stone-600 break-words max-w-[80%]">
                    Первоисточник: {item.sourcePaper}
                  </span>
                  <span className="inline-flex items-center text-amber-900 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] shrink-0">
                    Peer-Reviewed Standard
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Deep Dive Note on Gongfu Dynamics */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-2 min-w-0">
            <div className="flex items-center space-x-2 text-amber-950 font-bold text-sm min-w-0">
              <Sparkles className="w-4 h-4 text-amber-800 shrink-0" />
              <span className="break-words">Физическая модель метода Гунфу Ча: кинетическое фракционирование</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed break-words">
              В европейском настаивании (2–3 г на 300 мл, 5 минут) система переходит в полное термодинамическое равновесие, из-за чего в чашку выходят тяжелые танины и избыточная горечь. В методе <strong>Гунфу Ча</strong> (7–8 г на 100 мл, проливы по 8–20 с) реализуется <strong>неравновесный кинетический режим</strong>: за счет высокого градиента концентраций ΔC в раствор успевают перейти только легкоподвижные молекулы (теанин, монотерпены, свободный кофеин), а диффузия тяжелых катехинов EGCG задерживается сопротивлением пограничного слоя кутикулы.
            </p>
          </div>
        </section>
      )}

      {/* SECTION 4: CHEMICAL KINETICS & ACTIVATION ENERGY MATRIX */}
      {(activeSection === 'all' || activeSection === 'constants') && (
        <section className="space-y-4 min-w-0 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold shrink-0">
                <Atom className="w-4 h-4 text-emerald-800" />
              </div>
              <h3 className="text-lg font-bold font-serif text-stone-900 break-words">
                4. Физико-химические константы экстракции веществ
              </h3>
            </div>
            <span className="inline-flex items-center text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium self-start sm:self-auto shrink-0">
              Параметры хроматографии ВЭЖХ
            </span>
          </div>

          {/* Table with responsive container */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden max-w-full">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-left border-collapse text-xs min-w-[640px]">
                <thead>
                  <tr className="bg-stone-50 text-stone-700 border-b border-stone-200 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5 sm:p-4">Соединение / Формула</th>
                    <th className="p-3.5 sm:p-4">Молярная масса</th>
                    <th className="p-3.5 sm:p-4">Энергия Eₐ</th>
                    <th className="p-3.5 sm:p-4">Коэф. диффузии D</th>
                    <th className="p-3.5 sm:p-4">Роль во вкусе</th>
                    <th className="p-3.5 sm:p-4">Оптимум T°C и проливы</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {CHEMICAL_PROPERTIES.map((prop, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3.5 sm:p-4 font-medium text-stone-900 min-w-[180px]">
                        <div className="font-bold text-stone-900 break-normal">{prop.compound}</div>
                        <div className="font-mono text-stone-400 text-[10px] mt-0.5 whitespace-nowrap">{prop.chemicalFormula}</div>
                      </td>
                      <td className="p-3.5 sm:p-4 font-mono text-stone-600 whitespace-nowrap">
                        {prop.molecularWeight}
                      </td>
                      <td className="p-3.5 sm:p-4 font-mono text-amber-900 font-bold whitespace-nowrap bg-amber-50/40">
                        {prop.activationEnergyEa}
                      </td>
                      <td className="p-3.5 sm:p-4 font-mono text-blue-700 whitespace-nowrap">
                        {prop.diffusionCoeff}
                      </td>
                      <td className="p-3.5 sm:p-4 text-stone-600 min-w-[200px] break-normal">
                        {prop.tasteRole}
                      </td>
                      <td className="p-3.5 sm:p-4 text-stone-800 min-w-[170px]">
                        <div className="font-semibold text-emerald-900 whitespace-nowrap">{prop.optimalTempWindow}</div>
                        <div className="text-[11px] text-stone-500 mt-0.5 break-normal">{prop.extractionPeakSteep}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5: PEER-REVIEWED SCIENTIFIC ARTICLES */}
      {(activeSection === 'all' || activeSection === 'papers') && (
        <section className="space-y-4 min-w-0 max-w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2.5 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center font-bold shrink-0">
                <BookOpen className="w-4 h-4 text-purple-800" />
              </div>
              <h3 className="text-lg font-bold font-serif text-stone-900 break-words">
                5. Рецензируемые лабораторные исследования
              </h3>
            </div>
            <span className="inline-flex items-center text-xs bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-0.5 rounded-full font-medium self-start sm:self-auto shrink-0">
              {filteredPapers.length} публикаций
            </span>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 max-w-full scrollbar-none min-w-0">
            <Filter className="w-4 h-4 text-stone-400 shrink-0 ml-1 mr-1" />
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-medium transition-all shrink-0 ${
                    isSelected
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Research cards grid */}
          <div className="grid grid-cols-1 gap-4 min-w-0">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3.5 hover:border-amber-700/40 transition-all min-w-0 max-w-full overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-stone-100 pb-3 min-w-0">
                  <div className="space-y-1 min-w-0">
                    <span className="inline-flex items-center text-[11px] font-mono text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 font-semibold shrink-0">
                      {paper.journal} • {paper.year}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-stone-900 font-serif pt-1 leading-snug break-words">
                      {paper.titleRu}
                    </h4>
                    <div className="text-xs text-stone-400 italic break-words">
                      {paper.titleEn}
                    </div>
                  </div>
                  <div className="inline-flex items-center text-xs text-stone-600 font-medium bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200 self-start shrink-0 max-w-full break-words">
                    {paper.authors}
                  </div>
                </div>

                {/* Key finding box */}
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-stone-800 space-y-1 min-w-0">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-950 uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-amber-800 shrink-0" />
                    <span>Главный научный вывод исследования:</span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-stone-800 font-medium break-words">
                    {paper.keyFindingRu}
                  </p>
                </div>

                {/* Methodology & Practical takeaways */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1 min-w-0">
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1 min-w-0">
                    <div className="font-semibold text-stone-900 flex items-center space-x-1.5">
                      <Microchip className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Методология и лабораторные методы:</span>
                    </div>
                    <p className="text-stone-600 leading-relaxed break-words">
                      {paper.methodologyRu}
                    </p>
                  </div>

                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1 min-w-0">
                    <div className="font-semibold text-emerald-950 flex items-center space-x-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Практическое применение для мастера:</span>
                    </div>
                    <p className="text-stone-700 leading-relaxed break-words">
                      {paper.practicalApplicationRu}
                    </p>
                  </div>
                </div>

                {paper.doi && (
                  <div className="text-[11px] text-stone-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100 min-w-0">
                    <span className="break-all">DOI: <span className="font-mono text-stone-600 font-semibold">{paper.doi}</span></span>
                    <span className="inline-flex items-center space-x-1 text-amber-900 font-medium shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Рецензировано</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
