import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonSpinner, IonRefresher, IonRefresherContent, IonIcon } from '@ionic/react';
import { useHistory } from 'react-router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  flameOutline, cameraOutline, restaurantOutline,
  leafOutline, checkmarkCircleOutline, thumbsUpOutline, warningOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { StorageService } from '../services/storage';
import { OpenAIService } from '../services/openai';
import { Meal, UserSettings, FoodItem } from '../types';
import { formatTimeDisplay, getHealthScoreColor, getHealthRating, calculateStreak } from '../utils/helpers';
import MealReviewModal from '../components/MealReviewModal';
import DetailedLogModal from '../components/DetailedLogModal';
import './Home.css';

/* ── Health icon helper ──────────────────────────────────────────── */
const healthIcon = (s: number) =>
  s >= 90 ? leafOutline : s >= 70 ? checkmarkCircleOutline : s >= 50 ? thumbsUpOutline : warningOutline;

/* ── Activity Ring (Apple style) ─────────────────────────────────── */
const R = 76; // radius to centre of stroke
const SW = 18; // strokeWidth
const C = 2 * Math.PI * R;

const ActivityRing: React.FC<{ value: number; goal: number }> = ({ value, goal }) => {
  const pct = Math.min(value / Math.max(goal, 1), 1);
  const offset = C * (1 - pct);
  return (
    <div className="h-ring-container">
      <svg className="h-ring-svg" viewBox="0 0 200 200" width="180" height="180">
        {/* Track */}
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--cal-track)" strokeWidth={SW} />
        {/* Fill */}
        {value > 0 && (
          <circle
            cx="100" cy="100" r={R}
            fill="none"
            stroke="var(--cal-color)"
            strokeWidth={SW}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1)' }}
          />
        )}
      </svg>
      <div className="h-ring-inner">
        <span className="h-ring-cal">{Math.round(value)}</span>
        <span className="h-ring-of">of {goal}</span>
        <span className="h-ring-unit">kcal</span>
      </div>
    </div>
  );
};

/* ── Macro bar row ───────────────────────────────────────────────── */
const MacroRow: React.FC<{ label: string; value: number; goal: number; color: string; track: string }> = ({ label, value, goal, color, track }) => (
  <div className="h-macro-row">
    <div className="h-macro-dot" style={{ background: color }} />
    <span className="h-macro-label">{label}</span>
    <div className="h-macro-bar-track" style={{ background: track }}>
      <div className="h-macro-bar-fill" style={{ width: `${Math.min((value / Math.max(goal,1)) * 100, 100)}%`, background: color }} />
    </div>
    <span className="h-macro-value">{Math.round(value)}<span style={{ fontSize: 13, color: 'var(--label-3)' }}> / {goal}g</span></span>
  </div>
);

/* ── Greeting ────────────────────────────────────────────────────── */
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/* ── Page ────────────────────────────────────────────────────────── */
const HomePage: React.FC = () => {
  const history = useHistory(); // used by handleQuickPhoto / handleDetailedAnalyze for Settings redirect
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [detailedOpen, setDetailedOpen] = useState(false);
  const [pending, setPending] = useState<{ base64Images: string[]; foodItems: FoodItem[] } | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<import('../types').Meal | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [s, m] = await Promise.all([StorageService.getSettings(), StorageService.getMeals()]);
    setSettings(s); setMeals(m); setLoading(false);
  };

  const analyzeImages = async (base64Images: string[], notes?: string) => {
    const currentSettings = await StorageService.getSettings();
    if (!currentSettings?.openrouter_api_key) { alert('Add your OpenRouter API key in Settings.'); history.push('/tab3'); return; }
    const foodItems = await OpenAIService.analyzeMealPhoto(base64Images, currentSettings.openrouter_api_key!, currentSettings.daily_goals, currentSettings.analysis_mode ?? 'premium', notes);
    setPending({ base64Images, foodItems });
    setReviewOpen(true);
  };

  const handleQuickPhoto = async () => {
    const currentSettings = await StorageService.getSettings();
    if (!currentSettings?.openrouter_api_key) { alert('Add your OpenRouter API key in Settings.'); history.push('/tab3'); return; }
    setAnalyzing(true);
    try {
      const photo = await Camera.getPhoto({ quality: 70, allowEditing: false, resultType: CameraResultType.Base64, source: CameraSource.Prompt, width: 800 });
      if (!photo.base64String) throw new Error('No image captured');
      await analyzeImages([photo.base64String]);
    } catch (e: any) {
      if (e.message && !e.message.includes('User cancelled') && !e.message.includes('cancelled')) alert(e.message);
    } finally { setAnalyzing(false); }
  };

  const handleDetailedAnalyze = async (base64Images: string[], notes: string) => {
    setDetailedOpen(false);
    setAnalyzing(true);
    try {
      await analyzeImages(base64Images, notes);
    } catch (e: any) {
      alert(e.message);
    } finally { setAnalyzing(false); }
  };

  const handleSave = async (foodItems: FoodItem[], notes: string) => {
    if (!pending) return;
    const cal = foodItems.reduce((s, i) => s + i.calories, 0);
    const pro = foodItems.reduce((s, i) => s + i.protein, 0);
    const carb = foodItems.reduce((s, i) => s + i.carbs, 0);
    const fat = foodItems.reduce((s, i) => s + i.fat, 0);
    const score = Math.round(foodItems.reduce((s, i) => s + i.healthScore, 0) / foodItems.length);
    const meal: Meal = {
      id: `${Date.now()}`, timestamp: new Date().toISOString(),
      imageUri: `data:image/jpeg;base64,${pending.base64Images[0]}`,
      items: foodItems, totalCalories: cal, totalProtein: pro, totalCarbs: carb,
      totalFat: fat, healthScore: score, syncedToAppleHealth: false, notes: notes || undefined,
    };
    await StorageService.saveMeal(meal);
    const streak = calculateStreak([meal, ...meals]);
    await StorageService.updateStreak({ currentStreak: streak.currentStreak, longestStreak: Math.max(streak.currentStreak, settings!.streak.longestStreak), lastLoggedDate: new Date().toISOString().split('T')[0] });
    await load();
    setPending(null);
  };

  const handleMealSave = async (foodItems: FoodItem[], notes: string) => {
    if (!selectedMeal) return;
    await StorageService.updateMeal(selectedMeal.id, foodItems, notes);
    await load();
    setSelectedMeal(null);
  };

  const todayMeals = meals.filter(m => new Date(m.timestamp).toDateString() === new Date().toDateString());
  const tot = { cal: todayMeals.reduce((s, m) => s + m.totalCalories, 0), pro: todayMeals.reduce((s, m) => s + m.totalProtein, 0), carb: todayMeals.reduce((s, m) => s + m.totalCarbs, 0), fat: todayMeals.reduce((s, m) => s + m.totalFat, 0) };
  const g = settings?.daily_goals ?? { calories: 2000, protein: 150, carbs: 200, fat: 65 };
  const streak = calculateStreak(meals);
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) return (
    <IonPage><IonContent><div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IonSpinner /></div></IonContent></IonPage>
  );

  return (
    <IonPage>
      <IonContent fullscreen scrollY>
        <IonRefresher slot="fixed" onIonRefresh={async (e: any) => { await load(); e.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="h-safe" />

        {/* Header */}
        <div className="h-header">
          <div className="h-titles">
            <h1 className="h-large-title">Today</h1>
            <p className="h-date">{dateStr}</p>
          </div>
          {streak.currentStreak > 0 && (
            <div className="h-header-right">
              <span className="h-streak">
                <IonIcon icon={flameOutline} style={{ fontSize: 14 }} />
                {streak.currentStreak}
              </span>
            </div>
          )}
        </div>

        {/* Activity card */}
        <div className="h-activity">
          <div className="h-ring-wrap">
            <ActivityRing value={tot.cal} goal={g.calories} />
          </div>
          <div className="h-macros">
            <MacroRow label="Protein" value={tot.pro}  goal={g.protein} color="var(--protein-color)" track="var(--protein-track)" />
            <MacroRow label="Carbs"   value={tot.carb} goal={g.carbs}   color="var(--carbs-color)"   track="var(--carbs-track)" />
            <MacroRow label="Fat"     value={tot.fat}  goal={g.fat}     color="var(--fat-color)"     track="var(--fat-track)" />
          </div>
        </div>

        {/* Log buttons */}
        <div className="h-log-row">
          <button className="h-log-btn" onClick={handleQuickPhoto} disabled={analyzing}>
            {analyzing
              ? <><IonSpinner name="crescent" style={{ width: 18, height: 18 }} /> Analyzing…</>
              : <><IonIcon icon={cameraOutline} style={{ fontSize: 19 }} /> Quick Snap</>
            }
          </button>
          <button className="h-log-btn-secondary" onClick={() => setDetailedOpen(true)} disabled={analyzing}>
            <IonIcon icon={cameraOutline} style={{ fontSize: 17 }} /> Detailed
          </button>
        </div>

        {/* Meals */}
        <div className="h-section">
          <span className="h-section-title">
            {todayMeals.length > 0 ? "Today's Meals" : "Today's Meals"}
          </span>

          {todayMeals.length === 0 ? (
            <div className="h-empty">
              <div className="h-empty-icon"><IonIcon icon={restaurantOutline} /></div>
              <p className="h-empty-title">No meals logged</p>
              <p className="h-empty-sub">{greeting()} — tap Log a Meal to get started.</p>
            </div>
          ) : (
            <div className="h-meals-list">
              {todayMeals.map(meal => {
                const col = getHealthScoreColor(meal.healthScore);
                return (
                  <div key={meal.id} className="h-meal-row" onClick={() => setSelectedMeal(meal)} style={{ cursor: 'pointer' }}>
                    {meal.imageUri
                      ? <img src={meal.imageUri} alt="" className="h-meal-thumb" />
                      : <div className="h-meal-placeholder"><IonIcon icon={restaurantOutline} /></div>
                    }
                    <div className="h-meal-body">
                      <div className="h-meal-time">{formatTimeDisplay(new Date(meal.timestamp))}</div>
                      <div className="h-meal-cal">{Math.round(meal.totalCalories)}<span className="h-meal-cal-unit"> cal</span></div>
                      <div className="h-meal-macros">{Math.round(meal.totalProtein)}g protein · {Math.round(meal.totalCarbs)}g carbs · {Math.round(meal.totalFat)}g fat</div>
                      <span className="h-meal-badge" style={{ background: `${col}18`, color: col }}>
                        <IonIcon icon={healthIcon(meal.healthScore)} style={{ fontSize: 11 }} />
                        {getHealthRating(meal.healthScore)}
                      </span>
                    </div>
                    <IonIcon icon={chevronForwardOutline} className="h-meal-chevron" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-bottom-pad" />
      </IonContent>

      {pending && (
        <MealReviewModal
          isOpen={reviewOpen}
          foodItems={pending.foodItems}
          imageUri={`data:image/jpeg;base64,${pending.base64Images[0]}`}
          notes=""
          onClose={() => { setReviewOpen(false); setPending(null); }}
          onSave={handleSave}
        />
      )}

      <DetailedLogModal
        isOpen={detailedOpen}
        onClose={() => setDetailedOpen(false)}
        onAnalyze={handleDetailedAnalyze}
      />

      {selectedMeal && (
        <MealReviewModal
          isOpen={!!selectedMeal}
          foodItems={selectedMeal.items}
          imageUri={selectedMeal.imageUri}
          notes={selectedMeal.notes ?? ''}
          onClose={() => setSelectedMeal(null)}
          onSave={handleMealSave}
          onDelete={async () => { await StorageService.deleteMeal(selectedMeal.id); await load(); setSelectedMeal(null); }}
        />
      )}
    </IonPage>
  );
};

export default HomePage;
