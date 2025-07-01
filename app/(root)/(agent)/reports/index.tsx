import { config, databases } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Query } from 'react-native-appwrite';

// Tipe data untuk statistik
interface SalesStats {
  totalSales: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalProducts: number;
  topProducts: Array<{
    name: string;
    totalSold: number;
    revenue: number;
  }>;
}

// Komponen Kartu Statistik
const StatCard = ({ icon, value, label, color }: { icon: any, value: string | number, label: string, color: string }) => (
    <View style={styles.statCard}>
        <Ionicons name={icon} size={22} color={color} style={styles.statIcon} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// Komponen untuk Bar Chart sederhana
const BarChart = ({ data }: { data: SalesStats['topProducts'] }) => {
  if (!data || data.length === 0) return null;
  const maxValue = Math.max(...data.map(p => p.totalSold), 1); // Hindari pembagian dengan nol

  return (
    <View style={styles.chartContainer}>
      {data.map((product, index) => (
        <View key={index} style={styles.barWrapper}>
          <Text style={styles.barLabel} numberOfLines={2}>{product.name}</Text>
          <View style={styles.barBackground}>
            <View style={[styles.bar, { width: `${(product.totalSold / maxValue) * 100}%` }]} />
          </View>
          <Text style={styles.barValue}>{product.totalSold} terjual (Rp {product.revenue.toLocaleString('id-ID')})</Text>
        </View>
      ))}
    </View>
  );
};

export default function AgentReports() {
  const router = useRouter();
  const { user } = useGlobalContext();
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user || (user.userType !== 'agent' && user.userType !== 'admin')) {
      router.replace('/');
      return;
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user) return;
    try {
        // Ambil semua produk milik agen
        const productsResponse = await databases.listDocuments(config.databaseId!, config.stokCollectionId!, [Query.equal('agentId', user.$id), Query.limit(5000)]);
        const agentProducts = productsResponse.documents;
        const agentProductIds = new Set(agentProducts.map(p => p.$id));
        const totalProducts = productsResponse.total;

        if (agentProductIds.size === 0) {
            setStats({ totalSales: 0, totalOrders: 0, completedOrders: 0, pendingOrders: 0, totalProducts, topProducts: [] });
            return;
        }

        // Ambil semua item pesanan yang terkait dengan produk agen
        const orderItemsResponse = await databases.listDocuments(config.databaseId!, config.orderItemsCollectionId!, [Query.equal('productId', Array.from(agentProductIds)), Query.limit(5000)]);
        const agentOrderItems = orderItemsResponse.documents;

        const relevantOrderIds = [...new Set(agentOrderItems.map(item => item.orderId))];
        if (relevantOrderIds.length === 0) {
            setStats({ totalSales: 0, totalOrders: 0, completedOrders: 0, pendingOrders: 0, totalProducts, topProducts: [] });
            return;
        }
        
        const ordersResponse = await databases.listDocuments(config.databaseId!, config.ordersCollectionId!, [Query.equal('$id', relevantOrderIds), Query.limit(5000)]);
        
        const salesByProduct: Record<string, { totalSold: number; revenue: number; name: string }> = {};
        let totalSales = 0;

        ordersResponse.documents.forEach(order => {
            if (order.status === 'delivered') {
                const itemsInOrder = agentOrderItems.filter(item => item.orderId === order.$id);
                itemsInOrder.forEach(item => {
                    const price = item.priceAtPurchase * item.quantity;
                    totalSales += price;
                    
                    if (!salesByProduct[item.productId]) {
                        const product = agentProducts.find(p => p.$id === item.productId);
                        salesByProduct[item.productId] = { totalSold: 0, revenue: 0, name: product?.name || 'Produk Dihapus' };
                    }
                    salesByProduct[item.productId].totalSold += item.quantity;
                    salesByProduct[item.productId].revenue += price;
                });
            }
        });
        
        const topProducts = Object.values(salesByProduct).sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);

        setStats({
            totalSales,
            totalOrders: ordersResponse.total,
            completedOrders: ordersResponse.documents.filter(o => o.status === 'delivered').length,
            pendingOrders: ordersResponse.documents.filter(o => o.status === 'pending').length,
            totalProducts,
            topProducts
        });

    } catch (error) {
        console.error('Error loading stats:', error);
        Alert.alert("Error", "Gagal memuat statistik penjualan.");
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <View style={styles.centeredView}>
        <ActivityIndicator size="large" color="#526346" />
        <Text style={styles.loadingText}>Memuat Laporan...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Laporan Penjualan',
          headerTitleStyle: { fontFamily: 'Rubik-Bold' },
           headerShadowVisible: false,
           headerStyle: { backgroundColor: '#F8F9FA' },
        }}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>Ringkasan</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="cash-outline" value={`Rp ${stats?.totalSales.toLocaleString('id-ID') || 0}`} label="Penjualan Selesai" color="#10B981" />
          <StatCard icon="receipt-outline" value={stats?.totalOrders || 0} label="Total Pesanan" color="#3B82F6" />
          <StatCard icon="cube-outline" value={stats?.totalProducts || 0} label="Total Produk" color="#8B5CF6" />
          <StatCard icon="time-outline" value={stats?.pendingOrders || 0} label="Pesanan Pending" color="#F59E0B" />
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Produk Terlaris</Text>
            {stats && stats.topProducts.length > 0 ? (
                 <View style={styles.card}>
                    <BarChart data={stats.topProducts} />
                </View>
            ) : (
                <View style={[styles.card, styles.emptyChart]}>
                    <Ionicons name="stats-chart-outline" size={32} color="#9CA3AF" />
                    <Text style={styles.emptyChartText}>Belum ada penjualan yang tercatat.</Text>
                </View>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Stylesheet
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },
    loadingText: { marginTop: 10, fontFamily: 'Rubik-Medium', color: '#6B7280' },
    scrollContainer: { padding: 20, paddingBottom: 40 },
    section: { marginTop: 24 },
    sectionTitle: { fontSize: 22, fontFamily: 'Rubik-Bold', color: '#1F2937', marginBottom: 16 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
    statCard: { 
        width: '48%', 
        backgroundColor: 'white', 
        borderRadius: 16, 
        padding: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 5,
    },
    statIcon: { marginBottom: 12 },
    statValue: { fontSize: 20, fontFamily: 'Rubik-Bold', color: '#1F2937' },
    statLabel: { fontSize: 12, fontFamily: 'Rubik-Regular', color: '#6B7280', marginTop: 2 },
    card: { backgroundColor: 'white', borderRadius: 16, padding: 16 },
    chartContainer: { gap: 16 },
    barWrapper: { gap: 6 },
    barLabel: { fontFamily: 'Rubik-Medium', fontSize: 14, color: '#374151' },
    barBackground: { height: 20, backgroundColor: '#F3F4F6', borderRadius: 10, overflow: 'hidden' },
    bar: { height: '100%', backgroundColor: '#8CCD61', borderRadius: 10 },
    barValue: { fontFamily: 'Rubik-Regular', fontSize: 12, color: '#6B7280', alignSelf: 'flex-end' },
    emptyChart: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    emptyChartText: {
        fontFamily: 'Rubik-Regular',
        color: '#6B7280'
    }
});