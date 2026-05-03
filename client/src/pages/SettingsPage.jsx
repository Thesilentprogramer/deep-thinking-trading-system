import { Settings, Cpu, Globe, Database, Mail, Bell, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { api } from '../apiClient'
import { getToken } from 'firebase/messaging'
import { messaging } from '../firebase'

function SettingsPage() {
    const { user } = useAuth();
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            api.getNotificationSettings(user.uid)
                .then(settings => {
                    setEmailEnabled(settings.emailEnabled);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching settings:', err);
                    setLoading(false);
                });
        }
    }, [user]);

    const handleToggleEmail = async () => {
        setSaving(true);
        try {
            // Re-register with the new preference
            const token = await getToken(messaging, {
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
            });
            await api.registerFCMToken(user.uid, token, user.email, !emailEnabled);
            setEmailEnabled(!emailEnabled);
        } catch (err) {
            console.error('Error updating preference:', err);
            alert('Failed to update preference. Make sure Notification Server is running!');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h2 className="page-title">
                        <Settings size={20} />
                        Settings
                    </h2>
                    <p className="page-subtitle">Personalize your trading experience.</p>
                </div>
            </div>

            <div className="settings-section">
                <h3 className="section-title">System Info</h3>
                <div className="settings-grid">
                    <div className="settings-card">
                        <Cpu size={16} className="card-icon" />
                        <div className="settings-label">Deep Thinking Model</div>
                        <div className="settings-value">Llama 3.3 70B</div>
                    </div>

                    <div className="settings-card">
                        <Globe size={16} className="card-icon" />
                        <div className="settings-label">API Provider</div>
                        <div className="settings-value">NVIDIA NIM</div>
                    </div>

                    <div className="settings-card">
                        <Database size={16} className="card-icon" />
                        <div className="settings-label">Primary Data</div>
                        <div className="settings-value">Yahoo Finance, Alpha Vantage</div>
                    </div>
                </div>
            </div>

            <div className="settings-section" style={{ marginTop: '2.5rem' }}>
                <h3 className="section-title">Notifications</h3>
                <div className="settings-card notification-toggle-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                        <div className={`icon-circle ${emailEnabled ? 'active' : ''}`}>
                            <Mail size={18} />
                        </div>
                        <div>
                            <div className="settings-label">Email Reports</div>
                            <div className="settings-value" style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                Receive full PDF-style stock reports in your inbox.
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        className={`toggle-switch ${emailEnabled ? 'is-on' : ''}`}
                        onClick={handleToggleEmail}
                        disabled={loading || saving}
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : (
                            <div className="toggle-handle"></div>
                        )}
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .settings-section { margin-bottom: 2rem; }
                .section-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary); margin-bottom: 1rem; }
                .card-icon { margin-bottom: 0.75rem; opacity: 0.4; }
                .notification-toggle-card { 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    padding: 1.5rem;
                    background: var(--bg-secondary);
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                }
                .icon-circle { 
                    width: 40px; height: 40px; border-radius: 10px; 
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(255,255,255,0.05); color: var(--text-secondary);
                    transition: all 0.3s ease;
                }
                .icon-circle.active { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                
                .toggle-switch {
                    position: relative; width: 48px; height: 26px; border-radius: 13px;
                    background: #2d3748; border: none; cursor: pointer;
                    transition: background 0.3s ease; padding: 0;
                    display: flex; align-items: center;
                }
                .toggle-switch.is-on { background: #3b82f6; }
                .toggle-handle {
                    width: 20px; height: 20px; border-radius: 50%; background: white;
                    position: absolute; left: 3px; transition: transform 0.3s ease;
                }
                .toggle-switch.is-on .toggle-handle { transform: translateX(22px); }
                .toggle-switch:disabled { opacity: 0.5; cursor: not-allowed; }
                .animate-spin { animation: spin 1s linear infinite; margin: 0 auto; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}} />
        </div>
    )
}

export default SettingsPage
