import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { router } from './routes/router';
import './App.css';

// Initialize the stable TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Premium Notification Toaster configuration */}
      <Toaster 
        position="top-right" 
        expand={true}
        richColors 
        theme="light"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontSize: '12px',
            padding: '12px 16px',
            fontFamily: 'var(--font-body-md)',
          },
        }}
      />
      
      {/* Declarative Router Setup */}
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

export default App;
