import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  Platform,
  Animated,
  Dimensions,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { syncReminders } from '../utils/notifications';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const STORAGE_KEY = '@mindful_app_reminders';
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const DEFAULT_REMINDERS = [
  { id: '1', hour: 9, minute: 0, enabled: true, days: [0, 1, 2, 3, 4, 5, 6] },
  { id: '2', hour: 14, minute: 30, enabled: true, days: [1, 2, 3, 4, 5] },
  { id: '3', hour: 20, minute: 0, enabled: false, days: [0, 6] },
];

export default function ReminderModal({ visible, onClose }) {
  const [hasPermission, setHasPermission] = useState(true);
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTime, setPickerTime] = useState(new Date());
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null); // Track which row shows day selector

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      checkPermissions();
      loadReminders();

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
      setShowPicker(false);
      setEditingId(null);
      setExpandedId(null);
      onClose();
    });
  }

  async function checkPermissions() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Failed to check permissions:', error);
    }
  }

  async function handleRequestPermission() {
    try {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
      } else if (!canAskAgain) {
        Linking.openSettings();
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
    }
  }

  async function loadReminders() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        const sorted = [...parsed].sort((a, b) => {
          if (a.hour === b.hour) return a.minute - b.minute;
          return a.hour - b.hour;
        });
        setReminders(sorted);
      }
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  }

  async function saveAndSync(updatedReminders) {
    try {
      const sorted = [...updatedReminders].sort((a, b) => {
        if (a.hour === b.hour) return a.minute - b.minute;
        return a.hour - b.hour;
      });

      setReminders(sorted);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      await syncReminders(sorted);
    } catch (error) {
      console.error('Failed to save reminders:', error);
    }
  }

  async function toggleReminder(id) {
    const updated = reminders.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    await saveAndSync(updated);
  }

  async function deleteReminder(id) {
    const updated = reminders.filter((item) => item.id !== id);
    if (expandedId === id) setExpandedId(null);
    await saveAndSync(updated);
  }

  async function toggleDay(reminderId, dayIndex) {
    const updated = reminders.map((item) => {
      if (item.id !== reminderId) return item;

      const currentDays = item.days || [0, 1, 2, 3, 4, 5, 6];
      const newDays = currentDays.includes(dayIndex)
        ? currentDays.filter((d) => d !== dayIndex)
        : [...currentDays, dayIndex];

      return { ...item, days: newDays };
    });

    await saveAndSync(updated);
  }

  function formatTime(hour, minute) {
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function getRepeatText(days = [0, 1, 2, 3, 4, 5, 6]) {
    if (days.length === 7) return 'Every day';
    if (days.length === 0) return 'Never';
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';

    return days
      .sort((a, b) => a - b)
      .map((d) => DAYS_OF_WEEK[d])
      .join(', ');
  }

  function handleRowPress(reminder) {
    // Toggle expand for day selection
    setExpandedId(expandedId === reminder.id ? null : reminder.id);
  }

  function handleOpenAddPicker() {
    setEditingId(null);
    setPickerTime(new Date());
    setShowPicker(true);
  }

  function handleOpenEditPicker(reminder) {
    setEditingId(reminder.id);
    const date = new Date();
    date.setHours(reminder.hour, reminder.minute);
    setPickerTime(date);
    setShowPicker(true);
  }

  async function handlePickerChange(event, selectedDate) {
    if (event.type === 'dismissed' || !selectedDate) {
      setShowPicker(false);
      setEditingId(null);
      return;
    }

    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    setPickerTime(selectedDate);

    if (Platform.OS === 'android') {
      await saveReminderTime(selectedDate);
    }
  }

  async function saveReminderTime(dateToSave) {
    const date = dateToSave || pickerTime;
    let updated;

    if (editingId) {
      updated = reminders.map((item) =>
        item.id === editingId
          ? { ...item, hour: date.getHours(), minute: date.getMinutes(), enabled: true }
          : item
      );
    } else {
      const newReminder = {
        id: Date.now().toString(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        enabled: true,
        days: [0, 1, 2, 3, 4, 5, 6],
      };
      updated = [...reminders, newReminder];
    }

    setShowPicker(false);
    setEditingId(null);
    await saveAndSync(updated);
  }

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Daily Reminders</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Tap a reminder to edit days, or tap the time to edit clock.</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {!hasPermission && (
              <TouchableOpacity 
                style={styles.permissionBanner} 
                onPress={handleRequestPermission}
                activeOpacity={0.8}
              >
                <Ionicons name="warning-outline" size={20} color="#b45309" />
                <View style={styles.permissionTextContainer}>
                  <Text style={styles.permissionTitle}>Notifications are turned off</Text>
                  <Text style={styles.permissionSubtitle}>Tap here to enable them in settings.</Text>
                </View>
              </TouchableOpacity>
            )}

            {reminders.map((item) => {
              const isExpanded = expandedId === item.id;
              const activeDays = item.days || [0, 1, 2, 3, 4, 5, 6];

              return (
                <View key={item.id} style={[styles.reminderCard, !hasPermission && styles.disabledRow]}>
                  {/* Primary Row */}
                  <View style={styles.reminderRow}>
                    <TouchableOpacity
                      style={styles.timeInfo}
                      onPress={() => hasPermission && handleRowPress(item)}
                      disabled={!hasPermission}
                      activeOpacity={0.7}
                    >
                      <TouchableOpacity
                        onPress={() => hasPermission && handleOpenEditPicker(item)}
                        disabled={!hasPermission}
                      >
                        <Text style={[styles.timeText, (!item.enabled || !hasPermission) && styles.disabledText]}>
                          {formatTime(item.hour, item.minute)}
                        </Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.repeatText}>
                        {getRepeatText(activeDays)} • Tap to customize
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.rowActions}>
                      <Switch
                        value={item.enabled && hasPermission}
                        disabled={!hasPermission}
                        onValueChange={() => toggleReminder(item.id)}
                        trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
                        thumbColor={item.enabled && hasPermission ? '#3b82f6' : '#f8fafc'}
                      />
                      <TouchableOpacity 
                        onPress={() => deleteReminder(item.id)} 
                        style={styles.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Expandable Days Selector */}
                  {isExpanded && hasPermission && (
                    <View style={styles.daysRow}>
                      {DAY_LABELS.map((dayLabel, index) => {
                        const isSelected = activeDays.includes(index);
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                            onPress={() => toggleDay(item.id, index)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.dayChipText, isSelected && styles.dayChipTextSelected]}>
                              {dayLabel}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            <TouchableOpacity style={styles.addButton} onPress={handleOpenAddPicker}>
              <Ionicons name="add-circle-outline" size={22} color="#3b82f6" />
              <Text style={styles.addButtonText}>Add Reminder Time</Text>
            </TouchableOpacity>

            {showPicker && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={pickerTime}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handlePickerChange}
                />

                {Platform.OS === 'ios' && (
                  <View style={styles.iosPickerButtons}>
                    <TouchableOpacity
                      style={[styles.pickerBtn, styles.cancelPickerBtn]}
                      onPress={() => {
                        setShowPicker(false);
                        setEditingId(null);
                      }}
                    >
                      <Text style={styles.cancelPickerText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.pickerBtn, styles.confirmPickerBtn]}
                      onPress={() => saveReminderTime()}
                    >
                      <Text style={styles.confirmPickerText}>Save Time</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  sheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', padding: 24, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  doneButton: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  list: { paddingBottom: 20 },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  permissionTextContainer: { flex: 1 },
  permissionTitle: { fontSize: 13, fontWeight: '600', color: '#92400e' },
  permissionSubtitle: { fontSize: 12, color: '#b45309' },
  disabledRow: { opacity: 0.5 },
  reminderCard: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
  },
  reminderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeInfo: { flex: 1, gap: 2 },
  timeText: { fontSize: 22, fontWeight: '600', color: '#0f172a' },
  disabledText: { color: '#94a3b8' },
  repeatText: { fontSize: 12, color: '#64748b' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deleteBtn: { padding: 4 },
  daysRow: {
    flexDirection: 'row',
    justify: 'space-between',
    marginTop: 12,
    paddingTop: 8,
  },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipSelected: {
    backgroundColor: '#3b82f6',
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  dayChipTextSelected: {
    color: '#ffffff',
  },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16, marginTop: 8 },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  pickerContainer: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 12, marginTop: 8 },
  iosPickerButtons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  pickerBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelPickerBtn: { backgroundColor: '#e2e8f0' },
  cancelPickerText: { color: '#475569', fontWeight: '600' },
  confirmPickerBtn: { backgroundColor: '#3b82f6' },
  confirmPickerText: { color: '#ffffff', fontWeight: '600' },
});