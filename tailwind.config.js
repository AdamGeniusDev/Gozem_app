/** @type {import('tailwindcss').Config} */

module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors:{
        primary:{
          '100': '#8ADA9F',
          '200':'#2FCD5A',
          '300':'#169137',
          '400': '#48681B',
        },
        secondary: {
          '100': '#F9FAFB',
          '200':"#EBEDEC",
        },
        succes: '#10B981',
        terne: {
          '25': '#FCFCFC',
          '50': '#F9FAFB',
        }

      },
      fontFamily:{
        "black": ["Black","sans-serif"],
        "bold": ["Bold","sans-serif"],
        "cursive": ["Cursive","sans-serif"],
        "extrabold": ["ExtraBold","sans-serif"],
        "medium": ["Medium","sans-serif"],
        "regular": ["Regular","sans-serif"],
        "semibold": ["SemiBold","sans-serif"],
        "roboto": ["RobotoMedium","sans-serif"],

          "poppins-black":["Poppins","sans-serif"],
          "poppins-extra":["PoppinsExtra","sans-serif"],
          "poppins-bold":["PoppinsBold","sans-serif"],

      }
    },
  },
  plugins: [],
  corePlugins:{
    preflight: false,
  }
};