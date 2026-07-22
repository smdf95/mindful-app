import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { useKeepAwake } from 'expo-keep-awake';

export default function PlayerScreen({ route, navigation }) {
  useKeepAwake(); // Keeps screen awake while meditation player is active

  const { meditation, duration } = route.params;
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [phase, setPhase] = useState('intro'); // 'intro' | 'ready' | 'starting' | 'running' | 'paused'

  // Derived state helpers
  const isSessionPaused = phase === 'paused';
  const isSessionFinished = phase === 'finished';
  const showReadyContent = phase === 'ready' || phase === 'starting';
  const showRunningContent = phase === 'running' || phase === 'starting';

  // Refs for audio instance & timestamp tracking
  const soundRef = useRef(null);
  const endTimeRef = useRef(null);

  // Animation drivers
  const titleScale = useRef(new Animated.Value(1.4)).current;
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const readyContentOpacity = useRef(new Animated.Value(1)).current;
  const finishButtonOpacity = useRef(new Animated.Value(0)).current;
  const controlsTranslateY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  // 1. SETUP AUDIO & ENTRANCE ANIMATION (Runs once on mount)
  useEffect(() => {
    async function initAudio() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          require('../assets/audio/gong.mp3')
        );
        soundRef.current = sound;
      } catch (error) {
        console.error('Audio initialization error:', error);
      }
    }

    initAudio();

    // Smooth Entrance Sequence
    Animated.sequence([
      Animated.delay(900),
      Animated.timing(titleScale, { toValue: 1, duration: 1100, useNativeDriver: true }),
    ]).start(() => {
      setPhase('ready');
      Animated.timing(controlsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // 2. ACCURATE TIMER LOOP
  useEffect(() => {
    if (phase !== 'running') return;

    const timer = setInterval(async () => {
      const now = Date.now();
      const remainingSecs = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

      setTimeLeft(remainingSecs);

      if (remainingSecs === 0) {
        clearInterval(timer);
        setPhase('finished');
        if (soundRef.current) {
          try {
            await soundRef.current.replayAsync();
          } catch (err) {
            console.error('Error playing gong:', err);
          }
        }
      }
    }, 500);
    return () => clearInterval(timer);
  }, [phase]);

  // 3. SEAMLESS BREATHING PULSE
  useEffect(() => {
    let animation;

    if (isSessionPaused || phase === 'ready') {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 1200,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1.0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [isSessionPaused, phase]);

  // Helper for layout transition
    function triggerStartTransition(callback) {
    Animated.parallel([
        Animated.timing(readyContentOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
        }),
        Animated.timing(controlsTranslateY, {
        toValue: -40,
        duration: 450,
        useNativeDriver: true,
        }),
        Animated.sequence([
        Animated.delay(150),
        Animated.timing(finishButtonOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
        }),
        ]),
    ]).start(callback);
    }

    // Then your functions become super concise:
    function startSession() {
        setPhase('starting');
        endTimeRef.current = Date.now() + duration * 60 * 1000;
        triggerStartTransition(() => setPhase('running'));
    }

    function continueSession() {
        setPhase('starting');
        endTimeRef.current = Date.now() + timeLeft * 1000;
        triggerStartTransition(() => setPhase('running'));
    }

  function pause() {
    setPhase('paused');
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <View style={styles.container}>
      {/* Title */}
      <Animated.View style={[styles.titleWrapper, { transform: [{ scale: titleScale }] }]}>
        <Text style={styles.title}>{meditation.title}</Text>
      </Animated.View>

      {/* Main Controls Wrapper */}
      <Animated.View style={[styles.controlsWrapper, { opacity: controlsOpacity }]}>
        
        {/* Subtitle Slot */}
        <View style={styles.subtitleSlot}>
          {showReadyContent && (
            <Animated.Text style={[styles.subtitle, { opacity: readyContentOpacity }]}>
              {meditation.subtitle}
            </Animated.Text>
          )}
        </View>

        {/* Sliding Area */}
        <Animated.View style={[styles.slidingSection, { transform: [{ translateY: controlsTranslateY }] }]}>
          {/* Timer Display */}
          <Animated.View style={{ opacity: isSessionPaused ? pulseAnim : 1 }}>
            <Text style={styles.timer}>
              {mins}:{secs.toString().padStart(2, '0')}
            </Text>
          </Animated.View>

          {/* Action Slot */}
            <View style={styles.actionSlot}>
            {(() => {
                switch (phase) {
                case 'ready':
                case 'starting':
                    return (
                    <Animated.View style={[styles.buttonOverlay, { opacity: readyContentOpacity }]}>
                        <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={startSession}
                        activeOpacity={0.8}
                        disabled={phase !== 'ready'}
                        >
                        <Text style={styles.primaryButtonText}>Start</Text>
                        </TouchableOpacity>

                        <Animated.Text style={[styles.screenNote, { opacity: pulseAnim }]}>
                        Keep screen open
                        </Animated.Text>
                    </Animated.View>
                    );

                case 'running':
                    return (
                    <Animated.View style={[styles.buttonOverlay, styles.rowLayout, { opacity: finishButtonOpacity }]}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={pause} activeOpacity={0.7}>
                        <Text style={styles.secondaryButtonText}>Pause</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Text style={styles.secondaryButtonText}>Finish</Text>
                        </TouchableOpacity>
                    </Animated.View>
                    );

                case 'paused':
                    return (
                    <Animated.View style={[styles.buttonOverlay, styles.rowLayout]}>
                        <TouchableOpacity style={styles.primaryButtonHalf} onPress={continueSession} activeOpacity={0.8}>
                        <Text style={styles.primaryButtonText}>Continue</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Text style={styles.secondaryButtonText}>Finish</Text>
                        </TouchableOpacity>
                    </Animated.View>
                    );

                case 'finished':
                    return (
                    <Animated.View style={styles.buttonOverlay}>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Text style={styles.primaryButtonText}>Done</Text>
                        </TouchableOpacity>
                    </Animated.View>
                    );

                default:
                    return null;
                }
            })()}
            </View>
        </Animated.View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  titleWrapper: { width: '78%', alignItems: 'center' },
  title: {
    fontSize: 28,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '300',
    textAlign: 'center',
  },
  subtitleSlot: { minHeight: 60, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  subtitle: { fontSize: 16, color: '#aaa', textAlign: 'center', lineHeight: 22 },
  controlsWrapper: { width: '100%', alignItems: 'center' },
  slidingSection: { width: '100%', alignItems: 'center' },
  timer: { fontSize: 64, color: '#fff', fontWeight: '200', textAlign: 'center', marginVertical: 10 },
  
  actionSlot: {
    height: 90,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    position: 'relative',
  },
  buttonOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 30,
  },
  rowLayout: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },

  /* Primary Action Button (Solid White Pill) */
  primaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 44,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonHalf: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    minWidth: 125,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#1a1a2e',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  /* Secondary Action Buttons (Glass / Subtle Pill) */
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    minWidth: 110,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  secondaryButtonText: {
    color: '#e0e0e0',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  screenNote: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 0.5,
    marginTop: 14,
  },
});