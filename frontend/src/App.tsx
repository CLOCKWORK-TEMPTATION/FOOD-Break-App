import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import ProducerDashboard from './pages/ProducerDashboard';
import ArabicOrders from './pages/ArabicOrders';
import ArabicMenu from './pages/ArabicMenu';
import ArabicRestaurants from './pages/ArabicRestaurants';
import ErrorBoundary from './components/ErrorBoundary';
import { LocalizationProvider, LanguageToggle } from './components/LocalizedApp';
import './styles/arabic.css';

export default function App() {
  return (
    <LocalizationProvider>
      <ErrorBoundary>
        <div className="app">
          <LanguageToggle />
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/producer" replace />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/producer" element={<ProducerDashboard />} />
              <Route path="/arabic/orders" element={<ArabicOrders />} />
              <Route path="/arabic/menu" element={<ArabicMenu />} />
              <Route path="/arabic/restaurants" element={<ArabicRestaurants />} />
              {/* Add more routes as needed, e.g., Login */}
            </Routes>
          </Router>
        </div>
      </ErrorBoundary>
    </LocalizationProvider>
  );
}
