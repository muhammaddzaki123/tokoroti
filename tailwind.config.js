/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
      extend: {
        fontFamily: {
          rubik: ["Rubik-Regular", "sans-serif"],
          "rubik-bold": ["Rubik-Bold", "sans-serif"],
          "rubik-extrabold": ["Rubik-ExtraBold", "sans-serif"],
          "rubik-medium": ["Rubik-Medium", "sans-serif"],
          "rubik-semibold": ["Rubik-SemiBold", "sans-serif"],
          "rubik-light": ["Rubik-Light", "sans-serif"],
        },
        colors: {
          primary: {
            100: "#526346",
            200: "#8CCD61",
            300: "#747171",
            400: "#999EA1",
            500: "#999EA1",

          },
          accent: {
            100: "#FBFBFD",
          },
          black: {
            DEFAULT: "#000000",
            100: "#8C8E98",
            200: "#666876",
            300: "#191D31",
          },
          danger: "#F75555",
        },
      },
    },
    plugins: [],
  };
  