import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import ProducerDashboard from './pages/ProducerDashboard';
import './styles/arabic.css';

export default function App() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/producer" replace />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/producer" element={<ProducerDashboard />} />
        </Routes>
      </Router>
    </div>
  );
}
