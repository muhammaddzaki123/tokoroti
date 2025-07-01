import icons from "@/constants/icons";
import { account } from "@/lib/appwrite";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Semua field wajib diisi.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      await account.updatePassword(newPassword, oldPassword);
      Alert.alert("Berhasil", "Password berhasil diganti.");
      router.back();
    } catch (err: any) {
      Alert.alert("Gagal", err.message || "Gagal mengganti password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView contentContainerClassName="pb-32 px-7">
        <View className="flex flex-row items-center justify-between mt-5">
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={icons.leftArrow} className="size-6" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold">Ganti Password</Text>
          <View style={{ width: 24 }} />
        </View>

        <View className="flex flex-col mt-10 gap-5">
          <View>
            <Text className="text-lg font-rubik-bold mb-2">Password Lama</Text>
            <TextInput
              className="border border-primary-200 rounded-xl px-4 py-3 text-lg font-rubik-regular bg-white"
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Password lama"
              secureTextEntry
              editable={!loading}
            />
          </View>
          <View>
            <Text className="text-lg font-rubik-bold mb-2">Password Baru</Text>
            <TextInput
              className="border border-primary-200 rounded-xl px-4 py-3 text-lg font-rubik-regular bg-white"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Password baru"
              secureTextEntry
              editable={!loading}
            />
          </View>
          <View>
            <Text className="text-lg font-rubik-bold mb-2">Konfirmasi Password Baru</Text>
            <TextInput
              className="border border-primary-200 rounded-xl px-4 py-3 text-lg font-rubik-regular bg-white"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Konfirmasi password baru"
              secureTextEntry
              editable={!loading}
            />
          </View>
        </View>

        <TouchableOpacity
          className="bg-primary-500 rounded-xl py-3 mt-10 flex flex-row items-center justify-center"
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text className="text-white text-lg font-rubik-bold">
            {loading ? "Menyimpan..." : "Ganti Password"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChangePassword;