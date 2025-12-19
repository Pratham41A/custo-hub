import { useState } from 'react';
import { useGlobalStore } from '@/store/globalStore';
import { format } from 'date-fns';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Popover from '@mui/material/Popover';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmailIcon from '@mui/icons-material/Email';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LinearProgress from '@mui/material/LinearProgress';
import { MainLayout } from '@/components/layout/MainLayout';
import { customColors } from '@/theme/theme';

export default function Dashboard() {
  const { getDashboardStats, queryTypes } = useGlobalStore();
  const stats = getDashboardStats();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startAnchorEl, setStartAnchorEl] = useState(null);
  const [endAnchorEl, setEndAnchorEl] = useState(null);

  const handleStartDateSelect = (date) => {
    setStartDate(date);
    setStartAnchorEl(null);
    if (date && endDate && date > endDate) {
      setEndDate(null);
    }
  };

  const handleEndDateSelect = (date) => {
    if (date && startDate && date < startDate) {
      return;
    }
    setEndDate(date);
    setEndAnchorEl(null);
  };

  const statCards = [
    { 
      label: 'Read', 
      value: stats.read, 
      icon: VisibilityIcon, 
      color: customColors.stat.read,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
      bgClass: 'stat-card-blue',
    },
    { 
      label: 'Unread', 
      value: stats.unread, 
      icon: VisibilityOffIcon, 
      color: customColors.stat.unread,
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      bgClass: 'stat-card-amber',
    },
    { 
      label: 'Resolved', 
      value: stats.resolved, 
      icon: CheckCircleIcon, 
      color: customColors.stat.resolved,
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      bgClass: 'stat-card-emerald',
    },
    { 
      label: 'Pending', 
      value: stats.pending, 
      icon: AccessTimeIcon, 
      color: customColors.stat.pending,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
      bgClass: 'stat-card-violet',
    },
    { 
      label: 'Escalated', 
      value: stats.escalated, 
      icon: WarningIcon, 
      color: customColors.stat.escalated,
      gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
      bgClass: 'stat-card-red',
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MainLayout>
        <Box sx={{ p: 4 }} className="animate-fade-in">
          {/* Header */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              mb: 4,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={700}
                sx={{ 
                  background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                Customer Support Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monitor and manage all customer conversations in one place
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                variant="outlined"
                startIcon={<CalendarTodayIcon sx={{ fontSize: 18 }} />}
                onClick={(e) => setStartAnchorEl(e.currentTarget)}
                sx={{ 
                  minWidth: 150,
                  bgcolor: 'background.paper',
                  borderColor: 'divider',
                  color: startDate ? 'text.primary' : 'text.secondary',
                }}
              >
                {startDate ? format(startDate, 'MMM dd, yyyy') : 'Start Date'}
              </Button>
              <Popover
                open={Boolean(startAnchorEl)}
                anchorEl={startAnchorEl}
                onClose={() => setStartAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <DateCalendar value={startDate} onChange={handleStartDateSelect} />
              </Popover>

              <Box 
                sx={{ 
                  width: 24, 
                  height: 2, 
                  bgcolor: 'divider', 
                  borderRadius: 1 
                }} 
              />

              <Button
                variant="outlined"
                startIcon={<CalendarTodayIcon sx={{ fontSize: 18 }} />}
                onClick={(e) => setEndAnchorEl(e.currentTarget)}
                sx={{ 
                  minWidth: 150,
                  bgcolor: 'background.paper',
                  borderColor: 'divider',
                  color: endDate ? 'text.primary' : 'text.secondary',
                }}
              >
                {endDate ? format(endDate, 'MMM dd, yyyy') : 'End Date'}
              </Button>
              <Popover
                open={Boolean(endAnchorEl)}
                anchorEl={endAnchorEl}
                onClose={() => setEndAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <DateCalendar
                  value={endDate}
                  onChange={handleEndDateSelect}
                  minDate={startDate || undefined}
                />
              </Popover>
            </Box>
          </Box>

          {/* Status Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Grid item xs={12} sm={6} lg={2.4} key={stat.label}>
                  <Card 
                    className={`stat-card ${stat.bgClass}`}
                    sx={{ 
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 20px 40px -15px ${stat.color}40`,
                      },
                    }}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: stat.gradient,
                      }}
                    />
                    <CardContent sx={{ pt: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography 
                            variant="overline" 
                            sx={{ 
                              color: 'text.secondary',
                              fontWeight: 600,
                              letterSpacing: '0.05em',
                              fontSize: '0.7rem',
                            }}
                          >
                            {stat.label}
                          </Typography>
                          <Typography 
                            variant="h3" 
                            fontWeight={800}
                            sx={{ 
                              color: stat.color,
                              lineHeight: 1.2,
                              mt: 0.5,
                            }}
                          >
                            {stat.value}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            background: `${stat.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon sx={{ fontSize: 26, color: stat.color }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Grid container spacing={3}>
            {/* Query Type Stats */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2.5,
                        background: customColors.gradients.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TrendingUpIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        Resolved by Query Type
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Track resolution across categories
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {queryTypes.map((qt, index) => {
                      const count = stats.queryTypeStats[qt.name] || 0;
                      const maxCount = Math.max(...Object.values(stats.queryTypeStats), 1);
                      const percentage = (count / maxCount) * 100;
                      return (
                        <Box key={qt.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {qt.name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              fontWeight={700}
                              sx={{ color: 'primary.main' }}
                            >
                              {count}
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={percentage} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              bgcolor: 'rgba(99, 102, 241, 0.08)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                    {Object.keys(stats.queryTypeStats).length === 0 && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No resolved queries yet
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Channel Stats */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={600}>
                      Resolved by Channel
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Performance across communication channels
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          borderRadius: 4,
                          p: 3,
                          background: `linear-gradient(135deg, ${customColors.channel.whatsapp}12, ${customColors.channel.whatsapp}05)`,
                          border: `1px solid ${customColors.channel.whatsapp}25`,
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 12px 24px -8px ${customColors.channel.whatsapp}30`,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2.5,
                              background: `linear-gradient(135deg, ${customColors.channel.whatsapp}, #22c55e)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 8px 16px -4px ${customColors.channel.whatsapp}50`,
                            }}
                          >
                            <ChatIcon sx={{ color: 'white', fontSize: 22 }} />
                          </Box>
                          <Typography fontWeight={600}>WhatsApp</Typography>
                        </Box>
                        <Typography 
                          variant="h2" 
                          fontWeight={800}
                          sx={{ 
                            color: customColors.channel.whatsapp,
                            lineHeight: 1,
                          }}
                        >
                          {stats.whatsappResolved}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Resolved conversations
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          borderRadius: 4,
                          p: 3,
                          background: `linear-gradient(135deg, ${customColors.channel.email}12, ${customColors.channel.email}05)`,
                          border: `1px solid ${customColors.channel.email}25`,
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 12px 24px -8px ${customColors.channel.email}30`,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2.5,
                              background: `linear-gradient(135deg, ${customColors.channel.email}, #60a5fa)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: `0 8px 16px -4px ${customColors.channel.email}50`,
                            }}
                          >
                            <EmailIcon sx={{ color: 'white', fontSize: 22 }} />
                          </Box>
                          <Typography fontWeight={600}>Email</Typography>
                        </Box>
                        <Typography 
                          variant="h2" 
                          fontWeight={800}
                          sx={{ 
                            color: customColors.channel.email,
                            lineHeight: 1,
                          }}
                        >
                          {stats.emailResolved}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={1}>
                          Resolved conversations
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </MainLayout>
    </LocalizationProvider>
  );
}
