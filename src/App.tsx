/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, lazy, Suspense } from 'react';
import { Header, ActiveTab } from './components/Header';
import { TeaVariety, InitialTastingSessionData } from './types';
import { Beaker } from 'lucide-react';

const ExtractionSimulator = lazy(() => import('./components/ExtractionSimulator').then(m => ({ default: m.ExtractionSimulator })));
const ResearchArticlesView = lazy(() => import('./components/ResearchArticlesView').then(m => ({ default: m.ResearchArticlesView })));
const BrewingProtocolsView = lazy(() => import('./components/BrewingProtocolsView').then(m => ({ default: m.BrewingProtocolsView })));
const TeaComparisonView = lazy(() => import('./components/TeaComparisonView').then(m => ({ default: m.TeaComparisonView })));
const TeaTastingJournalView = lazy(() => import('./components/TeaTastingJournalView').then(m => ({ default: m.TeaTastingJournalView })));

const ComponentLoader = () => (
  <div className="flex flex-col items-center justify-center py-20 space-y-3 text-stone-500 animate-pulse">
    <Beaker className="w-8 h-8 text-amber-800 animate-bounce" />
    <span className="text-xs font-semibold text-stone-600 font-serif">Загрузка данных кинетики чая...</span>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');

  // Inter-tab transition states
  const [selectedTeaForSimulator, setSelectedTeaForSimulator] = useState<TeaVariety | null>(null);
  const [comparisonTeaAId, setComparisonTeaAId] = useState<string | undefined>(undefined);
  const [journalInitialSession, setJournalInitialSession] = useState<InitialTastingSessionData | null>(null);

  const handleOpenComparison = (tea: TeaVariety) => {
    setComparisonTeaAId(tea.id);
    setActiveTab('compare');
  };

  const handleOpenJournal = (sessionData: InitialTastingSessionData | TeaVariety) => {
    if ('id' in sessionData && 'type' in sessionData) {
      setJournalInitialSession({
        tea: sessionData as TeaVariety,
        waterTempC: (sessionData as TeaVariety).optimalTemp,
        teaMassG: (sessionData as TeaVariety).defaultMass,
        waterVolumeMl: (sessionData as TeaVariety).defaultVolume,
        steepsCount: (sessionData as TeaVariety).recommendedSteeps
      });
    } else {
      setJournalInitialSession(sessionData as InitialTastingSessionData);
    }
    setActiveTab('journal');
  };

  const handleSelectTeaToBrew = (tea: TeaVariety) => {
    setSelectedTeaForSimulator(tea);
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* Top Header & Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<ComponentLoader />}>
          {activeTab === 'simulator' && (
            <ExtractionSimulator 
              key={selectedTeaForSimulator?.id || 'sim_default'}
              initialSelectedTea={selectedTeaForSimulator}
              onOpenComparison={handleOpenComparison}
              onOpenJournal={handleOpenJournal}
            />
          )}
          {activeTab === 'compare' && (
            <TeaComparisonView 
              initialTeaAId={comparisonTeaAId}
              onSelectTeaToBrew={handleSelectTeaToBrew}
            />
          )}
          {activeTab === 'journal' && (
            <TeaTastingJournalView 
              initialSessionData={journalInitialSession}
              onSelectTeaToBrew={handleSelectTeaToBrew}
            />
          )}
          {activeTab === 'research' && <ResearchArticlesView />}
        </Suspense>
      </main>

      {/* Scientific Footer */}
      <footer className="border-t border-stone-200 bg-stone-50 py-8 text-stone-500 text-xs mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="font-serif font-bold text-stone-800">
              Расчет кинетики экстракции чая
            </span>
          </div>

          <div className="text-center md:text-right text-stone-400">
            Данные и расчёты основаны на исследованиях: <span className="text-stone-600">Food Chemistry, JAFC, LWT, CAAS (2019–2024)</span> и стандартах <span className="text-stone-600">GB/T 23776 / ISO 9768</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
