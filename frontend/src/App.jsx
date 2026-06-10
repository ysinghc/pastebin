/**
 * Main App component for the Pastebin frontend
 */

import { useState } from 'react';
import { PasteCreator, PasteRetriever, HealthStatus } from './components';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [createdPasteId, setCreatedPasteId] = useState('');

  const handlePasteCreated = (pasteId) => {
    setCreatedPasteId(pasteId);
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Health Status */}
        <div className="mb-6">
          <HealthStatus />
        </div>

        <Tabs defaultValue="create" onValueChange={setActiveTab}>
          <div className="mb-6 flex justify-center">
            <TabsList className="w-fit">
              <TabsTrigger value="create">Create Paste</TabsTrigger>
              <TabsTrigger value="retrieve">Retrieve Paste</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="create">
            <PasteCreator onPasteCreated={handlePasteCreated} />
          </TabsContent>

          <TabsContent value="retrieve">
            <PasteRetriever initialPasteId={createdPasteId} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-gray-100 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>Built with React + Vite | Backend: FastAPI + Redis</p>
            <p className="mt-1">
              <a
                href={import.meta.env.VITE_API_BASE_URL + '/docs' || 'http://localhost:8000/docs'}
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
