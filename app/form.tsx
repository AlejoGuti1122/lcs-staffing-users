// app/application-form.tsx
import { MaterialIcons } from "@expo/vector-icons"
import { zodResolver } from "@hookform/resolvers/zod"
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker"
import { router, useLocalSearchParams } from "expo-router"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { z } from "zod"
import { db } from "../config/firebase"
import LanguageSelector from "./components/LanguageSelector"

const experienceOptions = [
  "Housekeeping",
  "Houseperson",
  "Assembly Line",
  "Packing",
  "Lumper",
  "Operador de maquinaria - High-reach",
  "Operador de maquinaria - Forklift",
  "Operador de Pallet Jack",
  "Mantenimiento de Jardineria",
  "Installacion de Jardineria",
  "Irrigation en Jardineria",
  "Mantenimiento en Campo de golf",
  "Dishwasher",
  "Cook",
]

export default function ApplicationForm() {
  const { jobId, jobTitle } = useLocalSearchParams()
  const { t } = useTranslation()
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tempDate, setTempDate] = useState(new Date())

  // Schema con traducciones
  const formSchema = z.object({
    email: z
      .string()
      .min(1, t("form.emailRequired"))
      .email(t("form.emailInvalid"))
      .regex(
        /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        t("form.emailInvalid")
      ),
    hasTransport: z.enum(["si", "no"], {
      required_error: t("form.emailRequired"),
    }),
    hasDocuments: z.enum(["si", "no"], {
      required_error: t("form.emailRequired"),
    }),
    englishLevel: z.enum(["Bajo", "Medio", "Alto"], {
      required_error: t("form.emailRequired"),
    }),
    fullName: z.string().min(3, t("form.fullNameRequired")),
    phone: z
      .string()
      .min(1, t("form.phoneRequired"))
      .regex(/^[0-9]+$/, "Solo números")
      .min(10, "Mínimo 10 dígitos")
      .max(15, "Máximo 15 dígitos"),
    birthDate: z.string().min(1, t("form.birthDateRequired")),
    address: z.string().min(5, t("form.addressRequired")),
    hasExperience: z.enum(["si", "no"], {
      required_error: t("form.emailRequired"),
    }),
    experienceDetails: z.string().optional(),
    workExperience: z.array(z.string()),
    experienceLocation: z.string().optional(),
    experienceTimePeriod: z.string().optional(),
    additionalNotes: z.string().optional(),
  })

  type FormData = z.infer<typeof formSchema>

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      hasTransport: undefined as "si" | "no" | undefined,
      hasDocuments: undefined as "si" | "no" | undefined,
      englishLevel: undefined as "Bajo" | "Medio" | "Alto" | undefined,
      fullName: "",
      phone: "",
      birthDate: "",
      address: "",
      hasExperience: undefined as "si" | "no" | undefined,
      experienceDetails: "",
      workExperience: [],
      experienceLocation: "",
      experienceTimePeriod: "",
      additionalNotes: "",
    },
  })

  const hasExperience = watch("hasExperience")
  const formValues = watch()

  const isFormValid =
    formValues.email?.length > 0 &&
    formValues.hasTransport !== undefined &&
    formValues.hasDocuments !== undefined &&
    formValues.englishLevel !== undefined &&
    formValues.fullName?.length >= 3 &&
    formValues.phone?.length === 10 &&
    formValues.birthDate?.length > 0 &&
    formValues.address?.length >= 5 &&
    formValues.hasExperience !== undefined

  const onSubmit = async (data: FormData) => {
    try {
      await addDoc(collection(db, "applications"), {
        ...data,
        jobId,
        jobTitle,
        status: "pending",
        createdAt: serverTimestamp(),
      })

      if (Platform.OS === "web") {
        window.alert(
          `✅ ${t("form.successTitle")}\n\n${t("form.successMessage")}`
        )
        router.back()
      } else {
        Alert.alert(t("form.successTitle"), t("form.successMessage"), [
          { text: t("form.ok"), onPress: () => router.back() },
        ])
      }
    } catch (error) {
      if (Platform.OS === "web") {
        window.alert(`❌ ${t("form.errorTitle")}\n\n${t("form.errorMessage")}`)
      } else {
        Alert.alert(t("form.errorTitle"), t("form.errorMessage"))
      }
    }
  }

  const toggleCheckbox = (
    field: any,
    value: string,
    currentValues: string[]
  ) => {
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]
    field.onChange(newValues)
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#111"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Image
            source={require("../assets/images/logo.png")}
            style={{
              width: 100,
              height: 35,
              resizeMode: "contain",
              marginBottom: 10,
              marginTop: 24,
            }}
          />
          <Text style={styles.headerTitle}>{t("form.title")}</Text>
        </View>
        <LanguageSelector />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{jobTitle}</Text>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("form.email")}
              <Text style={styles.required}>{t("form.required")}</Text>
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder={t("form.emailPlaceholder")}
                  placeholderTextColor="#6b7280"
                  value={value}
                  onChangeText={(text) => onChange(text.trim())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.email && (
              <Text style={styles.error}>{errors.email.message}</Text>
            )}
          </View>

          {/* Transporte */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("form.transport")}
              <Text style={styles.required}>{t("form.required")}</Text>
            </Text>
            <Controller
              control={control}
              name="hasTransport"
              render={({ field }) => (
                <View>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => field.onChange("si")}
                  >
                    <View
                      style={[
                        styles.radio,
                        field.value === "si" && styles.radioSelected,
                      ]}
                    >
                      {field.value === "si" && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{t("form.yes")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => field.onChange("no")}
                  >
                    <View
                      style={[
                        styles.radio,
                        field.value === "no" && styles.radioSelected,
                      ]}
                    >
                      {field.value === "no" && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{t("form.no")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.hasTransport && (
              <Text style={styles.error}>{errors.hasTransport.message}</Text>
            )}
          </View>

          {/* Documentación */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("form.documents")}
              <Text style={styles.required}>{t("form.required")}</Text>
            </Text>
            <Controller
              control={control}
              name="hasDocuments"
              render={({ field }) => (
                <View>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => field.onChange("si")}
                  >
                    <View
                      style={[
                        styles.radio,
                        field.value === "si" && styles.radioSelected,
                      ]}
                    >
                      {field.value === "si" && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{t("form.yes")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => field.onChange("no")}
                  >
                    <View
                      style={[
                        styles.radio,
                        field.value === "no" && styles.radioSelected,
                      ]}
                    >
                      {field.value === "no" && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{t("form.no")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.hasDocuments && (
              <Text style={styles.error}>{errors.hasDocuments.message}</Text>
            )}
          </View>

          {/* Nivel de inglés */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("form.englishLevel")}
              <Text style={styles.required}>{t("form.required")}</Text>
            </Text>
            <Controller
              control={control}
              name="englishLevel"
              render={({ field }) => (
                <View>
                  {[
                    { key: "Bajo", label: t("form.englishLow") },
                    { key: "Medio", label: t("form.englishMedium") },
                    { key: "Alto", label: t("form.englishHigh") },
                  ].map((level) => (
                    <TouchableOpacity
                      key={level.key}
                      style={styles.radioOption}
                      onPress={() => field.onChange(level.key)}
                    >
                      <View
                        style={[
                          styles.radio,
                          field.value === level.key && styles.radioSelected,
                        ]}
                      >
                        {field.value === level.key && (
                          <View style={styles.radioDot} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>{level.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {errors.englishLevel && (
              <Text style={styles.error}>{errors.englishLevel.message}</Text>
            )}
          </View>

          {/* Nombre */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("form.fullName")}
              <Text style={styles.required}>{t("form.required")}</Text>
            </Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder={t("form.fullNamePlaceholder")}
                  placeholderTextColor="#6b7280"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.fullName && (
              <Text style={styles.error}>{errors.fullName.message}</Text>
            )}
          </View>

          {/* Teléfono */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("form.phone")}
              <Text style={styles.required}>{t("form.required")}</Text>
            </Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => {
                const phoneLength = value?.length || 0
                const isValid = phoneLength === 10
                const showValidation = phoneLength > 0

                return (
                  <>
                    <TextInput
                      style={[
                        styles.input,
                        errors.phone && styles.inputError,
                        showValidation && !isValid && styles.inputError,
                        showValidation && isValid && styles.inputSuccess,
                      ]}
                      placeholder={t("form.phonePlaceholder")}
                      placeholderTextColor="#6b7280"
                      value={value}
                      onChangeText={(text) => {
                        const numericText = text.replace(/[^0-9]/g, "")
                        onChange(numericText)
                      }}
                      keyboardType="numeric"
                      maxLength={15}
                    />
                    {showValidation && (
                      <Text
                        style={[
                          styles.phoneCounter,
                          isValid
                            ? styles.phoneCounterValid
                            : styles.phoneCounterInvalid,
                        ]}
                      >
                        {phoneLength}/10 {t("form.phoneDigits")}{" "}
                        {isValid ? "✓" : ""}
                      </Text>
                    )}
                  </>
                )
              }}
            />
            {errors.phone && (
              <Text style={styles.error}>{errors.phone.message}</Text>
            )}
          </View>

          {/* Fecha de nacimiento */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("form.birthDate")}
              <Text style={styles.required}>{t("form.required")}</Text>
            </Text>
            <Controller
              control={control}
              name="birthDate"
              render={({ field: { onChange, value } }) => (
                <>
                  {Platform.OS === "web" ? (
                    <View style={styles.dateInput}>
                      <input
                        type="date"
                        value={
                          value ? value.split("/").reverse().join("-") : ""
                        }
                        onChange={(e) => {
                          const dateValue = e.target.value
                          if (dateValue) {
                            const [year, month, day] = dateValue.split("-")
                            onChange(`${day}/${month}/${year}`)
                          } else {
                            onChange("")
                          }
                        }}
                        max={new Date().toISOString().split("T")[0]}
                        min="1900-01-01"
                        style={{
                          width: "100%",
                          backgroundColor: "transparent",
                          border: "none",
                          outline: "none",
                          color: "#fff",
                          fontSize: 16,
                          fontFamily: "inherit",
                          cursor: "pointer",
                        }}
                      />
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.dateInput,
                          errors.birthDate && styles.inputError,
                        ]}
                        onPress={() => {
                          if (value) {
                            const [day, month, year] = value.split("/")
                            if (day && month && year) {
                              setTempDate(
                                new Date(
                                  parseInt(year),
                                  parseInt(month) - 1,
                                  parseInt(day)
                                )
                              )
                            }
                          }
                          setShowDatePicker(true)
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons
                          name="calendar-today"
                          size={20}
                          color="#dc2626"
                          style={{ marginRight: 10 }}
                        />
                        <Text
                          style={
                            value ? styles.dateText : styles.datePlaceholder
                          }
                        >
                          {value || t("form.birthDatePlaceholder")}
                        </Text>
                      </TouchableOpacity>

                      {showDatePicker && Platform.OS === "android" && (
                        <DateTimePicker
                          value={tempDate}
                          mode="date"
                          display="default"
                          onChange={(
                            event: DateTimePickerEvent,
                            selectedDate?: Date
                          ) => {
                            setShowDatePicker(false)

                            if (event.type === "set" && selectedDate) {
                              const day = selectedDate
                                .getDate()
                                .toString()
                                .padStart(2, "0")
                              const month = (selectedDate.getMonth() + 1)
                                .toString()
                                .padStart(2, "0")
                              const year = selectedDate.getFullYear()
                              onChange(`${day}/${month}/${year}`)
                              setTempDate(selectedDate)
                            }
                          }}
                          maximumDate={new Date()}
                          minimumDate={new Date(1900, 0, 1)}
                        />
                      )}

                      {showDatePicker && Platform.OS === "ios" && (
                        <View style={styles.iosDatePickerContainer}>
                          <View style={styles.iosDatePickerHeader}>
                            <TouchableOpacity
                              onPress={() => setShowDatePicker(false)}
                              style={styles.iosDatePickerButton}
                            >
                              <Text style={styles.iosDatePickerButtonText}>
                                {t("form.cancelDate")}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                const day = tempDate
                                  .getDate()
                                  .toString()
                                  .padStart(2, "0")
                                const month = (tempDate.getMonth() + 1)
                                  .toString()
                                  .padStart(2, "0")
                                const year = tempDate.getFullYear()
                                onChange(`${day}/${month}/${year}`)
                                setShowDatePicker(false)
                              }}
                              style={styles.iosDatePickerButton}
                            >
                              <Text
                                style={[
                                  styles.iosDatePickerButtonText,
                                  { color: "#dc2626" },
                                ]}
                              >
                                {t("form.confirmDate")}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <DateTimePicker
                            value={tempDate}
                            mode="date"
                            display="spinner"
                            onChange={(
                              event: DateTimePickerEvent,
                              selectedDate?: Date
                            ) => {
                              if (selectedDate) {
                                setTempDate(selectedDate)
                              }
                            }}
                            maximumDate={new Date()}
                            minimumDate={new Date(1900, 0, 1)}
                            style={styles.iosDatePicker}
                            textColor="#fff"
                          />
                        </View>
                      )}
                    </>
                  )}
                </>
              )}
            />
            {errors.birthDate && (
              <Text style={styles.error}>{errors.birthDate.message}</Text>
            )}
          </View>

          {/* Dirección */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("form.address")}
              <Text style={styles.required}>{t("form.required")}</Text>
            </Text>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.input, errors.address && styles.inputError]}
                  placeholder={t("form.fullNamePlaceholder")}
                  placeholderTextColor="#6b7280"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {errors.address && (
              <Text style={styles.error}>{errors.address.message}</Text>
            )}
          </View>

          {/* ¿Tienes experiencia? */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("form.hasExperience")}
              <Text style={styles.required}>{t("form.required")}</Text>
            </Text>
            <Controller
              control={control}
              name="hasExperience"
              render={({ field }) => (
                <View>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => field.onChange("si")}
                  >
                    <View
                      style={[
                        styles.radio,
                        field.value === "si" && styles.radioSelected,
                      ]}
                    >
                      {field.value === "si" && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{t("form.yes")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => field.onChange("no")}
                  >
                    <View
                      style={[
                        styles.radio,
                        field.value === "no" && styles.radioSelected,
                      ]}
                    >
                      {field.value === "no" && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{t("form.no")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.hasExperience && (
              <Text style={styles.error}>{errors.hasExperience.message}</Text>
            )}
          </View>

          {/* Detalles de experiencia */}
          {hasExperience === "si" && (
            <View style={styles.field}>
              <Text style={styles.label}>{t("form.experienceDetails")}</Text>
              <Text style={styles.helperText}>
                {t("form.experienceDetailsHelper")}
              </Text>
              <Controller
                control={control}
                name="experienceDetails"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.textArea]}
                    placeholder={t("form.experienceDetailsPlaceholder")}
                    placeholderTextColor="#6b7280"
                    value={value}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                )}
              />
            </View>
          )}

          {/* Experiencia laboral (checkboxes) */}
          <View style={styles.field}>
            <Text style={styles.label}>{t("form.workExperience")}</Text>
            <Controller
              control={control}
              name="workExperience"
              render={({ field }) => (
                <View>
                  {experienceOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.checkboxOption}
                      onPress={() =>
                        toggleCheckbox(field, option, field.value || [])
                      }
                    >
                      <View
                        style={[
                          styles.checkbox,
                          field.value?.includes(option) &&
                            styles.checkboxSelected,
                        ]}
                      >
                        {field.value?.includes(option) && (
                          <MaterialIcons
                            name="check"
                            size={18}
                            color="#fff"
                          />
                        )}
                      </View>
                      <Text style={styles.checkboxLabel}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.checkboxOption}
                    onPress={() =>
                      toggleCheckbox(field, "Otro", field.value || [])
                    }
                  >
                    <View
                      style={[
                        styles.checkbox,
                        field.value?.includes("Otro") &&
                          styles.checkboxSelected,
                      ]}
                    >
                      {field.value?.includes("Otro") && (
                        <MaterialIcons
                          name="check"
                          size={18}
                          color="#fff"
                        />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{t("form.other")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

          {/* Ubicación y período */}
          <View style={styles.field}>
            <Text style={styles.label}>
              {t("form.experienceLocationTitle")}
            </Text>
            <Text style={styles.helperText}>
              {t("form.experienceLocationHelper")}
            </Text>

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.subLabel}>
                {t("form.experienceLocation")}
              </Text>
              <Controller
                control={control}
                name="experienceLocation"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input]}
                    placeholder={t("form.experienceLocationPlaceholder")}
                    placeholderTextColor="#6b7280"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>

            <View>
              <Text style={styles.subLabel}>
                {t("form.experienceTimePeriod")}
              </Text>
              <Controller
                control={control}
                name="experienceTimePeriod"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input]}
                    placeholder={t("form.experienceTimePeriodPlaceholder")}
                    placeholderTextColor="#6b7280"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>
          </View>

          {/* Notas adicionales */}
          <View style={styles.field}>
            <Text style={styles.label}>{t("form.additionalNotes")}</Text>
            <Text style={styles.helperText}>
              {t("form.additionalNotesHelper")}
            </Text>
            <Controller
              control={control}
              name="additionalNotes"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.textArea]}
                  placeholder={t("form.additionalNotesPlaceholder")}
                  placeholderTextColor="#6b7280"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />
          </View>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isFormValid || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={!isFormValid || isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? t("form.sending") : t("form.submit")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>{t("form.cancel")}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  header: {
    backgroundColor: "#111",
    paddingTop: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 3,
    borderBottomColor: "#dc2626",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  jobInfo: {
    backgroundColor: "#1f1f1f",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  field: {
    marginBottom: 24,
    backgroundColor: "#1f1f1f",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  required: {
    color: "#dc2626",
  },
  helperText: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#2a2a2a",
  },
  inputError: {
    borderColor: "#dc2626",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#2a2a2a",
    minHeight: 100,
  },
  error: {
    color: "#dc2626",
    fontSize: 14,
    marginTop: 6,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3a3a3a",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: "#dc2626",
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#dc2626",
  },
  radioLabel: {
    fontSize: 16,
    color: "#d1d5db",
    marginLeft: 12,
  },
  checkboxOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#3a3a3a",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#d1d5db",
    marginLeft: 12,
    flex: 1,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a3a3a",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#2a2a2a",
  },
  dateText: {
    fontSize: 16,
    color: "#fff",
  },
  datePlaceholder: {
    fontSize: 16,
    color: "#6b7280",
  },
  iosDatePickerContainer: {
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  iosDatePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  iosDatePickerButton: {
    padding: 5,
  },
  iosDatePickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
  },
  iosDatePicker: {
    height: 200,
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  cancelButtonText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "500",
  },
  headerContent: {
    alignItems: "center",
  },
  inputSuccess: {
    borderColor: "#22c55e",
  },
  phoneCounter: {
    fontSize: 14,
    marginTop: 6,
  },
  phoneCounterValid: {
    color: "#22c55e",
  },
  phoneCounterInvalid: {
    color: "#dc2626",
  },
  submitButtonDisabled: {
    backgroundColor: "#4a4a4a",
    opacity: 0.5,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#d1d5db",
    marginBottom: 8,
  },
})
