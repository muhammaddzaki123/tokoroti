import { RegisterAgentForm } from '@/constants/agent/RegisterAgentForm';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterAgent() {
  const router = useRouter();

  const handleSuccess = () => {
    // Navigasi sudah ditangani di dalam form,
    // fungsi ini bisa dikosongkan atau digunakan untuk tracking.
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Daftar Sebagai Agen',
          headerTitleStyle: {
            fontFamily: 'Rubik-Bold',
          },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F8F9FA' },
        }}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <RegisterAgentForm onSuccess={handleSuccess} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA'
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20
    }
})