import { useState, useEffect } from 'react';
import { useGlobalStore } from '../store/globalStore';
import { MainLayout } from '../components/layout/MainLayout';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function Dashboard() {
  const { getDashboardStats, fetchDashboard, fetchInboxes, loading } = useGlobalStore();
  const stats = getDashboardStats();
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([fetchDashboard(), fetchInboxes({ limit: 100 })]);
    } catch {
      showMessage('Failed to load dashboard data', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleRefresh = () => {
    loadData();
    showMessage('Refreshing dashboard...', 'info');
  };



  const statCards = [
    { label: 'Unread', value: stats.unread, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    { label: 'Read', value: stats.read, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    { label: 'Started', value: stats.started, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    { label: 'Resolved', value: stats.resolved, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  ];

  const isLoading = loading.dashboard || loading.inboxes;

  const containerStyle = { padding: '32px', animation: 'fadeIn 0.3s ease-out' };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '4px',
  };

  const subtitleStyle = { fontSize: '14px', color: '#64748b' };

  const controlsStyle = { display: 'flex', alignItems: 'center', gap: '12px' };

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const inputStyle = {
    padding: '10px 14px',
    background: '#fff',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#374151',
    minWidth: '140px',
  };

  const cardGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  };

  const cardStyle = {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.2s',
  };

  const sectionGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  };

  const sectionCardStyle = {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  };

  const sectionTitleStyle = { fontSize: '18px', fontWeight: 600, marginBottom: '20px' };

  const progressBarStyle = (percentage, color) => ({
    height: '8px',
    borderRadius: '4px',
    background: `linear-gradient(90deg, ${color} ${percentage}%, rgba(99, 102, 241, 0.08) ${percentage}%)`,
  });

  const toastStyle = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    padding: '12px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#fff',
    background: message.type === 'error' ? '#ef4444' : message.type === 'success' ? '#10b981' : '#3b82f6',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    zIndex: 9999,
    animation: 'fadeIn 0.3s ease-out',
  };

  return (
    <MainLayout>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Customer Support Dashboard</h1>
            <p style={subtitleStyle}>Monitor and manage all customer conversations</p>
          </div>
          <div style={controlsStyle}>
            <button style={buttonStyle} onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? <span className="spinner" /> : '🔄'} Refresh
            </button>
          </div>
        </div>

        {isLoading && (
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: '2px', marginBottom: '24px', animation: 'pulse 1.5s infinite' }} />
        )}

        <div style={cardGridStyle}>
          {statCards.map((stat) => (
            <div key={stat.label} style={cardStyle}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: stat.color }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: stat.color, marginTop: '8px', lineHeight: 1 }}>
                    {stat.value || 0}
                  </div>
                </div>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  {stat.label === 'Unread' && '📩'}
                  {stat.label === 'Read' && '📖'}
                  {stat.label === 'Started' && '▶️'}
                  {stat.label === 'Resolved' && '✅'}
                  {stat.label === 'Ended' && '🏁'}
                  {stat.label === 'Pending' && '⏳'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={sectionGridStyle}>
          <div style={sectionCardStyle}>
            <h3 style={sectionTitleStyle}>📈 Resolved by Query Type</h3>
            {(stats.categoryResolvedSummary || []).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stats.categoryResolvedSummary.map((cat) => {
                  const max = Math.max(...stats.categoryResolvedSummary.map(c => c.count), 1);
                  const pct = (cat.count / max) * 100;
                  return (
                    <div key={cat._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{cat._id}</span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#6366f1' }}>{cat.count}</span>
                      </div>
                      <div style={progressBarStyle(pct, '#6366f1')} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No resolved queries yet</div>
            )}
          </div>

          <div style={sectionCardStyle}>
            <h3 style={sectionTitleStyle}>📡 Resolved by Channel</h3>
            {(stats.channelResolvedSummary || []).length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                {stats.channelResolvedSummary.map((channel) => {
                  const color = channel._id?.toLowerCase() === 'whatsapp' ? '#25d366' : '#3b82f6';
                  return (
                    <div
                      key={channel._id}
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: `linear-gradient(135deg, ${color}12, ${color}05)`,
                        border: `1px solid ${color}25`,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>
                        {channel._id?.toLowerCase() === 'whatsapp' ? '💬' : '📧'}
                      </div>
                      <div style={{ fontSize: '32px', fontWeight: 800, color, lineHeight: 1 }}>{channel.count}</div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', textTransform: 'capitalize' }}>
                        {channel._id}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No channel data available</div>
            )}
          </div>
        </div>
      </div>

      {message.text && <div style={toastStyle}>{message.text}</div>}
    </MainLayout>
  );
}
