import { Artikel } from "@/components/Berita";
import DetailArtikel from "@/components/DetailArtikel";
import NoResults from '@/components/NoResults'; // Impor NoResults
import Search from "@/components/Search";
import { Article } from "@/constants/article";
import { useArticles } from "@/constants/useArticles";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = ["Semua", "Hiburan", "Benda", "Tradisi", "Adat"];

const ArtikelScreen = () => {
	const params = useLocalSearchParams<{ query?: string }>();
	const query = params.query || "";
	
	const [selectedCategory, setSelectedCategory] = useState("Semua");
	const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

	// Panggil hook dengan state saat ini
	const { articles, loading, error } = useArticles(query, selectedCategory);

	const handleArticlePress = (article: Article) => {
		setSelectedArticleId(article.$id);
	};

	const handleBackToList = () => {
		setSelectedArticleId(null);
	};

	if (selectedArticleId) {
		return <DetailArtikel id={selectedArticleId} onBack={handleBackToList} />;
	}

	return (
		<SafeAreaView className="flex-1 bg-white">
			<View className="p-4">
				{/* Header */}
				<View className="flex-row items-center justify-between">
					<TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
						<Ionicons name="arrow-back" size={28} color="#191D31" />
					</TouchableOpacity>
					<Text className="text-xl font-rubik-bold text-black-300">Artikel</Text>
					<View className="w-10"/>
				</View>
				
				{/* Search */}
				<View className="mt-4">
					<Search />
				</View>

				{/* Categories */}
				<View className="mt-4">
					<FlatList
						data={categories}
						keyExtractor={(item) => item}
						horizontal
						showsHorizontalScrollIndicator={false}
						renderItem={({ item }) => (
							<TouchableOpacity
								onPress={() => setSelectedCategory(item)}
								className={`px-4 py-2 rounded-full mr-3 ${
									selectedCategory === item ? "bg-primary-100" : "bg-gray-100"
								}`}
							>
								<Text
									className={`font-rubik-medium ${
										selectedCategory === item
											? "text-white"
											: "text-gray-600"
									}`}
								>
									{item}
								</Text>
							</TouchableOpacity>
						)}
					/>
				</View>
			</View>

			{/* Content List */}
			{loading ? (
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color="#526346" />
				</View>
			) : error ? (
				<View className="flex-1 justify-center items-center p-4">
					<Text className="text-center text-red-500">{error}</Text>
				</View>
			) : (
				<FlatList
					data={articles}
					keyExtractor={(item) => item.$id}
					renderItem={({ item }) => (
						<Artikel item={item} onPress={() => handleArticlePress(item)} />
					)}
					numColumns={2}
					columnWrapperStyle={{ gap: 16, paddingHorizontal: 16 }}
					contentContainerStyle={{ paddingBottom: 100 }}
					ListEmptyComponent={() => (
						<View className="mt-10">
							<NoResults />
						</View>
					)}
				/>
			)}
		</SafeAreaView>
	);
};

export default ArtikelScreen;