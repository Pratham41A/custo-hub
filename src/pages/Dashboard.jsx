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
    { label: 'Read', value: stats.read, icon: VisibilityIcon, color: customColors.stat.read },
    { label: 'Unread', value: stats.unread, icon: VisibilityOffIcon, color: customColors.stat.unread },
    { label: 'Resolved', value: stats.resolved, icon: CheckCircleIcon, color: customColors.stat.resolved },
    { label: 'Pending', value: stats.pending, icon: AccessTimeIcon, color: customColors.stat.pending },
    { label: 'Escalated', value: stats.escalated, icon: WarningIcon, color: customColors.stat.escalated },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <MainLayout>
        <Box sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5" fontWeight={700} sx={{ flex: 1, textAlign: 'center' }}>
              Unified Customer Support Dashboard
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<CalendarTodayIcon />}
                onClick={(e) => setStartAnchorEl(e.currentTarget)}
                sx={{ minWidth: 160 }}
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

              <Typography color="text.secondary">to</Typography>

              <Button
                variant="outlined"
                startIcon={<CalendarTodayIcon />}
                onClick={(e) => setEndAnchorEl(e.currentTarget)}
                sx={{ minWidth: 160 }}
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
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <Grid item xs={12} md={6} lg={2.4} key={stat.label}>
                  <Card sx={{ borderLeft: 4, borderColor: stat.color }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                          {stat.label}
                        </Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ color: stat.color }}>
                          {stat.value}
                        </Typography>
                      </Box>
                      <Icon sx={{ fontSize: 32, color: stat.color, opacity: 0.8 }} />
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Grid container spacing={3}>
            {/* Query Type Stats */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TrendingUpIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Resolved by Query Type
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {queryTypes.map((qt) => {
                      const count = stats.queryTypeStats[qt.name] || 0;
                      const maxCount = Math.max(...Object.values(stats.queryTypeStats), 1);
                      const percentage = (count / maxCount) * 100;
                      return (
                        <Box key={qt.id}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{qt.name}</Typography>
                            <Typography variant="body2" fontWeight={600}>{count}</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={percentage} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      );
                    })}
                    {Object.keys(stats.queryTypeStats).length === 0 && (
                      <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                        No resolved queries yet
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Channel Stats */}
            <Grid item xs={12} lg={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Resolved by Channel
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          borderRadius: 3,
                          p: 3,
                          background: `linear-gradient(135deg, ${customColors.channel.whatsapp}15, ${customColors.channel.whatsapp}08)`,
                          border: `1px solid ${customColors.channel.whatsapp}30`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              bgcolor: customColors.channel.whatsapp,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <ChatIcon sx={{ color: 'white' }} />
                          </Box>
                          <Typography fontWeight={500}>WhatsApp</Typography>
                        </Box>
                        <Typography variant="h3" fontWeight={700} sx={{ color: customColors.channel.whatsapp }}>
                          {stats.whatsappResolved}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                          Resolved conversations
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box
                        sx={{
                          borderRadius: 3,
                          p: 3,
                          background: `linear-gradient(135deg, ${customColors.channel.email}15, ${customColors.channel.email}08)`,
                          border: `1px solid ${customColors.channel.email}30`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              bgcolor: customColors.channel.email,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <EmailIcon sx={{ color: 'white' }} />
                          </Box>
                          <Typography fontWeight={500}>Email</Typography>
                        </Box>
                        <Typography variant="h3" fontWeight={700} sx={{ color: customColors.channel.email }}>
                          {stats.emailResolved}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
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
