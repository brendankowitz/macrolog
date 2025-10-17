import AppleHealthKit, {
  HealthKitPermissions,
  HealthInputOptions,
} from 'react-native-health';
import { Platform } from 'react-native';
import { Meal } from '../types';

// HealthKit permissions we need
const permissions: HealthKitPermissions = {
  permissions: {
    read: [],
    write: [
      AppleHealthKit.Constants.Permissions.DietaryEnergyConsumed,
      AppleHealthKit.Constants.Permissions.DietaryProtein,
      AppleHealthKit.Constants.Permissions.DietaryCarbohydrates,
      AppleHealthKit.Constants.Permissions.DietaryFatTotal,
    ],
  },
};

export const HealthKitService = {
  /**
   * Check if HealthKit is available on this device
   */
  isAvailable(): boolean {
    if (Platform.OS !== 'ios') {
      return false;
    }
    return AppleHealthKit.isAvailable();
  },

  /**
   * Request HealthKit permissions from the user
   * Returns true if granted, false if denied or unavailable
   */
  async requestPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isAvailable()) {
        resolve(false);
        return;
      }

      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error('HealthKit permission error:', error);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  },

  /**
   * Write a meal's nutrition data to Apple Health
   * @param meal The meal to sync
   * @returns true if successful, false if failed
   */
  async writeMealToHealth(meal: Meal): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const timestamp = new Date(meal.timestamp);

      // Write calories
      await this.writeCalories(meal.totalCalories, timestamp);

      // Write protein
      await this.writeProtein(meal.totalProtein, timestamp);

      // Write carbs
      await this.writeCarbs(meal.totalCarbs, timestamp);

      // Write fat
      await this.writeFat(meal.totalFat, timestamp);

      return true;
    } catch (error) {
      console.error('Error writing meal to HealthKit:', error);
      return false;
    }
  },

  /**
   * Write calorie data to HealthKit
   */
  async writeCalories(calories: number, timestamp: Date): Promise<void> {
    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        value: calories,
        startDate: timestamp.toISOString(),
        endDate: timestamp.toISOString(),
      };

      AppleHealthKit.saveDietaryEnergy(options, (error: string, result: any) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Write protein data to HealthKit (in grams)
   */
  async writeProtein(protein: number, timestamp: Date): Promise<void> {
    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        value: protein,
        startDate: timestamp.toISOString(),
        endDate: timestamp.toISOString(),
      };

      AppleHealthKit.saveProtein(options, (error: string, result: any) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Write carbohydrate data to HealthKit (in grams)
   */
  async writeCarbs(carbs: number, timestamp: Date): Promise<void> {
    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        value: carbs,
        startDate: timestamp.toISOString(),
        endDate: timestamp.toISOString(),
      };

      AppleHealthKit.saveCarbohydrates(options, (error: string, result: any) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Write fat data to HealthKit (in grams)
   */
  async writeFat(fat: number, timestamp: Date): Promise<void> {
    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        value: fat,
        startDate: timestamp.toISOString(),
        endDate: timestamp.toISOString(),
      };

      AppleHealthKit.saveTotalFat(options, (error: string, result: any) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve();
        }
      });
    });
  },
};
