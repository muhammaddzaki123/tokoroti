import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, FeaturedCard } from "@/components/Cards";
import Filters from "@/components/Filters";
import NoResults from "@/components/NoResults";
import Search from "@/components/Search";
import { getLatestProperties, getProperties } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { useAppwrite } from "@/lib/useAppwrite";

const HomeHeader = ({ user, query }: { user: any, query?: string }) => (
  <View style={styles.section}>
    {!query && (
      <View style={styles.headerRow}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: user?.avatar }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.greetingText}>Selamat Datang,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/(root)/(keranjang)/keranjang')} style={styles.cartButton}>
          <Ionicons name="cart-outline" size={28} color="#191D31" />
        </TouchableOpacity>
      </View>
    )}
    <Search />
  </View>
);

const Home = () => {
  const { user } = useGlobalContext();
  const params = useLocalSearchParams<{ query?: string; filter?: string }>();
  
  // Ambil nilai query dan filter dari parameter URL
  const query = params.query || "";
  const filter = params.filter || "All";

  // --- PERBAIKAN UTAMA: Satu sumber data ---
  // Hook ini sekarang bertanggung jawab untuk semua pengambilan data produk
  const { data: properties, loading: propertiesLoading, refetch } = useAppwrite({
    fn: () => getProperties({ query, filter }), // Kirim query dan filter
    // `skip` tidak lagi diperlukan karena `useEffect` akan menangani pembaruan
  });

  const { data: latestProperties, loading: latestLoading, refetch: refetchLatest } = useAppwrite({
    fn: getLatestProperties,
  });

  // useEffect ini akan dijalankan setiap kali query atau filter berubah
  useEffect(() => {
    refetch();
  }, [query, filter]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetchLatest();
    await refetch(); // Refresh data utama
    setRefreshing(false);
  };

  const handleCardPress = (id: string) => router.push(`/properties/${id}`);

  const renderFeaturedItem = ({ item }: { item: any }) => (
    <FeaturedCard item={item} onPress={() => handleCardPress(item.$id)} />
  );

  const renderRecommendationItem = ({ item }: { item: any }) => (
    <Card item={item} onPress={() => handleCardPress(item.$id)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={properties as any[]}
        keyExtractor={(item) => item.$id}
        renderItem={renderRecommendationItem}
        numColumns={2}
        columnWrapperStyle={{ gap: 16 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListHeaderComponent={() => (
          <>
            <HomeHeader user={user} query={query} />
            
            {/* Sembunyikan konten lain saat ada pencarian atau filter aktif */}
            {!query && filter === "All" && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Unggulan</Text>
                  <TouchableOpacity onPress={() => router.push('/explore')}>
                    <Text style={styles.seeAllText}>Lihat Semua</Text>
                  </TouchableOpacity>
                </View>
                {latestLoading ? (
                  <ActivityIndicator size="large" color="#526346" />
                ) : (
                  <FlatList
                    data={latestProperties}
                    renderItem={renderFeaturedItem}
                    keyExtractor={(item) => item.$id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: 8, gap: 16 }}
                  />
                )}
              </View>
            )}

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {query ? `Hasil untuk "${query}"` : "Rekomendasi"}
                </Text>
                {query && (
                    <TouchableOpacity onPress={() => router.setParams({ query: '' })}>
                        <Text style={styles.seeAllText}>Hapus</Text>
                    </TouchableOpacity>
                )}
            </View>
            <Filters />
          </>
        )}
        ListEmptyComponent={() => (
          propertiesLoading ? (
            <ActivityIndicator size="large" color="#526346" style={{ marginTop: 20 }}/>
          ) : (
            <NoResults />
          )
        )}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#526346" />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  section: { marginBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: '#8CCD61' },
  greetingText: { fontFamily: 'Rubik-Regular', color: '#666876', fontSize: 14 },
  userName: { fontFamily: 'Rubik-SemiBold', color: '#191D31', fontSize: 20 },
  cartButton: { backgroundColor: 'white', padding: 12, borderRadius: 22, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5},
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { fontSize: 24, fontFamily: 'Rubik-Bold', color: '#191D31' },
  seeAllText: { fontSize: 16, fontFamily: 'Rubik-Medium', color: '#526346' },
});

export default Home;