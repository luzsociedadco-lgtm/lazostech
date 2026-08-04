import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Button, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import Purchases, { LOG_LEVEL, PurchasesOffering } from "react-native-purchases";
import RevenueCatUI from "react-native-purchases-ui";
import { WebView } from "react-native-webview";

const DEMO_URL = process.env.EXPO_PUBLIC_UNIMARKET_URL ?? "https://www.lazostech.com/unimarket";

function revenueCatKey() {
  if (Platform.OS === "ios") return process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY;
  if (Platform.OS === "android") return process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY;
  return undefined;
}

export default function App() {
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [status, setStatus] = useState("Cargando UniMarket…");
  const [showPaywall, setShowPaywall] = useState(false);
  const apiKey = useMemo(revenueCatKey, []);

  useEffect(() => {
    let active = true;

    async function configureRevenueCat() {
      if (!apiKey || Platform.OS === "web") {
        setStatus("Modo demo: configura una clave pública de RevenueCat para activar compras.");
        return;
      }

      try {
        Purchases.setLogLevel(LOG_LEVEL.INFO);
        Purchases.configure({ apiKey });
        const offerings = await Purchases.getOfferings();
        if (active) {
          setOffering(offerings.current ?? null);
          setStatus(offerings.current ? "RevenueCat listo para mostrar el plan de vendedor verificado." : "RevenueCat conectado; falta una offering activa.");
        }
      } catch {
        if (active) setStatus("No pudimos cargar la offering de RevenueCat todavía.");
      }
    }

    void configureRevenueCat();
    return () => {
      active = false;
    };
  }, [apiKey]);

  async function openPaywall() {
    if (!offering) {
      setStatus("Crea una offering en RevenueCat para habilitar el plan.");
      return;
    }

    setShowPaywall(true);
    await RevenueCatUI.presentPaywall({ offering });
    setShowPaywall(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.brand}>LazosTech</Text>
        <Text style={styles.title}>UniMarket</Text>
        <Text style={styles.subtitle}>Intercambio circular universitario</Text>
      </View>

      <View style={styles.actions}>
        <Text style={styles.status}>{status}</Text>
        <Button title={showPaywall ? "Abriendo plan…" : "Plan vendedor verificado"} onPress={openPaywall} disabled={showPaywall || Platform.OS === "web"} />
      </View>

      {Platform.OS === "web" ? (
        <ScrollView contentContainerStyle={styles.webFallback}>
          <Text style={styles.fallbackTitle}>Vista previa web</Text>
          <Text style={styles.fallbackText}>Las compras nativas se prueban en un development build de iOS o Android.</Text>
          <ActivityIndicator color="#f4b942" />
        </ScrollView>
      ) : (
        <WebView source={{ uri: DEMO_URL }} style={styles.webview} startInLoadingState renderLoading={() => <ActivityIndicator style={styles.loader} color="#f4b942" />} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#17130d" },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, backgroundColor: "rgba(52, 42, 28, 0.94)" },
  brand: { color: "#f4b942", fontSize: 14, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#fff5dc", fontSize: 27, fontWeight: "900", marginTop: 2 },
  subtitle: { color: "#dccaa1", fontSize: 13, marginTop: 2 },
  actions: { gap: 8, padding: 12, backgroundColor: "rgba(52, 42, 28, 0.94)" },
  status: { color: "#eadfc8", fontSize: 12 },
  webview: { flex: 1, backgroundColor: "#17130d" },
  loader: { flex: 1, backgroundColor: "#17130d" },
  webFallback: { flexGrow: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  fallbackTitle: { color: "#fff5dc", fontSize: 20, fontWeight: "800" },
  fallbackText: { color: "#dccaa1", textAlign: "center" }
});
