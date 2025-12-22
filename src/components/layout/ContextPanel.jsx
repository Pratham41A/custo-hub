import { useState, useEffect } from 'react';
import { useGlobalStore } from '@/store/globalStore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import EmailIcon from '@mui/icons-material/Email';
import NoteIcon from '@mui/icons-material/Note';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DevicesIcon from '@mui/icons-material/Devices';
import LabelIcon from '@mui/icons-material/Label';
import CloseIcon from '@mui/icons-material/Close';
import { customColors } from '@/theme/theme';

export function ContextPanel({ inbox, onClose }) {
  const { 
    subscriptions, payments, views, notes,
    fetchUserSubscriptions, fetchUserPayments, fetchUserViews, fetchUserActivities 
  } = useGlobalStore();
  const [activeModal, setActiveModal] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  if (!inbox) return null;

  const user = inbox.user || {};
  const userId = user.id || user._id;

  const loadDataForModal = async (type) => {
    if (!userId) return;
    setLoadingData(true);
    try {
      if (type === 'subscription') await fetchUserSubscriptions(userId, 20);
      if (type === 'payment') await fetchUserPayments(userId, 20);
      if (type === 'view') await fetchUserViews(userId, 20);
      if (type === 'notes') await fetchUserActivities(userId, 20);
    } finally {
      setLoadingData(false);
    }
  };

  const handleOpenModal = (type) => {
    setActiveModal(type);
    loadDataForModal(type);
  };

  const dataItems = [
    { key: 'subscription', label: 'Subscriptions', count: subscriptions.length },
    { key: 'payment', label: 'Payments', count: payments.length },
    { key: 'view', label: 'Views', count: views.length },
    { key: 'notes', label: 'Notes', count: notes.length },
  ];

  return (
    <>
      <Box
        component="aside"
        className="animate-slide-in-right"
        sx={{
          position: 'fixed',
          right: 0,
          top: 0,
          zIndex: 1100,
          height: '100vh',
          width: 340,
          borderLeft: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px -12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            height: 72,
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 3,
          }}
        >
          <Typography variant="h6" fontWeight={600}>Customer Details</Typography>
          <IconButton onClick={onClose} sx={{ bgcolor: 'rgba(0,0,0,0.04)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 72, height: 72, mx: 'auto', mb: 2,
                background: customColors.gradients.primary,
                fontSize: '1.5rem', fontWeight: 600,
              }}
            >
              {(user.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </Avatar>
            <Typography variant="h6" fontWeight={600}>{user.name || 'Unknown'}</Typography>
            <Typography variant="body2" color="text.secondary">Customer</Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {[
              user.email && { icon: EmailIcon, value: user.email },
              user.mobile && { icon: PhoneIcon, value: user.mobile },
              user.location && { icon: LocationOnIcon, value: user.location },
              user.speciality && { icon: LabelIcon, value: user.speciality },
              user.device && { icon: DevicesIcon, value: user.device },
              user.registration_date && { icon: CalendarTodayIcon, value: `Joined ${new Date(user.registration_date).toLocaleDateString()}` },
            ].filter(Boolean).map((item, index) => {
              const Icon = item.icon;
              return (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <Icon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="body2">{item.value}</Typography>
                </Box>
              );
            })}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1.5 }}>
              Customer Data
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {dataItems.map((item) => (
                <Button
                  key={item.key}
                  variant="outlined"
                  size="small"
                  onClick={() => handleOpenModal(item.key)}
                  sx={{ justifyContent: 'space-between', py: 1.5, borderRadius: 2, borderColor: 'divider', color: 'text.primary' }}
                >
                  <Typography variant="body2" fontWeight={500}>{item.label}</Typography>
                  <Chip label={item.count} size="small" sx={{ height: 22, bgcolor: 'primary.main', color: 'white', fontWeight: 600 }} />
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Modals */}
      <Dialog open={activeModal === 'subscription'} onClose={() => setActiveModal(null)} maxWidth="md" fullWidth>
        <DialogTitle>Subscriptions - {user.name}</DialogTitle>
        <DialogContent>
          {loadingData ? <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
            <Table>
              <TableHead><TableRow><TableCell>Package</TableCell><TableCell>Plan</TableCell><TableCell>Start</TableCell><TableCell>End</TableCell></TableRow></TableHead>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id || sub._id}>
                    <TableCell>{sub.package_name}</TableCell>
                    <TableCell>{sub.plan_type}</TableCell>
                    <TableCell>{new Date(sub.package_start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(sub.package_end_date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {subscriptions.length === 0 && <TableRow><TableCell colSpan={4} align="center">No subscriptions</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'payment'} onClose={() => setActiveModal(null)} maxWidth="md" fullWidth>
        <DialogTitle>Payments - {user.name}</DialogTitle>
        <DialogContent>
          {loadingData ? <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
            <Table>
              <TableHead><TableRow><TableCell>Course</TableCell><TableCell>Amount</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id || p._id}>
                    <TableCell>{p.course_name}</TableCell>
                    <TableCell>{p.currency_type} {p.amount}</TableCell>
                    <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && <TableRow><TableCell colSpan={3} align="center">No payments</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'view'} onClose={() => setActiveModal(null)} maxWidth="md" fullWidth>
        <DialogTitle>Views - {user.name}</DialogTitle>
        <DialogContent>
          {loadingData ? <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
            <Table>
              <TableHead><TableRow><TableCell>Course</TableCell><TableCell>Duration</TableCell><TableCell>Progress</TableCell></TableRow></TableHead>
              <TableBody>
                {views.map((v) => (
                  <TableRow key={v.id || v._id}>
                    <TableCell>{v.course_name}</TableCell>
                    <TableCell>{v.duration} min</TableCell>
                    <TableCell><LinearProgress variant="determinate" value={v.percentage_video_watched || 0} sx={{ width: 60 }} /></TableCell>
                  </TableRow>
                ))}
                {views.length === 0 && <TableRow><TableCell colSpan={3} align="center">No views</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === 'notes'} onClose={() => setActiveModal(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Notes - {user.name}</DialogTitle>
        <DialogContent>
          {loadingData ? <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box> : (
            <Table>
              <TableHead><TableRow><TableCell>Note</TableCell><TableCell>Due Date</TableCell></TableRow></TableHead>
              <TableBody>
                {notes.map((n) => (
                  <TableRow key={n.id || n._id}>
                    <TableCell>{n.body}</TableCell>
                    <TableCell>{new Date(n.due_date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {notes.length === 0 && <TableRow><TableCell colSpan={2} align="center">No notes</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
