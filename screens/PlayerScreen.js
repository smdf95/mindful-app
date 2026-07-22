import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Audio } from 'expo-av';

export default function PlayerScreen({ route, navigation }) {
    const { meditation, duration } = route.params;
    const [timeLeft, setTimeLeft] = useState(duration * 60);
    const [phase, setPhase] = useState('intro');
    

    const titleScale = useRef(new Animated.Value(1.4)).current;
    const titleTranslateY = useRef(new Animated.Value(0)).current;
    const controlsOpacity = useRef(new Animated.Value(0)).current;

    async function playSound() {
        try {
            const { sound } = await Audio.Sound.createAsync(require('../assets/audio/gong.mp3'));
            await sound.playAsync();
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    useEffect(() => {
        Animated.sequence([
            Animated.delay(900),
      Animated.parallel([
        Animated.timing(titleScale, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ]),
    ]).start(() => {
      setPhase('ready');
      Animated.timing(controlsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });
  }, []);

    useEffect(() => {
        if (phase !== 'running') return;
        const timer = setInterval(() => {
        setTimeLeft((t) => (t > 0 ? t - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [phase]);

    useEffect(() => {
        if (phase === 'running' && timeLeft === 0) {
        playSound();
        }
    }, [timeLeft, phase]);

    function startSession() {
        setPhase('running');
    }

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                styles.titleWrapper,
                { transform: [{ scale: titleScale }] },
                ]}
            >
                <Text style={styles.title}>{meditation.title}</Text>
            </Animated.View>
            <Animated.View style={[styles.controlsWrapper, { opacity: controlsOpacity }]}>
                <Text style={styles.timer}>{mins}:{secs.toString().padStart(2, '0')}</Text>

                <View style={styles.startSlot}>
                    {phase === 'ready' && (
                        <TouchableOpacity style={styles.startButton} onPress={startSession}>
                        <Text style={styles.startText}>Start</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {phase === 'running' && (
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.cancel}>Finish</Text>
                    </TouchableOpacity>
                )}
                
            </Animated.View>
        </View>
    );
}


const styles = StyleSheet.create({
    container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e'},
    titleWrapper: {width: '78%', alignItems: 'center'},
    title: 
    {
        fontSize: 28, 
        color: '#fff', 
        marginBottom: 20, 
        fontWeight: '300',
        textAlign: 'center',
    },
    controlsWrapper: { width: '100%', alignItems: 'center' },
    timer: { fontSize: 64, color: '#fff', fontWeight: '200', textAlign: 'center' },
    startSlot: {
        height: 66,
        justifyContent: 'center',
        marginTop: 30,
    },
    startButton: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
    },
    startText: { color: '#1a1a2e', fontSize: 18, fontWeight: '500' },
    cancel: { fontSize: 16, color: '#888', marginTop: 24, textAlign: 'center' },
});