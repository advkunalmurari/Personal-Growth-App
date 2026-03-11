import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, AppState, AppStateStatus } from 'react-native';
import Animated, { FadeInUp, Layout, SlideOutRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect } from 'react';
import { supabase } from './src/lib/supabase';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, mmkvPersister } from './src/lib/react-query';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';

// Example Mock Data
const MOCK_TASKS = [
  { id: '1', title: 'Deep Work: System Architecture', done: false },
  { id: '2', title: 'Schedule Recovery Block', done: false },
  { id: '3', title: 'Daily Review', done: false }
];

export default function App() {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      // In a full implementation we'd check supabase.auth.getSession()
      // and redirect to a Login screen if no session exists.
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to access Life OS',
          fallbackLabel: 'Use PIN',
        });

        if (result.success) {
          setIsAuthenticated(true);
        } else {
          Alert.alert('Authentication Failed', 'Restart the app to try again.');
        }
      } else {
        // Fallback for simulators or devices without biometrics
        setIsAuthenticated(true);
      }
      setIsReady(true);
    }

    checkAuth();

    // Refetch on App Focus
    const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    });

    // Auto-refetch on Network reconnect
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      onlineManager.setOnline(
        state.isConnected != null && state.isConnected && Boolean(state.isInternetReachable)
      );
    });

    return () => {
      subscription.remove();
      unsubscribeNetInfo();
    };
  }, []);

  // Supabase Realtime Channel Example
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase.channel('public:tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
        console.log('Realtime tasks update:', payload);
        // Using queryClient.invalidateQueries({ queryKey: ['tasks'] }) in a real implementation
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [isAuthenticated]);

  const toggleTask = (id: string) => {
    // Trigger Tactile Feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, done: !task.done } : task
    ));
  };

  const removeTask = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  if (!isReady) return null;
  if (!isAuthenticated) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.title}>Locked.</Text>
    </View>
  );

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: mmkvPersister }}>
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.title}>Today's Plan</Text>
          <Text style={styles.subtitle}>Execute with precision.</Text>
        </View>

        <View style={styles.list}>
          {tasks.map((task, index) => (
            <Animated.View
              key={task.id}
              entering={FadeInUp.delay(index * 100)}
              exiting={SlideOutRight}
              layout={Layout.springify()}
              style={styles.taskCard}
            >
              <TouchableOpacity
                style={[styles.checkbox, task.done && styles.checkboxDone]}
                onPress={() => toggleTask(task.id)}
              />
              <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>
                {task.title}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeTask(task.id)}
              >
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
          {tasks.length === 0 && (
            <Text style={styles.emptyText}>All tasks completed. Victory.</Text>
          )}
        </View>
      </View>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
  },
  list: {
    flex: 1,
    gap: 16,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6366f1',
    marginRight: 16,
  },
  checkboxDone: {
    backgroundColor: '#6366f1',
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    color: '#e4e4e7',
    fontWeight: '500',
  },
  taskTitleDone: {
    color: '#71717a',
    textDecorationLine: 'line-through',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#10b981',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 18,
    fontWeight: '600',
  }
});
