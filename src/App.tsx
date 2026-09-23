/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { ExtractionSimulator } from './components/ExtractionSimulator';
import { ResearchArticlesView } from './components/ResearchArticlesView';
import { BrewingProtocolsView } from './components/BrewingProtocolsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-amber-200 selection:text-amber-950">
      {/* Top Header & Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'simulator' && <ExtractionSimulator />}
        {activeTab === 'research' && <ResearchArticlesView />}
        {activeTab === 'protocols' && <BrewingProtocolsView />}
      </main>

      {/* Scientific Footer */}
      <footer className="border-t border-stone-200 bg-stone-50 py-8 text-stone-500 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-amber-800 text-white flex items-center justify-center font-serif text-xs font-bold">
              茶
            </div>
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
