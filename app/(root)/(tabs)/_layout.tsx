import { Tabs } from "expo-router";
import React from "react";
import { Image, Text, View } from "react-native";

import icons from "@/constants/icons";

const TabIcon = ({
	focused,
	icon,
	title,
	isScanner = false,
}: {
	focused: boolean;
	icon: any;
	title: string;
	isScanner?: boolean;
}) => {
	if (isScanner) {
		return (
			<View className="flex-1 mt-1 flex flex-col items-center justify-center">
				<View className={`
					${focused ? "bg-primary-300" : "bg-[#526346]"} 
					rounded-full p-3 shadow-lg elevation-5
					${focused ? "scale-110" : "scale-100"}
					border-2 border-white
				`}>
					<Image
						source={icon}
						tintColor="white"
						resizeMode="contain"
						className="size-8"
					/>
				</View>
				<Text
					className={`${
						focused
							? "text-primary-300 font-rubik-medium"
							: "text-[#526346] font-rubik-medium"
					} text-xs w-full text-center mt-1`}
				>
					{title}
				</Text>
			</View>
		);
	}

	return (
		<View className="flex-1 mt-3 flex flex-col items-center">
			<Image
				source={icon}
				tintColor={focused ? "#526346" : "#666876"}
				resizeMode="contain"
				className="size-6"
			/>
			<Text
				className={`${
					focused
						? "text-primary-300 font-rubik-medium"
						: "text-black-200 font-rubik"
				} text-xs w-full text-center mt-1`}
			>
				{title}
			</Text>
		</View>
	);
};

const TabsLayout = () => {
	return (
		<Tabs
			screenOptions={{
				tabBarShowLabel: false,
				tabBarStyle: {
					backgroundColor: "white",
					position: "absolute",
					borderTopColor: "#0061FF1A",
					borderTopWidth: 1,
					minHeight: 80, // Tinggi tab bar diperbesar untuk mengakomodasi scanner yang lebih besar
					paddingBottom: 10,
					paddingTop: 5,
					borderTopLeftRadius: 20,
					borderTopRightRadius: 20,
					borderLeftWidth: 1,
					borderRightWidth: 1,
					borderLeftColor: "#0061FF1A",
					borderRightColor: "#0061FF1A",
					shadowColor: "#000",
					shadowOffset: {
						width: 0,
						height: -2,
					},
					shadowOpacity: 0.1,
					shadowRadius: 3,
					elevation: 5,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					headerShown: false,
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={icons.home} focused={focused} title="Home" />
					),
				}}
			/>

			<Tabs.Screen
				name="shirt-editor"
				options={{
					title: "Edit",
					headerShown: false,
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={icons.editing} focused={focused} title="Edit" />
					),
				}}
			/>

			<Tabs.Screen
				name="scanner"
				options={{
					title: "Scanner",
					headerShown: false,
					tabBarIcon: ({ focused }) => (
						<TabIcon 
							icon={icons.scanner} 
							focused={focused} 
							title="Scanner" 
							isScanner={true} 
						/>
					),
				}}
			/>

			<Tabs.Screen
				name="artikel"
				options={{
					title: "Artikel",
					headerShown: false,
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={icons.news} focused={focused} title="Artikel" />
					),
				}}
			/>

			<Tabs.Screen
				name="profile"
				options={{
					title: "Profile",
					headerShown: false,
					tabBarIcon: ({ focused }) => (
						<TabIcon icon={icons.person} focused={focused} title="Profile" />
					),
				}}
			/>
		</Tabs>
	);
};

export default TabsLayout;