import { CameraView, useCameraPermissions } from 'expo-camera';
import { Link, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    setScanned(false);
  }, []);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Memuat izin kamera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          Kami memerlukan izin kamera untuk memindai QR Code.
        </Text>
        <Button onPress={requestPermission} title="Berikan Izin Kamera" />
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!scanned) {
      setScanned(true);
      console.log(`QR Code scanned: type ${type}, data ${data}`);

    router.push(`/(scanner)/${data}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pindai QR Code Video</Text>
      <View style={styles.cameraContainer}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFillObject}
        />
        {scanned && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>QR Code Berhasil Dipindai!</Text>
            <Button title="Pindai Lagi" onPress={() => setScanned(false)} />
          </View>
        )}
      </View>
      <Text style={styles.instructionText}>
        Arahkan kamera ke QR Code yang berisi ID video Appwrite.
      </Text>
      <Link href="/" style={styles.backButton}>
        <Text style={styles.backButtonText}>Kembali ke Home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  cameraContainer: {
    width: width * 0.8,
    height: width * 0.8,
    overflow: 'hidden',
    borderRadius: 15,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  instructionText: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 30,
    backgroundColor: '#526346',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});