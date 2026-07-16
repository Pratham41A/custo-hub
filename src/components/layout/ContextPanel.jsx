import { useCallback, useRef, useState } from 'react';
import { useGlobalStore } from '../../store/globalStore';
import { formatDateIST } from '../../utils/timezoneUtils';
import { PaginationControls } from '../PaginationControls';

// Backward compatibility wrapper - uses the new utility function
const formatDate = (date) => formatDateIST(date);

export function ContextPanel({ inbox, onClose }) {
  const subscriptions = useGlobalStore(state => state.subscriptions);
  const payments = useGlobalStore(state => state.payments);
  const views = useGlobalStore(state => state.views);
  const notes = useGlobalStore(state => state.notes);
  const fetchUserSubscriptions = useGlobalStore(state => state.fetchUserSubscriptions);
  const fetchUserPayments = useGlobalStore(state => state.fetchUserPayments);
  const fetchUserViews = useGlobalStore(state => state.fetchUserViews);
  const fetchUserActivities = useGlobalStore(state => state.fetchUserActivities);
  const resolutionsByInbox = useGlobalStore(state => state.resolutionsByInbox);
  const fetchResolutions = useGlobalStore(state => state.fetchResolutions);
  const [activeModal, setActiveModal] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [modalError, setModalError] = useState('');
  const loadingMoreRef = useRef(false);
  const [paginationState, setPaginationState] = useState({
    subscription: { page: 1, limit: 10, totalCount: 0, totalPages: 1, hasMore: false },
    payment: { page: 1, limit: 10, totalCount: 0, totalPages: 1, hasMore: false },
    view: { page: 1, limit: 10, totalCount: 0, totalPages: 1, hasMore: false },
    notes: { page: 1, limit: 10, totalCount: 0, totalPages: 1, hasMore: false },
    resolutions: { page: 1, limit: 10, totalCount: 0, totalPages: 1, hasMore: false },
  });

  if (!inbox) return null;

  const user = inbox.owner || inbox.dummyOwner || {};
  const userId = user._id || inbox.owner?._id || inbox.dummyOwner?._id;
  const inboxId = inbox._id;
  const isOwner = !!inbox.owner;
  
  // Get display name - prioritize fullname, then name
  const getDisplayName = () => user.fullname || user.name || 'Unknown User';

  // Get user info fields to display
  const getUserInfoFields = () => {
    const fields = [];
    
    if (isOwner) {
      // For Owner: email, fullname, mobileno, registeredFrom, interest, usercountry
      if (user.email) fields.push({ label: 'Email', value: user.email, icon: '📧' });
      if (user.fullname) fields.push({ label: 'Full Name', value: user.fullname, icon: '👤' });
      if (user.mobile || user.mobileno) fields.push({ label: 'Mobile No.', value: user.mobile || user.mobileno, icon: '📱' });
      if (user.registeredfrom || user.registeredFrom || user.registeryFrom) fields.push({ label: 'Registered From', value: user.registeredfrom || user.registeredFrom || user.registeryFrom, icon: '🌐' });
      if (user.usercountry || user.user_country || user.country) fields.push({ label: 'Country', value: user.usercountry || user.user_country || user.country, icon: '🌍' });
      if (user.interest && Array.isArray(user.interest) && user.interest.length > 0) {
        const interests = user.interest.map(i => i.interests || i).join(', ');
        fields.push({ label: 'Interests', value: interests, icon: '⭐' });
      }
    } else {
      // For DummyOwner: name, email, mobileno
      if (user.name) fields.push({ label: 'Name', value: user.name, icon: '👤' });
      if (user.email) fields.push({ label: 'Email', value: user.email, icon: '📧' });
      if (user.mobile || user.mobileno) fields.push({ label: 'Mobile No.', value: user.mobile || user.mobileno, icon: '📱' });
    }
    
    return fields;
  };

  const loadDataForModal = useCallback(async (type, page = 1, limit = 10, append = false) => {
    if (!userId || (append && (loadingData || loadingMoreRef.current))) return;
    loadingMoreRef.current = append;
    setLoadingData(true);
    setModalError('');
    try {
      let result;
      if (type === 'subscription') result = await fetchUserSubscriptions(userId, { page, limit, append });
      if (type === 'payment') result = await fetchUserPayments(userId, { page, limit, append });
      if (type === 'view') result = await fetchUserViews(userId, { page, limit, append });
      if (type === 'notes') result = await fetchUserActivities(inboxId, { page, limit, append });
      if (type === 'resolutions') {
        const shouldUseCached = !append && page === 1 && Array.isArray(resolutionsByInbox?.[inboxId]) && resolutionsByInbox[inboxId].length > 0;
        const response = shouldUseCached
          ? { data: resolutionsByInbox[inboxId], pagination: { page: 1, limit, totalCount: resolutionsByInbox[inboxId].length, totalPages: 1, hasMore: false } }
          : await fetchResolutions(inboxId, { page, limit, append });
        result = response;
      }
      const paginationMeta = result?.pagination || { page, limit, totalCount: 0, totalPages: 1, hasMore: false };
      const resolvedMeta = {
        ...paginationMeta,
        page: Number(paginationMeta.page) || page,
        limit: Number(paginationMeta.limit) || limit,
        totalCount: Number(paginationMeta.totalCount) || 0,
        totalPages: Number(paginationMeta.totalPages) || 1,
        hasMore: Boolean(paginationMeta.hasMore),
      };
      setPaginationState((prev) => ({ ...prev, [type]: { ...prev[type], ...resolvedMeta } }));
    } catch (error) {
      setModalError(error?.message || 'Failed to load data');
      setPaginationState((prev) => ({ ...prev, [type]: { ...prev[type], page, limit, totalCount: 0, totalPages: 1, hasMore: false } }));
    } finally {
      setLoadingData(false);
      loadingMoreRef.current = false;
    }
  }, [fetchUserActivities, fetchUserPayments, fetchUserSubscriptions, fetchUserViews, inboxId, loadingData, resolutionsByInbox, userId, fetchResolutions]);

  const handleOpenModal = (type) => {
    setActiveModal(type);
    loadDataForModal(type, 1, 10, false);
  };

  const handleModalScroll = (type, event) => {
    const node = event.currentTarget;
    const currentState = paginationState[type] || { page: 1, limit: 10, hasMore: false };
    if (!node || loadingData || !currentState?.hasMore) return;
    const nearBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 160;
    if (nearBottom) {
      const nextPage = (currentState?.page || 1) + 1;
      const shouldLoad = currentState?.page < 999 && currentState?.limit > 0;
      if (!shouldLoad) return;
      console.log('[context-panel][load-more]', { type, currentPage: currentState?.page, nextPage, hasMore: currentState?.hasMore, limit: currentState?.limit });
      loadDataForModal(type, nextPage, currentState?.limit || 10, true);
    }
  };

  const dataItems = [
    { key: 'subscription', label: 'Subscriptions' },
    { key: 'payment', label: 'Payments' },
    { key: 'view', label: 'Views' },
    { key: 'notes', label: 'Notes' },
    { key: 'resolutions', label: 'Resolutions' },
  ];

  const getSectionItems = (type) => {
    if (type === 'subscription') return Array.isArray(subscriptions) ? subscriptions : [];
    if (type === 'payment') return Array.isArray(payments) ? payments : [];
    if (type === 'view') return Array.isArray(views) ? views : [];
    if (type === 'notes') return Array.isArray(notes) ? notes : [];
    if (type === 'resolutions') return Array.isArray(resolutionsByInbox?.[inboxId]) ? resolutionsByInbox[inboxId] : [];
    return [];
  };

  const getSectionPagination = (type) => paginationState[type] || { page: 1, limit: 10, totalCount: 0, totalPages: 1, hasMore: false };

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
    justifyContent: 'flex-end',
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
    fontSize: '12px',
    fontWeight: 500,
  };

  const badgeStyle = {
    padding: '4px 10px',
    borderRadius: '6px',
    background: '#6366f1',
    color: '#fff',
    fontSize: '10px',
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
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
  };

  const modalHeaderStyle = {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    fontSize: '16px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const tableStyle = {
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
  };

  const thStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#64748b',
    background: '#f8fafc',
    borderBottom: '2px solid rgba(0,0,0,0.06)',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  };

  const tdStyle = {
    padding: '14px 16px',
    fontSize: '12px',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  };

  const initials = (user.fullname || user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <>
      <aside style={panelStyle}>
        <div style={headerStyle}>
          <button style={closeButtonStyle} onClick={onClose}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={avatarStyle}>{initials}</div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>{getDisplayName()}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {isOwner ? 'Owner' : 'Guest'}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            {getUserInfoFields().map((field, idx) => (
              <div key={idx} style={infoRowStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {field.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#1e293b', marginTop: '2px', wordBreak: 'break-word' }}>
                    {field.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '12px' }}>
              Data
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {dataItems.map((item) => (
                <button key={item.key} style={dataButtonStyle} onClick={() => handleOpenModal(item.key)}>
                  <span>{item.label}</span>
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
              <span>Subscriptions - {getDisplayName()} ({getSectionPagination('subscription').totalCount || getSectionItems('subscription').length})</span>
              <button style={closeButtonStyle} onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ padding: '16px', maxHeight: '60vh', overflow: 'auto' }} onScroll={(event) => handleModalScroll('subscription', event)}>
              {loadingData && getSectionItems('subscription').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px' }}><span className="spinner" /></div>
              ) : modalError ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#ef4444', fontSize: '13px' }}>{modalError}</div>
              ) : (
                <>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Package</th>
                        <th style={thStyle}>Duration</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>End Date</th>
                        <th style={thStyle}>Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSectionItems('subscription').map((sub) => {
                        const duration = sub.packageId?.subscriptionDurationWeb || '-';
                        return (
                          <tr key={sub._id}>
                            <td style={tdStyle}>{sub.packageId?.packageName || '-'}</td>
                            <td style={tdStyle}>{duration} months</td>
                            <td style={tdStyle}>{sub.currencytype} {sub.amountpaid || 0}</td>
                            <td style={tdStyle}>
                              <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: sub.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: sub.status === 'active' ? '#10b981' : '#ef4444', textTransform: 'capitalize' }}>
                                {sub.status}
                              </span>
                            </td>
                            <td style={tdStyle}>{formatDate(sub.endDate)}</td>
                            <td style={tdStyle}>{sub.paymentmethod || '-'}</td>
                          </tr>
                        );
                      })}
                      {getSectionItems('subscription').length === 0 && (
                        <tr><td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>No subscriptions</td></tr>
                      )}
                    </tbody>
                  </table>
                  <PaginationControls
                    currentPage={getSectionPagination('subscription').page}
                    totalPages={getSectionPagination('subscription').totalPages}
                    totalCount={getSectionPagination('subscription').totalCount}
                    isLoading={loadingData}
                    label="subscriptions"
                    hasMore={getSectionPagination('subscription').hasMore}
                  />
                </>
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
              <span>Payments - {getDisplayName()} ({getSectionPagination('payment').totalCount || getSectionItems('payment').length})</span>
              <button style={closeButtonStyle} onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ padding: '16px', maxHeight: '60vh', overflow: 'auto' }} onScroll={(event) => handleModalScroll('payment', event)}>
              {loadingData && getSectionItems('payment').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px' }}><span className="spinner" /></div>
              ) : modalError ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#ef4444', fontSize: '13px' }}>{modalError}</div>
              ) : (
                <>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Course</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Payment Method</th>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Coupon</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSectionItems('payment').map((p) => (
                        <tr key={p._id}>
                          <td style={tdStyle}>{p.coursename || p.courseid?.coursename || '-'}</td>
                          <td style={tdStyle}>{p.currencytype} {p.amountpaid || 0}</td>
                          <td style={tdStyle}>{p.paymentmethod || '-'}</td>
                          <td style={tdStyle}>{formatDate(p.whenentered)}</td>
                          <td style={tdStyle}>{p.couponcode || '-'}</td>
                        </tr>
                      ))}
                      {getSectionItems('payment').length === 0 && (
                        <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>No payments</td></tr>
                      )}
                    </tbody>
                  </table>
                  <PaginationControls
                    currentPage={getSectionPagination('payment').page}
                    totalPages={getSectionPagination('payment').totalPages}
                    totalCount={getSectionPagination('payment').totalCount}
                    isLoading={loadingData}
                    label="payments"
                    hasMore={getSectionPagination('payment').hasMore}
                  />
                </>
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
              <span>Views - {getDisplayName()} ({getSectionPagination('view').totalCount || getSectionItems('view').length})</span>
              <button style={closeButtonStyle} onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ padding: '16px', maxHeight: '60vh', overflow: 'auto' }} onScroll={(event) => handleModalScroll('view', event)}>
              {loadingData && getSectionItems('view').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px' }}><span className="spinner" /></div>
              ) : modalError ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#ef4444', fontSize: '13px' }}>{modalError}</div>
              ) : (
                <>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Course</th>
                        <th style={thStyle}>Sub Course</th>
                        <th style={thStyle}>Views</th>
                        <th style={thStyle}>Video Duration</th>
                        <th style={thStyle}>Progress %</th>
                        <th style={thStyle}>Device</th>
                        <th style={thStyle}>Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSectionItems('view').map((v) => {
                        const rawVal = v?.percentvideoplay;
                        const parsed = rawVal != null && rawVal !== '' ? Number(rawVal) : NaN;
                        const pct = !isNaN(parsed) ? parsed : null;
                        return (
                          <tr key={v._id}>
                            <td style={tdStyle}>{v.courseid?.coursename || '-'}</td>
                            <td style={tdStyle}>{v.subcourseid?.name || '-'}</td>
                            <td style={tdStyle}>{v.courseid?.views || '0'}</td>
                            <td style={tdStyle}>{v.durationofvideo || '-'}</td>
                            <td style={tdStyle}>{pct != null ? `${pct.toFixed(2)}%` : '-'}</td>
                            <td style={tdStyle}>{v.devices || '-'}</td>
                            <td style={tdStyle}>{formatDate(v.lastseen)}</td>
                          </tr>
                        );
                      })}
                      {getSectionItems('view').length === 0 && (
                        <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>No views</td></tr>
                      )}
                    </tbody>
                  </table>
                  <PaginationControls
                    currentPage={getSectionPagination('view').page}
                    totalPages={getSectionPagination('view').totalPages}
                    totalCount={getSectionPagination('view').totalCount}
                    isLoading={loadingData}
                    label="views"
                    hasMore={getSectionPagination('view').hasMore}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {activeModal === 'notes' && (
        <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
          <div style={{ ...modalStyle, maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <span>Notes - {getDisplayName()} ({getSectionPagination('notes').totalCount || getSectionItems('notes').length})</span>
              <button style={closeButtonStyle} onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ padding: '16px', maxHeight: '60vh', overflow: 'auto' }} onScroll={(event) => handleModalScroll('notes', event)}>
              {loadingData && getSectionItems('notes').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px' }}><span className="spinner" /></div>
              ) : modalError ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#ef4444', fontSize: '13px' }}>{modalError}</div>
              ) : (
                <>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Note</th>
                        <th style={thStyle}>Due Date</th>
                        <th style={thStyle}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSectionItems('notes').map((n) => (
                        <tr key={n._id}>
                          <td style={tdStyle}>{n.body}</td>
                          <td style={tdStyle}>{formatDate(n.dueDate)}</td>
                          <td style={tdStyle}>{formatDate(n.createdAt)}</td>
                        </tr>
                      ))}
                      {getSectionItems('notes').length === 0 && (
                        <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>No notes</td></tr>
                      )}
                    </tbody>
                  </table>
                  <PaginationControls
                    currentPage={getSectionPagination('notes').page}
                    totalPages={getSectionPagination('notes').totalPages}
                    totalCount={getSectionPagination('notes').totalCount}
                    isLoading={loadingData}
                    label="notes"
                    hasMore={getSectionPagination('notes').hasMore}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resolutions Modal */}
      {activeModal === 'resolutions' && (
        <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
          <div style={{ ...modalStyle, maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <span>Resolutions - {getDisplayName()} ({getSectionPagination('resolutions').totalCount || getSectionItems('resolutions').length})</span>
              <button style={closeButtonStyle} onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ padding: '16px', maxHeight: '60vh', overflow: 'auto' }} onScroll={(event) => handleModalScroll('resolutions', event)}>
              {loadingData && getSectionItems('resolutions').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px' }}><span className="spinner" /></div>
              ) : modalError ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#ef4444', fontSize: '13px' }}>{modalError}</div>
              ) : (
                <>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Query Type</th>
                        <th style={thStyle}>Resolved By</th>
                        <th style={thStyle}>Source</th>
                        <th style={thStyle}>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getSectionItems('resolutions').map((r) => (
                        <tr key={r._id}>
                          <td style={tdStyle}>{r.queryType || '-'}</td>
                          <td style={tdStyle}>{r.resolvedBy || '-'}</td>
                          <td style={tdStyle}>{r.source || '-'}</td>
                          <td style={tdStyle}>{formatDate(r.createdAt)}</td>
                        </tr>
                      ))}
                      {getSectionItems('resolutions').length === 0 && (
                        <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>No resolutions</td></tr>
                      )}
                    </tbody>
                  </table>
                  <PaginationControls
                    currentPage={getSectionPagination('resolutions').page}
                    totalPages={getSectionPagination('resolutions').totalPages}
                    totalCount={getSectionPagination('resolutions').totalCount}
                    isLoading={loadingData}
                    label="resolutions"
                    hasMore={getSectionPagination('resolutions').hasMore}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
