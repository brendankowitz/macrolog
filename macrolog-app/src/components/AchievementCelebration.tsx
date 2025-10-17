import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Achievement } from '../types';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementCelebration({ visible, achievement, onClose }: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef([...Array(12)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible && achievement) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      confettiAnims.forEach(anim => anim.setValue(0));

      // Background fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Achievement pop in
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        delay: 200,
        useNativeDriver: true,
      }).start();

      // Confetti animation
      confettiAnims.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000 + Math.random() * 500,
          delay: 300 + index * 50,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [visible, achievement]);

  if (!achievement) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Confetti */}
        {confettiAnims.map((anim, index) => {
          const angle = (index / confettiAnims.length) * Math.PI * 2;
          const distance = 150;
          const translateX = Math.cos(angle) * distance;
          const translateY = Math.sin(angle) * distance;

          return (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  opacity: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1, 0],
                  }),
                  transform: [
                    {
                      translateX: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, translateX],
                      }),
                    },
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, translateY],
                      }),
                    },
                    {
                      rotate: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.confettiEmoji}>
                {['🎉', '✨', '🌟', '⭐'][index % 4]}
              </Text>
            </Animated.View>
          );
        })}

        {/* Achievement Card */}
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeEmoji}>{achievement.emoji}</Text>
          </View>

          <Text style={styles.title}>Achievement Unlocked!</Text>

          <Text style={styles.achievementName}>{achievement.name}</Text>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>

          <View style={styles.streak}>
            <Text style={styles.streakLabel}>Streak Milestone</Text>
            <Text style={styles.streakValue}>{achievement.threshold} days 🔥</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
  },
  confettiEmoji: {
    fontSize: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: width - 64,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  badge: {
    width: 100,
    height: 100,
    backgroundColor: '#FEF3C7',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#FCD34D',
  },
  badgeEmoji: {
    fontSize: 56,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  achievementName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  streak: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#92400E',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
