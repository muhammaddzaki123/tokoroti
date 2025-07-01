import { useGlobalContext } from '@/lib/global-provider';
import { getFinishedDesigns, addCustomDesignDirectlyToCart } from '@/lib/appwrite';
import { useAppwrite } from '@/lib/useAppwrite';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Models } from 'react-native-appwrite';

interface FinishedDesignItem extends Models.Document {
  name?: string;
  imageUrl: string; 
  designData: string; 
  shirtColor: string; 
};

const FinishedDesignCard = ({ item }: { item: FinishedDesignItem }) => {
  const { user } = useGlobalContext();
  const [isAdding, setIsAdding] = useState(false);

  const calculatePrice = () => {
    try {
      const elements = JSON.parse(item.designData);
      const stickerCount = elements.filter((el: any) => el.type === 'sticker').length;
      return 30000 + stickerCount * 15000;
    } catch (e) {
      return 30000;
    }
  };
  const price = calculatePrice();

  const handleEdit = () => {
    router.push({
      pathname: '/(root)/(tabs)/shirt-editor',
      params: { designData: item.designData, shirtColor: item.shirtColor },
    });
  };

  const handleAddToCart = async () => {
    if (!user) {
      Alert.alert("Login Diperlukan", "Anda harus masuk untuk menambahkan item.");
      return;
    }
    
    setIsAdding(true);
    try {
      await addCustomDesignDirectlyToCart(user.$id, {
        name: item.name || `Desain Kustom #${item.$id.slice(-6)}`,
        imageUrl: item.imageUrl,
        price: price,
      });
      Alert.alert("Sukses", "Desain berhasil ditambahkan ke keranjang!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <View className="bg-white rounded-lg shadow-sm overflow-hidden mb-4 border border-gray-200">
      <Image
        source={{ uri: item.imageUrl }}
        className="w-full h-48 bg-gray-100"
        resizeMode="contain"
      />
      <View className="p-4">
        <Text className="font-rubik-bold text-lg text-black-300">
          {item.name || `Desain-${item.$id.slice(-6)}`}
        </Text>
        <Text className="text-xl font-rubik-extrabold text-primary-100 mt-2">
          Rp {price.toLocaleString('id-ID')}
        </Text>
        <Text className="font-rubik text-xs text-gray-400 mt-1">
          Dibuat pada: {new Date(item.$createdAt).toLocaleDateString()}
        </Text>
        
        <View className="mt-4 space-y-2">
          <TouchableOpacity 
            onPress={handleEdit}
            className="bg-gray-200 p-3 rounded-lg items-center flex-row justify-center"
          >
            <Ionicons name="create-outline" size={18} color="#333" />
            <Text className="text-black font-rubik-bold ml-2">Edit Desain</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleAddToCart}
            disabled={isAdding}
            className={`p-3 rounded-lg items-center flex-row justify-center ${isAdding ? 'bg-gray-400' : 'bg-primary-100'}`}
          >
            {isAdding ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="cart-outline" size={18} color="white" />
                <Text className="text-white font-rubik-bold ml-2">Tambah ke Keranjang</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ... Komponen MyDesignsScreen tetap sama
const MyDesignsScreen = () => {
  const { user } = useGlobalContext();

  const { data: designs, loading } = useAppwrite({
    fn: () => getFinishedDesigns(user!.$id),
    skip: !user,
  });

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-5">
        <Text className="text-xl font-rubik-bold text-center">Anda harus login untuk melihat halaman ini.</Text>
        <TouchableOpacity onPress={() => router.push('/sign-in')} className="mt-5 bg-primary-100 px-4 py-2 rounded-lg">
            <Text className="text-white font-rubik-medium">Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#191D31" />
        </TouchableOpacity>
        <Text className="text-xl font-rubik-bold text-black-300">Desain Saya</Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#526346" />
        </View>
      ) : (
        <FlatList
          data={designs as FinishedDesignItem[]}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => <FinishedDesignCard item={item} />} 
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-20">
              <Ionicons name="color-palette-outline" size={80} color="#CBD5E0" />
              <Text className="text-xl font-rubik-bold text-gray-500 mt-4">Belum Ada Desain</Text>
              <Text className="text-base text-gray-400 mt-2 text-center">
                Buat dan finalisasi desain di editor baju untuk menyimpannya di sini.
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};
export default MyDesignsScreen;