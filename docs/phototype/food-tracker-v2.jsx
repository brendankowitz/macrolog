import React, { useState, useRef, useEffect } from 'react';
import { Camera, Check, X, Edit2, Save, Home, Settings, TrendingUp, Eye, EyeOff, Key, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FoodTracker() {
  const [activeTab, setActiveTab] = useState('home');
  const [screen, setScreen] = useState('home');
  const [selectedImage, setSelectedImage] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [loggedMeals, setLoggedMeals] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65
  });
  const fileInputRef = useRef(null);

  // Load API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setTempApiKey(savedKey);
    }
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', tempApiKey);
    setApiKey(tempApiKey);
  };

  // Simulated LLM response with health scores
  const simulateFoodAnalysis = () => {
    setScreen('analyzing');
    
    setTimeout(() => {
      setFoodItems([
        {
          id: 1,
          name: 'Grilled Chicken Breast',
          amount: 6,
          unit: 'oz',
          calories: 280,
          protein: 52,
          carbs: 0,
          fat: 6,
          editable: false,
          healthScore: 95,
          healthReason: 'Lean protein, nutrient-dense'
        },
        {
          id: 2,
          name: 'Brown Rice',
          amount: 1,
          unit: 'cup',
          calories: 215,
          protein: 5,
          carbs: 45,
          fat: 2,
          editable: false,
          healthScore: 80,
          healthReason: 'Whole grain, good fiber'
        },
        {
          id: 3,
          name: 'Steamed Broccoli',
          amount: 1.5,
          unit: 'cups',
          calories: 50,
          protein: 4,
          carbs: 10,
          fat: 0.5,
          editable: false,
          healthScore: 100,
          healthReason: 'Nutrient-rich vegetable'
        }
      ]);
      setScreen('confirm');
    }, 2000);
  };

  // Helper functions
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getMealsForDate = (date) => {
    const dateStr = formatDate(date);
    return loggedMeals.filter(meal => 
      formatDate(new Date(meal.timestamp)) === dateStr
    );
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const getTotalsForDate = (date) => {
    const meals = getMealsForDate(date);
    return {
      calories: meals.reduce((sum, meal) => sum + meal.totalCalories, 0),
      protein: meals.reduce((sum, meal) => sum + meal.totalProtein, 0),
      carbs: meals.reduce((sum, meal) => sum + meal.totalCarbs, 0),
      fat: meals.reduce((sum, meal) => sum + meal.totalFat, 0),
      meals: meals.length,
      avgHealthScore: meals.length > 0 
        ? Math.round(meals.reduce((sum, meal) => sum + (meal.healthScore || 0), 0) / meals.length)
        : 0
    };
  };

  const getHealthScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getHealthRating = (score) => {
    if (score >= 90) return 'Nutritious';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Limited';
  };

  const getHealthScoreEmoji = (score) => {
    if (score >= 90) return '🌟';
    if (score >= 70) return '✅';
    if (score >= 50) return '👍';
    return '⚠️';
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        simulateFoodAnalysis();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  const updateFoodItem = (id, field, value) => {
    setFoodItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const toggleEdit = (id) => {
    setFoodItems(items =>
      items.map(item =>
        item.id === id ? { ...item, editable: !item.editable } : item
      )
    );
  };

  const removeFoodItem = (id) => {
    setFoodItems(items => items.filter(item => item.id !== id));
  };

  const confirmAndLog = () => {
    const avgHealthScore = foodItems.reduce((sum, item) => sum + (item.healthScore || 70), 0) / foodItems.length;
    
    const meal = {
      id: Date.now(),
      timestamp: new Date(),
      image: selectedImage,
      items: foodItems,
      totalCalories: foodItems.reduce((sum, item) => sum + item.calories, 0),
      totalProtein: foodItems.reduce((sum, item) => sum + item.protein, 0),
      totalCarbs: foodItems.reduce((sum, item) => sum + item.carbs, 0),
      totalFat: foodItems.reduce((sum, item) => sum + item.fat, 0),
      healthScore: Math.round(avgHealthScore)
    };
    
    setLoggedMeals([meal, ...loggedMeals]);
    setScreen('success');
    
    setTimeout(() => {
      setScreen('home');
      setSelectedImage(null);
      setFoodItems([]);
    }, 2000);
  };

  const getTotals = () => {
    return {
      calories: foodItems.reduce((sum, item) => sum + item.calories, 0),
      protein: foodItems.reduce((sum, item) => sum + item.protein, 0),
      carbs: foodItems.reduce((sum, item) => sum + item.carbs, 0),
      fat: foodItems.reduce((sum, item) => sum + item.fat, 0)
    };
  };

  // Settings Screen
  if (activeTab === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-md mx-auto px-6 pt-14 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-6 pb-24">
          {/* API Key Section */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">OpenAI Configuration</h2>
            </div>
            
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Key size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">API Key</div>
                  <div className="text-xs text-gray-500">Required for food analysis</div>
                </div>
              </div>

              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                onClick={saveApiKey}
                disabled={!tempApiKey || tempApiKey === apiKey}
                className={`w-full mt-3 py-3 rounded-xl font-semibold text-sm transition-all ${
                  tempApiKey && tempApiKey !== apiKey
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Save API Key
              </button>

              {apiKey && (
                <div className="mt-3 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                  <Check size={14} />
                  <span>API key configured</span>
                </div>
              )}
            </div>
          </div>

          {/* Daily Goals Section */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Daily Goals</h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Calories</label>
                <input
                  type="number"
                  value={dailyGoals.calories}
                  onChange={(e) => setDailyGoals({...dailyGoals, calories: parseInt(e.target.value) || 0})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Protein (g)</label>
                  <input
                    type="number"
                    value={dailyGoals.protein}
                    onChange={(e) => setDailyGoals({...dailyGoals, protein: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Carbs (g)</label>
                  <input
                    type="number"
                    value={dailyGoals.carbs}
                    onChange={(e) => setDailyGoals({...dailyGoals, carbs: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Fat (g)</label>
                  <input
                    type="number"
                    value={dailyGoals.fat}
                    onChange={(e) => setDailyGoals({...dailyGoals, fat: parseInt(e.target.value) || 0})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <div className="text-sm text-gray-600 leading-relaxed">
              <p className="mb-2">Get your API key from OpenAI:</p>
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 font-medium"
              >
                platform.openai.com/api-keys →
              </a>
            </div>
          </div>

          {/* App Info */}
          <div className="text-center">
            <div className="text-6xl mb-3">🍽️</div>
            <div className="text-sm text-gray-500 mb-1">FoodTrack</div>
            <div className="text-xs text-gray-400">Version 1.0.0</div>
          </div>
        </div>

        <BottomTabBar activeTab={activeTab} setActiveTab={setActiveTab} setScreen={setScreen} />
      </div>
    );
  }

  // Progress Screen
  if (activeTab === 'progress') {
    const selectedDateMeals = getMealsForDate(selectedDate);
    const selectedDateTotals = getTotalsForDate(selectedDate);
    const todayTotals = getTotalsForDate(new Date());
    const last7Days = getLast7Days();
    const viewingToday = isToday(selectedDate);

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with Date Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-md mx-auto px-6 pt-14 pb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Progress</h1>
            
            {/* Date Navigation */}
            <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-3">
              <button
                onClick={() => changeDate(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-600 hover:bg-gray-100 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </div>
              </div>
              
              <button
                onClick={() => changeDate(1)}
                disabled={isToday(selectedDate)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                  isToday(selectedDate)
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-6 pb-24">
          {/* Today's Summary - Always shown at top if viewing today */}
          {viewingToday && (
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-lg p-6 mb-6 text-white">
              <div className="text-sm font-medium mb-2 opacity-90">Today's Total</div>
              <div className="flex items-end gap-2 mb-1">
                <div className="text-5xl font-bold">{todayTotals.calories}</div>
                <div className="text-lg opacity-75 pb-2">/ {dailyGoals.calories}</div>
              </div>
              <div className="text-sm opacity-90 mb-4">calories</div>
              
              {/* Progress Bar */}
              <div className="h-2 bg-white/20 rounded-full mb-6 overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((todayTotals.calories / dailyGoals.calories) * 100, 100)}%` }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
                <div>
                  <div className="text-2xl font-bold">{todayTotals.protein}g</div>
                  <div className="text-xs opacity-80">Protein</div>
                  <div className="text-xs opacity-60">Goal: {dailyGoals.protein}g</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{todayTotals.carbs}g</div>
                  <div className="text-xs opacity-80">Carbs</div>
                  <div className="text-xs opacity-60">Goal: {dailyGoals.carbs}g</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{todayTotals.fat}g</div>
                  <div className="text-xs opacity-80">Fat</div>
                  <div className="text-xs opacity-60">Goal: {dailyGoals.fat}g</div>
                </div>
              </div>

              {/* Health Rating */}
              {todayTotals.avgHealthScore > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs opacity-80 mb-1">Health Rating</div>
                      <div className="text-2xl font-bold">{getHealthRating(todayTotals.avgHealthScore)}</div>
                    </div>
                    <div className="text-4xl">{getHealthScoreEmoji(todayTotals.avgHealthScore)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected Date Summary - Only shown if NOT viewing today */}
          {!viewingToday && (
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-lg p-6 mb-6 text-white">
              <div className="text-sm font-medium mb-2 opacity-90">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </div>
              <div className="flex items-end gap-2 mb-1">
                <div className="text-5xl font-bold">{selectedDateTotals.calories}</div>
                <div className="text-lg opacity-75 pb-2">/ {dailyGoals.calories}</div>
              </div>
              <div className="text-sm opacity-90 mb-4">calories</div>
              
              {/* Progress Bar */}
              <div className="h-2 bg-white/20 rounded-full mb-6 overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((selectedDateTotals.calories / dailyGoals.calories) * 100, 100)}%` }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
                <div>
                  <div className="text-2xl font-bold">{selectedDateTotals.protein}g</div>
                  <div className="text-xs opacity-80">Protein</div>
                  <div className="text-xs opacity-60">Goal: {dailyGoals.protein}g</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{selectedDateTotals.carbs}g</div>
                  <div className="text-xs opacity-80">Carbs</div>
                  <div className="text-xs opacity-60">Goal: {dailyGoals.carbs}g</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{selectedDateTotals.fat}g</div>
                  <div className="text-xs opacity-80">Fat</div>
                  <div className="text-xs opacity-60">Goal: {dailyGoals.fat}g</div>
                </div>
              </div>

              {/* Health Rating */}
              {selectedDateTotals.avgHealthScore > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs opacity-80 mb-1">Health Rating</div>
                      <div className="text-2xl font-bold">{getHealthRating(selectedDateTotals.avgHealthScore)}</div>
                    </div>
                    <div className="text-4xl">{getHealthScoreEmoji(selectedDateTotals.avgHealthScore)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7-Day Overview */}
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Last 7 Days</h2>
            
            <div className="space-y-3">
              {last7Days.map((day) => {
                const dayTotals = getTotalsForDate(day);
                const goalMet = dayTotals.calories >= dailyGoals.calories * 0.9 && 
                                dayTotals.calories <= dailyGoals.calories * 1.1;
                const isSelectedDay = formatDate(day) === formatDate(selectedDate);
                
                return (
                  <button
                    key={formatDate(day)}
                    onClick={() => setSelectedDate(day)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      isSelectedDay 
                        ? 'bg-blue-50 border-2 border-blue-500' 
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="text-left">
                      <div className={`font-semibold ${isSelectedDay ? 'text-blue-600' : 'text-gray-900'}`}>
                        {isToday(day) ? 'Today' : day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {dayTotals.meals} meals
                        {dayTotals.avgHealthScore > 0 && (
                          <span className="ml-2 font-medium">
                            • {getHealthRating(dayTotals.avgHealthScore)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          goalMet ? 'text-green-600' : dayTotals.calories > 0 ? 'text-orange-600' : 'text-gray-400'
                        }`}>
                          {dayTotals.calories || '—'}
                        </div>
                        <div className="text-xs text-gray-500">
                          of {dailyGoals.calories}
                        </div>
                      </div>
                      
                      {dayTotals.calories > 0 && (
                        <div className="text-2xl">
                          {goalMet ? '✅' : '📊'}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Meals for Selected Date */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Meals {isToday(selectedDate) ? 'Today' : `on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </h2>
            
            {selectedDateMeals.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <div className="text-4xl mb-3">🍽️</div>
                <div className="text-gray-500">No meals logged</div>
                <div className="text-sm text-gray-400 mt-1">
                  {isToday(selectedDate) ? 'Tap the camera to get started' : 'No data for this date'}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateMeals.map(meal => (
                  <div key={meal.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex">
                      <img src={meal.image} alt="Meal" className="w-24 h-24 object-cover" />
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">{meal.items.length} items</span>
                              {meal.healthScore && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getHealthScoreColor(meal.healthScore)}`}>
                                  {getHealthRating(meal.healthScore)}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-blue-600">{meal.totalCalories}</div>
                            <div className="text-xs text-gray-500">cal</div>
                          </div>
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-gray-600">P: {meal.totalProtein}g</span>
                          <span className="text-gray-600">C: {meal.totalCarbs}g</span>
                          <span className="text-gray-600">F: {meal.totalFat}g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <BottomTabBar activeTab={activeTab} setActiveTab={setActiveTab} setScreen={setScreen} />
      </div>
    );
  }

  // Home Screen
  if (screen === 'home') {
    const todayTotals = getTotalsForDate(new Date());
    const todayMeals = getMealsForDate(new Date());
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-md mx-auto px-6 pt-14 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">FoodTrack</h1>
            <p className="text-sm text-gray-500 mt-1">Snap, analyze, track</p>
          </div>
        </div>

        <div className="max-w-md mx-auto px-6 py-6 pb-24">
          {!apiKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <div className="font-semibold text-amber-900 mb-1">API Key Required</div>
                <div className="text-sm text-amber-700">
                  Add your OpenAI API key in Settings to enable food analysis
                </div>
              </div>
            </div>
          )}

          {/* Camera Button */}
          <button
            onClick={handleCameraClick}
            disabled={!apiKey}
            className={`w-full rounded-3xl shadow-xl overflow-hidden mb-6 transition-all transform ${
              apiKey ? 'hover:scale-[1.02] active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-white">
              <div className="flex items-center justify-center gap-4">
                <Camera size={40} strokeWidth={2} />
                <div className="text-left">
                  <div className="text-2xl font-bold">Take Photo</div>
                  <div className="text-sm opacity-90">Analyze your meal</div>
                </div>
              </div>
            </div>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Quick Stats */}
          {todayMeals.length > 0 && (
            <>
              <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Today</div>
                  {todayTotals.avgHealthScore > 0 && (
                    <div className={`text-xs px-2 py-1 rounded-full font-semibold ${getHealthScoreColor(todayTotals.avgHealthScore)}`}>
                      {getHealthScoreEmoji(todayTotals.avgHealthScore)} {todayTotals.avgHealthScore}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="text-3xl font-bold text-blue-600">
                      {todayTotals.calories}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Calories</div>
                    <div className="text-xs text-gray-500">of {dailyGoals.calories}</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="text-3xl font-bold text-green-600">
                      {todayTotals.protein}g
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Protein</div>
                    <div className="text-xs text-gray-500">of {dailyGoals.protein}g</div>
                  </div>
                </div>
              </div>

              {/* Recent Meals */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-gray-900">Recent</h2>
                  <button 
                    onClick={() => setActiveTab('progress')}
                    className="text-sm text-blue-500 font-medium"
                  >
                    See all
                  </button>
                </div>
                
                <div className="space-y-3">
                  {todayMeals.slice(0, 3).map(meal => (
                    <div key={meal.id} className="bg-white rounded-2xl shadow-sm flex overflow-hidden">
                      <img src={meal.image} alt="Meal" className="w-20 h-20 object-cover" />
                      <div className="flex-1 p-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{meal.items.length} items</span>
                            {meal.healthScore && (
                              <span className="text-xs">{getHealthScoreEmoji(meal.healthScore)}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-blue-600">{meal.totalCalories}</div>
                          <div className="text-xs text-gray-500">cal</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {todayMeals.length === 0 && apiKey && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="text-5xl mb-4">📸</div>
              <div className="text-gray-900 font-semibold mb-2">Ready to start tracking</div>
              <div className="text-sm text-gray-500">
                Take a photo of your meal and let AI identify the nutrition
              </div>
            </div>
          )}
        </div>

        <BottomTabBar activeTab={activeTab} setActiveTab={setActiveTab} setScreen={setScreen} />
      </div>
    );
  }

  // Analyzing Screen
  if (screen === 'analyzing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-end">
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
        
        <div className="relative w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-2xl animate-slide-up">
          <div className="p-6">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            
            <img src={selectedImage} alt="Food" className="w-full h-64 object-cover rounded-2xl mb-6" />
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-pulse">
                <div className="text-3xl">🤖</div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing</h2>
              <p className="text-gray-500 mb-6">AI is identifying your meal and health score...</p>
              
              <div className="flex justify-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>

        <BottomTabBar activeTab={activeTab} setActiveTab={setActiveTab} setScreen={setScreen} />
      </div>
    );
  }

  // Confirmation Screen
  if (screen === 'confirm') {
    const totals = getTotals();
    const avgHealthScore = Math.round(foodItems.reduce((sum, item) => sum + (item.healthScore || 70), 0) / foodItems.length);
    
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-md mx-auto px-6 pt-14 pb-4 flex items-center justify-between">
            <button
              onClick={() => {
                setScreen('home');
                setSelectedImage(null);
                setFoodItems([]);
              }}
              className="text-blue-500 font-medium"
            >
              Cancel
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Review Meal</h1>
            <div className="w-16"></div>
          </div>
        </div>

        <div className="max-w-md mx-auto pb-32">
          <div className="px-6 py-4">
            <img src={selectedImage} alt="Food" className="w-full h-48 object-cover rounded-2xl shadow-sm" />
          </div>

          {/* Nutrition Summary Card with Health Score */}
          <div className="px-6 mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium opacity-90 mb-1">Total</div>
                  <div className="text-4xl font-bold">{totals.calories} cal</div>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-80 mb-1">Health Score</div>
                  <div className="flex items-center gap-2">
                    <div className="text-3xl">{getHealthScoreEmoji(avgHealthScore)}</div>
                    <div className="text-3xl font-bold">{avgHealthScore}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
                <div>
                  <div className="text-xl font-bold">{totals.protein}g</div>
                  <div className="text-xs opacity-80">Protein</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{totals.carbs}g</div>
                  <div className="text-xs opacity-80">Carbs</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{totals.fat}g</div>
                  <div className="text-xs opacity-80">Fat</div>
                </div>
              </div>
            </div>
          </div>

          {/* Food Items List with Health Scores */}
          <div className="px-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</h2>
            <div className="space-y-3">
              {foodItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {item.editable ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateFoodItem(item.id, 'name', e.target.value)}
                              className="font-semibold text-gray-900 border-b border-blue-500 outline-none w-full bg-transparent"
                            />
                          ) : (
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          )}
                          {item.healthScore && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getHealthScoreColor(item.healthScore)}`}>
                              {getHealthScoreEmoji(item.healthScore)} {item.healthScore}
                            </span>
                          )}
                        </div>
                        
                        {item.healthReason && !item.editable && (
                          <div className="text-xs text-gray-500 mb-2">{item.healthReason}</div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {item.editable ? (
                            <>
                              <input
                                type="number"
                                value={item.amount}
                                onChange={(e) => updateFoodItem(item.id, 'amount', parseFloat(e.target.value))}
                                className="w-16 text-sm border-b border-blue-500 outline-none bg-transparent"
                                step="0.1"
                              />
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => updateFoodItem(item.id, 'unit', e.target.value)}
                                className="w-20 text-sm border-b border-blue-500 outline-none bg-transparent"
                              />
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">{item.amount} {item.unit}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-3">
                        <button
                          onClick={() => toggleEdit(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100"
                        >
                          {item.editable ? <Save size={16} /> : <Edit2 size={16} />}
                        </button>
                        <button
                          onClick={() => removeFoodItem(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
                      <div className="text-center">
                        {item.editable ? (
                          <input
                            type="number"
                            value={item.calories}
                            onChange={(e) => updateFoodItem(item.id, 'calories', parseInt(e.target.value))}
                            className="w-full text-center text-sm border-b border-blue-500 outline-none font-semibold text-blue-600 bg-transparent"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-blue-600">{item.calories}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5">cal</div>
                      </div>
                      <div className="text-center">
                        {item.editable ? (
                          <input
                            type="number"
                            value={item.protein}
                            onChange={(e) => updateFoodItem(item.id, 'protein', parseInt(e.target.value))}
                            className="w-full text-center text-sm border-b border-blue-500 outline-none font-semibold text-green-600 bg-transparent"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-green-600">{item.protein}g</div>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5">protein</div>
                      </div>
                      <div className="text-center">
                        {item.editable ? (
                          <input
                            type="number"
                            value={item.carbs}
                            onChange={(e) => updateFoodItem(item.id, 'carbs', parseInt(e.target.value))}
                            className="w-full text-center text-sm border-b border-blue-500 outline-none font-semibold text-orange-600 bg-transparent"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-orange-600">{item.carbs}g</div>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5">carbs</div>
                      </div>
                      <div className="text-center">
                        {item.editable ? (
                          <input
                            type="number"
                            value={item.fat}
                            onChange={(e) => updateFoodItem(item.id, 'fat', parseInt(e.target.value))}
                            className="w-full text-center text-sm border-b border-blue-500 outline-none font-semibold text-purple-600 bg-transparent"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-purple-600">{item.fat}g</div>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5">fat</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
          <div className="max-w-md mx-auto p-4 pb-6">
            <button
              onClick={confirmAndLog}
              className="w-full bg-blue-500 text-white rounded-2xl py-4 font-semibold hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Log Meal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success Screen
  if (screen === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
            <Check size={40} className="text-green-600" strokeWidth={3} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Logged!</h2>
          <p className="text-gray-500 mb-6">Your meal has been saved</p>
          
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
            <div className="text-4xl font-bold mb-1">
              {getTotals().calories}
            </div>
            <div className="text-sm opacity-90">calories added</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Bottom Tab Bar Component
function BottomTabBar({ activeTab, setActiveTab, setScreen }) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'progress', icon: TrendingUp, label: 'Progress' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="max-w-md mx-auto flex justify-around py-2 pb-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setScreen('home');
              }}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
                isActive 
                  ? 'text-blue-500' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
