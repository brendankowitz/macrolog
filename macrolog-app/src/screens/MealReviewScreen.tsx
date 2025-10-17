import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FoodItem, DailyGoals } from '../types';
import { getHealthScoreColor, getHealthRating, getHealthScoreEmoji } from '../utils/helpers';

interface Props {
  route: {
    params: {
      imageUri: string;
      foodItems: FoodItem[];
      dailyGoals: DailyGoals;
    };
  };
  navigation: any;
}

export default function MealReviewScreen({ route, navigation }: Props) {
  const { imageUri, foodItems: initialFoodItems, dailyGoals } = route.params;
  const [foodItems, setFoodItems] = useState<FoodItem[]>(initialFoodItems);

  const updateFoodItem = (id: string, field: keyof FoodItem, value: any) => {
    setFoodItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const toggleEdit = (id: string) => {
    setFoodItems(items =>
      items.map(item =>
        item.id === id ? { ...item, editable: !item.editable } : item
      )
    );
  };

  const removeFoodItem = (id: string) => {
    if (foodItems.length === 1) {
      Alert.alert('Cannot Remove', 'Meal must have at least one food item');
      return;
    }
    setFoodItems(items => items.filter(item => item.id !== id));
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Meal?',
      'Are you sure you want to discard this meal?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const handleConfirm = () => {
    navigation.navigate('MealSuccess', { imageUri, foodItems });
  };

  const getTotals = () => {
    return {
      calories: foodItems.reduce((sum, item) => sum + item.calories, 0),
      protein: foodItems.reduce((sum, item) => sum + item.protein, 0),
      carbs: foodItems.reduce((sum, item) => sum + item.carbs, 0),
      fat: foodItems.reduce((sum, item) => sum + item.fat, 0),
    };
  };

  const totals = getTotals();
  const avgHealthScore = Math.round(
    foodItems.reduce((sum, item) => sum + item.healthScore, 0) / foodItems.length
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Meal</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryCalories}>{totals.calories} cal</Text>
            </View>
            <View style={styles.healthScoreBox}>
              <Text style={styles.healthScoreLabel}>Health Score</Text>
              <View style={styles.healthScoreRow}>
                <Text style={styles.healthScoreEmoji}>{getHealthScoreEmoji(avgHealthScore)}</Text>
                <Text style={styles.healthScoreValue}>{avgHealthScore}</Text>
              </View>
            </View>
          </View>

          <View style={styles.macrosRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{totals.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{totals.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{totals.fat}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Food Items */}
        <Text style={styles.sectionTitle}>ITEMS</Text>
        {foodItems.map(item => (
          <View key={item.id} style={styles.foodCard}>
            <View style={styles.foodHeader}>
              <View style={styles.foodHeaderLeft}>
                {item.editable ? (
                  <TextInput
                    style={styles.foodNameInput}
                    value={item.name}
                    onChangeText={(text) => updateFoodItem(item.id, 'name', text)}
                    placeholder="Food name"
                  />
                ) : (
                  <View style={styles.foodNameRow}>
                    <Text style={styles.foodName}>{item.name}</Text>
                    <View
                      style={[
                        styles.healthBadge,
                        { backgroundColor: `${getHealthScoreColor(item.healthScore)}20` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.healthBadgeText,
                          { color: getHealthScoreColor(item.healthScore) },
                        ]}
                      >
                        {getHealthScoreEmoji(item.healthScore)} {item.healthScore}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Encouragement Message */}
                {!item.editable && item.encouragement && (
                  <View style={styles.encouragementBox}>
                    <Text style={styles.encouragementText}>{item.encouragement}</Text>
                  </View>
                )}

                {/* Amount */}
                <View style={styles.amountRow}>
                  {item.editable ? (
                    <>
                      <TextInput
                        style={styles.amountInput}
                        value={item.amount.toString()}
                        onChangeText={(text) =>
                          updateFoodItem(item.id, 'amount', parseFloat(text) || 0)
                        }
                        keyboardType="decimal-pad"
                        placeholder="0"
                      />
                      <TextInput
                        style={styles.unitInput}
                        value={item.unit}
                        onChangeText={(text) => updateFoodItem(item.id, 'unit', text)}
                        placeholder="unit"
                      />
                    </>
                  ) : (
                    <Text style={styles.amountText}>
                      {item.amount} {item.unit}
                    </Text>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => toggleEdit(item.id)}
                >
                  <Text style={styles.actionEmoji}>{item.editable ? '💾' : '✏️'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => removeFoodItem(item.id)}
                >
                  <Text style={styles.actionEmoji}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Nutrition Grid */}
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                {item.editable ? (
                  <TextInput
                    style={styles.nutritionInput}
                    value={item.calories.toString()}
                    onChangeText={(text) =>
                      updateFoodItem(item.id, 'calories', parseInt(text) || 0)
                    }
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.nutritionValue}>{item.calories}</Text>
                )}
                <Text style={styles.nutritionLabel}>cal</Text>
              </View>
              <View style={styles.nutritionItem}>
                {item.editable ? (
                  <TextInput
                    style={styles.nutritionInput}
                    value={item.protein.toString()}
                    onChangeText={(text) =>
                      updateFoodItem(item.id, 'protein', parseInt(text) || 0)
                    }
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.nutritionValue}>{item.protein}g</Text>
                )}
                <Text style={styles.nutritionLabel}>protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                {item.editable ? (
                  <TextInput
                    style={styles.nutritionInput}
                    value={item.carbs.toString()}
                    onChangeText={(text) =>
                      updateFoodItem(item.id, 'carbs', parseInt(text) || 0)
                    }
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.nutritionValue}>{item.carbs}g</Text>
                )}
                <Text style={styles.nutritionLabel}>carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                {item.editable ? (
                  <TextInput
                    style={styles.nutritionInput}
                    value={item.fat.toString()}
                    onChangeText={(text) =>
                      updateFoodItem(item.id, 'fat', parseInt(text) || 0)
                    }
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.nutritionValue}>{item.fat}g</Text>
                )}
                <Text style={styles.nutritionLabel}>fat</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>✓ Log Meal</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cancelButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  image: {
    width: '100%',
    height: 192,
    borderRadius: 16,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  summaryCalories: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  healthScoreBox: {
    alignItems: 'flex-end',
  },
  healthScoreLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  healthScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthScoreEmoji: {
    fontSize: 28,
  },
  healthScoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 12,
  },
  foodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  foodHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  foodNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  foodNameInput: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    paddingVertical: 4,
    marginBottom: 8,
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  healthBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  encouragementBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  encouragementText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountText: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountInput: {
    width: 60,
    fontSize: 14,
    color: '#111827',
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    paddingVertical: 2,
  },
  unitInput: {
    width: 80,
    fontSize: 14,
    color: '#111827',
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    paddingVertical: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  actionEmoji: {
    fontSize: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 2,
  },
  nutritionInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    borderBottomWidth: 1,
    borderBottomColor: '#3B82F6',
    textAlign: 'center',
    width: 60,
    paddingVertical: 2,
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
    paddingBottom: 32,
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
