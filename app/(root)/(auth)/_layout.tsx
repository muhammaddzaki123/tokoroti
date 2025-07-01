import { Redirect, Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";

import { useGlobalContext } from "@/lib/global-provider";

const AuthLayout = () => {
  const { loading, isLogged } = useGlobalContext();

  // Jika proses loading belum selesai, jangan tampilkan apa-apa
  // atau bisa juga tampilkan ActivityIndicator jika diinginkan
  if (loading) {
    return null; 
  }

  // Jika pengguna sudah login, arahkan langsung ke halaman utama
  if (isLogged) {
    return <Redirect href="/" />;
  }

  return (
    <>
      <Stack>
        <Stack.Screen
          name="sign-in"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="sign-up"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      <StatusBar backgroundColor="#FFFFFF" style="dark" />
    </>
  );
};

export default AuthLayout;