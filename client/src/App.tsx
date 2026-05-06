import EditWorkshop from './workshops/EditWorkshop';
import WorkshopDetails from './workshops/WorkshopDetails';

function App() {
  // Demo workshop ID
  const demoWorkshopId = '123e4567-e89b-12d3-a456-426614174000';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="text-center animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-6">
            New Feature: AI Summarization
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight sm:text-6xl">
            UniHub <span className="text-indigo-600">AI</span> Workshops
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            Revolutionizing how students consume workshop content. Upload a PDF, and let our 
            <span className="text-indigo-600 font-bold"> Gemini-powered</span> engine do the heavy lifting.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start animate-in fade-in zoom-in duration-1000 delay-300">
          <section className="space-y-8">
            <div className="flex items-center space-x-3 px-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Admin Dashboard</h2>
            </div>
            <EditWorkshop workshopId={demoWorkshopId} />
          </section>

          <section className="space-y-8">
            <div className="flex items-center space-x-3 px-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Student View</h2>
            </div>
            <WorkshopDetails workshopId={demoWorkshopId} />
          </section>
        </main>

        <footer className="pt-16 pb-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 text-sm font-semibold tracking-widest uppercase mb-2">
            UniHub Workshop Management System
          </p>
          <div className="flex items-center justify-center space-x-2 text-gray-300">
            <span>Powered by</span>
            <span className="font-bold text-gray-400">Google Gemini 1.5 Flash</span>
            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
            <span>NestJS</span>
            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
            <span>React</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
