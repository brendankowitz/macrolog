import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonIcon,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { camera, settingsSharp } from 'ionicons/icons';
import { useHistory } from 'react-router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { StorageService } from '../services/storage';
import { OpenAIService } from '../services/openai';
import { Meal, UserSettings } from '../types';
import {
  getTotalsForDate,
  formatTimeDisplay,
  getHealthScoreEmoji,
  calculateStreak,
  getDayName,
} from '../utils/helpers';
import { convertImageToBase64, compressImage } from '../utils/imageUtils';
import './Home.css';

const HomePage: React.FC = () => {
  const history = useHistory();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedSettings, loadedMeals] = await Promise.all([
        StorageService.getSettings(),
        StorageService.getMeals(),
      ]);
      setSettings(loadedSettings);
      setMeals(loadedMeals);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: any) => {
    await loadData();
    event.detail.complete();
  };

  const handleTakePhoto = async () => {
    if (!settings?.openai_api_key) {
      alert('Please add your OpenAI API key in Settings to enable food analysis.');
      history.push('/tab3');
      return;
    }

    setAnalyzing(true);
    try {
      // Use Capacitor Camera plugin to take a photo
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt, // Allow user to choose camera or photo library
      });

      if (!photo.base64String) {
        throw new Error('No photo captured');
      }

      const base64Image = photo.base64String;

      // Analyze with OpenAI
      const foodItems = await OpenAIService.analyzeMealPhoto(
        base64Image,
        settings.openai_api_key!,
        settings.daily_goals
      );

      // Create meal object
      const totals = {
        calories: foodItems.reduce((sum, item) => sum + item.calories, 0),
        protein: foodItems.reduce((sum, item) => sum + item.protein, 0),
        carbs: foodItems.reduce((sum, item) => sum + item.carbs, 0),
        fat: foodItems.reduce((sum, item) => sum + item.fat, 0),
      };

      const avgHealthScore = Math.round(
        foodItems.reduce((sum, item) => sum + item.healthScore, 0) / foodItems.length
      );

      const meal: Meal = {
        id: `${Date.now()}`,
        timestamp: new Date().toISOString(),
        imageUri: `data:image/jpeg;base64,${base64Image}`,
        items: foodItems,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        healthScore: avgHealthScore,
        syncedToAppleHealth: false,
      };

      // Save meal
      await StorageService.saveMeal(meal);

      // Update streak
      const streakData = calculateStreak([meal, ...meals]);
      await StorageService.updateStreak({
        currentStreak: streakData.currentStreak,
        longestStreak: Math.max(
          streakData.currentStreak,
          settings.streak.longestStreak
        ),
        lastLoggedDate: new Date().toISOString().split('T')[0],
      });

      // Reload data
      await loadData();
      alert('Meal analyzed and saved!');
    } catch (error: any) {
      console.error('Error analyzing meal:', error);
      // Only show alert if it's not a user cancellation
      if (error.message && !error.message.includes('User cancelled')) {
        alert(`Error: ${error.message}`);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const todaysMeals = meals.filter((meal) => {
    const mealDate = new Date(meal.timestamp).toDateString();
    const today = new Date().toDateString();
    return mealDate === today;
  });

  const todaysTotals = {
    calories: todaysMeals.reduce((sum, meal) => sum + meal.totalCalories, 0),
    protein: todaysMeals.reduce((sum, meal) => sum + meal.totalProtein, 0),
    carbs: todaysMeals.reduce((sum, meal) => sum + meal.totalCarbs, 0),
    fat: todaysMeals.reduce((sum, meal) => sum + meal.totalFat, 0),
  };

  const streakData = calculateStreak(meals);

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>MacroLog</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>MacroLog</IonTitle>
          <IonButton slot="end" fill="clear" onClick={() => history.push('/tab3')}>
            <IonIcon icon={settingsSharp} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Today's Summary */}
        <div className="home-header">
          <h1>Today's Nutrition</h1>
          <div className="today-streak">
            <span className="streak-badge">🔥 {streakData.currentStreak} day streak</span>
          </div>
        </div>

        {/* Macros Grid */}
        <IonGrid className="macros-grid">
          <IonRow>
            <IonCol size="6" sizeMd="3">
              <IonCard>
                <IonCardContent className="macro-card">
                  <div className="macro-label">Calories</div>
                  <div className="macro-value">{Math.round(todaysTotals.calories)}</div>
                  <div className="macro-goal">Goal: {settings?.daily_goals.calories}</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard>
                <IonCardContent className="macro-card">
                  <div className="macro-label">Protein</div>
                  <div className="macro-value">{Math.round(todaysTotals.protein)}g</div>
                  <div className="macro-goal">Goal: {settings?.daily_goals.protein}g</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard>
                <IonCardContent className="macro-card">
                  <div className="macro-label">Carbs</div>
                  <div className="macro-value">{Math.round(todaysTotals.carbs)}g</div>
                  <div className="macro-goal">Goal: {settings?.daily_goals.carbs}g</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard>
                <IonCardContent className="macro-card">
                  <div className="macro-label">Fat</div>
                  <div className="macro-value">{Math.round(todaysTotals.fat)}g</div>
                  <div className="macro-goal">Goal: {settings?.daily_goals.fat}g</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Add Meal Button */}
        <div className="fab-container">
          <IonButton
            expand="block"
            color="primary"
            onClick={handleTakePhoto}
            disabled={analyzing}
            className="add-meal-button"
          >
            {analyzing ? (
              <>
                <IonSpinner name="crescent" /> Analyzing...
              </>
            ) : (
              <>
                <IonIcon icon={camera} slot="start" />
                Log Meal
              </>
            )}
          </IonButton>
        </div>

        {/* Today's Meals */}
        <div className="meals-section">
          <h2>Today's Meals</h2>
          {todaysMeals.length === 0 ? (
            <IonCard>
              <IonCardContent>
                <IonText color="medium">No meals logged yet</IonText>
              </IonCardContent>
            </IonCard>
          ) : (
            todaysMeals.map((meal) => (
              <IonCard key={meal.id} className="meal-card">
                <IonCardContent>
                  <div className="meal-header">
                    <div>
                      <h3>{formatTimeDisplay(new Date(meal.timestamp))}</h3>
                      <p className="meal-items-count">{meal.items.length} items</p>
                    </div>
                    <div className="health-score">
                      <span className="health-emoji">{getHealthScoreEmoji(meal.healthScore)}</span>
                      <span className="health-number">{meal.healthScore}</span>
                    </div>
                  </div>
                  <div className="meal-stats">
                    <span>{meal.totalCalories} cal</span>
                    <span>{meal.totalProtein}g protein</span>
                  </div>
                </IonCardContent>
              </IonCard>
            ))
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
