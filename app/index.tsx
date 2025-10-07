// app/index.tsx
import { MaterialIcons } from "@expo/vector-icons"
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
  salary?: string
  requirements?: string[]
  status: string
  imageURL?: string
}

export default function Index() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

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

      setJobs(jobsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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
            color="#666"
          />
          <Text style={styles.company}>{item.company}</Text>
        </View>

        {item.location && (
          <View style={styles.row}>
            <MaterialIcons
              name="location-on"
              size={16}
              color="#666"
            />
            <Text style={styles.location}>{item.location}</Text>
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
          color="#3b82f6"
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Empleos Disponibles</Text>
        <Text style={styles.headerSubtitle}>{jobs.length} empleos activos</Text>
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
              color="#ccc"
            />
            <Text style={styles.emptyText}>No hay empleos disponibles</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    color: "#111",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  company: {
    fontSize: 15,
    color: "#374151",
    marginLeft: 6,
  },
  location: {
    fontSize: 14,
    color: "#6b7280",
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
    color: "#4b5563",
    lineHeight: 20,
    marginTop: 8,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  tag: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: "#6b7280",
  },
  empty: {
    alignItems: "center",
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 12,
  },
})
