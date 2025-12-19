import { NavLink, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
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
        zIndex: 1200,
        height: '100vh',
        width: 'var(--sidebar-width, 280px)',
        background: customColors.sidebar.background,
        borderRight: `1px solid ${customColors.sidebar.border}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 3,
          py: 2.5,
          borderBottom: `1px solid ${customColors.sidebar.border}`,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <img 
            src="/images/onfnewlogo.png" 
            alt="Onference" 
            style={{ 
              height: 32, 
              width: 'auto',
              filter: 'brightness(1.1)',
            }} 
          />
        </Box>
        <Box>
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#fff', 
              fontWeight: 700,
              fontSize: '1.1rem',
              letterSpacing: '-0.01em',
            }}
          >
            Onference
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Support Hub
          </Typography>
        </Box>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, py: 2, px: 1.5 }}>
        <Typography 
          variant="overline" 
          sx={{ 
            px: 2, 
            py: 1.5, 
            display: 'block',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
          }}
        >
          Main Menu
        </Typography>
        <List disablePadding>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderRadius: 2.5,
                    position: 'relative',
                    overflow: 'hidden',
                    bgcolor: isActive ? customColors.sidebar.accent : 'transparent',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 4,
                      height: isActive ? '60%' : 0,
                      borderRadius: '0 4px 4px 0',
                      background: 'linear-gradient(180deg, #818cf8, #6366f1)',
                      transition: 'height 0.2s',
                    },
                    '&:hover': {
                      bgcolor: customColors.sidebar.accentHover,
                    },
                    '&:hover::before': {
                      height: '40%',
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      minWidth: 44,
                      color: isActive ? customColors.sidebar.primary : 'rgba(255, 255, 255, 0.6)',
                      transition: 'color 0.2s',
                    }}
                  >
                    <Icon sx={{ fontSize: 22 }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.9rem',
                      color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                      transition: 'color 0.2s',
                    }} 
                  />
                  {isActive && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: customColors.sidebar.primary,
                        boxShadow: `0 0 8px ${customColors.sidebar.primary}`,
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          mx: 1.5,
          mb: 1.5,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${customColors.sidebar.border}`,
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.4)',
            display: 'block',
            mb: 0.5,
          }}
        >
          Need help?
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: customColors.sidebar.primary,
            fontWeight: 500,
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          View Documentation →
        </Typography>
      </Box>
    </Box>
  );
}
