import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, ActivityIndicator
} from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useGlobalContext } from '@/lib/global-provider'
import { useAppwrite } from '@/lib/useAppwrite'
import { getUserAddresses, addUserAddress, deleteUserAddress } from '@/lib/appwrite'
import { Ionicons } from '@expo/vector-icons'

const AddressManagerScreen = () => {
    // --- PERBAIKAN DI SINI ---
    const { user, refetch: refetchUser } = useGlobalContext(); // Menggunakan 'refetch' dan memberi alias 'refetchUser'
    const { fromCheckout } = useLocalSearchParams();

    const { data: addresses, loading, refetch } = useAppwrite({
        fn: () => getUserAddresses(user!.$id),
        skip: !user
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [newAddressLabel, setNewAddressLabel] = useState('');
    const [newAddressDetail, setNewAddressDetail] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSelectAddress = (address: { label: string, detail: string }) => {
        if (fromCheckout) {
             router.back();
        }
    };

    const handleAddAddress = async () => {
        if (!newAddressLabel || !newAddressDetail) {
            Alert.alert("Error", "Label dan Detail alamat tidak boleh kosong.");
            return;
        }
        setIsSaving(true);
        try {
            await addUserAddress(user!.$id, { label: newAddressLabel, detail: newAddressDetail });
            setModalVisible(false);
            setNewAddressLabel('');
            setNewAddressDetail('');
            refetch(); 
        } catch (error: any) {
            Alert.alert("Gagal Menyimpan", error.message);
        } finally {
            setIsSaving(false);
        }
    }
    
    const handleDeleteAddress = (address: { label: string, detail: string }) => {
        Alert.alert("Hapus Alamat", `Yakin ingin menghapus alamat "${address.label}"?`, [
            { text: "Batal", style: "cancel" },
            { text: "Hapus", style: "destructive", onPress: async () => {
                try {
                    await deleteUserAddress(user!.$id, address);
                    refetch();
                } catch (error: any) {
                    Alert.alert("Gagal Menghapus", error.message);
                }
            }}
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
                    <Ionicons name="arrow-back" size={28} color="#191D31" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pilih Alamat</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading ? <ActivityIndicator size="large" style={{marginTop: 50}}/> : (
                <FlatList
                    data={addresses}
                    keyExtractor={(item) => item.label + item.detail}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.addressCard} onPress={() => handleSelectAddress(item)}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="location-sharp" size={24} color="#526346"/>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.addressLabel}>{item.label}</Text>
                                <Text style={styles.addressDetail}>{item.detail}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDeleteAddress(item)} style={{padding: 8}}>
                                <Ionicons name="trash-outline" size={22} color="#E53935"/>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                    ListFooterComponent={
                        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                            <Ionicons name="add" size={24} color="white"/>
                            <Text style={styles.addButtonText}>Tambah Alamat Baru</Text>
                        </TouchableOpacity>
                    }
                    contentContainerStyle={{ padding: 20 }}
                />
            )}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Alamat Baru</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Label (Contoh: Rumah, Kantor)"
                            value={newAddressLabel}
                            onChangeText={setNewAddressLabel}
                        />
                        <TextInput
                            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                            placeholder="Detail Alamat Lengkap"
                            value={newAddressDetail}
                            onChangeText={setNewAddressDetail}
                            multiline
                        />
                        <TouchableOpacity 
                            style={[styles.saveButton, isSaving && {backgroundColor: '#AAB1A5'}]} 
                            onPress={handleAddAddress}
                            disabled={isSaving}
                        >
                            {isSaving ? <ActivityIndicator color="white"/> : <Text style={styles.saveButtonText}>Simpan</Text>}
                        </TouchableOpacity>
                         <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Batal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#EEE' },
    headerTitle: { fontSize: 22, fontFamily: 'Rubik-ExtraBold', color: '#191D31' },
    addressCard: { flexDirection: 'row', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
    iconContainer: { marginRight: 16, backgroundColor: '#EFF2ED', padding: 12, borderRadius: 99 },
    addressLabel: { fontSize: 16, fontFamily: 'Rubik-Bold', color: '#333' },
    addressDetail: { fontSize: 14, color: '#666', marginTop: 4 },
    addButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#526346', padding: 16, borderRadius: 12, marginTop: 8 },
    addButtonText: { color: 'white', fontSize: 16, fontFamily: 'Rubik-Bold', marginLeft: 8 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontFamily: 'Rubik-Bold', marginBottom: 20 },
    input: { width: '100%', borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 16 },
    saveButton: { backgroundColor: '#526346', padding: 16, borderRadius: 8, width: '100%', alignItems: 'center' },
    saveButtonText: { color: 'white', fontSize: 16, fontFamily: 'Rubik-Bold' },
    cancelButton: { marginTop: 12, padding: 8 },
    cancelButtonText: { fontSize: 16, color: '#888' },
});

export default AddressManagerScreen;