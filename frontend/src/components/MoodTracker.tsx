import React, { useState } from 'react';
import { emotionService } from '../services/emotionService';

const MOODS = [
    { id: 'HAPPY', emoji: '😊', label: 'Happy' },
    { id: 'EXCITED', emoji: '🤩', label: 'Excited' },
    { id: 'CALM', emoji: '😌', label: 'Calm' },
    { id: 'FOCUSED', emoji: '🧠', label: 'Focused' },
    { id: 'TIRED', emoji: '😴', label: 'Tired' },
    { id: 'STRESSED', emoji: '😫', label: 'Stressed' },
    { id: 'ANXIOUS', emoji: '😰', label: 'Anxious' },
    { id: 'HUNGRY', emoji: '😡', label: 'Hangry' },
];

export default function MoodTracker() {
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [showRecs, setShowRecs] = useState(false);
    const [recommendations, setRecommendations] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleMoodSelect = async (moodId: string) => {
        setSelectedMood(moodId);
        setLoading(true);

        try {
            // 1. Log Mood
            await emotionService.logMood({ mood: moodId, intensity: 7, context: 'Dashboard Interaction' });

            // 2. Get Recommendations
            const recs = await emotionService.getRecommendations(moodId);
            setRecommendations(recs);
            setShowRecs(true);
        } catch (error) {
            console.error("Failed to process mood", error);
        } finally {
            setLoading(false);
        }
    };

    const closeRecs = () => {
        setShowRecs(false);
        setSelectedMood(null);
        setRecommendations(null);
    };

    if (showRecs && recommendations) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <h3>AI Welfare Assistant</h3>
                    <button onClick={closeRecs} style={styles.closeBtn}>✕</button>
                </div>

                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                        {MOODS.find(m => m.id === selectedMood)?.emoji}
                    </div>
                    <p>We noticed you are feeling <strong>{selectedMood?.toLowerCase()}</strong>.</p>

                    <div style={styles.suggestionBox}>
                        <h4>💡 AI Suggestion</h4>
                        <p>{recommendations.recommendationType === 'ENERGY_BOOST' ? '⚡ Boost your energy level' : '🧘 Take a moment for yourself'}</p>
                    </div>

                    <h4>Referred Menu Items:</h4>
                    <div style={styles.itemsGrid}>
                        {recommendations.items.map((item: any) => (
                            <div key={item.id} style={styles.itemCard}>
                                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{item.description?.substring(0, 50)}...</div>
                            </div>
                        ))}
                        {recommendations.items.length === 0 && <p>No specific food matches, just stay hydrated! 💧</p>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>How are you feeling today?</h3>
            <div style={styles.grid}>
                {MOODS.map(mood => (
                    <button
                        key={mood.id}
                        onClick={() => handleMoodSelect(mood.id)}
                        style={styles.moodBtn}
                        disabled={loading}
                    >
                        <span style={{ fontSize: '1.5rem' }}>{mood.emoji}</span>
                        <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>{mood.label}</span>
                    </button>
                ))}
            </div>
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <small style={{ color: '#888', fontSize: '0.7rem' }}>🔒 Your data is private & AI-processed securely.</small>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        background: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        maxWidth: '400px',
        margin: '1rem auto'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
    },
    title: {
        margin: '0 0 1rem 0',
        textAlign: 'center',
        fontSize: '1rem',
        color: '#333'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.5rem'
    },
    moodBtn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        border: '1px solid #eee',
        borderRadius: '8px',
        background: 'white',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    closeBtn: {
        border: 'none',
        background: 'none',
        fontSize: '1.2rem',
        cursor: 'pointer'
    },
    suggestionBox: {
        background: '#e3f2fd',
        padding: '1rem',
        borderRadius: '8px',
        margin: '1rem 0',
        color: '#1565c0'
    },
    itemsGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        textAlign: 'left'
    },
    itemCard: {
        padding: '0.5rem',
        border: '1px solid #eee',
        borderRadius: '6px'
    }
};
