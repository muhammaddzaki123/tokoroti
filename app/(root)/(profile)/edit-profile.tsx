import icons from '@/constants/icons';
// Pastikan ID dan semua variabel config diimpor dengan benar
import { config, databases, storage, ID } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator // Tambahkan ActivityIndicator
} from "react-native";

const EditProfile = () => {
  const { user, refetch } = useGlobalContext();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [userType, setUserType] = useState(user?.userType ?? '');
  const [alamat, setAlamat] = useState(user?.alamat ?? '');
  const [noHp, setNoHp] = useState(user?.noHp ?? '');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // State khusus untuk upload gambar

  const handleSave = async () => {
    // ... (fungsi ini tetap sama, tidak perlu diubah)
    if (!name.trim() || !email.trim() || !userType.trim()) {
      Alert.alert("Error", "Nama, Email, dan User Type tidak boleh kosong.");
      return;
    }
    setLoading(true);
    try {
      await databases.updateDocument(
        config.databaseId!,
        config.usersProfileCollectionId!,
        user!.$id,
        { name, email, userType, alamat, noHp }
      );
      await refetch();
      Alert.alert("Berhasil", "Profil berhasil diperbarui.");
      router.back();
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    // 1. Validasi konfigurasi Appwrite sebelum melakukan apapun
    if (!config.endpoint || !config.projectId || !config.storageBucketId) {
        Alert.alert("Error Konfigurasi", "Konfigurasi Appwrite tidak lengkap. Periksa file .env Anda.");
        return;
    }
    
    setIsUploading(true); // Mulai loading

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Izin Diperlukan", "Anda perlu memberikan izin galeri foto.");
        setIsUploading(false); // Hentikan loading
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsUploading(false); // Hentikan loading jika dibatalkan
        return;
      }
      
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      
      const file = {
        name: `avatar-${user?.$id}-${Date.now()}.jpg`,
        type: blob.type || 'image/jpeg',
        uri: asset.uri,
        size: blob.size,
      };

      // 2. Unggah file
      const uploadedFile = await storage.createFile(
        config.storageBucketId!,
        ID.unique(),
        file
      );

      // 3. Buat URL secara manual (Metode Paling Andal)
      const fileUrl = `${config.endpoint}/storage/buckets/${config.storageBucketId}/files/${uploadedFile.$id}/view?project=${config.projectId}`;

      // 4. Simpan URL string yang sudah benar ke database
      await databases.updateDocument(
        config.databaseId!,
        config.usersProfileCollectionId!,
        user!.$id,
        { avatar: fileUrl } 
      );
      
      // 5. Muat ulang data pengguna
      await refetch();
      Alert.alert("Berhasil!", "Gambar profil berhasil diperbarui.");

    } catch (error: any) {
      console.error('Gagal memperbarui gambar profil:', error);
      Alert.alert("Error", `Gagal memperbarui gambar profil: ${error.message}`);
    } finally {
      setIsUploading(false); // Hentikan loading di akhir proses
    }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-7"
      >
        <View className="flex flex-row items-center justify-between mt-5">
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={icons.leftArrow} className="size-6" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold">Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <View className="flex flex-row justify-center mt-5">
          <View className="flex flex-col items-center relative mt-5">
            <Image
              source={{ uri: user?.avatar || 'https://via.placeholder.com/150' }}
              onError={() => console.error('Gagal memuat gambar profil')}
              className="size-44 relative rounded-full"
            />
            {/* Tampilkan Indikator Loading di atas gambar saat mengunggah */}
            {isUploading && (
                <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 100}}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
            )}
            <TouchableOpacity onPress={handleImagePick} disabled={isUploading} className="absolute bottom-11 right-2">
              <Image source={icons.edit} className="size-9" />
            </TouchableOpacity>
            <Text className="text-2xl font-rubik-bold mt-2">{user?.name}</Text>
          </View>
        </View>

        <View className="flex flex-col mt-10 gap-5">
          {/* ... (Kolom input lainnya tetap sama) ... */}
          <View>
            <Text className="text-lg font-rubik-bold mb-2">Nama</Text>
            <TextInput
              className="border border-primary-200 rounded-xl px-4 py-3 text-lg font-rubik-regular bg-white"
              value={name}
              onChangeText={setName}
              placeholder="Nama"
              editable={!loading}
            />
          </View>
          <View>
            <Text className="text-lg font-rubik-bold mb-2">Email</Text>
            <TextInput
              className="border border-primary-200 rounded-xl px-4 py-3 text-lg font-rubik-regular bg-white"
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>
          <View>
            <Text className="text-lg font-rubik-bold mb-2">User Type</Text>
            <TextInput
              className="border border-primary-200 rounded-xl px-4 py-3 text-lg font-rubik-regular bg-white"
              value={userType}
              onChangeText={setUserType}
              placeholder="User Type"
              editable={!loading}
            />
          </View>
          <View>
            <Text className="text-lg font-rubik-bold mb-2">Alamat</Text>
            <TextInput
              className="border border-primary-200 rounded-xl px-4 py-3 text-lg font-rubik-regular bg-white"
              value={alamat}
              onChangeText={setAlamat}
              placeholder="Alamat"
              editable={!loading}
            />
          </View>
          <View>
            <Text className="text-lg font-rubik-bold mb-2">No HP</Text>
            <TextInput
              className="border border-primary-200 rounded-xl px-4 py-3 text-lg font-rubik-regular bg-white"
              value={noHp}
              onChangeText={setNoHp}
              placeholder="No HP"
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>
        </View>

        <TouchableOpacity
          className="bg-primary-500 rounded-xl py-3 mt-10 flex flex-row items-center justify-center"
          onPress={handleSave}
          disabled={loading}
        >
          <Text className="text-white text-lg font-rubik-bold">
            {loading ? "Menyimpan..." : "Simpan"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfile;