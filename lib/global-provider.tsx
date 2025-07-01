import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { account, avatars, config, databases, getCurrentUser } from "./appwrite";

// Interface User yang disesuaikan dengan data dari getCurrentUser
interface User {
  $id: string;
  name: string;
  email: string;
  avatar: string;
  userType: 'user' | 'admin' | 'agent';
  alamat: string;
  noHp: string;
}

interface GlobalContextType {
  isLogged: boolean;
  user: User | null;
  loading: boolean;
  refetch: () => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // getCurrentUser sudah mengembalikan data user yang siap pakai
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        // --- PERBAIKAN UTAMA DI SINI ---
        // Tidak perlu memformat ulang, langsung gunakan data dari currentUser
        setUser(currentUser as User);
        setIsLogged(true);
      } else {
        // Tidak ada sesi pengguna yang aktif
        setUser(null);
        setIsLogged(false);
      }
    } catch (error) {
      console.error("Gagal mengambil data pengguna:", error);
      setUser(null);
      setIsLogged(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Coba ambil data pengguna saat komponen pertama kali dimuat
    fetchUserData();
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        isLogged,
        user,
        loading,
        refetch: fetchUserData, // 'refetch' akan memanggil ulang fetchUserData
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context)
    throw new Error("useGlobalContext harus digunakan di dalam GlobalProvider");

  return context;
};

export default GlobalProvider;