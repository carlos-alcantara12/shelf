import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./AuthContext";

// Cada página é carregada só quando a pessoa chega nela.
const AppLayout = lazy(() => import("./AppLayout"));
const WelcomePage = lazy(() => import("@/pages/welcome/WelcomePage"));
const LoginPage = lazy(() => import("@/pages/login/LoginPage"));
const LibraryPage = lazy(() => import("@/pages/library/LibraryPage"));
const CatalogPage = lazy(() => import("@/pages/catalog/CatalogPage"));
const ProgressPage = lazy(() => import("@/pages/progress/ProgressPage"));
const SharedLibrariesPage = lazy(() => import("@/pages/shared/SharedLibrariesPage"));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage"));
const SignUpPage = lazy(() => import("@/pages/signup/SignUpPage"));
const DiagnosticLevelPage = lazy(() => import("@/pages/diagnostic/LevelPage"));
const DiagnosticQuestionsPage = lazy(() => import("@/pages/diagnostic/QuestionsPage"));
const DiagnosticResultPage = lazy(() => import("@/pages/diagnostic/ResultPage"));
const DiagnosticReviewPage = lazy(() => import("@/pages/diagnostic/ReviewPage"));

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/entrar" element={<LoginPage />} />
            <Route path="/cadastro" element={<SignUpPage />} />
            <Route path="/diagnostico" element={<DiagnosticLevelPage />} />
            <Route path="/diagnostico/perguntas" element={<DiagnosticQuestionsPage />} />
            <Route path="/diagnostico/resultado" element={<DiagnosticResultPage />} />
            <Route path="/diagnostico/revisar" element={<DiagnosticReviewPage />} />
            <Route element={<AppLayout />}>
              <Route path="/biblioteca" element={<LibraryPage />} />
              <Route path="/catalogo" element={<CatalogPage />} />
              <Route path="/progresso" element={<ProgressPage />} />
              <Route path="/compartilhadas" element={<SharedLibrariesPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
