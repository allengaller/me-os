import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import { useAuthStore } from './stores/authStore';

const Workbench = lazy(() => import('./pages/Workbench'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const DirectionHub = lazy(() => import('./pages/DirectionHub'));
const ActionHub = lazy(() => import('./pages/ActionHub'));
const CognitionHub = lazy(() => import('./pages/CognitionHub'));
const ReflectionHub = lazy(() => import('./pages/ReflectionHub'));
const ResourcesHub = lazy(() => import('./pages/ResourcesHub'));
const MeLogHub = lazy(() => import('./pages/MeLogHub'));
const BrandHub = lazy(() => import('./pages/BrandHub'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border border-slate-200 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const isDevMode = import.meta.env.DEV || import.meta.env.VITE_SKIP_AUTH === 'true';

  if (isDevMode) {
    return <>{children}</>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="bg-[var(--color-surface)] rounded-xl border border-slate-100 p-12 text-center">
        <h1 className="text-4xl font-light text-slate-900 mb-2">404</h1>
        <p className="text-sm text-slate-400">页面不存在</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/workbench" element={<Workbench />} />

          {/* Direction */}
          <Route path="/direction" element={<DirectionHub />} />
          <Route path="/direction/*" element={<Navigate to="/direction" replace />} />

          {/* Action */}
          <Route path="/action" element={<ActionHub />} />
          <Route path="/action/*" element={<Navigate to="/action" replace />} />

          {/* Cognition */}
          <Route path="/cognition" element={<CognitionHub />} />
          <Route path="/cognition/*" element={<Navigate to="/cognition" replace />} />

          {/* Reflection */}
          <Route path="/reflection" element={<ReflectionHub />} />
          <Route path="/reflection/*" element={<Navigate to="/reflection" replace />} />

          {/* Resources */}
          <Route path="/resources" element={<ResourcesHub />} />
          <Route path="/resources/*" element={<Navigate to="/resources" replace />} />

          {/* MeLog */}
          <Route path="/melog" element={<MeLogHub />} />
          <Route path="/melog/*" element={<Navigate to="/melog" replace />} />

          {/* Brand */}
          <Route path="/brand" element={<BrandHub />} />
          <Route path="/brand/*" element={<Navigate to="/brand" replace />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
