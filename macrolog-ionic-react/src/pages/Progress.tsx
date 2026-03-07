import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonSpinner, IonIcon } from '@ionic/react';
import { flameOutline, trophyOutline, lockClosedOutline } from 'ionicons/icons';
import { StorageService } from '../services/storage';
import { UserSettings, Meal } from '../types';
import { getTotalsForDate, getLast7Days, getHealthRating, calculateStreak, formatDate } from '../utils/helpers';
import './Progress.css';

const ProgressPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [s, m] = await Promise.all([StorageService.getSettings(), StorageService.getMeals()]);
    setSettings(s); setMeals(m); setLoading(false);
  };

  const shift = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const isToday = (d: Date) => formatDate(d) === formatDate(new Date());

  const goals = settings?.daily_goals ?? { calories: 2000, protein: 150, carbs: 200, fat: 65 };
  const streak = calculateStreak(meals);
  const totals = getTotalsForDate(meals, selectedDate);
  const calPct = Math.min((totals.calories / goals.calories) * 100, 100);
  const last7 = getLast7Days();
  const maxCal = Math.max(...last7.map(d => getTotalsForDate(meals, d).calories), goals.calories, 1);

  const dateMain = isToday(selectedDate) ? 'Today'
    : selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dateSub = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

  const unlocked = settings?.achievements.filter(a => a.unlocked) ?? [];
  const locked   = settings?.achievements.filter(a => !a.unlocked) ?? [];

  if (loading) return (
    <IonPage><IonContent><div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IonSpinner /></div></IonContent></IonPage>
  );

  return (
    <IonPage>
      <IonContent fullscreen scrollY>
        <div className="p-safe" />

        {/* Header */}
        <div className="p-header">
          <h1 className="p-large-title">Progress</h1>

          {/* Date nav */}
          <div className="p-date-nav">
            <button className="p-date-btn" onClick={() => shift(-1)}>‹</button>
            <div className="p-date-center">
              <div className="p-date-main">{dateMain}</div>
              <div className="p-date-sub">{dateSub}</div>
            </div>
            <button className="p-date-btn" onClick={() => shift(1)} disabled={isToday(selectedDate)}>›</button>
          </div>
        </div>

        {/* Summary */}
        <div className="p-summary">
          <div className="p-summary-cal">{Math.round(totals.calories)}</div>
          <div className="p-summary-label">of {goals.calories} calories{totals.avgHealthScore > 0 ? ` · ${getHealthRating(totals.avgHealthScore)}` : ''}</div>
          <div className="p-progress-track">
            <div className="p-progress-fill" style={{ width: `${calPct}%` }} />
          </div>
          <div className="p-macro-strip">
            <div className="p-macro-cell">
              <div className="p-macro-cell-val" style={{ color: 'var(--protein-color)' }}>{Math.round(totals.protein)}g</div>
              <div className="p-macro-cell-name">Protein</div>
              <div className="p-macro-cell-goal">/ {goals.protein}g</div>
            </div>
            <div className="p-macro-cell">
              <div className="p-macro-cell-val" style={{ color: 'var(--carbs-color)' }}>{Math.round(totals.carbs)}g</div>
              <div className="p-macro-cell-name">Carbs</div>
              <div className="p-macro-cell-goal">/ {goals.carbs}g</div>
            </div>
            <div className="p-macro-cell">
              <div className="p-macro-cell-val" style={{ color: 'var(--fat-color)' }}>{Math.round(totals.fat)}g</div>
              <div className="p-macro-cell-name">Fat</div>
              <div className="p-macro-cell-goal">/ {goals.fat}g</div>
            </div>
          </div>
        </div>

        <div className="p-body">

          {/* Streaks */}
          <span className="p-section-title">Streaks</span>
          <div className="p-streak-row">
            <div className="p-streak-card">
              <div className="p-streak-icon-row">
                <IonIcon icon={flameOutline} className="p-streak-icon" style={{ color: 'var(--sys-orange)' }} />
                <span style={{ fontSize: 12, color: 'var(--label-2)', fontWeight: 500 }}>Current</span>
              </div>
              <div className="p-streak-num">{streak.currentStreak}</div>
              <div className="p-streak-label">day streak</div>
            </div>
            <div className="p-streak-card">
              <div className="p-streak-icon-row">
                <IonIcon icon={trophyOutline} className="p-streak-icon" style={{ color: 'var(--sys-blue)' }} />
                <span style={{ fontSize: 12, color: 'var(--label-2)', fontWeight: 500 }}>Best</span>
              </div>
              <div className="p-streak-num">{settings?.streak.longestStreak ?? 0}</div>
              <div className="p-streak-label">day record</div>
            </div>
          </div>

          {/* 7-day chart */}
          <span className="p-section-title">Last 7 Days</span>
          <div className="p-chart-card">
            <div className="p-chart-bars">
              {last7.map(day => {
                const dt = getTotalsForDate(meals, day);
                const pct = dt.calories > 0 ? (dt.calories / maxCal) * 100 : 0;
                const goalMet = dt.calories >= goals.calories * 0.9 && dt.calories <= goals.calories * 1.1;
                const isSel = formatDate(day) === formatDate(selectedDate);
                return (
                  <div
                    key={formatDate(day)}
                    className={`p-bar-col${isSel ? ' selected' : ''}`}
                    onClick={() => setSelectedDate(new Date(day))}
                  >
                    <div className="p-bar-track">
                      <div
                        className={`p-bar-fill${dt.calories === 0 ? ' empty' : goalMet ? ' goal-met' : ''}`}
                        style={{ height: dt.calories === 0 ? undefined : `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-chart-labels">
              {last7.map(day => {
                const isSel = formatDate(day) === formatDate(selectedDate);
                const lbl = isToday(day) ? 'Now' : day.toLocaleDateString('en-US', { weekday: 'narrow' });
                return (
                  <span key={formatDate(day)} className={`p-chart-label${isSel ? ' selected' : ''}`}>{lbl}</span>
                );
              })}
            </div>
          </div>

          {/* Achievements */}
          {unlocked.length > 0 && (
            <>
              <span className="p-section-title">Achievements</span>
              <div className="p-ach-grid" style={{ marginBottom: 24 }}>
                {unlocked.map(a => (
                  <div key={a.id} className="p-ach-card">
                    <div className="p-ach-emoji">{a.emoji}</div>
                    <div className="p-ach-name">{a.name}</div>
                    <div className="p-ach-desc">{a.description}</div>
                    {a.unlockedDate && <div className="p-ach-date">{new Date(a.unlockedDate).toLocaleDateString()}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {locked.length > 0 && (
            <>
              <span className="p-section-title" style={{ color: 'var(--label-2)' }}>Locked</span>
              <div className="p-ach-grid">
                {locked.map(a => (
                  <div key={a.id} className="p-ach-card locked">
                    <div className="p-ach-emoji"><IonIcon icon={lockClosedOutline} /></div>
                    <div className="p-ach-name">{a.name}</div>
                    <div className="p-ach-desc">{a.description}</div>
                    <div className="p-ach-date">{a.threshold} days</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-bottom-pad" />
      </IonContent>
    </IonPage>
  );
};

export default ProgressPage;
