import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { StartupsProvider } from './context/StartupsContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AuthModal } from './components/common/AuthModal';
import { ScrollToTop } from './components/common/ScrollToTop';

// Pages
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { StartupDetailPage } from './pages/StartupDetailPage';
import { SubmitStartupPage } from './pages/SubmitStartupPage';
import { AuthPage } from './pages/AuthPage';
import { SavedStartupsPage } from './pages/SavedStartupsPage';
import { MySubmissionsPage } from './pages/MySubmissionsPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  const [headerSearch, setHeaderSearch] = useState('');

  return (
    <ThemeProvider>
      <AuthProvider>
      <StartupsProvider>
          <BrowserRouter>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600/15 selection:text-blue-700 transition-colors">
              {/* Header Navigation matching reference screenshot */}
              <Navbar 
                globalSearch={headerSearch} 
                onSearchQueryChange={setHeaderSearch} 
              />

              {/* Main Content */}
              <main className="flex-1">
                <Routes>
                  <Route 
                    path="/" 
                    element={<HomePage headerSearchQuery={headerSearch} />} 
                  />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/startup/:slug" element={<StartupDetailPage />} />
                  <Route path="/submit" element={<SubmitStartupPage />} />
                  <Route path="/login" element={<AuthPage initialMode="login" />} />
                  <Route path="/signup" element={<AuthPage initialMode="signup" />} />
                  <Route path="/saved" element={<SavedStartupsPage />} />
                  <Route path="/me/submissions" element={<MySubmissionsPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>

              {/* Footer */}
              <Footer />
              <AuthModal />

            </div>
          </BrowserRouter>
      </StartupsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
