import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { meditations, resolveMeditation } from '../data/meditations';
import ReminderModal from '../components/ReminderModal';
import MeditationModal from '../components/MeditationModal';

const ICON_MAP = {
  random: { family: 'MaterialCommunity', name: 'dice-5-outline' },
  breath: { family: 'MaterialCommunity', name: 'weather-windy' },
  bodyscan: { family: 'MaterialCommunity', name: 'human' },
  leaves: { family: 'Ionicons', name: 'leaf-outline' },
  sounds: { family: 'Ionicons', name: 'volume-medium-outline' },
};

const DURATIONS = [1, 2, 3, 4, 5, 6, 7];

export default function HomeScreen({ navigation }) {
  const [duration, setDuration] = useState(3);
  const [meditationId, setMeditationId] = useState('random');
  const [isMeditationModalVisible, setIsMeditationModalVisible] = useState(false);
  const [isReminderModalVisible, setIsReminderModalVisible] = useState(false);

  function startSession() {
    const meditation = resolveMeditation(meditationId);
    navigation.navigate('Player', { meditation, duration });
  }

  function renderIcon(iconKey, size = 24, color = '#3b82f6') {
    const iconConfig = ICON_MAP[iconKey] || ICON_MAP.random;

    if (iconConfig.family === 'Ionicons') {
      return <Ionicons name={iconConfig.name} size={size} color={color} />;
    }
    return <MaterialCommunityIcons name={iconConfig.name} size={size} color={color} />;
  }

  const selectedMeditation = meditationId === 'random' 
    ? { title: 'Surprise Me', icon: 'random' }
    : meditations.find((m) => m.id === meditationId);

  return (
    <LinearGradient colors={['#ffffff', '#c7e1e7']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Main Section Group */}
        <View style={styles.mainControls}>
          
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Take a deep breath and choose your session.</Text>
            </View>

            <TouchableOpacity 
              style={styles.bellButton} 
              onPress={() => setIsReminderModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color="#1a1a2e" />
            </TouchableOpacity>
          </View>

          {/* Meditation Selector Bar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meditation</Text>
            <TouchableOpacity 
              style={styles.dropdownTrigger} 
              onPress={() => setIsMeditationModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownLeft}>
                {renderIcon(selectedMeditation?.icon, 24, '#3b82f6')}
                <View>
                  <Text style={styles.dropdownTitle}>{selectedMeditation?.title}</Text>
                  {selectedMeditation?.subtitle && (
                    <Text style={styles.dropdownSubtitle}>{selectedMeditation.subtitle}</Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Duration Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration</Text>
            <View style={styles.pillContainer}>
              {DURATIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pill, duration === d && styles.pillSelected]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={[styles.pillText, duration === d && styles.pillTextSelected]}>
                    {d} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </View>

        {/* Start Session Button */}
        <TouchableOpacity style={styles.button} onPress={startSession} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Start a Session</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Modals */}
      <MeditationModal
        visible={isMeditationModalVisible}
        selectedId={meditationId}
        onSelect={(id) => setMeditationId(id)}
        onClose={() => setIsMeditationModalVisible(false)}
      />

      <ReminderModal 
        visible={isReminderModalVisible} 
        onClose={() => setIsReminderModalVisible(false)} 
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'space-between',
    paddingHorizontal: 24, 
    paddingTop: 70, 
    paddingBottom: 40 
  },
  mainControls: { gap: 32 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 50,
    marginBottom: 12,
  },
  headerTextContainer: { flex: 1, paddingRight: 12 },
  title: { fontSize: 30, fontWeight: '700', color: '#1a1a2e', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6e7a8a', lineHeight: 22 },
  bellButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  section: {},
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8c9ba5', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#ffffff' },
  pillSelected: { backgroundColor: '#3b82f6' },
  pillText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  pillTextSelected: { color: '#ffffff' },
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  dropdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dropdownTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  dropdownSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },
  button: { backgroundColor: '#1e293b', paddingVertical: 18, borderRadius: 14, alignItems: 'center', marginTop: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});