import Box from '@mui/material/Box';
import { Sidebar } from './Sidebar';

export function MainLayout({ children }) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      }}
    >
      <Sidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          ml: 'var(--sidebar-width, 280px)', 
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
