import { useGlobalStore } from '@/store/globalStore';
import { User, Inbox } from '@/types';
import { X, Mail, Phone, MapPin, Calendar, Monitor, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ContextPanelProps {
  inbox?: Inbox | null;
  onClose: () => void;
}

export function ContextPanel({ inbox, onClose }: ContextPanelProps) {
  const { users, subscriptions, payments, views, activities } = useGlobalStore();
  const [activeModal, setActiveModal] = useState<'subscription' | 'payment' | 'view' | 'activity' | null>(null);

  if (!inbox) return null;

  const user = users.find((u) => u.id === inbox.user.id);
  const userSubscriptions = subscriptions.filter((s) => s.user.id === inbox.user.id);
  const userPayments = payments.filter((p) => p.user.id === inbox.user.id);
  const userViews = views.filter((v) => v.user_id === inbox.user.id);
  const userActivities = activities.filter((a) => a.user.id === inbox.user.id);

  return (
    <>
      <aside className="fixed right-0 top-0 z-30 h-screen w-80 border-l border-border bg-card animate-slide-in-right">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <h2 className="text-lg font-semibold">Customer Details</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* User Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg font-semibold text-primary">
                      {inbox.user.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{inbox.user.name}</h3>
                    <p className="text-sm text-muted-foreground">Customer</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{inbox.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{inbox.user.mobile}</span>
                  </div>
                  {user?.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user?.speciality && (
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span>{user.speciality}</span>
                    </div>
                  )}
                  {user?.device && (
                    <div className="flex items-center gap-2 text-sm">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span>{user.device}</span>
                    </div>
                  )}
                  {user?.registration_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Joined {new Date(user.registration_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {user?.topic_filters && user.topic_filters.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Topics</p>
                    <div className="flex flex-wrap gap-1">
                      {user.topic_filters.map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Customer Data</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal('subscription')}
                    className="justify-start"
                  >
                    Subscriptions
                    <Badge variant="secondary" className="ml-auto">{userSubscriptions.length}</Badge>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal('payment')}
                    className="justify-start"
                  >
                    Payments
                    <Badge variant="secondary" className="ml-auto">{userPayments.length}</Badge>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal('view')}
                    className="justify-start"
                  >
                    Views
                    <Badge variant="secondary" className="ml-auto">{userViews.length}</Badge>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveModal('activity')}
                    className="justify-start"
                  >
                    Activities
                    <Badge variant="secondary" className="ml-auto">{userActivities.length}</Badge>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Conversation Stats */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Conversation Stats</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-2xl font-bold text-whatsapp">{inbox.whatsapp_count}</p>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-2xl font-bold text-email">{inbox.email_count}</p>
                    <p className="text-xs text-muted-foreground">Email</p>
                  </div>
                  <div className="col-span-2 rounded-lg bg-muted p-3">
                    <p className="text-2xl font-bold text-success">{inbox.resolved_count}</p>
                    <p className="text-xs text-muted-foreground">Resolved Tickets</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* Subscription Modal */}
      <Dialog open={activeModal === 'subscription'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Subscriptions - {inbox.user.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.package_name}</TableCell>
                    <TableCell>{sub.plan_type}</TableCell>
                    <TableCell>{new Date(sub.package_start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(sub.package_end_date).toLocaleDateString()}</TableCell>
                    <TableCell>{sub.payment_method}</TableCell>
                  </TableRow>
                ))}
                {userSubscriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={activeModal === 'payment'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Payments - {inbox.user.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.course_name}</TableCell>
                    <TableCell>{payment.currency_type} {payment.amount}</TableCell>
                    <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-sm">{payment.transaction_id}</TableCell>
                    <TableCell>{payment.payment_source}</TableCell>
                  </TableRow>
                ))}
                {userPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Views Modal */}
      <Dialog open={activeModal === 'view'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Watch History - {inbox.user.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Subcourse</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Device</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userViews.map((view) => (
                  <TableRow key={view.id}>
                    <TableCell className="font-medium">{view.course_name}</TableCell>
                    <TableCell>{view.subcourse_name || '-'}</TableCell>
                    <TableCell>{new Date(view.watch_date).toLocaleDateString()}</TableCell>
                    <TableCell>{view.duration} min</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-success"
                            style={{ width: `${view.percentage_video_watched}%` }}
                          />
                        </div>
                        <span className="text-sm">{view.percentage_video_watched}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{view.device}</TableCell>
                  </TableRow>
                ))}
                {userViews.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No watch history found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Activities Modal */}
      <Dialog open={activeModal === 'activity'} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Activities - {inbox.user.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium">{activity.body}</TableCell>
                    <TableCell>{new Date(activity.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(activity.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {userActivities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No activities found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
