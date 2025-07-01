import {
  Account,
  Avatars,
  Client,
  Databases,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

// =================================================================
// KONFIGURASI APPWRITE
// =================================================================
export const config = {
  platform: "com.unram.tokotoroti",
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
  storageBucketId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'default',
  collectionId: process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID,
  //toko
  usersProfileCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_PROFILE_COLLECTION_ID,
  galleriesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
  reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
  agentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID,
  stokCollectionId: process.env.EXPO_PUBLIC_APPWRITE_STOK_COLLECTION_ID,
  keranjangCollectionId: process.env.EXPO_PUBLIC_APPWRITE_KERANJANG_COLLECTION_ID,
  ordersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID,
  orderItemsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ORDER_ITEMS_COLLECTION_ID,

};

// Inisialisasi Klien Appwrite
const client = new Client();
if (config.endpoint && config.projectId && config.platform) {
    client
      .setEndpoint(config.endpoint)
      .setProject(config.projectId)
      .setPlatform(config.platform);
} else {
    console.error("Konfigurasi Appwrite tidak lengkap. Silakan periksa variabel lingkungan Anda.");
}

export const avatars = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// =================================================================
// FUNGSI OTENTIKASI & PENGGUNA (Authentication & User)
// =================================================================

/**
 * Membuat pengguna baru dan menyimpan profilnya di Database.
 */
export async function createUser(email: string, password: string, name: string) {
  try {
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw new Error("Gagal membuat akun.");

    const avatarUrl = avatars.getInitials(name);

    // Saat membuat user, inisialisasi 'addresses' dengan array kosong
    await databases.createDocument(
      config.databaseId!,
      config.usersProfileCollectionId!,
      newAccount.$id,
      {
        accountId: newAccount.$id,
        email,
        name,
        avatar: avatarUrl.toString(),
        userType: 'user',
        addresses: [], // Inisialisasi 'addresses' sebagai array kosong
      }
    );

    return newAccount;
  } catch (error: any) {
    console.error("Error saat membuat pengguna:", error);
    throw new Error(error.message || "Gagal membuat akun.");
  }
}

/**
 * Login pengguna dengan membuat sesi baru.
 */
export async function loginUser(email: string, password: string) {
  try {
    // Menghapus sesi lama untuk memastikan login yang bersih
    await account.deleteSession("current").catch(() => {});
    return await account.createEmailPasswordSession(email, password);
  } catch (error: any) {
    console.error("Error saat proses login:", error);
    throw new Error(error.message || "Email atau password salah.");
  }
}

/**
 * Mengambil data pengguna yang sedang login.
 */
export async function getCurrentUser() {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) return null;

    const userDoc = await databases.getDocument(
      config.databaseId!,
      config.usersProfileCollectionId!,
      currentAccount.$id
    );

    return {
      $id: userDoc.$id,
      name: userDoc.name,
      email: userDoc.email,
      avatar: userDoc.avatar,
      userType: userDoc.userType as 'user' | 'admin' | 'agent',
      alamat: userDoc.alamat,
      noHp: userDoc.noHp || '',
    };
  } catch (error) {
    console.log("Tidak ada sesi aktif atau profil pengguna tidak ditemukan.");
    return null;
  }
}

/**
 * Logout pengguna dengan menghapus sesi saat ini.
 */
export async function logout() {
  try {
    return await account.deleteSessions();
  } catch (error: any) {
    console.error("Error saat logout:", error.message);
    throw new Error("Gagal untuk logout.");
  }
}


// =================================================================
// FUNGSI PRODUK (PROPERTIES)
// =================================================================

export async function getLatestProperties() {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.stokCollectionId!,
      [Query.orderDesc("$createdAt"), Query.limit(5)]
    );
    return result.documents;
  } catch (error) {
    console.error("Error saat mengambil produk terbaru:", error);
    return [];
  }
}

export async function getProperties({ filter, query, limit }: { filter?: string; query?: string; limit?: number; }) {
  try {
    const queries: any[] = [Query.orderDesc("$createdAt")];
    if (filter && filter !== "All") queries.push(Query.equal("type", filter));
    if (query) queries.push(Query.search("name", query));
    if (limit) queries.push(Query.limit(limit));
    return (await databases.listDocuments(config.databaseId!, config.stokCollectionId!, queries)).documents;
  } catch (error) {
    console.error("Error saat mengambil produk:", error);
    return [];
  }
}

export async function getPropertyById({ id }: { id: string }) {
  try {
    const propertyDoc = await databases.getDocument(config.databaseId!, config.stokCollectionId!, id);
    if (!propertyDoc) return null;

    if (propertyDoc.agent?.$id) {
      propertyDoc.agent = await databases.getDocument(config.databaseId!, config.agentsCollectionId!, propertyDoc.agent.$id);
    }
    if (Array.isArray(propertyDoc.reviews) && propertyDoc.reviews.length > 0) {
      propertyDoc.reviews = await Promise.all(propertyDoc.reviews.map((review: any) =>
        databases.getDocument(config.databaseId!, config.reviewsCollectionId!, review.$id)
      ));
    }
    if (Array.isArray(propertyDoc.gallery) && propertyDoc.gallery.length > 0) {
      propertyDoc.gallery = await Promise.all(propertyDoc.gallery.map((image: any) =>
        databases.getDocument(config.databaseId!, config.galleriesCollectionId!, image.$id)
      ));
    }
    return propertyDoc;
  } catch (error) {
    console.error(`Error saat mengambil produk berdasarkan ID (${id}):`, error);
    return null;
  }
}

// =================================================================
// FUNGSI KERANJANG BELANJA (CART)
// =================================================================

export async function addToCart(userId: string, productId: string) {
  try {
    const existingItems = await databases.listDocuments(
      config.databaseId!,
      config.keranjangCollectionId!,
      [Query.equal("userId", userId), Query.equal("productId", productId), Query.limit(1)]
    );

    if (existingItems.documents.length > 0) {
      const item = existingItems.documents[0];
      return await databases.updateDocument(
        config.databaseId!,
        config.keranjangCollectionId!,
        item.$id,
        { quantity: item.quantity + 1 }
      );
    } else {
      return await databases.createDocument(
        config.databaseId!,
        config.keranjangCollectionId!,
        ID.unique(),
        { userId, productId, quantity: 1 }
      );
    }
  } catch (error: any) {
    console.error("Error saat menambah ke keranjang:", error);
    throw new Error(error.message || "Gagal menambahkan ke keranjang.");
  }
}

export async function getCartItems(userId: string) {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.keranjangCollectionId!,
      [Query.equal("userId", userId), Query.orderDesc("$createdAt")]
    );
    return result.documents;
  } catch (error) {
    console.error('Error saat mengambil item keranjang:', error);
    return [];
  }
}

// =================================================================
// FUNGSI ALAMAT PENGGUNA (USER ADDRESS)
// =================================================================

/**
 * Mengambil daftar alamat pengguna dan mengubahnya dari string JSON menjadi objek.
 */
export async function getUserAddresses(userId: string): Promise<Array<{ label: string, detail: string }>> {
    try {
        const userDoc = await databases.getDocument(config.databaseId!, config.usersProfileCollectionId!, userId);
        if (userDoc.addresses && Array.isArray(userDoc.addresses)) {
          // Parse setiap string JSON di dalam array menjadi objek
          return userDoc.addresses.map((addrStr: string) => JSON.parse(addrStr));
        }
        return [];
    } catch (error) {
        console.error("Gagal mengambil alamat:", error);
        return [];
    }
}

/**
 * Menambahkan alamat baru untuk pengguna dengan mengubah objek menjadi string JSON.
 */
export async function addUserAddress(userId: string, newAddress: { label: string, detail: string }) {
    try {
        const userDoc = await databases.getDocument(config.databaseId!, config.usersProfileCollectionId!, userId);
        const currentAddresses = userDoc.addresses || [];
        
        // Ubah objek alamat baru menjadi string sebelum menambahkannya ke array
        const updatedAddresses = [...currentAddresses, JSON.stringify(newAddress)];
        
        await databases.updateDocument(config.databaseId!, config.usersProfileCollectionId!, userId, { addresses: updatedAddresses });
        return updatedAddresses.map((addr: string) => JSON.parse(addr));
    } catch (error: any) {
        console.error("Gagal menambah alamat:", error);
        throw new Error(error.message);
    }
}

/**
 * Menghapus alamat dari daftar pengguna.
 */
export async function deleteUserAddress(userId: string, addressToDelete: { label: string, detail: string }) {
    try {
        const userDoc = await databases.getDocument(config.databaseId!, config.usersProfileCollectionId!, userId);
        const currentAddresses = userDoc.addresses || [];

        // Ubah objek yang akan dihapus menjadi string untuk perbandingan
        const addressToDeleteString = JSON.stringify(addressToDelete);
        const updatedAddresses = currentAddresses.filter(
            (addrStr: string) => addrStr !== addressToDeleteString
        );

        await databases.updateDocument(config.databaseId!, config.usersProfileCollectionId!, userId, { addresses: updatedAddresses });
        return updatedAddresses.map((addr: string) => JSON.parse(addr));
    } catch (error: any) {
        console.error("Gagal menghapus alamat:", error);
        throw new Error(error.message);
    }
}

// =================================================================
// FUNGSI PESANAN (ORDERS)
// =================================================================

export async function createOrder(
    userId: string, 
    shippingAddress: string, 
    totalAmount: number,
    cartItems: any[]
) {
    if (!cartItems || cartItems.length === 0) {
        throw new Error("Keranjang kosong, tidak bisa membuat pesanan.");
    }

    try {
        const newOrder = await databases.createDocument(
            config.databaseId!,
            config.ordersCollectionId!,
            ID.unique(),
            { userId, shippingAddress, totalAmount, status: 'pending' }
        );
        if (!newOrder) throw new Error("Gagal membuat data pesanan.");

        const itemPromises = cartItems.map(item => 
            Promise.all([
                databases.createDocument(
                    config.databaseId!,
                    config.orderItemsCollectionId!,
                    ID.unique(),
                    {
                        orderId: newOrder.$id,
                        productId: item.productId,
                        quantity: item.quantity,
                        priceAtPurchase: item.product?.price || 0
                    }
                ),
                databases.deleteDocument(config.databaseId!, config.keranjangCollectionId!, item.$id)
            ])
        );

        await Promise.all(itemPromises);
        return newOrder.$id;

    } catch (error: any) {
        console.error("Error saat membuat pesanan:", error);
        throw new Error(error.message || "Gagal membuat pesanan.");
    }
}

// =================================================================
// FUNGSI AGEN
// =================================================================

/**
 * Mendaftarkan user sebagai agen baru.
 */
export async function registerAsAgent(userId: string, agentData: { storeName: string; phoneNumber: string; }) {
  try {
    // 1. Buat dokumen baru di collection 'agents'
    await databases.createDocument(
      config.databaseId!,
      config.agentsCollectionId!,
      userId, // Gunakan ID user sebagai ID dokumen agen untuk relasi 1-to-1
      {
        name: agentData.storeName,
        phone: agentData.phoneNumber,
        owner: userId, // Relasi ke dokumen user
      }
    );

    // 2. Update userType di collection 'users' menjadi 'agent'
    await databases.updateDocument(
      config.databaseId!,
      config.usersProfileCollectionId!,
      userId,
      {
        userType: 'agent'
      }
    );

  } catch (error: any) {
    console.error("Error saat mendaftar sebagai agen:", error);
    // Cek jika error karena agen sudah ada
    if (error.code === 409) { // 409 Conflict (Document already exists)
      throw new Error("Anda sudah terdaftar sebagai agen.");
    }
    throw new Error(error.message || "Gagal mendaftar sebagai agen.");
  }
}



/**
 * Mengambil SEMUA item dari keranjang, termasuk kustom dan standar.
 */
// export async function getCartItems(userId: string) {
//   try {
//     const cartItems = await databases.listDocuments(
//       config.databaseId!,
//       config.keranjangCollectionId!,
//       [Query.equal("userId", userId)]
//     );

//     const mergedItemsPromises = cartItems.documents.map(async (item) => {
//       if (item.isCustom) {
//         // Logika untuk item kustom (sudah benar)
//         return {
//           ...item,
//           product: {
//             $id: `custom_${item.$id}`,
//             name: item.customProductName,
//             image: item.customProductImage,
//             price: item.customProductPrice,
//           },
//         };
//       } else {
//         // ---- PERBAIKAN UTAMA ADA DI SINI ----
//         // Pastikan productId adalah string yang valid sebelum memanggil getPropertyById
//         if (typeof item.productId === 'string' && item.productId.length > 0) {
//           try {
//             const product = await getPropertyById({ id: item.productId });
//             if (product) {
//               return { ...item, product };
//             }
//             // Jika produk tidak ditemukan (misalnya, telah dihapus), abaikan item ini.
//             console.warn(`Produk dengan ID ${item.productId} tidak ada di database.`);
//             return null;
//           } catch (e) {
//             console.error(`Gagal memuat produk ID ${item.productId} untuk item keranjang ${item.$id}:`, e);
//             return null;
//           }
//         } else {
//           // Abaikan item keranjang jika tidak memiliki productId yang valid
//           console.warn(`Item keranjang ${item.$id} tidak memiliki productId yang valid dan akan diabaikan.`);
//           return null;
//         }
//       }
//     });

//     const mergedItems = (await Promise.all(mergedItemsPromises)).filter(item => item !== null);
//     return mergedItems as any[];
//   } catch (error: any) {
//     console.error("Error mengambil item keranjang:", error);
//     throw new Error(error.message || "Gagal mengambil item keranjang.");
//   }
// }

// /**
//  * Fungsi createOrder juga perlu diupdate untuk menangani item kustom.
//  */
// export const createOrder = async (userId: string, shippingAddress: string, totalAmount: number, cartItems: any[]) => {
//   try {
//     const newOrder = await databases.createDocument(config.databaseId!, config.ordersCollectionId!, ID.unique(), {
//       userId,
//       shippingAddress,
//       totalAmount,
//       status: 'pending',
//     });

//     const orderItemPromises = cartItems.map((item) => {
//       return databases.createDocument(config.databaseId!, config.orderItemsCollectionId!, ID.unique(), {
//         orderId: newOrder.$id,
//         quantity: item.quantity,
//         priceAtPurchase: item.product.price,
//         productId: item.isCustom ? null : item.product.$id,
//         productName: item.product.name,
//         productImageUrl: item.product.image,
//       });
//     });

//     await Promise.all(orderItemPromises);

//     const itemsToDelete = cartItems.filter(item => item.$id);
//     if (itemsToDelete.length > 0) {
//       const deletePromises = itemsToDelete.map(item => 
//         databases.deleteDocument(config.databaseId!, config.keranjangCollectionId!, item.$id)
//       );
//       await Promise.all(deletePromises);
//     }

//     return newOrder.$id;
//   } catch (error: any) {
//     console.error("Gagal membuat pesanan:", error);
//     throw new Error(error.message);
//   }
// };

export async function getAgentDashboardStats(agentId: string) {
  try {
    // 1. Ambil semua produk milik agen
    const productsResponse = await databases.listDocuments(
      config.databaseId!,
      config.stokCollectionId!,
      [Query.equal('agentId', agentId), Query.limit(5000)] // Ambil semua produk agen
    );
    const agentProducts = productsResponse.documents;
    const totalProducts = productsResponse.total;
    const agentProductIds = new Set(agentProducts.map(p => p.$id));

    // Jika agen tidak punya produk, langsung kembalikan statistik nol
    if (agentProductIds.size === 0) {
      return { totalProducts: 0, pendingOrders: 0, totalSales: 0, totalOrders: 0, completedOrders: 0 };
    }

    // 2. Ambil semua item pesanan yang mengandung produk dari agen ini
    const orderItemsResponse = await databases.listDocuments(
      config.databaseId!,
      config.orderItemsCollectionId!,
      [Query.equal('productId', Array.from(agentProductIds)), Query.limit(5000)] // Filter berdasarkan produk agen
    );
    const agentOrderItems = orderItemsResponse.documents;

    // 3. Dapatkan ID pesanan yang unik dari item-item tersebut
    const relevantOrderIds = [...new Set(agentOrderItems.map(item => item.orderId))];

    // Jika tidak ada pesanan terkait, kembalikan statistik nol untuk pesanan
    if (relevantOrderIds.length === 0) {
        return { totalProducts, pendingOrders: 0, totalSales: 0, totalOrders: 0, completedOrders: 0 };
    }
    
    // 4. Ambil semua dokumen pesanan yang relevan
    const ordersResponse = await databases.listDocuments(
        config.databaseId!,
        config.ordersCollectionId!,
        [Query.equal('$id', relevantOrderIds), Query.limit(relevantOrderIds.length)]
    );
    const agentOrders = ordersResponse.documents;

    // 5. Hitung statistik dari pesanan yang relevan
    let totalSales = 0;

    agentOrders.forEach(order => {
        // Hanya hitung penjualan dari pesanan yang sudah selesai (delivered)
        if (order.status === 'delivered') {
            const itemsInThisOrder = agentOrderItems.filter(item => item.orderId === order.$id);
            itemsInThisOrder.forEach(item => {
                const price = item.priceAtPurchase * item.quantity;
                totalSales += price;
            });
        }
    });
    
    const totalOrders = agentOrders.length;
    const pendingOrders = agentOrders.filter(o => o.status === 'pending').length;
    const completedOrders = agentOrders.filter(o => o.status === 'delivered').length;
    
    return { totalProducts, pendingOrders, totalSales, totalOrders, completedOrders };

  } catch (error) {
    console.error("Error fetching agent dashboard stats:", error);
    return { totalProducts: 0, pendingOrders: 0, totalSales: 0, totalOrders: 0, completedOrders: 0 };
  }
}