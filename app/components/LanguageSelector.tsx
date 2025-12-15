import AsyncStorage from "@react-native-async-storage/async-storage"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

export default function LanguageSelector() {
  const { i18n } = useTranslation()

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang)
    await AsyncStorage.setItem("user-language", lang)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, i18n.language === "es" && styles.buttonActive]}
        onPress={() => changeLanguage("es")}
      >
        <Text
          style={[
            styles.buttonText,
            i18n.language === "es" && styles.buttonTextActive,
          ]}
        >
          🇪🇸 ES
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, i18n.language === "en" && styles.buttonActive]}
        onPress={() => changeLanguage("en")}
      >
        <Text
          style={[
            styles.buttonText,
            i18n.language === "en" && styles.buttonTextActive,
          ]}
        >
          🇺🇸 EN
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3a3a3a",
    backgroundColor: "#1f1f1f",
  },
  buttonActive: {
    borderColor: "#dc2626",
    backgroundColor: "#dc2626",
  },
  buttonText: {
    color: "#9ca3af",
    fontWeight: "600",
    fontSize: 14,
  },
  buttonTextActive: {
    color: "#fff",
  },
})
