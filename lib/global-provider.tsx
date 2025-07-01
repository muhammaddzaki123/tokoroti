import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { account, avatars, config, databases, getCurrentUser, ID } from "./appwrite";

interface GlobalContextType {
  isLogged: boolean;
  user: User | null;
  loading: boolean;
  refetch: () => void;
}

// Interface User (pastikan ini cocok dengan struktur data Anda)
interface User {
  $id: string;
  name: string;
  email: string;
  avatar: string;
  userType: 'user' | 'admin' | 'agent';
  alamat: string;
  noHp: string;
  accountId: string;
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
      const currentAccount = await account.get();
      
      if (currentAccount) {
        let userProfileDoc = await getCurrentUser();

        // Jika profil tidak ada di database (kasus login pertama kali via OAuth)
        if (!userProfileDoc) {
          console.log("Profil database tidak ditemukan. Membuat profil baru...");
          const avatarUrl = avatars.getInitials(currentAccount.name);
          
          userProfileDoc = await databases.createDocument(
            config.databaseId!,
            config.usersProfileCollectionId!,
            currentAccount.$id,
            {
              accountId: currentAccount.$id,
              email: currentAccount.email,
              name: currentAccount.name,
              avatar: avatarUrl.toString(),
              userType: 'user',
              addresses: [],
            }
          );
        }
        
        // --- PERBAIKAN UTAMA DI SINI ---
        const formattedUser: User = {
            $id: userProfileDoc.$id,
            accountId: userProfileDoc.accountId,
            name: userProfileDoc.name,
            email: userProfileDoc.email,
            avatar: userProfileDoc.avatar,
            userType: userProfileDoc.userType,
            alamat: userProfileDoc.alamat,
            noHp: userProfileDoc.noHp,
        };

        setUser(formattedUser);
        setIsLogged(true);

      } else {
        // Tidak ada sesi aktif
        setUser(null);
        setIsLogged(false);
      }
    } catch (error) {
      console.log("Tidak ada sesi pengguna aktif atau terjadi error:", error);
      setUser(null);
      setIsLogged(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        isLogged,
        user,
        loading,
        refetch: fetchUserData,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context)
    throw new Error("useGlobalContext must be used within a GlobalProvider");

  return context;
};

export default GlobalProvider;