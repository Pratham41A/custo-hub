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

  return (
    <>
      <Box
        component="aside"
        className="animate-slide-in-right"
        sx={{
          position: 'fixed',
          right: 0,
          top: 0,
          zIndex: 30,
          height: '100vh',
          width: 320,
          borderLeft: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            height: 64,
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Customer Details
          </Typography>
          <IconButton onClick={onClose} title="Hide Customer Details">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* User Info */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography fontWeight={600} color="primary.main">
                  {inbox.user.name.split(' ').map((n) => n[0]).join('')}
                </Typography>
              </Box>
              <Box>
                <Typography fontWeight={600}>{inbox.user.name}</Typography>
                <Typography variant="body2" color="text.secondary">Customer</Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2">{inbox.user.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2">{inbox.user.mobile}</Typography>
              </Box>
              {user?.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2">{user.location}</Typography>
                </Box>
              )}
              {user?.speciality && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LabelIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2">{user.speciality}</Typography>
                </Box>
              )}
              {user?.device && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DevicesIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2">{user.device}</Typography>
                </Box>
              )}
              {user?.registration_date && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2">
                    Joined {new Date(user.registration_date).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
            </Box>

            {user?.topic_filters && user.topic_filters.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Topics
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {user.topic_filters.map((topic) => (
                    <Chip key={topic} label={topic} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Quick Actions */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" mb={1} display="block">
              Customer Data
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setActiveModal('subscription')}
                sx={{ justifyContent: 'space-between' }}
              >
                Subscriptions
                <Chip label={userSubscriptions.length} size="small" sx={{ ml: 1 }} />
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setActiveModal('payment')}
                sx={{ justifyContent: 'space-between' }}
              >
                Payments
                <Chip label={userPayments.length} size="small" sx={{ ml: 1 }} />
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setActiveModal('view')}
                sx={{ justifyContent: 'space-between' }}
              >
                Views
                <Chip label={userViews.length} size="small" sx={{ ml: 1 }} />
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setActiveModal('notes')}
                sx={{ justifyContent: 'space-between' }}
                startIcon={<NoteIcon />}
              >
                Notes
                <Chip label={userNotes.length} size="small" sx={{ ml: 1 }} />
              </Button>
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
                  <TableCell>{sub.package_name}</TableCell>
                  <TableCell>{sub.plan_type}</TableCell>
                  <TableCell>{new Date(sub.package_start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(sub.package_end_date).toLocaleDateString()}</TableCell>
                  <TableCell>{sub.payment_method}</TableCell>
                </TableRow>
              ))}
              {userSubscriptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No subscriptions found</TableCell>
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
                  <TableCell>{payment.course_name}</TableCell>
                  <TableCell>{payment.currency_type} {payment.amount}</TableCell>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{payment.transaction_id}</TableCell>
                  <TableCell>{payment.payment_source}</TableCell>
                </TableRow>
              ))}
              {userPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">No payments found</TableCell>
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
                  <TableCell>{view.course_name}</TableCell>
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
                  <TableCell colSpan={6} align="center">No watch history found</TableCell>
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
                  <TableCell>{note.body}</TableCell>
                  <TableCell>{new Date(note.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(note.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {userNotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">No notes found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </>
  );
}
