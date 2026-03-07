import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonPage, IonSpinner, IonIcon } from '@ionic/react';
import {
  eyeOutline, eyeOffOutline, checkmarkCircle, restaurantOutline,
  keyOutline, trashOutline, chevronForwardOutline, sparklesOutline,
  moonOutline,
} from 'ionicons/icons';
import { StorageService } from '../services/storage';
import { OpenAIService } from '../services/openai';
import { UserSettings, DailyGoals } from '../types';
import { applyTheme } from '../App';
import './Settings.css';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [goals, setGoals] = useState<DailyGoals>({ calories: 2000, protein: 150, carbs: 200, fat: 65 });
  const [analysisMode, setAnalysisMode] = useState<'premium' | 'free'>('premium');
  const [appearance, setAppearance] = useState<'system' | 'light' | 'dark'>('system');
  const [toast, setToast] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 2500);
  };

  const load = async () => {
    try {
      const s = await StorageService.getSettings();
      setSettings(s);
      setApiKey(s.openrouter_api_key || '');
      setGoals(s.daily_goals);
      setAnalysisMode(s.analysis_mode ?? 'premium');
      setAppearance(s.appearance ?? 'system');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveKey = async () => {
    if (!apiKey.trim()) { showToast('Enter a key first'); return; }
    setBusy(true);
    try {
      await StorageService.updateApiKey(apiKey.trim());
      showToast('Key saved');
      await load();
    } catch { showToast('Failed to save'); }
    finally { setBusy(false); }
  };

  const validateKey = async () => {
    if (!apiKey.trim()) { showToast('Enter a key first'); return; }
    setBusy(true);
    try {
      const ok = await OpenAIService.validateApiKey(apiKey.trim());
      showToast(ok ? 'Key is valid' : 'Key is invalid');
    } catch { showToast('Error checking key'); }
    finally { setBusy(false); }
  };

  const saveGoals = async () => {
    setBusy(true);
    try {
      await StorageService.updateDailyGoals(goals);
      showToast('Goals updated');
      await load();
    } catch { showToast('Failed to save'); }
    finally { setBusy(false); }
  };

  const changeAnalysisMode = async (mode: 'premium' | 'free') => {
    setAnalysisMode(mode);
    await StorageService.updateAnalysisMode(mode);
  };

  const changeAppearance = async (val: 'system' | 'light' | 'dark') => {
    setAppearance(val);
    applyTheme(val);
    await StorageService.updateAppearance(val);
  };

  const clearData = async () => {
    if (!window.confirm('Delete all meal data? This cannot be undone.')) return;
    try { await StorageService.clearAll(); showToast('All data cleared'); await load(); }
    catch { showToast('Error clearing data'); }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen scrollY>
        <div className="s-safe" />

        <div className="s-header">
          <h1 className="s-large-title">Settings</h1>
        </div>

        <div className="s-body">

          {/* OpenRouter API */}
          <div className="s-section">
            <div className="s-section-header">OpenRouter API</div>
            <div className="s-group">

              {/* Key status row */}
              <div className="s-row">
                <div className="s-row-icon" style={{ background: '#34C759' }}>
                  <IonIcon icon={keyOutline} />
                </div>
                <span className="s-row-label">API Key</span>
                {settings?.openrouter_api_key ? (
                  <span className="s-key-badge">
                    <IonIcon icon={checkmarkCircle} />
                    Configured
                  </span>
                ) : (
                  <span className="s-row-value">Not set</span>
                )}
              </div>

              {/* Key input */}
              <div className="s-row s-input-row">
                <div className="s-input-label">OpenRouter Key</div>
                <div className="s-input-wrap">
                  <input
                    className={`s-input s-input-mono`}
                    type={showKey ? 'text' : 'password'}
                    placeholder="sk-or-v1-..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    style={{ paddingRight: 42 }}
                  />
                  <button className="s-eye-btn" type="button" onClick={() => setShowKey(v => !v)}>
                    <IonIcon icon={showKey ? eyeOffOutline : eyeOutline} style={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Save / Validate buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button
                className="s-btn s-btn-blue"
                style={{ flex: 1 }}
                onClick={saveKey}
                disabled={busy || !apiKey.trim()}
              >
                {busy ? <IonSpinner name="crescent" style={{ width: 18, height: 18 }} /> : 'Save Key'}
              </button>
              <button
                className="s-btn"
                style={{ flex: 1, background: 'var(--bg-card)', color: 'var(--sys-blue)' }}
                onClick={validateKey}
                disabled={busy || !apiKey.trim()}
              >
                Validate
              </button>
            </div>

            <div style={{ padding: '8px 4px 0' }}>
              <a
                className="s-link"
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get your key at openrouter.ai/keys
              </a>
            </div>
          </div>

          {/* Analysis Quality */}
          <div className="s-section">
            <div className="s-section-header">Analysis Quality</div>
            <div className="s-group">
              <div className="s-row" style={{ cursor: 'pointer' }} onClick={() => changeAnalysisMode('premium')}>
                <div className="s-row-icon" style={{ background: 'var(--sys-purple)' }}>
                  <IonIcon icon={sparklesOutline} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="s-row-label">Premium</div>
                  <div style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 1 }}>qwen3.5-flash · Best accuracy</div>
                </div>
                {analysisMode === 'premium' && (
                  <IonIcon icon={checkmarkCircle} style={{ color: 'var(--sys-blue)', fontSize: 20 }} />
                )}
              </div>
              <div className="s-row" style={{ cursor: 'pointer' }} onClick={() => changeAnalysisMode('free')}>
                <div className="s-row-icon" style={{ background: 'var(--sys-green)' }}>
                  <IonIcon icon={sparklesOutline} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="s-row-label">Free</div>
                  <div style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 1 }}>openrouter/auto:free · No cost</div>
                </div>
                {analysisMode === 'free' && (
                  <IonIcon icon={checkmarkCircle} style={{ color: 'var(--sys-blue)', fontSize: 20 }} />
                )}
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="s-section">
            <div className="s-section-header">Appearance</div>
            <div className="s-group">
              <div className="s-row" style={{ cursor: 'pointer' }} onClick={() => changeAppearance('system')}>
                <div className="s-row-icon" style={{ background: 'var(--sys-indigo, #5856D6)' }}>
                  <IonIcon icon={moonOutline} />
                </div>
                <span className="s-row-label">System</span>
                {appearance === 'system' && (
                  <IonIcon icon={checkmarkCircle} style={{ color: 'var(--sys-blue)', fontSize: 20 }} />
                )}
              </div>
              <div className="s-row" style={{ cursor: 'pointer' }} onClick={() => changeAppearance('light')}>
                <div className="s-row-icon" style={{ background: 'var(--sys-orange)' }}>
                  <IonIcon icon={moonOutline} />
                </div>
                <span className="s-row-label">Light</span>
                {appearance === 'light' && (
                  <IonIcon icon={checkmarkCircle} style={{ color: 'var(--sys-blue)', fontSize: 20 }} />
                )}
              </div>
              <div className="s-row" style={{ cursor: 'pointer' }} onClick={() => changeAppearance('dark')}>
                <div className="s-row-icon" style={{ background: 'var(--label-2)' }}>
                  <IonIcon icon={moonOutline} />
                </div>
                <span className="s-row-label">Dark</span>
                {appearance === 'dark' && (
                  <IonIcon icon={checkmarkCircle} style={{ color: 'var(--sys-blue)', fontSize: 20 }} />
                )}
              </div>
            </div>
          </div>

          {/* Daily Goals */}
          <div className="s-section">
            <div className="s-section-header">Daily Nutrition Goals</div>
            <div className="s-group">

              <div className="s-row s-input-row">
                <div className="s-input-label">Calories (kcal)</div>
                <input
                  className="s-input"
                  type="number"
                  value={goals.calories}
                  onChange={e => setGoals({ ...goals, calories: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="s-goals-grid">
                {(['protein', 'carbs', 'fat'] as const).map(key => (
                  <div key={key} className="s-row s-input-row">
                    <div className="s-input-label" style={{ textTransform: 'capitalize' }}>{key} (g)</div>
                    <input
                      className="s-input"
                      type="number"
                      value={goals[key]}
                      onChange={e => setGoals({ ...goals, [key]: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                ))}
              </div>

            </div>

            <button
              className="s-btn s-btn-blue"
              style={{ marginTop: 10 }}
              onClick={saveGoals}
              disabled={busy}
            >
              {busy ? <IonSpinner name="crescent" style={{ width: 18, height: 18 }} /> : 'Save Goals'}
            </button>
          </div>

          {/* Data */}
          <div className="s-section">
            <div className="s-section-header">Data</div>
            <div className="s-group">
              <div className="s-row" style={{ cursor: 'pointer' }} onClick={clearData}>
                <div className="s-row-icon" style={{ background: 'var(--sys-red, #FF3B30)' }}>
                  <IonIcon icon={trashOutline} />
                </div>
                <span className="s-row-label" style={{ color: 'var(--sys-red, #FF3B30)' }}>Clear All Data</span>
                <IonIcon icon={chevronForwardOutline} className="s-row-chevron" />
              </div>
            </div>
          </div>

          {/* About */}
          <div className="s-footer">
            <div className="s-footer-icon">
              <IonIcon icon={restaurantOutline} />
            </div>
            <div className="s-footer-name">MacroLog</div>
            <div className="s-footer-version">Version 1.0 · Powered by OpenRouter</div>
          </div>

        </div>

        <div className="s-bottom-pad" />

        {toast && <div className="s-toast">{toast}</div>}
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
