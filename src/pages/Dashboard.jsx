import { useGlobalStore } from '@/store/globalStore';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, TrendingUp, Mail, MessageCircle, CheckCircle, Clock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Dashboard() {
  const {
    getDashboardStats,
    queryTypes,
    dateRange,
    setDateRange
  } = useGlobalStore();
  const stats = getDashboardStats();
  const [startDate, setStartDate] = useState(undefined);
  const [endDate, setEndDate] = useState(undefined);

  const handleStartDateSelect = (date) => {
    setStartDate(date);
    if (date && endDate && date > endDate) {
      setEndDate(undefined);
    }
  };

  const handleEndDateSelect = (date) => {
    if (date && startDate && date < startDate) {
      return;
    }
    setEndDate(date);
  };

  const statCards = [{
    label: 'Read',
    value: stats.read,
    icon: Eye,
    colorClass: 'stat-card-read',
    color: 'text-stat-read'
  }, {
    label: 'Unread',
    value: stats.unread,
    icon: EyeOff,
    colorClass: 'stat-card-unread',
    color: 'text-stat-unread'
  }, {
    label: 'Resolved',
    value: stats.resolved,
    icon: CheckCircle,
    colorClass: 'stat-card-resolved',
    color: 'text-stat-resolved'
  }, {
    label: 'Pending',
    value: stats.pending,
    icon: Clock,
    colorClass: 'stat-card-pending',
    color: 'text-stat-pending'
  }, {
    label: 'Escalated',
    value: stats.escalated,
    icon: AlertTriangle,
    colorClass: 'stat-card-escalated',
    color: 'text-stat-escalated'
  }];

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-center flex-1">Unified Customer Support Dashboard</h1>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-[160px] justify-start text-left font-normal', !startDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'MMM dd, yyyy') : <span>Start Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="end">
                <Calendar 
                  mode="single" 
                  selected={startDate} 
                  onSelect={handleStartDateSelect} 
                  initialFocus 
                  className="pointer-events-auto" 
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-[160px] justify-start text-left font-normal', !endDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'MMM dd, yyyy') : <span>End Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="end">
                <Calendar 
                  mode="single" 
                  selected={endDate} 
                  onSelect={handleEndDateSelect}
                  disabled={(date) => startDate ? date < startDate : false}
                  initialFocus 
                  className="pointer-events-auto" 
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map(stat => <div key={stat.label} className={cn('stat-card', stat.colorClass)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className={cn('text-3xl font-bold', stat.color)}>{stat.value}</p>
                </div>
                <stat.icon className={cn('h-8 w-8 opacity-80', stat.color)} />
              </div>
            </div>)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Query Type Stats */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Resolved by Query Type</h2>
            </div>
            <div className="space-y-3">
              {queryTypes.map(qt => {
              const count = stats.queryTypeStats[qt.name] || 0;
              const maxCount = Math.max(...Object.values(stats.queryTypeStats), 1);
              const percentage = count / maxCount * 100;
              return <div key={qt.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{qt.name}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary transition-all duration-500" style={{
                    width: `${percentage}%`
                  }} />
                    </div>
                  </div>;
            })}
              {Object.keys(stats.queryTypeStats).length === 0 && <p className="text-muted-foreground text-sm text-center py-4">
                  No resolved queries yet
                </p>}
            </div>
          </div>

          {/* Channel Stats */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Resolved by Channel</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-gradient-to-br from-whatsapp/10 to-whatsapp/5 border border-whatsapp/20 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-whatsapp">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">WhatsApp</span>
                </div>
                <p className="text-4xl font-bold text-whatsapp">{stats.whatsappResolved}</p>
                <p className="text-sm text-muted-foreground mt-1">Resolved conversations</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-email/10 to-email/5 border border-email/20 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-email">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">Email</span>
                </div>
                <p className="text-4xl font-bold text-email">{stats.emailResolved}</p>
                <p className="text-sm text-muted-foreground mt-1">Resolved conversations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
