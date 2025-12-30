/**
 * Producer Dashboard (لوحة تحكم الإنتاج)
 * Features:
 * - Production Schedule Management (Sync with Shooting Schedule)
 * - Budget & Cost Analytics
 * - Attendance Integration
 * - Comprehensive Reports
 */

import { useState, useEffect } from 'react';
import styles from './ProducerDashboard.module.css';
import MoodTracker from '../components/MoodTracker';
import { productionService } from '../services/productionService';

// --- Types ---

interface ShootingDay {
  id: string;
  date: string; // YYYY-MM-DD
  dayNumber: number;
  startTime: string;
  endTime: string;
  location: string;
  status: 'SCHEDULED' | 'SHOOTING' | 'COMPLETED' | 'CANCELLED' | 'OFF_DAY' | 'MOVED';
  scenes: string[]; // Scene numbers
}

interface CrewMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  checkInTime?: string;
}

interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  projected: number;
}

// --- State Management ---

export default function ProducerDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'budget' | 'attendance'>('overview');
  const [schedule, setSchedule] = useState<ShootingDay[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [budget, setBudget] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showExportOptions, setShowExportOptions] = useState(false);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [scheduleData, crewData, budgetData] = await Promise.all([
          productionService.getSchedule(),
          productionService.getCrew(),
          productionService.getBudget()
        ]);
        setSchedule(scheduleData);
        setCrew(crewData);
        setBudget(budgetData);
      } catch (err: any) {
        setError(err.message || 'فشل تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Helpers ---

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'present';
      case 'ABSENT': return 'absent';
      case 'LATE': return 'late';
      default: return 'excused';
    }
  };

  const calculateBudgetHealth = (category: BudgetCategory) => {
    const percentage = (category.spent / category.allocated) * 100;
    if (percentage > 90) return 'critical';
    if (percentage > 75) return 'warning';
    return 'good';
  };

  // --- Handlers ---

  const handleDragSchedule = () => {
    alert('Feature: Drag & Drop Schedule adjustment triggers automatic notification to Catering & Crew.');
    // Simulated logic:
    // 1. Update ShootingDay date
    // 2. Notify Crew (via NotificationSystem)
    // 3. Update Order delivery times
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    alert(`Generating ${format.toUpperCase()} report...`);
    setShowExportOptions(false);
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#333' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>جاري التحميل...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ color: '#f44336' }}>خطأ: {error}</div>
          <button onClick={() => window.location.reload()}>إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>🎬 Production Control</h1>
          <div className={styles.userSection}>
            <span style={{ fontSize: '0.9rem', color: '#ccc' }}>Project: Desert Rose (Day 12/45)</span>
            <button className={styles.actionBtn}>⚙️</button>
            <img src="https://via.placeholder.com/40" alt="Producer" className={styles.profileImg} />
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <button className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`} onClick={() => setActiveTab('overview')}>
            📊 Overview
          </button>
          <button className={`${styles.navItem} ${activeTab === 'schedule' ? styles.active : ''}`} onClick={() => setActiveTab('schedule')}>
            📅 Schedule
          </button>
          <button className={`${styles.navItem} ${activeTab === 'budget' ? styles.active : ''}`} onClick={() => setActiveTab('budget')}>
            💰 Budget & Analytics
          </button>
          <button className={`${styles.navItem} ${activeTab === 'attendance' ? styles.active : ''}`} onClick={() => setActiveTab('attendance')}>
            👥 Crew & Attendance
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className={styles.main}>
        {activeTab === 'overview' && (
          <div className={styles.grid}>
            {/* Key Metrics */}
            <div className={styles.statCard} style={{ background: '#fff' }}>
              <div className={styles.statIcon} style={{ background: '#e3f2fd', color: '#1976d2' }}>📉</div>
              <div className={styles.statInfo}>
                <h3>Total Spent</h3>
                <p>287,000 SR <span className={`${styles.trend} ${styles.up}`}>+2.4%</span></p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#e8f5e9', color: '#2e7d32' }}>🎬</div>
              <div className={styles.statInfo}>
                <h3>Schedule Adherence</h3>
                <p>94% <span className={`${styles.trend} ${styles.up}`}>On Track</span></p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#fff3e0', color: '#ef6c00' }}>⚠️</div>
              <div className={styles.statInfo}>
                <h3>Pending Breaks</h3>
                <p>12 <span className={styles.trend}>Orders</span></p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: '#ffebee', color: '#c62828' }}>🤒</div>
              <div className={styles.statInfo}>
                <h3>Absences</h3>
                <p>1 <span className={`${styles.trend} ${styles.down}`}>Critical</span></p>
              </div>
            </div>

            {/* Quick Chart */}
            <div className={`${styles.card} ${styles.chartSection}`}>
              <div className={styles.sectionHeader}>
                <h2>Daily Spending vs Forecast</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select className={styles.filterSelect}><option>This Week</option></select>
                </div>
              </div>
              <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '20px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
                {/* CSS Bar Chart Simulation */}
                {[65, 78, 45, 90, 82, 55, 70].map((h, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '100%', height: '100%', background: '#f5f5f5', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${h}%`, background: i === 3 ? '#ff7043' : '#5c6bc0', transition: 'height 0.5s' }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Day {i + 10}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Schedule Preview */}
            <div className={`${styles.card} ${styles.sideSection}`}>
              <MoodTracker />
              <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h3>Today's Call Sheet</h3>
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Call Time</span>
                    <strong>06:00 AM</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Lunch Break</span>
                    <strong>12:30 PM</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>First Meal Order</span>
                    <span style={{ color: '#4CAF50' }}>Confirmed (85 pax)</span>
                  </div>
                  <hr style={{ margin: '1rem 0', borderColor: '#eee' }} />
                  <h4>Scenes</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={styles.statusBadge} style={{ background: '#eee' }}>INT. OFFICE - DAY</span>
                    <span className={styles.statusBadge} style={{ background: '#eee' }}>EXT. PARK - DAY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

            {activeTab === 'schedule' && (
              <div className={styles.card}>
                <div className={styles.sectionHeader}>
                  <h2>Shooting Schedule (Sync Enabled)</h2>
                  <div>
                    <button className={styles.actionBtn} style={{ background: '#1a1a2e', fontSize: '0.9rem', width: 'auto', borderRadius: '4px' }} onClick={handleDragSchedule}>
                      🔄 Sync with StudioBinder
                    </button>
                  </div>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Day #</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Location</th>
                        <th>Scenes</th>
                        <th>Status</th>
                        <th>Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map(day => (
                        <tr key={day.id}>
                          <td>Day {day.dayNumber || '-'}</td>
                          <td>{day.date}</td>
                          <td>{day.startTime} - {day.endTime}</td>
                          <td>{day.location}</td>
                          <td>{day.scenes.join(', ')}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${day.status.toLowerCase()}`}>
                              {day.status}
                            </span>
                          </td>
                          <td>
                            {day.status === 'SHOOTING' ?
                              <span style={{ color: '#2e7d32' }}>Ready (12:30)</span> :
                              day.status === 'OFF_DAY' ?
                                '-' :
                                <span style={{ color: '#1976d2' }}>Scheduled</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '2rem', padding: '1rem', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #bbdefb' }}>
                  <strong>Feature #25 - Auto-Adjust Logic:</strong>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                    If "Shooting" extends past 6 hours without a break, the system automatically alerts the producer and pushes the "Lunch Delivery" time notification to the Catering partner.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'budget' && (
              <div className={styles.grid}>
                <div className={`${styles.card} ${styles.chartSection}`} style={{ gridColumn: 'span 12' }}>
                  <div className={styles.sectionHeader}>
                    <h2>Financial Intelligence & Forecasting</h2>
                    <div style={{ position: 'relative' }}>
                      <button className={styles.exportBtn} onClick={() => setShowExportOptions(!showExportOptions)}>
                        📥 Export Report
                      </button>
                      {showExportOptions && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '0.5rem', zIndex: 10, minWidth: '150px' }}>
                          <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => handleExport('pdf')}>PDF Report</button>
                          <button style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => handleExport('excel')}>Excel Data</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Category</th>
                          <th>Allocated</th>
                          <th>Spent</th>
                          <th>Utilization</th>
                          <th>Projected</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budget.map((cat, i) => {
                          const util = (cat.spent / cat.allocated) * 100;
                          const health = calculateBudgetHealth(cat);
                          return (
                            <tr key={i}>
                              <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{cat.name}</td>
                              <td>{cat.allocated.toLocaleString()} SR</td>
                              <td>{cat.spent.toLocaleString()} SR</td>
                              <td>
                                <div style={{ width: '100px', height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(util, 100)}%`, height: '100%', background: health === 'critical' ? '#d32f2f' : health === 'warning' ? '#f57c00' : '#4caf50' }}></div>
                                </div>
                                <span style={{ fontSize: '0.75rem' }}>{util.toFixed(1)}%</span>
                              </td>
                              <td>{cat.projected.toLocaleString()} SR</td>
                              <td>
                                {cat.projected > cat.allocated ?
                                  <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>Over Budget</span> :
                                  <span style={{ color: '#4caf50' }}>On Track</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className={styles.grid}>
                <div className={`${styles.card} ${styles.sideSection}`} style={{ height: 'fit-content' }}>
                  <h3>Attendance Summary</h3>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '8px solid #4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>85%</div>
                      <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Present</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '8px solid #F44336', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>5%</div>
                      <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Absent</p>
                    </div>
                  </div>
                </div>

                <div className={`${styles.card} ${styles.chartSection}`} style={{ height: 'auto' }}>
                  <div className={styles.sectionHeader}>
                    <h2>Crew List & Check-in</h2>
                    <div className={styles.filterControls}>
                      <input type="text" placeholder="Search crew..." className={styles.filterSelect} style={{ width: '200px' }} />
                    </div>
                  </div>

                  <div className={styles.crewList}>
                    {crew.map(member => (
                      <div key={member.id} className={styles.crewMember}>
                        <div className={styles.memberInfo}>
                          <div className={styles.memberAvatar}>{member.avatar}</div>
                          <div>
                            <strong>{member.name}</strong>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{member.role}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                          {member.checkInTime && (
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#888' }}>Check-in</span>
                              <strong>{member.checkInTime}</strong>
                            </div>
                          )}
                          <div className={styles.attendanceStatus}>
                            <span className={`${styles.dot} ${styles.dot}${getAttendanceColor(member.status)}`} style={{ background: member.status === 'PRESENT' ? '#4CAF50' : member.status === 'ABSENT' ? '#F44336' : member.status === 'LATE' ? '#FF9800' : '#999' }}></span>
                            <span>{member.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '2rem', padding: '1rem', background: '#fff3e0', borderRadius: '8px', border: '1px solid #ffe0b2' }}>
                    <strong>Feature #26 - Attendance Integration:</strong>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                      System automatically detected 1 absent crew member ("Laila - Makeup").
                      <button style={{ marginLeft: '10px', padding: '4px 8px', cursor: 'pointer' }} onClick={() => alert('Order #1234 cancelled for Laila')}>Auto-cancel her meal order?</button>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
    </div>
  );
}
