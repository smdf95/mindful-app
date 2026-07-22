import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { meditations } from '../data/meditations';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const ICON_MAP = {
  random: { family: 'MaterialCommunity', name: 'dice-5-outline' },
  breath: { family: 'MaterialCommunity', name: 'weather-windy' },
  bodyscan: { family: 'MaterialCommunity', name: 'human' },
  leaves: { family: 'Ionicons', name: 'leaf-outline' },
  sounds: { family: 'Ionicons', name: 'volume-medium-outline' },
};

function renderIcon(iconKey, size = 24, color = '#3b82f6') {
  const iconConfig = ICON_MAP[iconKey] || ICON_MAP.random;

  if (iconConfig.family === 'Ionicons') {
    return <Ionicons name={iconConfig.name} size={size} color={color} />;
  }
  return <MaterialCommunityIcons name={iconConfig.name} size={size} color={color} />;
}

export default function MeditationModal({ visible, selectedId, onSelect, onClose }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(SCREEN_HEIGHT);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  function handleClose() {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }

  function handleSelect(id) {
    onSelect(id);
    handleClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        {/* Animated Fading Backdrop */}
        <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Animated Sliding Bottom Sheet */}
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Meditation</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {/* Surprise Me Option */}
            <TouchableOpacity
              style={[
                styles.optionRow,
                selectedId === 'random' && styles.optionRowSelected,
              ]}
              onPress={() => handleSelect('random')}
            >
              {renderIcon('random', 24, selectedId === 'random' ? '#3b82f6' : '#64748b')}
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Surprise Me</Text>
              </View>
              {selectedId === 'random' && <Ionicons name="checkmark" size={20} color="#3b82f6" />}
            </TouchableOpacity>

            {/* Meditation Items */}
            {meditations.map((m) => {
              const isSelected = selectedId === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.optionRow,
                    isSelected && styles.optionRowSelected,
                  ]}
                  onPress={() => handleSelect(m.id)}
                >
                  {renderIcon(m.icon, 24, isSelected ? '#3b82f6' : '#64748b')}
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>{m.title}</Text>
                    {m.subtitle && <Text style={styles.optionSubtitle}>{m.subtitle}</Text>}
                  </View>
                  {isSelected && <Ionicons name="checkmark" size={20} color="#3b82f6" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e2e8f0' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
  closeButton: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  modalList: { paddingHorizontal: 16 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginTop: 6, gap: 12 },
  optionRowSelected: { backgroundColor: '#eff6ff' },
  optionTextContainer: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '500', color: '#1e293b' },
  optionSubtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
});