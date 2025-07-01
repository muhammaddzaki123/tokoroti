import { Href, Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useGlobalContext } from '../../../lib/global-provider';
import { useAppwrite } from '@/lib/useAppwrite';
import { getAgentDashboardStats } from '@/lib/appwrite';

// Komponen Kartu Statistik
const StatCard = ({ icon, value, label, color }: { icon: any, value: string | number, label: string, color: string }) => (
    <View style={styles.statCard}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}1A` }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// Komponen Tombol Menu
const MenuButton = ({ title, description, route, icon, onPress }: { title: string, description: string, route: Href<any>, icon: any, onPress: (route: Href<any>) => void }) => (
    <TouchableOpacity onPress={() => onPress(route)} style={styles.menuButton}>
        <View style={styles.menuIconContainer}>
            <Ionicons name={icon} size={28} color="#526346" />
        </View>
        <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>{title}</Text>
            <Text style={styles.menuDescription}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={24} color="#CBD5E0" />
    </TouchableOpacity>
);

export default function AgentDashboard() {
  const router = useRouter();
  const { user } = useGlobalContext();

  // Ambil data statistik dasbor
  const { data: stats, loading } = useAppwrite({
    fn: () => getAgentDashboardStats(user!.$id),
    skip: !user
  });

  if (!user || (user.userType !== 'agent' && user.userType !== 'admin')) {
    router.replace('/');
    return null;
  }

  const menuItems = [
    { title: 'Produk', description: 'Tambah, edit, dan kelola produk Anda', route: '/(root)/(agent)/products' as const, icon: 'cube-outline' },
    { title: 'Pesanan', description: 'Lihat dan proses pesanan masuk', route: '/(root)/(agent)/orders' as const, icon: 'receipt-outline' },
    { title: 'Laporan', description: 'Analisis dan pantau penjualan', route: '/(root)/(agent)/reports' as const, icon: 'stats-chart-outline' },
    { title: 'Pengaturan Toko', description: 'Atur profil dan informasi toko', route: '/(root)/(agent)/settings' as const, icon: 'settings-outline' }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Dashboard Agen',
          headerTitleStyle: { fontFamily: 'Rubik-Bold' },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F8F9FA' },
        }}
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Selamat datang, {user.name}!</Text>
            <Text style={styles.headerSubtitle}>Kelola toko Anda dengan mudah dari sini.</Text>
        </View>
        
        {/* Bagian Statistik */}
        <View style={styles.statsContainer}>
            {loading ? (
                <ActivityIndicator size="small" color="#526346" />
            ) : (
                <>
                    <StatCard icon="file-tray-stacked-outline" value={stats?.totalProducts ?? 0} label="Total Produk" color="#3B82F6" />
                    <StatCard icon="time-outline" value={stats?.pendingOrders ?? 0} label="Pesanan Pending" color="#F59E0B" />
                    <StatCard icon="cash-outline" value={`Rp ${(stats?.totalSales ?? 0).toLocaleString('id-ID')}`} label="Total Penjualan" color="#10B981" />
                </>
            )}
        </View>
        
        {/* Bagian Menu */}
        <View style={styles.menuContainer}>
            {menuItems.map((item) => (
                <MenuButton key={item.route} {...item} onPress={(route) => router.push(route)} />
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContainer: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        paddingBottom: 40, // Memberi jarak dari tab navigasi bawah
    },
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'Rubik-Bold',
        color: '#1F2937',
    },
    headerSubtitle: {
        fontSize: 16,
        fontFamily: 'Rubik-Regular',
        color: '#6B7280',
        marginTop: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontFamily: 'Rubik-Bold',
        color: '#1F2937',
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Rubik-Regular',
        color: '#6B7280',
        marginTop: 2,
    },
    menuContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 8,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    menuIconContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 99,
        padding: 12,
        marginRight: 16,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontFamily: 'Rubik-Medium',
        color: '#1F2937',
    },
    menuDescription: {
        fontSize: 14,
        fontFamily: 'Rubik-Regular',
        color: '#6B7280',
        marginTop: 2,
    },
});