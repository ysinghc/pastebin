/**
 * Main App component for the Pastebin frontend
 */

import { useState } from 'react';
import { PasteCreator, PasteRetriever, HealthStatus } from './components';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [createdPasteId, setCreatedPasteId] = useState('');

  const handlePasteCreated = (pasteId) => {
    setCreatedPasteId(pasteId);
    // Optionally switch to retrieve tab
    // setActiveTab('retrieve');
  };

  const handleRetrieveWithId = (pasteId) => {
    setCreatedPasteId(pasteId);
    setActiveTab('retrieve');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pastebin</h1>
              <p className="text-sm text-gray-600 mt-1">Share code and text snippets with ease</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p>Backend: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Health Status */}
        <div className="mb-6">
          <HealthStatus />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'create'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Create Paste
          </button>
          <button
            onClick={() => setActiveTab('retrieve')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'retrieve'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Retrieve Paste
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'create' && (
            <PasteCreator onPasteCreated={handlePasteCreated} />
          )}

          {activeTab === 'retrieve' && (
            <PasteRetriever initialPasteId={createdPasteId} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-gray-100 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>Built with React + Vite | Backend: FastAPI + Redis</p>
            <p className="mt-1">
              <a
                href={import.meta.env.VITE_API_BASE_URL + '/docs  ' || 'http://localhost:8000/docs'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700"
              >
                API Documentation
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
