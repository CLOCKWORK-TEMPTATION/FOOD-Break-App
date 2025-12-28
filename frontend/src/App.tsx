import { useState } from 'react';
import AdminDashboard from './pages/AdminDashboard';
import ProducerDashboard from './pages/ProducerDashboard';

export default function App() {
    // Simple route state: 'admin' | 'producer'
    const [currentView, setCurrentView] = useState<'admin' | 'producer'>('producer');

    return (
        <div>
            {/* Navigation Switcher (Temporary for Demo) */}
            <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 9999, display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => setCurrentView('admin')}
                    style={{
                        padding: '10px 20px',
                        background: currentView === 'admin' ? '#e94560' : '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                >
                    Admin View
                </button>
                <button
                    onClick={() => setCurrentView('producer')}
                    style={{
                        padding: '10px 20px',
                        background: currentView === 'producer' ? '#e94560' : '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                >
                    Producer View
                </button>
            </div>

            {currentView === 'admin' ? <AdminDashboard /> : <ProducerDashboard />}
        </div>
    );
}
