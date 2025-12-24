import { useState } from 'react';
import { useGlobalStore } from '../../store/globalStore';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function ContextPanel({ inbox, onClose }) {
  const { subscriptions, payments, views, notes, fetchUserSubscriptions, fetchUserPayments, fetchUserViews, fetchUserActivities } = useGlobalStore();
  const [activeModal, setActiveModal] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [pagination, setPagination] = useState({});

  if (!inbox) return null;

  const user = inbox.owner || {};
  const userId = user._id;

  const loadDataForModal = async (type) => {
    if (!userId) return;
    setLoadingData(true);
    try {
      let result;
      if (type === 'subscription') result = await fetchUserSubscriptions(userId, 20);
      if (type === 'payment') result = await fetchUserPayments(userId, 20);
      if (type === 'view') result = await fetchUserViews(userId, 20);
      if (type === 'notes') result = await fetchUserActivities(userId, 20);
      if (result?.pagination) setPagination(result.pagination);
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

  // Styles
  const panelStyle = {
    position: 'fixed',
    right: 0,
    top: 0,
    zIndex: 1100,
    height: '100vh',
    width: '340px',
    borderLeft: '1px solid rgba(0,0,0,0.08)',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '-8px 0 32px -12px rgba(0,0,0,0.15)',
    animation: 'slideInRight 0.3s ease-out',
  };

  const headerStyle = {
    display: 'flex',
    height: '72px',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    padding: '0 24px',
  };

  const closeButtonStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(0,0,0,0.04)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  };

  const avatarStyle = {
    width: '72px',
    height: '72px',
    margin: '0 auto 16px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 600,
  };

  const infoRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'rgba(0,0,0,0.02)',
    marginBottom: '8px',
  };

  const dataButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(0,0,0,0.08)',
    background: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
    fontWeight: 500,
  };

  const badgeStyle = {
    padding: '4px 10px',
    borderRadius: '6px',
    background: '#6366f1',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
  };

  const modalOverlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  };

  const modalStyle = {
    background: '#fff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '700px',
    maxHeight: '80vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
  };

  const modalHeaderStyle = {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    fontSize: '18px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748b',
    background: '#f8fafc',
    borderBottom: '2px solid rgba(0,0,0,0.06)',
  };

  const tdStyle = {
    padding: '14px 16px',
    fontSize: '14px',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
  };

  const progressStyle = (percentage) => ({
    width: '60px',
    height: '6px',
    borderRadius: '3px',
    background: `linear-gradient(90deg, #6366f1 ${percentage}%, rgba(99,102,241,0.12) ${percentage}%)`,
  });

  const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <>
      <aside style={panelStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: '16px', fontWeight: 600 }}>Customer Details</span>
          <button style={closeButtonStyle} onClick={onClose}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={avatarStyle}>{initials}</div>
            <div style={{ fontSize: '18px', fontWeight: 600 }}>{user.name || 'Unknown'}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Customer</div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            {user.email && (
              <div style={infoRowStyle}>
                <span>📧</span>
                <span style={{ fontSize: '14px' }}>{user.email}</span>
              </div>
            )}
            {user.mobile && (
              <div style={infoRowStyle}>
                <span>📱</span>
                <span style={{ fontSize: '14px' }}>{user.mobile}</span>
              </div>
            )}
            {user.location && (
              <div style={infoRowStyle}>
                <span>📍</span>
                <span style={{ fontSize: '14px' }}>{user.location}</span>
              </div>
            )}
            {user.speciality && (
              <div style={infoRowStyle}>
                <span>🏷️</span>
                <span style={{ fontSize: '14px' }}>{user.speciality}</span>
              </div>
            )}
            {user.device && (
              <div style={infoRowStyle}>
                <span>💻</span>
                <span style={{ fontSize: '14px' }}>{user.device}</span>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '12px' }}>
              Customer Data
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {dataItems.map((item) => (
                <button key={item.key} style={dataButtonStyle} onClick={() => handleOpenModal(item.key)}>
                  <span>{item.label}</span>
                  <span style={badgeStyle}>{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Subscriptions Modal */}
      {activeModal === 'subscription' && (
        <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <span>Subscriptions - {user.name}</span>
              <button style={closeButtonStyle} onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ padding: '16px', maxHeight: '60vh', overflow: 'auto' }}>
              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '32px' }}><span className="spinner" /></div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Package</th>
                      <th style={thStyle}>Plan</th>
                      <th style={thStyle}>Method</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Start</th>
                      <th style={thStyle}>End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr key={sub._id}>
                        <td style={tdStyle}>{sub.packageId?.packageName || '-'}</td>
                        <td style={tdStyle}>{sub.packageId?.planType === 1 ? 'Premium' : 'Basic'}</td>
                        <td style={tdStyle}>{sub.paymentmethod}</td>
                        <td style={tdStyle}>
                          <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: sub.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: sub.status === 'active' ? '#10b981' : '#ef4444', textTransform: 'capitalize' }}>
                            {sub.status}
                          </span>
                        </td>
                        <td style={tdStyle}>{formatDate(sub.startDate)}</td>
                        <td style={tdStyle}>{formatDate(sub.endDate)}</td>
                      </tr>
                    ))}
                    {subscriptions.length === 0 && (
                      <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>No subscriptions</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payments Modal */}
      {activeModal === 'payment' && (
        <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <span>Payments - {user.name}</span>
              <button style={closeButtonStyle} onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ padding: '16px', maxHeight: '60vh', overflow: 'auto' }}>
              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '32px' }}><span className="spinner" /></div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Course</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Method</th>
                      <th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td style={tdStyle}>{p.coursename || '-'}</td>
                        <td style={tdStyle}>{p.currencytype} {p.amountpaid}</td>
                        <td style={tdStyle}>{p.paymentmethod}</td>
                        <td style={tdStyle}>{formatDate(p.whenentered)}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>No payments</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Views Modal */}
      {activeModal === 'view' && (
        <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <span>Views - {user.name}</span>
              <button style={closeButtonStyle} onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ padding: '16px', maxHeight: '60vh', overflow: 'auto' }}>
              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '32px' }}><span className="spinner" /></div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Course</th>
                      <th style={thStyle}>Sub Course</th>
                      <th style={thStyle}>Duration</th>
                      <th style={thStyle}>Progress</th>
                      <th style={thStyle}>Device</th>
                      <th style={thStyle}>Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {views.map((v) => {
                      const pct = parseFloat(v.percentvideoplay || 0) * 100;
                      return (
                        <tr key={v._id}>
                          <td style={tdStyle}>{v.coursename || v.courseid?.coursename || '-'}</td>
                          <td style={tdStyle}>{v.subcoursename || '-'}</td>
                          <td style={tdStyle}>{v.durationofvideo}</td>
                          <td style={tdStyle}>
                            <div style={progressStyle(pct)} title={`${pct.toFixed(1)}%`} />
                          </td>
                          <td style={tdStyle}>{v.devices}</td>
                          <td style={tdStyle}>{formatDate(v.lastseen)}</td>
                        </tr>
                      );
                    })}
                    {views.length === 0 && (
                      <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>No views</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {activeModal === 'notes' && (
        <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
          <div style={{ ...modalStyle, maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <span>Notes - {user.name}</span>
              <button style={closeButtonStyle} onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ padding: '16px', maxHeight: '60vh', overflow: 'auto' }}>
              {loadingData ? (
                <div style={{ textAlign: 'center', padding: '32px' }}><span className="spinner" /></div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Note</th>
                      <th style={thStyle}>Due Date</th>
                      <th style={thStyle}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map((n) => (
                      <tr key={n._id}>
                        <td style={tdStyle}>{n.body}</td>
                        <td style={tdStyle}>{formatDate(n.due_date)}</td>
                        <td style={tdStyle}>{formatDate(n.createdAt)}</td>
                      </tr>
                    ))}
                    {notes.length === 0 && (
                      <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>No notes</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
