// app/index.tsx
import { MaterialIcons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { router } from "expo-router"
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { db } from "../config/firebase"

interface Job {
  id: string
  title: string
  description: string
  company: string
  location?: string
  latitude?: number
  longitude?: number
  salary?: string
  requirements?: string[]
  status: string
  imageURL?: string
  distance?: number
}

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return distance
}

export default function Index() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()

        if (status !== "granted") {
          Alert.alert(
            "Permiso denegado",
            "Se necesita acceso a la ubicación para mostrar empleos cercanos"
          )
          setLoading(false)
          return
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
      } catch (error) {
        console.error("Error obteniendo ubicación:", error)
        Alert.alert(
          "Error",
          "No se pudo obtener tu ubicación. Verifica que el GPS esté activado."
        )
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    const q = query(
      collection(db, "jobs"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Job[]

      if (userLocation) {
        const jobsWithDistance = jobsData.map((job) => {
          if (job.latitude && job.longitude) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              job.latitude,
              job.longitude
            )
            return { ...job, distance }
          }
          return { ...job, distance: 999999 }
        })

        jobsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0))
        setJobs(jobsWithDistance)
      } else {
        setJobs(jobsData)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [userLocation])

  const JobCard = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: "/form" as any,
          params: { jobId: item.id, jobTitle: item.title },
        })
      }
    >
      {item.imageURL && (
        <Image
          source={{ uri: item.imageURL }}
          style={styles.image}
        />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.row}>
          <MaterialIcons
            name="business"
            size={16}
            color="#9ca3af"
          />
          <Text style={styles.company}>{item.company}</Text>
        </View>

        {item.distance !== undefined && item.distance < 999999 && (
          <View style={styles.row}>
            <MaterialIcons
              name="near-me"
              size={16}
              color="#dc2626"
            />
            <Text style={styles.distance}>
              {item.distance < 0.1
                ? "Menos de 0.1 millas"
                : `${item.distance.toFixed(1)} millas de distancia`}
            </Text>
          </View>
        )}

        {item.salary && (
          <View style={styles.row}>
            <MaterialIcons
              name="attach-money"
              size={16}
              color="#10b981"
            />
            <Text style={styles.salary}>{item.salary}</Text>
          </View>
        )}

        <Text
          style={styles.description}
          numberOfLines={2}
        >
          {item.description}
        </Text>

        {item.requirements && item.requirements.length > 0 && (
          <View style={styles.tags}>
            {item.requirements.slice(0, 3).map((req, i) => (
              <View
                key={i}
                style={styles.tag}
              >
                <Text style={styles.tagText}>{req}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#dc2626"
        />
        <Text style={styles.loadingText}>Obteniendo tu ubicación...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#111"
      />

      {/* ✨ HEADER CON LOGO */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>LCS</Text>
          </View>
          <Text style={styles.logoTitle}>Staffing</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerSubtitle}>
            {jobs.length} empleos activos
            {userLocation && " • Ordenados por distancia"}
          </Text>
        </View>
      </View>

      <FlatList
        data={jobs}
        renderItem={({ item }) => <JobCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <MaterialIcons
              name="work-off"
              size={64}
              color="#dc2626"
            />
            <Text style={styles.emptyText}>No hay empleos disponibles</Text>
          </View>
        )}
      />
    </View>
  )
}

Index.options = {
  headerShown: false,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#e5e7eb",
  },
  header: {
    backgroundColor: "#111",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: "#dc2626",
  },
  // ✨ ESTILOS DEL LOGO
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  logoBox: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  logoText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  logoTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 12,
  },
  headerInfo: {
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#e5e7eb",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#1f1f1f",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  image: {
    width: "100%",
    height: 180,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  company: {
    fontSize: 15,
    color: "#d1d5db",
    marginLeft: 6,
  },
  distance: {
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "600",
    marginLeft: 6,
  },
  salary: {
    fontSize: 15,
    color: "#10b981",
    fontWeight: "600",
    marginLeft: 6,
  },
  description: {
    fontSize: 14,
    color: "#9ca3af",
    lineHeight: 20,
    marginTop: 8,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  tag: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#3a3a3a",
  },
  tagText: {
    fontSize: 12,
    color: "#d1d5db",
  },
  empty: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#e5e7eb",
    marginTop: 12,
  },
})
