import { Sidebar } from './Sidebar';
import Toast from '../Toast';

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
  },
  main: {
    flexGrow: 1,
    marginLeft: 'var(--sidebar-width, 260px)',
    minHeight: '100vh',
    position: 'relative',
  },
};

export function MainLayout({ children }) {
  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.main}>
        {children}
      </main>
      <Toast />
    </div>
  );
}
