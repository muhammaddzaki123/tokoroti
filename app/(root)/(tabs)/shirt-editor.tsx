import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import ViewShot from 'react-native-view-shot';

import {
  config,
  getDesignFonts,
  getDesignStickers,
  getShirtColors,
  ID,
  saveFinishedDesign,
  storage,
} from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { useAppwrite } from '@/lib/useAppwrite';

const T_SHIRT_IMAGE = require('@/assets/images/baju_polos.png');

interface ElementState {
  id: number;
  type: 'text' | 'sticker';
  value: string | ImageSourcePropType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  fontFamily: string;
}
interface FontAsset { $id: string; name: string; fontFamily: string; }
interface ColorAsset { $id: string; hexCode: string; }

// Komponen EditableElement dan ElementEditor tidak perlu diubah
const EditableElement = React.memo(
  ({
    element,
    isActive,
    onActivate,
    onUpdate,
    canvasBounds,
  }: {
    element: ElementState;
    isActive: boolean;
    onActivate: (id: number | null) => void;
    onUpdate: (id: number, updates: Partial<ElementState>) => void;
    canvasBounds: { width: number; height: number };
  }) => {
    const x = useSharedValue(element.x);
    const y = useSharedValue(element.y);
    const savedOffset = useSharedValue({ x: 0, y: 0 });

    const panGesture = Gesture.Pan()
      .onBegin(() => {
        'worklet';
        savedOffset.value = { x: x.value, y: y.value };
        runOnJS(onActivate)(element.id);
      })
      .onUpdate((e) => {
        'worklet';
        const newX = savedOffset.value.x + e.translationX;
        const newY = savedOffset.value.y + e.translationY;
        const halfWidth = (element.type === 'text' ? 50 : 40) * element.scale;
        const halfHeight = (element.type === 'text' ? 25 : 40) * element.scale;
        x.value = Math.max(
          -canvasBounds.width / 2 + halfWidth,
          Math.min(canvasBounds.width / 2 - halfWidth, newX)
        );
        y.value = Math.max(
          -canvasBounds.height / 2 + halfHeight,
          Math.min(canvasBounds.height / 2 - halfHeight, newY)
        );
      })
      .onEnd(() => {
        'worklet';
        runOnJS(onUpdate)(element.id, { x: x.value, y: y.value });
      });

    const tapGesture = Gesture.Tap().onEnd(() => {
      'worklet';
      runOnJS(onActivate)(element.id);
    });

    const animatedStyle = useAnimatedStyle(() => ({
      position: 'absolute',
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { scale: element.scale },
        { rotate: `${element.rotation}rad` },
      ],
    }));

    return (
      <GestureDetector gesture={Gesture.Simultaneous(panGesture, tapGesture)}>
        <Animated.View style={animatedStyle}>
          <View
            className={`p-1 items-center justify-center ${
              isActive ? 'border-2 border-dashed border-blue-500 rounded-lg' : ''
            }`}
          >
            {element.type === 'sticker' ? (
              <Image
                source={element.value as ImageSourcePropType}
                style={styles.stickerOnCanvas}
                resizeMode="contain"
              />
            ) : (
              <Text
                style={[
                  { color: element.color, fontFamily: element.fontFamily },
                  { fontSize: 40, textAlign: 'center' },
                ]}
              >
                {element.value as string}
              </Text>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    );
  }
);
const ElementEditor = ({
  element,
  onUpdate,
  onDelete,
  fonts,
  colors,
}: {
  element: ElementState;
  onUpdate: (id: number, updates: Partial<ElementState>) => void;
  onDelete: (id: number) => void;
  fonts: FontAsset[];
  colors: ColorAsset[];
}) => {
  return (
    <View className="px-4 py-2 space-y-3">
      <View className="flex-row items-center space-x-2">
        <Ionicons name="scan-outline" size={20} color="#555" />
        <Slider
          style={{ flex: 1 }}
          minimumValue={0.5}
          maximumValue={3}
          value={element.scale}
          onValueChange={(val) => onUpdate(element.id, { scale: val })}
          minimumTrackTintColor="#526346"
          maximumTrackTintColor="#DDD"
          thumbTintColor="#526346"
        />
      </View>
      <View className="flex-row items-center space-x-2">
        <Ionicons name="reload-outline" size={20} color="#555" />
        <Slider
          style={{ flex: 1 }}
          minimumValue={-Math.PI}
          maximumValue={Math.PI}
          value={element.rotation}
          onValueChange={(val) => onUpdate(element.id, { rotation: val })}
          minimumTrackTintColor="#526346"
          maximumTrackTintColor="#DDD"
          thumbTintColor="#526346"
        />
      </View>
      {element.type === 'text' && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 5 }}
          >
            {fonts.map((font) => (
              <TouchableOpacity
                key={font.$id}
                className={`px-4 py-2 rounded-full mx-1 ${
                  element.fontFamily === font.fontFamily
                    ? 'bg-primary-100'
                    : 'bg-gray-200'
                }`}
                onPress={() => onUpdate(element.id, { fontFamily: font.fontFamily })}
              >
                <Text
                  style={{
                    fontFamily: font.fontFamily,
                    color:
                      element.fontFamily === font.fontFamily ? 'white' : 'black',
                  }}
                >
                  {font.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center' }}
          >
            {colors.map((color) => (
              <TouchableOpacity
                key={color.$id}
                style={[
                  { backgroundColor: color.hexCode },
                  {
                    borderWidth: element.color === color.hexCode ? 2 : 1,
                    borderColor:
                      element.color === color.hexCode ? '#3498db' : '#EAEAEA',
                  },
                ]}
                className="w-10 h-10 rounded-full mx-1.5"
                onPress={() => onUpdate(element.id, { color: color.hexCode })}
              />
            ))}
          </ScrollView>
        </>
      )}
      <TouchableOpacity
        onPress={() => onDelete(element.id)}
        className="flex-row items-center justify-center p-3 bg-red-100 rounded-lg mt-2"
      >
        <Ionicons name="trash-outline" size={24} color="#D32F2F" />
        <Text className="text-red-600 ml-2 font-rubik-bold">Hapus</Text>
      </TouchableOpacity>
    </View>
  );
};
const ToolTab = ({
  icon,
  label,
  active,
  onPress,
}: {
  icon: any;
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} className="items-center gap-1 flex-1">
    <Ionicons name={icon} size={24} color={active ? '#526346' : '#888'} />
    <Text
      className={`font-rubik-medium text-xs ${
        active ? 'text-primary-100' : 'text-gray-500'
      }`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);


const ShirtEditorScreen = () => {
  const { user } = useGlobalContext();
  const params = useLocalSearchParams();
  const viewShotRef = useRef<ViewShot>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [shirtColor, setShirtColor] = useState('#FFFFFF');
  const [elements, setElements] = useState<ElementState[]>([]);
  const [activeElementId, setActiveElementId] = useState<number | null>(null);
  const [textInputValue, setTextInputValue] = useState('');
  const [activeTool, setActiveTool] = useState<'tshirt' | 'sticker' | 'text'>('tshirt');
  const [canvasBounds, setCanvasBounds] = useState({ width: 0, height: 0 });

  const { data: colors, loading: loadingColors } = useAppwrite({ fn: getShirtColors });
  const { data: stickers, loading: loadingStickers } = useAppwrite({ fn: getDesignStickers });
  const { data: fonts, loading: loadingFonts } = useAppwrite({ fn: getDesignFonts });
  
  // PERBAIKAN UTAMA: Mengganti dependency array dari [params] menjadi nilai primitifnya
  useEffect(() => {
    const { designData, shirtColor: paramShirtColor } = params;
    if (designData && typeof designData === 'string') {
      try {
        const loadedElements = JSON.parse(designData);
        const restoredElements = loadedElements.map((el: any) => {
            if (el.type === 'sticker' && typeof el.value === 'string') {
                return { ...el, value: { uri: el.value } };
            }
            return el;
        });
        setElements(restoredElements);
      } catch (e) {
        console.error("Gagal mem-parsing data desain:", e);
        Alert.alert("Error", "Gagal memuat data desain yang ada.");
      }
    }
    if (paramShirtColor && typeof paramShirtColor === 'string') {
        setShirtColor(paramShirtColor);
    }
  }, [params.designData, params.shirtColor]);

  const addElement = (type: 'sticker' | 'text', value: any) => {
    const newElement: ElementState = {
      id: Date.now(),
      type,
      value: type === 'sticker' ? { uri: value } : value,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      color: '#000000',
      fontFamily: 'Rubik-Regular',
    };
    setElements((prev) => [...prev, newElement]);
    setActiveElementId(newElement.id);
  };
  const deleteElement = (id: number) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (activeElementId === id) setActiveElementId(null);
  };
  const updateElement = useCallback(
    (id: number, updates: Partial<ElementState>) => {
      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
      );
    },
    []
  );
  const getActiveElement = () => elements.find((el) => el.id === activeElementId);
  const onCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasBounds({ width: width * 0.8, height: height * 0.8 });
  };
  
  const handleCaptureAndSave = async () => {
    if (!user) {
        Alert.alert('Perlu Login', 'Anda harus masuk untuk menyimpan desain.');
        return;
    }
    if (!viewShotRef.current?.capture) {
        Alert.alert('Error', 'Komponen capture belum siap.');
        return;
    }

    setIsSaving(true);
    try {
        const uri = await viewShotRef.current.capture();
        const response = await fetch(uri);
        const blob = await response.blob();
        
        const file = {
            name: `design-${user.$id}-${Date.now()}.png`,
            type: 'image/png',
            uri: uri,
            size: blob.size,
        } as any; 

        const uploadedFile = await storage.createFile(config.storageBucketId!, ID.unique(), file);
        const imageUrl = storage.getFileView(config.storageBucketId!, uploadedFile.$id).href;
        
        const elementsToSave = elements.map(el => {
            if (el.type === 'sticker' && typeof el.value === 'object' && el.value !== null) {
                return { ...el, value: (el.value as any).uri };
            }
            return el;
        });
        const designDataJSON = JSON.stringify(elementsToSave);
        const designName = `Desain Kustom - ${new Date().toLocaleDateString()}`;

        await saveFinishedDesign(user.$id, designName, imageUrl, designDataJSON, shirtColor);

        Alert.alert('Sukses!', 'Desain final Anda telah disimpan.');
        router.push('/(root)/(desaign)/my-designs');

    } catch (error: any) {
        console.error("Gagal menangkap atau menyimpan desain:", error);
        Alert.alert('Error', error.message || 'Gagal menyelesaikan desain.');
    } finally {
        setIsSaving(false);
    }
  };


  const renderToolOptions = () => {
    const activeElement = getActiveElement();
    if (activeElement) {
      return (
        <ElementEditor
          element={activeElement}
          onUpdate={updateElement}
          onDelete={deleteElement}
          fonts={(fonts as unknown as FontAsset[]) || []}
          colors={(colors as unknown as ColorAsset[]) || []}
        />
      );
    }
    switch (activeTool) {
      case 'tshirt':
        if (loadingColors) return <ActivityIndicator color="#526346" />;
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
          >
            {(colors || []).map((color: any) => (
              <TouchableOpacity
                key={color.$id}
                style={[
                  { backgroundColor: color.hexCode },
                  {
                    borderWidth: shirtColor === color.hexCode ? 2 : 1,
                    borderColor:
                      shirtColor === color.hexCode ? '#3498db' : '#EAEAEA',
                  },
                ]}
                className="w-10 h-10 rounded-full mx-1.5"
                onPress={() => setShirtColor(color.hexCode)}
              />
            ))}
          </ScrollView>
        );
      case 'sticker':
        if (loadingStickers) return <ActivityIndicator color="#526346" />;
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16 }}
          >
            {(stickers || []).map((sticker: any) => (
              <TouchableOpacity
                key={sticker.$id}
                className="mx-2"
                onPress={() => {
                  addElement('sticker', sticker.imageUrl);
                  setActiveTool('sticker');
                }}
              >
                <Image
                  source={{ uri: sticker.imageUrl }}
                  style={styles.stickerInToolbar}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
      case 'text':
        if (loadingFonts) return <ActivityIndicator color="#526346" />;
        return (
          <View className="flex-row items-center px-4 flex-1">
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 mr-2 font-rubik"
              placeholder="Ketik teks di sini..."
              value={textInputValue}
              onChangeText={setTextInputValue}
            />
            <TouchableOpacity
              className="p-2"
              onPress={() => {
                if (textInputValue.trim()) {
                  addElement('text', textInputValue);
                  setTextInputValue('');
                  setActiveTool('text');
                }
              }}
            >
              <Ionicons name="add-circle" size={28} color="#526346" />
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="py-4 px-4 flex-row justify-between items-center border-b border-gray-200">
          <TouchableOpacity
            onPress={() => router.push('/(root)/(desaign)/my-designs')}
            className="p-2"
          >
            <Ionicons name="folder-outline" size={28} color="#526346" />
          </TouchableOpacity>
          <Text className="text-xl font-rubik-bold text-black-300">
            Editor Baju
          </Text>
          <TouchableOpacity
            onPress={handleCaptureAndSave}
            disabled={isSaving}
            className="p-2"
          >
            <Ionicons
              name="checkmark-done-outline"
              size={28}
              color={isSaving ? '#ccc' : '#526346'}
            />
          </TouchableOpacity>
        </View>

        <View className="flex-1 p-4 bg-gray-100" onLayout={onCanvasLayout}>
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setActiveElementId(null)}
          >
            <ViewShot 
              ref={viewShotRef} 
              options={{ fileName: "gumisaq-design", format: "png", quality: 0.9 }} 
              style={styles.canvasContainer}
            >
              <Image
                source={T_SHIRT_IMAGE}
                style={{ tintColor: shirtColor, width: '80%', height: '80%' }}
                resizeMode="contain"
              />
              {elements.map((el) => (
                <EditableElement
                  key={el.id}
                  element={el}
                  isActive={el.id === activeElementId}
                  onActivate={setActiveElementId}
                  onUpdate={updateElement}
                  canvasBounds={canvasBounds}
                />
              ))}
            </ViewShot>
          </TouchableOpacity>
        </View>

        <View className="bg-white border-t border-gray-200 pb-[90px] pt-2">
          <View className="min-h-[70px] justify-center py-1">
            {renderToolOptions()}
          </View>

          {!getActiveElement() && (
            <View className="flex-row justify-around pt-2 border-t border-gray-100">
              <ToolTab
                icon="shirt-outline"
                label="Baju"
                active={activeTool === 'tshirt'}
                onPress={() => setActiveTool('tshirt')}
              />
              <ToolTab
                icon="happy-outline"
                label="Stiker"
                active={activeTool === 'sticker'}
                onPress={() => setActiveTool('sticker')}
              />
              <ToolTab
                icon="text"
                label="Teks"
                active={activeTool === 'text'}
                onPress={() => setActiveTool('text')}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  canvasContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerOnCanvas: {
    width: 80,
    height: 80,
  },
  stickerInToolbar: {
    width: 50,
    height: 50,
  },
});

export default ShirtEditorScreen;