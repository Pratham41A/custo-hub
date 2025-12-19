import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import HomeIcon from '@mui/icons-material/Home';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Typography 
          variant="h1" 
          sx={{ 
            fontSize: '8rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            mb: 2,
          }}
        >
          404
        </Typography>
        <Typography variant="h5" color="text.secondary" fontWeight={500} mb={1}>
          Page not found
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4} maxWidth={400}>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Button 
          component={Link} 
          to="/" 
          variant="contained" 
          size="large"
          startIcon={<HomeIcon />}
          sx={{ 
            px: 4,
            py: 1.5,
            borderRadius: 3,
          }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default NotFound;
