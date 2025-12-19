import { useState } from 'react';
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
  const { users, subscriptions, payments, views, notes } = useGlobalStore();
  const [activeModal, setActiveModal] = useState(null);

  if (!inbox) return null;

  const user = users.find((u) => u.id === inbox.user.id);
  const userSubscriptions = subscriptions.filter((s) => s.user.id === inbox.user.id);
  const userPayments = payments.filter((p) => p.user.id === inbox.user.id);
  const userViews = views.filter((v) => v.user_id === inbox.user.id);
  const userNotes = notes.filter((n) => n.user.id === inbox.user.id);

  const dataItems = [
    { key: 'subscription', label: 'Subscriptions', count: userSubscriptions.length },
    { key: 'payment', label: 'Payments', count: userPayments.length },
    { key: 'view', label: 'Views', count: userViews.length },
    { key: 'notes', label: 'Notes', count: userNotes.length, icon: NoteIcon },
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
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            height: 'var(--header-height, 72px)',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 3,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Customer Details
          </Typography>
          <IconButton 
            onClick={onClose}
            sx={{ 
              bgcolor: 'rgba(0,0,0,0.04)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.08)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {/* User Info */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                mx: 'auto',
                mb: 2,
                background: customColors.gradients.primary,
                fontSize: '1.5rem',
                fontWeight: 600,
                boxShadow: '0 8px 24px -8px rgba(99, 102, 241, 0.4)',
              }}
            >
              {inbox.user.name.split(' ').map((n) => n[0]).join('')}
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              {inbox.user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customer
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
            {[
              { icon: EmailIcon, value: inbox.user.email },
              { icon: PhoneIcon, value: inbox.user.mobile },
              user?.location && { icon: LocationOnIcon, value: user.location },
              user?.speciality && { icon: LabelIcon, value: user.speciality },
              user?.device && { icon: DevicesIcon, value: user.device },
              user?.registration_date && { 
                icon: CalendarTodayIcon, 
                value: `Joined ${new Date(user.registration_date).toLocaleDateString()}` 
              },
            ].filter(Boolean).map((item, index) => {
              const Icon = item.icon;
              return (
                <Box 
                  key={index} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(0,0,0,0.02)',
                  }}
                >
                  <Icon sx={{ fontSize: 18, color: 'primary.main' }} />
                  <Typography variant="body2">{item.value}</Typography>
                </Box>
              );
            })}
          </Box>

          {user?.topic_filters && user.topic_filters.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography 
                variant="overline" 
                sx={{ 
                  color: 'text.secondary', 
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  display: 'block',
                  mb: 1,
                }}
              >
                Topics
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {user.topic_filters.map((topic) => (
                  <Chip 
                    key={topic} 
                    label={topic} 
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(99, 102, 241, 0.1)',
                      color: 'primary.main',
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Quick Actions */}
          <Box>
            <Typography 
              variant="overline" 
              sx={{ 
                color: 'text.secondary', 
                fontWeight: 600,
                letterSpacing: '0.05em',
                display: 'block',
                mb: 1.5,
              }}
            >
              Customer Data
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {dataItems.map((item) => (
                <Button
                  key={item.key}
                  variant="outlined"
                  size="small"
                  onClick={() => setActiveModal(item.key)}
                  sx={{ 
                    justifyContent: 'space-between',
                    py: 1.5,
                    borderRadius: 2,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(99, 102, 241, 0.04)',
                    },
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    {item.label}
                  </Typography>
                  <Chip 
                    label={item.count} 
                    size="small"
                    sx={{ 
                      height: 22,
                      minWidth: 28,
                      bgcolor: 'primary.main',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  />
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Subscription Modal */}
      <Dialog open={activeModal === 'subscription'} onClose={() => setActiveModal(null)} maxWidth="md" fullWidth>
        <DialogTitle>Subscriptions - {inbox.user.name}</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Package</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Payment Method</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userSubscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell sx={{ fontWeight: 500 }}>{sub.package_name}</TableCell>
                  <TableCell>{sub.plan_type}</TableCell>
                  <TableCell>{new Date(sub.package_start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(sub.package_end_date).toLocaleDateString()}</TableCell>
                  <TableCell>{sub.payment_method}</TableCell>
                </TableRow>
              ))}
              {userSubscriptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No subscriptions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={activeModal === 'payment'} onClose={() => setActiveModal(null)} maxWidth="md" fullWidth>
        <DialogTitle>Payments - {inbox.user.name}</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Source</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell sx={{ fontWeight: 500 }}>{payment.course_name}</TableCell>
                  <TableCell>{payment.currency_type} {payment.amount}</TableCell>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{payment.transaction_id}</TableCell>
                  <TableCell>{payment.payment_source}</TableCell>
                </TableRow>
              ))}
              {userPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No payments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Views Modal */}
      <Dialog open={activeModal === 'view'} onClose={() => setActiveModal(null)} maxWidth="md" fullWidth>
        <DialogTitle>Watch History - {inbox.user.name}</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Subcourse</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Device</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userViews.map((view) => (
                <TableRow key={view.id}>
                  <TableCell sx={{ fontWeight: 500 }}>{view.course_name}</TableCell>
                  <TableCell>{view.subcourse_name || '-'}</TableCell>
                  <TableCell>{new Date(view.watch_date).toLocaleDateString()}</TableCell>
                  <TableCell>{view.duration} min</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={view.percentage_video_watched} 
                        sx={{ width: 60, height: 6, borderRadius: 3 }}
                        color="success"
                      />
                      <Typography variant="body2">{view.percentage_video_watched}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{view.device}</TableCell>
                </TableRow>
              ))}
              {userViews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No watch history found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={activeModal === 'notes'} onClose={() => setActiveModal(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Notes - {inbox.user.name}</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Note</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userNotes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell sx={{ fontWeight: 500 }}>{note.body}</TableCell>
                  <TableCell>{new Date(note.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(note.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {userNotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No notes found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}
