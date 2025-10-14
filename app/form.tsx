// app/application-form.tsx
import { MaterialIcons } from "@expo/vector-icons"
import { zodResolver } from "@hookform/resolvers/zod"
import { router, useLocalSearchParams } from "expo-router"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { Controller, useForm } from "react-hook-form"
import {
  Alert,
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

const formSchema = z.object({
  email: z.string().email("Email inválido"),
  hasTransport: z.enum(["si", "no"], { required_error: "Campo requerido" }),
  hasDocuments: z.enum(["si", "no"], { required_error: "Campo requerido" }),
  englishLevel: z
    .array(z.string())
    .min(1, "Selecciona al menos un nivel de inglés"),
  fullName: z.string().min(3, "Nombre completo requerido"),
  phone: z.string().min(10, "Teléfono requerido"),
  birthDate: z.string().min(1, "Fecha de nacimiento requerida"),
  address: z.string().min(5, "Dirección requerida"),
  hasExperience: z.enum(["si", "no"], { required_error: "Campo requerido" }),
  experienceDetails: z.string().optional(),
  workExperience: z.array(z.string()),
  additionalNotes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

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

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    // ✅ DESPUÉS (correcto)
    defaultValues: {
      email: "",
      hasTransport: undefined,
      hasDocuments: undefined,
      englishLevel: [],
      fullName: "",
      phone: "",
      birthDate: "",
      address: "",
      hasExperience: undefined,
      experienceDetails: "",
      workExperience: [],
      additionalNotes: "",
    },
  })

  const hasExperience = watch("hasExperience")

  const onSubmit = async (data: FormData) => {
    try {
      await addDoc(collection(db, "applications"), {
        ...data,
        jobId,
        jobTitle,
        status: "pending",
        createdAt: serverTimestamp(),
      })

      Alert.alert(
        "¡Aplicación enviada!",
        "Tu aplicación ha sido enviada exitosamente. Te contactaremos pronto.",
        [{ text: "OK", onPress: () => router.back() }]
      )
    } catch (error) {
      console.error("Error:", error)
      Alert.alert("Error", "No se pudo enviar la aplicación")
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
        barStyle="dark-content"
        backgroundColor="#fff"
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color="#111"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aplicar al empleo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Job Title */}
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{jobTitle}</Text>
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Correo electrónico</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Tu respuesta"
                value={value}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
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
            ¿Tienes transporte confiable para llenar diariamente al trabajo?
            <Text style={styles.required}> *</Text>
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
                  <Text style={styles.radioLabel}>Sí</Text>
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
                  <Text style={styles.radioLabel}>No</Text>
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
            ¿Cuentas con documentación para trabajar legalmente en Estados
            Unidos?
            <Text style={styles.required}> *</Text>
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
                  <Text style={styles.radioLabel}>Sí</Text>
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
                  <Text style={styles.radioLabel}>No</Text>
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
            ¿Cuál es su nivel de inglés?<Text style={styles.required}> *</Text>
          </Text>
          <Controller
            control={control}
            name="englishLevel"
            render={({ field }) => (
              <View>
                {["Bajo", "Medio", "Alto"].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={styles.checkboxOption}
                    onPress={() =>
                      toggleCheckbox(field, level, field.value || [])
                    }
                  >
                    <View
                      style={[
                        styles.checkbox,
                        field.value?.includes(level) && styles.checkboxSelected,
                      ]}
                    >
                      {field.value?.includes(level) && (
                        <MaterialIcons
                          name="check"
                          size={18}
                          color="#fff"
                        />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{level}</Text>
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
            Nombre Completo<Text style={styles.required}> *</Text>
          </Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.fullName && styles.inputError]}
                placeholder="Tu respuesta"
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
          <Text style={styles.label}>Número de teléfono</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="Tu respuesta"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
              />
            )}
          />
          {errors.phone && (
            <Text style={styles.error}>{errors.phone.message}</Text>
          )}
        </View>

        {/* Fecha de nacimiento */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Fecha de Nacimiento<Text style={styles.required}> *</Text>
          </Text>
          <Controller
            control={control}
            name="birthDate"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.birthDate && styles.inputError]}
                placeholder="DD / MM / AAAA"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.birthDate && (
            <Text style={styles.error}>{errors.birthDate.message}</Text>
          )}
        </View>

        {/* Dirección */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Dirección<Text style={styles.required}> *</Text>
          </Text>
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                placeholder="Tu respuesta"
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
            ¿Tienes experiencia laboral?<Text style={styles.required}> *</Text>
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
                  <Text style={styles.radioLabel}>Sí</Text>
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
                  <Text style={styles.radioLabel}>No</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.hasExperience && (
            <Text style={styles.error}>{errors.hasExperience.message}</Text>
          )}
        </View>

        {/* Detalles de experiencia (si dijo Sí) */}
        {hasExperience === "si" && (
          <View style={styles.field}>
            <Text style={styles.label}>
              Cuéntanos sobre tu experiencia laboral
            </Text>
            <Text style={styles.helperText}>
              ¿Dónde trabajaste antes? ¿Qué hacías?
            </Text>
            <Controller
              control={control}
              name="experienceDetails"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[styles.textArea]}
                  placeholder="Ejemplo: Trabajé en un hotel como Housekeeping por 2 años..."
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
          <Text style={styles.label}>¿Qué experiencia laboral tienes?</Text>
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
                {/* Otro */}
                <TouchableOpacity
                  style={styles.checkboxOption}
                  onPress={() =>
                    toggleCheckbox(field, "Otro", field.value || [])
                  }
                >
                  <View
                    style={[
                      styles.checkbox,
                      field.value?.includes("Otro") && styles.checkboxSelected,
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
                  <Text style={styles.checkboxLabel}>Otro:</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        {/* Notas adicionales */}
        <View style={styles.field}>
          <Text style={styles.label}>Notas adicionales</Text>
          <Text style={styles.helperText}>
            ¿Algo más que quieras contarnos? (Opcional)
          </Text>
          <Controller
            control={control}
            name="additionalNotes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.textArea]}
                placeholder="Escribe aquí cualquier información adicional que consideres relevante..."
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
            style={styles.submitButton}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Enviando..." : "Enviar"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  jobInfo: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  field: {
    marginBottom: 24,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 12,
  },
  required: {
    color: "#dc2626",
  },
  helperText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111",
    backgroundColor: "#fff",
  },
  inputError: {
    borderColor: "#dc2626",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#111",
    backgroundColor: "#fff",
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
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: "#3b82f6",
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3b82f6",
  },
  radioLabel: {
    fontSize: 16,
    color: "#374151",
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
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
    flex: 1,
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
  },
  cancelButtonText: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "500",
  },
})
