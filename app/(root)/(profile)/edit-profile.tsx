import icons from '@/constants/icons';
import { config, databases, storage } from '@/lib/appwrite';
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
} from "react-native";

const EditProfile = () => {
  const { user, refetch } = useGlobalContext();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [userType, setUserType] = useState(user?.userType ?? '');
  const [alamat, setAlamat] = useState(user?.alamat ?? '');
  const [noHp, setNoHp] = useState(user?.noHp ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
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
        {
          name,
          email,
          userType,
          alamat,
          noHp,
        }
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
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("Permission Required", "You need to grant access to your photos to change profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        Alert.alert("Uploading...", "Please wait while we update your profile picture.");

        const file = {
          name: `avatar-${user?.$id}-${Date.now()}.jpg`,
          type: 'image/jpeg',
          uri: result.assets[0].uri,
          size: await new Promise<number>((resolve) => {
            fetch(result.assets[0].uri)
              .then((response) => response.blob())
              .then((blob) => resolve(blob.size))
          })
        };

        const uploadedFile = await storage.createFile(
          config.storageBucketId!,
          'unique()',
          file
        );

        const fileUrl = storage.getFileView(config.storageBucketId!, uploadedFile.$id);
        
        await databases.updateDocument(
          config.databaseId!,
          config.usersProfileCollectionId!,
          user!.$id,
          { avatar: fileUrl.href }
        );
        
        await refetch();

        Alert.alert("Success", "Profile picture updated successfully!");
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert("Error", "Failed to update profile picture. Please try again.");
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
              onError={() => console.error('Failed to load profile image')}
              className="size-44 relative rounded-full"
            />
            <TouchableOpacity onPress={handleImagePick} className="absolute bottom-11 right-2">
              <Image source={icons.edit} className="size-9" />
            </TouchableOpacity>
            <Text className="text-2xl font-rubik-bold mt-2">{user?.name}</Text>
          </View>
        </View>

        <View className="flex flex-col mt-10 gap-5">
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