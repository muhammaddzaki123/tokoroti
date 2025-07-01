import icons from '@/constants/icons';
import { useGlobalContext } from '@/lib/global-provider';
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ProfileDetailItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <View className="flex-row items-center py-2">
    <Text className="text-lg font-rubik-bold w-32">{label}:</Text>
    <Text className="text-lg font-rubik-regular">{value ?? 'Tidak ada'}</Text>
  </View>
);

const ProfileDetail = () => {
  const { user } = useGlobalContext();

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32"
      >
        {/* Header */}
        <View className="px-5">
          <View className="flex flex-row items-center justify-between mt-5">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#191D31" />
            </TouchableOpacity>
            <Text className="text-xl font-rubik-bold text-black-300">Detail Profile</Text>
            <View style={{ width: 24 }} />
          </View>
        </View>

        {/* Profile Avatar & Name */}
        <View className="px-5 mt-8">
          <View className="flex flex-col items-center">
            <Image
              source={{
                uri: !user?.avatar
                  ? 'https://via.placeholder.com/150'
                  : user.avatar,
              }}
              className="size-36 rounded-full"
            />
            <Text className="text-2xl font-rubik-bold text-black-300 mt-3">{user?.name}</Text>
            {user?.userType && (
              <View className="bg-primary-50 rounded-full px-4 py-1 mt-2">
                <Text className="text-primary-300 font-rubik-medium text-sm">
                  {user.userType}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Profile Information */}
        <View className="px-5 mt-8">
          <View className="flex flex-row items-center justify-between mb-5">
            <Text className="text-xl font-rubik-bold text-black-300">
              Informasi Personal
            </Text>
          </View>
          <ProfileDetailItem label="Nama Lengkap" value={user?.name} />
          <ProfileDetailItem label="Email" value={user?.email} />
          <ProfileDetailItem label="Tipe User" value={user?.userType} />
          <ProfileDetailItem label="Alamat" value={user?.alamat} />
          <ProfileDetailItem label="No HP" value={user?.noHp} />
        </View>

        {/* Action Buttons */}
        <View className="px-5 mt-8">
          <TouchableOpacity
            className="bg-primary-300 rounded-lg py-4 mb-4 flex flex-row items-center justify-center"
            onPress={() => router.push('/edit-profile')}
          >
            <Text className="text-white text-base font-rubik-bold">Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-white border border-primary-100 rounded-lg py-4 flex flex-row items-center justify-center shadow-sm"
            onPress={() => router.push('/change-password')}
          >
            <Image source={icons.lock} className="size-5 mr-2" />
            <Text className="text-primary-300 text-base font-rubik-bold">Ganti Password</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Info Cards */}
        <View className="px-5 mt-8">
          <View className="flex flex-row items-center justify-between mb-5">
            <Text className="text-xl font-rubik-bold text-black-300">
              Status Akun
            </Text>
          </View>
          <View className="flex flex-row gap-3">
            <View className="flex-1 bg-green-50 rounded-lg p-4 border border-green-100">
              <View className="flex flex-row items-center">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <Text className="text-green-600 font-rubik-bold text-sm">✓</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-green-600 font-rubik-bold text-base">Aktif</Text>
                  <Text className="text-green-500 font-rubik text-sm">Status Akun</Text>
                </View>
              </View>
            </View>
            <View className="flex-1 bg-blue-50 rounded-lg p-4 border border-blue-100">
              <View className="flex flex-row items-center">
                <View className="bg-blue-100 rounded-full p-2 mr-3">
                  <Image source={icons.bell} className="size-4 tint-blue-600" />
                </View>
                <View className="flex-1">
                  <Text className="text-blue-600 font-rubik-bold text-base">Terverifikasi</Text>
                  <Text className="text-blue-500 font-rubik text-sm">Keamanan</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileDetail;