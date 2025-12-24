import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/inbox', icon: '📥', label: 'Inbox' },
];

export function Sidebar() {
  const location = useLocation();

  const sidebarStyle = {
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 1200,
    height: '100vh',
    width: 'var(--sidebar-width, 260px)',
    background: 'linear-gradient(180deg, #1a1f2e 0%, #0f1419 100%)',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
  };

  const logoSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  };

  const logoBoxStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  };

  const navStyle = {
    flex: 1,
    padding: '16px 12px',
  };

  const menuLabelStyle = {
    padding: '8px 12px',
    display: 'block',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  };

  const getNavItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    marginBottom: '4px',
    borderRadius: '10px',
    position: 'relative',
    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
    color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
    fontWeight: isActive ? 600 : 500,
    fontSize: '14px',
    transition: 'all 0.2s',
    textDecoration: 'none',
  });

  const iconStyle = {
    fontSize: '18px',
  };

  const activeIndicatorStyle = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#818cf8',
    boxShadow: '0 0 8px #818cf8',
    marginLeft: 'auto',
  };

  const footerStyle = {
    padding: '16px',
    margin: '0 12px 12px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  };

  return (
    <aside style={sidebarStyle}>
      <div style={logoSectionStyle}>
        <div style={logoBoxStyle}>
          <img 
            src="/images/onfnewlogo.png" 
            alt="Onference" 
            style={{ height: '28px', width: 'auto', filter: 'brightness(1.1)' }} 
          />
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.01em' }}>
            Onference
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Support Hub
          </div>
        </div>
      </div>

      <nav style={navStyle}>
        <span style={menuLabelStyle}>Main Menu</span>
        <ul style={{ listStyle: 'none' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink to={item.path} style={getNavItemStyle(isActive)}>
                  <span style={iconStyle}>{item.icon}</span>
                  <span>{item.label}</span>
                  {isActive && <span style={activeIndicatorStyle} />}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div style={footerStyle}>
        <div style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '11px', marginBottom: '4px' }}>
          Need help?
        </div>
        <div style={{ color: '#818cf8', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>
          View Documentation →
        </div>
      </div>
    </aside>
  );
}
