import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from './supabase'

// Configure how notifications are presented when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
})

export async function registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
        console.warn('Push notifications require a physical device')
        return null
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
    }

    if (finalStatus !== 'granted') {
        console.warn('Push notification permission denied')
        return null
    }

    // Get the Expo Push Token
    const { data: token } = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-expo-project-id',
    })

    // Android channel configuration
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Life OS',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#6366f1',
        })
        await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Habit & Task Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 150],
        })
    }

    // Save the push token to Supabase
    const { data: { user } } = await supabase.auth.getUser()
    if (user && token) {
        await supabase
            .from('push_tokens')
            .upsert(
                { user_id: user.id, token, platform: Platform.OS },
                { onConflict: 'user_id,platform' }
            )
    }

    return token
}

export function scheduleDailyReminder(hour: number, minute: number, title: string, body: string) {
    return Notifications.scheduleNotificationAsync({
        content: { title, body, sound: 'default' },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour,
            minute,
            repeats: true,
        },
    })
}

export function cancelAllScheduled() {
    return Notifications.cancelAllScheduledNotificationsAsync()
}
