import { config, databases, storage } from '@/lib/appwrite';
import { ResizeMode, Video } from 'expo-av';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof id === 'string') {
      fetchVideoDetails(id);
    } else {
      setLoading(false);
      setError('ID video dari QR Code tidak valid.');
    }
  }, [id]);

  const fetchVideoDetails = async (videoId: string) => {
    try {
      setLoading(true);
      setError(null);

      const videoDocument = await databases.getDocument(
        config.databaseId!,
        config.collectionId!,
        videoId
      );

      const fileId = videoDocument.fileId;

      if (!fileId) {
        throw new Error('Atribut "fileId" tidak ditemukan dalam dokumen.');
      }

      const filePreviewUrl = storage.getFileView(config.storageBucketId!, fileId);
      setVideoUrl(filePreviewUrl.href);
    } catch (err: any) {
      console.error('Gagal mengambil detail video:', err);
      setError('Gagal memuat video: ' + err.message);
      Alert.alert('Terjadi Kesalahan', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady && videoRef.current) {
      (async () => {
        try {
          await videoRef.current!.playAsync();
          await videoRef.current!.presentFullscreenPlayer();
        } catch (e) {
          console.error('Gagal memutar atau fullscreen:', e);
        }
      })();
    }
  }, [isReady]);

  if (loading) {
    return (
      <View style={styles.fullscreenContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Memuat video...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.fullscreenContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.backButtonContainer}>
          <Text onPress={() => router.back()} style={styles.backButton}>
            Kembali ke Scanner
          </Text>
        </View>
      </View>
    );
  }

  console.log(videoUrl);
  return (
    <View style={styles.fullscreenContainer}>
      <Stack.Screen options={{ title: 'Memutar Video', headerShown: false }} />
      {videoUrl ? (
        <Video
          ref={videoRef}
          style={styles.fullscreenVideo}
          source={{ uri: videoUrl }}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          useNativeControls
          isLooping
          onReadyForDisplay={() => setIsReady(true)}
          onError={(error) => {
          console.error("Video error:", error);
        }}
        />
      ) : (
        <Text style={styles.noVideoText}>Tidak ada URL video ditemukan.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideo: {
    width: width,
    height: height,
    backgroundColor: 'black',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ccc',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  backButtonContainer: {
    marginTop: 30,
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButton: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noVideoText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
});