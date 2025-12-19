import { NavLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InboxIcon from '@mui/icons-material/Inbox';
import { customColors } from '@/theme/theme';

const navItems = [
  { path: '/', icon: DashboardIcon, label: 'Dashboard' },
  { path: '/inbox', icon: InboxIcon, label: 'Inbox' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <Box
      component="aside"
      sx={{
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 40,
        height: '100vh',
        width: 256,
        bgcolor: customColors.sidebar.background,
        borderRight: 1,
        borderColor: customColors.sidebar.accent,
      }}
    >
      <Box sx={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
        {/* Logo */}
        <Box
          sx={{
            display: 'flex',
            height: 64,
            alignItems: 'center',
            gap: 1.5,
            borderBottom: 1,
            borderColor: customColors.sidebar.accent,
            px: 3,
          }}
        >
          <img src="/images/onfnewlogo.png" alt="Onference Logo" style={{ height: 32, width: 'auto' }} />
        </Box>

        {/* Main Navigation */}
        <List sx={{ flex: 1, px: 1.5, py: 2 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  sx={{
                    borderRadius: 2,
                    px: 1.5,
                    py: 1.25,
                    bgcolor: isActive ? customColors.sidebar.accent : 'transparent',
                    color: isActive ? customColors.sidebar.primary : customColors.sidebar.foreground,
                    '&:hover': {
                      bgcolor: customColors.sidebar.accent,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.875rem',
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}
