
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (was cacheTime)
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const container = document.getElementById("root");
if (!container) {
  throw new Error('Root element not found');
}

createRoot(container).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
