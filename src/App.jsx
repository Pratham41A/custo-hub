import { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SnackbarProvider } from 'notistack';
import theme from './theme/theme';
import Dashboard from "./pages/Dashboard";
import InboxPage from "./pages/InboxPage";
import NotFound from "./pages/NotFound";
import { socketService } from './services/socketService';

const queryClient = new QueryClient();

function AppContent() {
  useEffect(() => {
    // Connect socket on app mount
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={3000}
      >
        <AppContent />
      </SnackbarProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
