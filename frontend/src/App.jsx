import { BrowserRouter as Router, Routes, Route, NavLink, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import PredictPage from './pages/PredictPage';
import BreedExplorerPage from './pages/BreedExplorerPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import './App.css';

function AppContent() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();

  return (
    <Router>
      <nav className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-brand">
            🐄 <span>CattleAI</span>
          </NavLink>
          <div className="nav-right">
            <ul className="nav-links">
              <li><NavLink to="/" end>Home</NavLink></li>
              <li><NavLink to="/predict">Predict</NavLink></li>
              <li><NavLink to="/breeds">Breeds</NavLink></li>
              <li><NavLink to="/about">About</NavLink></li>
              {isAuthenticated && isAdmin && (
                <li><NavLink to="/admin">Admin</NavLink></li>
              )}
            </ul>
            <div className="auth-links">
              {isAuthenticated ? (
                <div className="user-menu">
                  <span className="user-name">
                    👤 {user?.username}
                    {isAdmin && <span className="admin-badge">Admin</span>}
                  </span>
                  <button onClick={logout} className="btn-logout" title="Sign Out">
                    🚪
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn-login">Sign In</Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={
          <ProtectedRoute><HomePage /></ProtectedRoute>
        } />
        <Route path="/predict" element={
          <ProtectedRoute><PredictPage /></ProtectedRoute>
        } />
        <Route path="/breeds" element={
          <ProtectedRoute><BreedExplorerPage /></ProtectedRoute>
        } />
        <Route path="/about" element={
          <ProtectedRoute><AboutPage /></ProtectedRoute>
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <AdminPage />
          </ProtectedRoute>
        } />
      </Routes>

      <footer className="footer">
        <p>
          Built by <a href="https://www.linkedin.com/in/sajit9285/" target="_blank" rel="noreferrer">Vraj Patel</a>
          {' '} · Powered by PyTorch & FastAPI · {new Date().getFullYear()}
        </p>
      </footer>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

