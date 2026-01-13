import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const SurahPage = lazy(() => import("./pages/SurahPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const DuasPage = lazy(() => import("./pages/DuasPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ComparisonPage = lazy(() => import("./pages/ComparisonPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Register service worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  }
}

const App = () => {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/surah/:id" element={<SurahPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/compare" element={<ComparisonPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/duas" element={<DuasPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
