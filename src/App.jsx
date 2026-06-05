import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Splash         from './components/Splash';
import Layout         from './components/Layout/Layout';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import ErrorBoundary  from './components/ErrorBoundary';

import Dashboard        from './pages/Dashboard';
import Simulator        from './pages/Simulator';
import Rankings         from './pages/Rankings';
import Trends           from './pages/Trends';
import Comparison       from './pages/Comparison';
import SavedSimulations from './pages/SavedSimulations';
import Settings         from './pages/Settings';
import Login            from './pages/Login';
import Signup           from './pages/Signup';
import Chatbot          from './components/Chatbot';
import TourGuide        from './components/TourGuide';

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE WRAPPER
// Each page gets its own boundary so a crash on /simulator never affects /rankings
// ─────────────────────────────────────────────────────────────────────────────

function PageBoundary({ context, children }) {
  return (
    <ErrorBoundary context={context} variant="page">
      {children}
    </ErrorBoundary>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <Splash onComplete={() => setShowSplash(false)} />}

      {!showSplash && (
        <Router>
          <Routes>
            {/* ── Public routes ──────────────────────────────────────── */}
            <Route
              path="/login"
              element={
                <PageBoundary context="Login">
                  <Login />
                </PageBoundary>
              }
            />
            <Route
              path="/signup"
              element={
                <PageBoundary context="Signup">
                  <Signup />
                </PageBoundary>
              }
            />

            {/* ── Protected routes ───────────────────────────────────── */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  {/* Layout boundary: catches Sidebar / nav crashes */}
                  <ErrorBoundary context="Layout" variant="page">
                    <Layout>
                      <Routes>
                        <Route
                          path="/"
                          element={
                            <PageBoundary context="Dashboard">
                              <Dashboard />
                            </PageBoundary>
                          }
                        />
                        <Route
                          path="/simulator"
                          element={
                            <PageBoundary context="Simulator">
                              <Simulator />
                            </PageBoundary>
                          }
                        />
                        <Route
                          path="/rankings"
                          element={
                            <PageBoundary context="Rankings">
                              <Rankings />
                            </PageBoundary>
                          }
                        />
                        <Route
                          path="/trends"
                          element={
                            <PageBoundary context="Trends">
                              <Trends />
                            </PageBoundary>
                          }
                        />
                        <Route
                          path="/comparison"
                          element={
                            <PageBoundary context="Comparison">
                              <Comparison />
                            </PageBoundary>
                          }
                        />
                        <Route
                          path="/saved"
                          element={
                            <PageBoundary context="Saved Simulations">
                              <SavedSimulations />
                            </PageBoundary>
                          }
                        />
                        <Route
                          path="/settings"
                          element={
                            <PageBoundary context="Settings">
                              <Settings />
                            </PageBoundary>
                          }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Layout>
                  </ErrorBoundary>
                </ProtectedRoute>
              }
            />
          </Routes>

          {/* Chatbot and TourGuide are outside Layout but still within Router */}
          <ErrorBoundary context="Global Overlays" variant="inline">
            <Chatbot />
            <TourGuide />
          </ErrorBoundary>
        </Router>
      )}
    </>
  );
}

export default App;
