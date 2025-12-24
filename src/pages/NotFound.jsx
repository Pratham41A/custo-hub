import { Link } from 'react-router-dom';

export default function NotFound() {
  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    textAlign: 'center',
    padding: '24px',
  };

  const iconStyle = {
    fontSize: '80px',
    marginBottom: '24px',
  };

  const titleStyle = {
    fontSize: '48px',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: '12px',
  };

  const messageStyle = {
    fontSize: '18px',
    color: '#64748b',
    marginBottom: '32px',
  };

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 28px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    textDecoration: 'none',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
    transition: 'all 0.2s',
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>🔍</div>
      <h1 style={titleStyle}>404</h1>
      <p style={messageStyle}>Oops! The page you're looking for doesn't exist.</p>
      <Link to="/" style={buttonStyle}>
        ← Back to Dashboard
      </Link>
    </div>
  );
}
