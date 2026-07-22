// utils/notifications.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Notification permissions are required to set meditation reminders.');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Meditation Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return true;
}

export async function syncReminders(reminderTimes) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return false;

  // Clear existing scheduled notifications to stay strictly in sync with user preferences
  await Notifications.cancelAllScheduledNotificationsAsync();

  const activeReminders = reminderTimes.filter((r) => r.enabled);

const messages = [
    { title: "Mindful Moment 🌿", body: "Take a deep breath and reset your mind for a few minutes." },
    { title: "Time to Pause 🧘‍♂️", body: "A short 2-minute meditation can change your whole day." },
    { title: "Midday Refresh ☀️", body: "Step away for a moment and clear your mental headspace." },
    { title: "Check In With Yourself ✨", body: "How are you feeling right now? Give yourself a quick break." },
    { title: "Evening Unwind 🌙", body: "Ready for a quick session before ending your day?" },
  ];

  for (let i = 0; i < activeReminders.length; i++) {
    const reminder = activeReminders[i];
    const message = messages[i % messages.length];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminder.hour,
        minute: reminder.minute,
      },
    });
  }

  return true;
}