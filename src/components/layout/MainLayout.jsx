import Box from '@mui/material/Box';
import { Sidebar } from './Sidebar';

export function MainLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, ml: '256px', minHeight: '100vh' }}>
        {children}
      </Box>
    </Box>
  );
}
