import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMap } from "react-leaflet";

// ============================================================
// DATOS MOCK Y DE RESPALDO (OFFLINE / SIMULACIÓN VENEZUELA)
// ============================================================

const offlineSismos = [
    {
        id: "ve-2026-001",
        tipo: "precursor",
        magnitud: 7.2,
        profundidad_km: 20.3,
        lat: 10.35,
        lng: -68.65,
        hora_utc: "2026-06-24T22:04:33Z",
        hora_local: "24/6/2026, 18:04:33",
        epicentro: "23 km al noreste de San Felipe, Yaracuy, Venezuela",
        lugar: "San Felipe, Yaracuy, Venezuela",
        alerta_pager: "naranja",
        tsunami: 0,
        felt: 480,
        mmi: 7,
        cdi: 7,
        descripcion: "M 7.2 Precursor - Yaracuy, Venezuela",
    },
    {
        id: "ve-2026-002",
        tipo: "principal",
        magnitud: 7.5,
        profundidad_km: 10.0,
        lat: 10.28,
        lng: -68.75,
        hora_utc: "2026-06-24T22:05:12Z",
        hora_local: "24/6/2026, 18:05:12",
        epicentro: "23 km al sureste de Yumare, Yaracuy, Venezuela",
        lugar: "Yumare, Yaracuy, Venezuela",
        alerta_pager: "rojo",
        tsunami: 0,
        felt: 1850,
        mmi: 9,
        cdi: 9,
        descripcion: "M 7.5 Principal - Yaracuy, Venezuela",
    },
];

const OFFLINE_REPLICAS = [
    { id: "r1", magnitud: 5.4, profundidad_km: 12, lat: 10.31, lng: -68.70, hora_utc: "2026-06-24T22:18:00Z" },
    { id: "r2", magnitud: 4.9, profundidad_km: 15, lat: 10.25, lng: -68.80, hora_utc: "2026-06-24T22:35:00Z" },
    { id: "r3", magnitud: 5.1, profundidad_km: 8, lat: 10.22, lng: -68.72, hora_utc: "2026-06-24T23:10:00Z" },
    { id: "r4", magnitud: 4.7, profundidad_km: 18, lat: 10.38, lng: -68.68, hora_utc: "2026-06-24T23:55:00Z" },
    { id: "r5", magnitud: 4.3, profundidad_km: 10, lat: 10.20, lng: -68.78, hora_utc: "2026-06-25T01:22:00Z" },
    { id: "r6", magnitud: 5.0, profundidad_km: 14, lat: 10.30, lng: -68.65, hora_utc: "2026-06-25T03:40:00Z" },
];

const WORLD_CITIES = [
    // Venezuela
    { nombre: "San Felipe", estado: "Yaracuy, Venezuela", lat: 10.34, lng: -68.75, poblacion: 95000 },
    { nombre: "Yumare", estado: "Yaracuy, Venezuela", lat: 10.47, lng: -68.85, poblacion: 8500 },
    { nombre: "Morón", estado: "Carabobo, Venezuela", lat: 10.48, lng: -68.20, poblacion: 50000 },
    { nombre: "Puerto Cabello", estado: "Carabobo, Venezuela", lat: 10.47, lng: -68.02, poblacion: 185000 },
    { nombre: "Valencia", estado: "Carabobo, Venezuela", lat: 10.18, lng: -68.00, poblacion: 1400000 },
    { nombre: "Barquisimeto", estado: "Lara, Venezuela", lat: 10.07, lng: -69.32, poblacion: 900000 },
    { nombre: "Caracas", estado: "Dto. Capital, Venezuela", lat: 10.49, lng: -66.88, poblacion: 2900000 },
    { nombre: "Maiquetía", estado: "Vargas, Venezuela", lat: 10.59, lng: -67.00, poblacion: 50000 },
    { nombre: "Maracay", estado: "Aragua, Venezuela", lat: 10.24, lng: -67.59, poblacion: 900000 },
    { nombre: "Coro", estado: "Falcón, Venezuela", lat: 11.40, lng: -69.67, poblacion: 195000 },
    { nombre: "Valera", estado: "Trujillo, Venezuela", lat: 9.31, lng: -70.60, poblacion: 170000 },
    { nombre: "Mérida", estado: "Mérida, Venezuela", lat: 8.59, lng: -71.14, poblacion: 250000 },
    { nombre: "Cumaná", estado: "Sucre, Venezuela", lat: 10.45, lng: -64.18, poblacion: 370000 },
    { nombre: "Barcelona", estado: "Anzoátegui, Venezuela", lat: 10.13, lng: -64.68, poblacion: 420000 },
    { nombre: "Maracaibo", estado: "Zulia, Venezuela", lat: 10.66, lng: -71.61, poblacion: 1600000 },
    
    // Países Vecinos y Caribe
    { nombre: "Bogotá", estado: "Colombia", lat: 4.71, lng: -74.07, poblacion: 8000000 },
    { nombre: "Cúcuta", estado: "Colombia", lat: 7.89, lng: -72.50, poblacion: 770000 },
    { nombre: "Bucaramanga", estado: "Colombia", lat: 7.12, lng: -73.12, poblacion: 580000 },
    { nombre: "Oranjestad", estado: "Aruba", lat: 12.52, lng: -70.03, poblacion: 35000 },
    { nombre: "Willemstad", estado: "Curaçao", lat: 12.11, lng: -68.93, poblacion: 150000 },
    { nombre: "Puerto España", estado: "Trinidad y Tobago", lat: 10.66, lng: -61.51, poblacion: 3700 },
    
    // Ciudades Sísmicas Mundiales de Referencia
    { nombre: "Santiago", estado: "Chile", lat: -33.45, lng: -70.66, poblacion: 5600000 },
    { nombre: "Lima", estado: "Perú", lat: -12.04, lng: -77.03, poblacion: 9500000 },
    { nombre: "Quito", estado: "Ecuador", lat: -0.18, lng: -78.47, poblacion: 2000000 },
    { nombre: "Ciudad de México", estado: "México", lat: 19.43, lng: -99.13, poblacion: 9200000 },
    { nombre: "Los Angeles", estado: "California, EE.UU.", lat: 34.05, lng: -118.24, poblacion: 3900000 },
    { nombre: "San Francisco", estado: "California, EE.UU.", lat: 37.77, lng: -122.42, poblacion: 870000 },
    { nombre: "Tokyo", estado: "Japón", lat: 35.68, lng: 139.76, poblacion: 14000000 },
    { nombre: "Taipei", estado: "Taiwán", lat: 25.03, lng: 121.56, poblacion: 2600000 },
    { nombre: "Yakarta", estado: "Indonesia", lat: -6.20, lng: 106.82, poblacion: 10500000 },
    { nombre: "Roma", estado: "Italia", lat: 41.90, lng: 12.49, poblacion: 2800000 },
    { nombre: "Estambul", estado: "Turquía", lat: 41.01, lng: 28.98, poblacion: 15400000 }
];

const ZONAS_IMPACTO = [
    { intensidad: "IX (Violento)", radio_km: 30, color: "#7F1D1D", opacidad: 0.5, poblacion_exp: 85000, descripcion: "Destrucción severa. Mayoría de estructuras vulnerables colapsan." },
    { intensidad: "VIII (Severo)", radio_km: 65, color: "#DC2626", opacidad: 0.35, poblacion_exp: 320000, descripcion: "Daño considerable en edificios ordinarios, colapsos parciales." },
    { intensidad: "VII (Muy fuerte)", radio_km: 110, color: "#EA580C", opacidad: 0.25, poblacion_exp: 1100000, descripcion: "Daño moderado a leve. Caída de cornisas, chimeneas y tejas." },
    { intensidad: "VI (Fuerte)", radio_km: 170, color: "#D97706", opacidad: 0.18, poblacion_exp: 320000, descripcion: "Sentido por todos. Pequeños daños generales, pánico ligero." },
    { intensidad: "V (Moderado)", radio_km: 250, color: "#CA8A04", opacidad: 0.12, poblacion_exp: 6500000, descripcion: "Sentido por casi todos. Objetos colgantes se balancean fuertemente." },
];

const REPORTES_INICIALES_PRESETS = [
    { id: "rep1", tipo: "colapso", ciudad: "Epicentro", descripcion: "Fallas estructurales notables en construcciones de adobe. Desprendimiento de tejas.", estado: "activo", hora: "Hace 10m", prioridad: "critica", lat: 0, lng: 0 },
    { id: "rep2", tipo: "servicios", ciudad: "Región Cercana", descripcion: "Corte del fluido eléctrico y caída temporal de antenas telefónicas.", estado: "pendiente", hora: "Hace 25m", prioridad: "alta", lat: 0, lng: 0 }
];

// ============================================================
// AUXILIAR / UTILIDADES SÍSMICAS
// ============================================================

const deg2rad = (deg) => deg * (Math.PI / 180);

const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la tierra en km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const estimateIntensity = (mag, dist) => {
    const raw = 1.5 * mag - 1.5 - 1.2 * Math.log(dist + 5);
    const val = Math.max(1, Math.min(10, Math.round(raw)));
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return roman[val - 1] || "I";
};

const getDamageLevel = (mmi) => {
    const m = {
        "X": { nivel: "catastrófico", color: "#7F1D1D" },
        "IX": { nivel: "crítico", color: "#DC2626" },
        "VIII": { nivel: "severo", color: "#EA580C" },
        "VII": { nivel: "fuerte", color: "#D97706" },
        "VI": { nivel: "moderado", color: "#CA8A04" },
        "V": { nivel: "leve-moderado", color: "#CA8A04" },
        "IV": { nivel: "leve", color: "#16A34A" },
        "III": { nivel: "sentido", color: "#16A34A" },
        "II": { nivel: "sentido", color: "#6B7280" },
        "I": { nivel: "no sentido", color: "#6B7280" }
    };
    return m[mmi] || { nivel: "no sentido", color: "#6B7280" };
};

const isNearVenezuela = (lat, lng, place = "") => {
    const inBox = lat >= 0.0 && lat <= 15.5 && lng >= -75.0 && lng <= -56.5;
    const mentionsVE = place?.toLowerCase().includes("venezuela") || 
                       place?.toLowerCase().includes("trinidad") || 
                       place?.toLowerCase().includes("colombia") ||
                       place?.toLowerCase().includes("caribbean") ||
                       place?.toLowerCase().includes("aruba") ||
                       place?.toLowerCase().includes("curacao") ||
                       place?.toLowerCase().includes("grenada") ||
                       place?.toLowerCase().includes("barbados");
    return inBox || mentionsVE;
};

const parsePlace = (place, eqLat, eqLng) => {
    let distance_km = 10;
    let nombre = place || "Epicentro";
    let estado = "";
    
    if (place?.includes(" of ")) {
        const parts = place.split(" of ");
        nombre = parts[1];
        const distMatch = parts[0].match(/(\d+(\.\d+)?)/);
        if (distMatch) {
            distance_km = parseFloat(distMatch[1]);
        }
    }
    
    if (nombre.includes(", ")) {
        const commaParts = nombre.split(", ");
        nombre = commaParts[0];
        estado = commaParts[1];
    }
    
    return {
        id: "dyn-local",
        nombre: nombre,
        estado: estado || "Zona Local",
        distancia_km: Math.round(distance_km),
        poblacion: 12000,
        lat: eqLat + (Math.random() - 0.5) * 0.05,
        lng: eqLng + (Math.random() - 0.5) * 0.05,
    };
};

const colorPorMagnitud = (m) => {
    if (m >= 7.5) return "#7F1D1D";
    if (m >= 7.0) return "#DC2626";
    if (m >= 6.0) return "#EA580C";
    if (m >= 5.0) return "#D97706";
    return "#CA8A04";
};

const colorPorNivel = (nivel) => {
    const mapa = { critico: "#DC2626", rojo: "#DC2626", severo: "#EA580C", naranja: "#EA580C", alta: "#D97706", "leve-moderado": "#CA8A04", moderado: "#D97706", leve: "#16A34A", informativo: "#2563EB", media: "#D97706", verde: "#16A34A" };
    return mapa[nivel] || "#6B7280";
};

const gradoIntensidad = (i) => {
    const m = { X: 10, IX: 9, VIII: 8, VII: 7, VI: 6, V: 5, IV: 4, III: 3, II: 2, I: 1 };
    const k = Object.keys(m).find(k => i?.startsWith(k));
    return k ? m[k] : 1;
};

const exportarCSV = (ciudades) => {
    const header = "Ciudad,Ubicacion,Distancia_km,Poblacion,Intensidad,Nivel_Dano,Verificado\n";
    const rows = ciudades.map(c => `${c.nombre},${c.estado},${c.distancia_km},${c.poblacion},${c.intensidad},${c.nivel_dano},${c.verificado ? "Sí" : "No"}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sismo_impacto_ciudades.csv";
    a.click();
};

// ============================================================
// CONTEXTO DE ESTADO GLOBAL
// ============================================================

const AppContext = createContext(null);

function AppProvider({ children }) {
    const [modoOscuro, setModoOscuro] = useState(true);
    const [ambitoGeografico, setAmbitoGeografico] = useState("venezuela");
    const [feed, setFeed] = useState("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson");
    const [sismos, setSismos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
    
    const [capasActivas, setCapasActivas] = useState({ epicentro: true, intensidad: true, ciudades: true, replicas: true, reportes: true });
    const [ciudadFoco, setCiudadFoco] = useState(null);
    const [ciudadesCercanas, setCiudadesCercanas] = useState([]);
    const [replicas, setReplicas] = useState([]);
    const [reportesPorSismo, setReportesPorSismo] = useState({});
    
    const [tabActiva, setTabActiva] = useState("mapa");
    const [filtroMinMag, setFiltroMinMag] = useState(2.5);
    const [busquedaUbicacion, setBusquedaUbicacion] = useState("");
    const [sidebarTab, setSidebarTab] = useState("lista");
    const [sidebarAbierto, setSidebarAbierto] = useState(false);
    
    const [simulandoReplica, setSimulandoReplica] = useState(false);
    const [alertaSimulada, setAlertaSimulada] = useState(null);

    const toggleCapa = useCallback((capa) => {
        setCapasActivas(prev => ({ ...prev, [capa]: !prev[capa] }));
    }, []);

    // Consulta de Feed Principal
    useEffect(() => {
        setLoading(true);
        setError(null);
        
        if (feed === "offline") {
            setSismos(offlineSismos);
            setEventoSeleccionado(offlineSismos[1]);
            setLoading(false);
            return;
        }

        fetch(feed)
            .then(res => {
                if (!res.ok) throw new Error("Error consultando API USGS");
                return res.json();
            })
            .then(data => {
                const parsed = data.features.map(f => {
                    const coords = f.geometry.coordinates;
                    return {
                        id: f.id,
                        tipo: f.properties.mag >= 6.2 ? "principal" : "menor / réplica",
                        magnitud: f.properties.mag,
                        profundidad_km: coords[2],
                        lat: coords[1],
                        lng: coords[0],
                        hora_utc: new Date(f.properties.time).toISOString(),
                        hora_local: new Date(f.properties.time).toLocaleString("es-VE"),
                        epicentro: f.properties.place,
                        lugar: f.properties.place,
                        alerta_pager: f.properties.alert || (f.properties.mag >= 6.5 ? "rojo" : f.properties.mag >= 5.5 ? "naranja" : "verde"),
                        tsunami: f.properties.tsunami || 0,
                        felt: f.properties.felt || 0,
                        mmi: f.properties.mmi || Math.max(1, Math.round(f.properties.mag * 1.3 - 1)),
                        cdi: f.properties.cdi || 1,
                        descripcion: f.properties.title
                    };
                });

                let combined = [];
                if (ambitoGeografico === "venezuela") {
                    const filteredVE = parsed.filter(s => isNearVenezuela(s.lat, s.lng, s.epicentro));
                    combined = [...offlineSismos, ...filteredVE];
                } else {
                    combined = parsed;
                }

                const unique = [];
                const seen = new Set();
                for (const s of combined) {
                    if (!seen.has(s.id)) {
                        seen.add(s.id);
                        unique.push(s);
                    }
                }

                unique.sort((a, b) => new Date(b.hora_utc) - new Date(a.hora_utc));
                setSismos(unique);

                if (ambitoGeografico === "venezuela") {
                    const principalVE = unique.find(s => s.id === "ve-2026-002");
                    setEventoSeleccionado(principalVE || unique[0] || null);
                } else {
                    setEventoSeleccionado(unique[0] || null);
                }

                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError("Error de conexión con el servidor. Cargando histórico de Venezuela.");
                setSismos(offlineSismos);
                setEventoSeleccionado(offlineSismos[1]);
                setLoading(false);
            });
    }, [feed, ambitoGeografico]);

    // Recalcular ciudades e impactos locales y cargar réplicas
    useEffect(() => {
        if (!eventoSeleccionado) return;

        const localDynCity = parsePlace(eventoSeleccionado.epicentro, eventoSeleccionado.lat, eventoSeleccionado.lng);
        const cercanas = WORLD_CITIES.map(c => {
            const dist = getDistance(eventoSeleccionado.lat, eventoSeleccionado.lng, c.lat, c.lng);
            const mmi = estimateIntensity(eventoSeleccionado.magnitud, dist);
            const dmg = getDamageLevel(mmi);
            return {
                ...c,
                distancia_km: Math.round(dist),
                intensidad: mmi,
                nivel_dano: dmg.nivel,
                color: dmg.color,
                verificado: Math.random() > 0.4
            };
        }).filter(c => c.distancia_km <= 350);

        const localDmg = getDamageLevel(estimateIntensity(eventoSeleccionado.magnitud, localDynCity.distancia_km));
        const ciudadesCombinadas = [
            {
                ...localDynCity,
                intensidad: estimateIntensity(eventoSeleccionado.magnitud, localDynCity.distancia_km),
                nivel_dano: localDmg.nivel,
                color: localDmg.color,
                verificado: true
            },
            ...cercanas
        ].sort((a, b) => a.distancia_km - b.distancia_km);

        setCiudadesCercanas(ciudadesCombinadas);

        if (!reportesPorSismo[eventoSeleccionado.id]) {
            setReportesPorSismo(prev => ({
                ...prev,
                [eventoSeleccionado.id]: REPORTES_INICIALES_PRESETS.map(r => ({
                    ...r,
                    ciudad: localDynCity.nombre,
                    lat: localDynCity.lat,
                    lng: localDynCity.lng
                }))
            }));
        }

        if (feed === "offline" || eventoSeleccionado.id.startsWith("ve-2026-")) {
            setReplicas(OFFLINE_REPLICAS);
            return;
        }

        const timeVal = new Date(eventoSeleccionado.hora_utc).getTime();
        const startTime = new Date(timeVal - 6 * 3600 * 1000).toISOString();
        const endTime = new Date(timeVal + 72 * 3600 * 1000).toISOString();
        const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endtime=${endTime}&latitude=${eventoSeleccionado.lat}&longitude=${eventoSeleccionado.lng}&maxradiuskm=150&minmagnitude=2.0`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                const list = data.features
                    .filter(f => f.id !== eventoSeleccionado.id)
                    .map(f => {
                        const coords = f.geometry.coordinates;
                        return {
                            id: f.id,
                            magnitud: f.properties.mag,
                            profundidad_km: coords[2],
                            lat: coords[1],
                            lng: coords[0],
                            hora_utc: new Date(f.properties.time).toISOString()
                        };
                    });
                setReplicas(list);
            })
            .catch(() => {
                const list = Array.from({ length: 4 }).map((_, i) => ({
                    id: `sim-rep-${i}`,
                    magnitud: parseFloat((eventoSeleccionado.magnitud - 1.2 - Math.random() * 1.5).toFixed(1)),
                    profundidad_km: Math.round(eventoSeleccionado.profundidad_km + (Math.random() - 0.5) * 6),
                    lat: eventoSeleccionado.lat + (Math.random() - 0.5) * 0.3,
                    lng: eventoSeleccionado.lng + (Math.random() - 0.5) * 0.3,
                    hora_utc: new Date(timeVal + (i + 1) * 4 * 3600 * 1000).toISOString()
                })).filter(r => r.magnitud > 2.0);
                setReplicas(list);
            });

    }, [eventoSeleccionado, feed]);

    const agregarReporte = useCallback((sismoId, reporte) => {
        setReportesPorSismo(prev => {
            const list = prev[sismoId] || [];
            return {
                ...prev,
                [sismoId]: [{ ...reporte, id: `rep-${Date.now()}` }, ...list]
            };
        });
    }, []);

    const actualizarEstadoReporte = useCallback((sismoId, id, estado) => {
        setReportesPorSismo(prev => {
            const list = prev[sismoId] || [];
            return {
                ...prev,
                [sismoId]: list.map(r => r.id === id ? { ...r, estado } : r)
            };
        });
    }, []);

    const simularReplica = useCallback(() => {
        if (!eventoSeleccionado) return;
        setSimulandoReplica(true);
        const mag = (4.0 + Math.random() * 2.0).toFixed(1);
        const offsetLat = (Math.random() - 0.5) * 0.2;
        const offsetLng = (Math.random() - 0.5) * 0.2;
        setTimeout(() => {
            const nuevaReplica = {
                id: `sim-act-${Date.now()}`,
                magnitud: parseFloat(mag),
                profundidad_km: Math.round(10 + Math.random() * 20),
                lat: eventoSeleccionado.lat + offsetLat,
                lng: eventoSeleccionado.lng + offsetLng,
                hora_utc: new Date().toISOString(),
                simulada: true
            };
            setReplicas(prev => [nuevaReplica, ...prev]);
            setAlertaSimulada(`⚡ Réplica M${mag} simulada cerca de ${eventoSeleccionado.lugar}`);
            setSimulandoReplica(false);
            setTimeout(() => setAlertaSimulada(null), 5000);
        }, 1200);
    }, [eventoSeleccionado]);

    return (
        <AppContext.Provider value={{
            modoOscuro, setModoOscuro, ambitoGeografico, setAmbitoGeografico, feed, setFeed, sismos, loading, error,
            eventoSeleccionado, setEventoSeleccionado, capasActivas, toggleCapa,
            ciudadFoco, setCiudadFoco, ciudadesCercanas, replicas, reportesPorSismo,
            agregarReporte, actualizarEstadoReporte, tabActiva, setTabActiva,
            filtroMinMag, setFiltroMinMag, busquedaUbicacion, setBusquedaUbicacion,
            sidebarTab, setSidebarTab, sidebarAbierto, setSidebarAbierto, simularReplica, simulandoReplica, alertaSimulada
        }}>
            {children}
        </AppContext.Provider>
    );
}

const useApp = () => useContext(AppContext);

// ============================================================
// COMPONENTES COMUNES DE UI
// ============================================================

const Badge = ({ nivel, texto }) => {
    const bg = { 
        rojo: "bg-red-955 text-red-200 border-red-700", 
        naranja: "bg-orange-955 text-orange-200 border-orange-700", 
        critico: "bg-red-955 text-red-200 border-red-700", 
        alta: "bg-orange-955 text-orange-200 border-orange-700", 
        media: "bg-yellow-955 text-yellow-200 border-yellow-700", 
        leve: "bg-green-955 text-green-200 border-green-700", 
        tsunami: "bg-red-955 text-red-100 border-red-600 animate-pulse",
        informativo: "bg-blue-955 text-blue-200 border-blue-700", 
        confirmado: "bg-green-955 text-green-200 border-green-700", 
        activo: "bg-red-955 text-red-200 border-red-700", 
        pendiente: "bg-yellow-955 text-yellow-200 border-yellow-700",
        verde: "bg-green-955 text-green-200 border-green-700" 
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${bg[nivel] || "bg-gray-800 text-gray-300 border-gray-600"}`}>{texto || nivel?.toUpperCase()}</span>;
};

const Pulso = ({ color = "#DC2626" }) => (
    <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }}></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }}></span>
    </span>
);

function MapRecenter({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { animate: true, duration: 1.2 });
        }
    }, [center, zoom, map]);
    return null;
}

// ============================================================
// COMPONENTE DE MAPA LEAFLET GLOBAL
// ============================================================

function MapaLeaflet() {
    const { capasActivas, eventoSeleccionado, ciudadesCercanas, replicas, ciudadFoco, setCiudadFoco, ambitoGeografico } = useApp();
    const [mapCenter, setMapCenter] = useState([10.48, -66.90]);
    const [mapZoom, setMapZoom] = useState(6);

    useEffect(() => {
        if (eventoSeleccionado) {
            setMapCenter([eventoSeleccionado.lat, eventoSeleccionado.lng]);
            setMapZoom(eventoSeleccionado.magnitud > 7.0 ? 5.5 : 6.5);
        } else if (ambitoGeografico === "venezuela") {
            setMapCenter([10.48, -66.90]);
            setMapZoom(6);
        }
    }, [eventoSeleccionado, ambitoGeografico]);

    useEffect(() => {
        if (ciudadFoco) {
            setMapCenter([ciudadFoco.lat, ciudadFoco.lng]);
            setMapZoom(8);
        }
    }, [ciudadFoco]);

    if (!eventoSeleccionado) return (
        <div className="flex items-center justify-center h-full text-gray-500 bg-gray-950">
            Cargando mapa interactivo focalizado...
        </div>
    );

    return (
        <div className="w-full h-full relative border border-gray-800 rounded-lg overflow-hidden">
            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%", background: "#0f172a" }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    maxZoom={16}
                />
                
                <MapRecenter center={mapCenter} zoom={mapZoom} />

                {/* Zonas de Intensidad de Daño */}
                {capasActivas.intensidad && ZONAS_IMPACTO.map((zona, idx) => {
                    const scaleFactor = eventoSeleccionado.magnitud / 7.5;
                    const radioMetros = zona.radio_km * 1000 * scaleFactor;
                    return (
                        <Circle
                            key={`z-${idx}`}
                            center={[eventoSeleccionado.lat, eventoSeleccionado.lng]}
                            radius={radioMetros}
                            pathOptions={{
                                fillColor: zona.color,
                                fillOpacity: zona.opacidad * 0.7,
                                color: zona.color,
                                weight: 1,
                                opacity: 0.4
                            }}
                        />
                    );
                })}

                {/* Ciudades Cercanas */}
                {capasActivas.ciudades && ciudadesCercanas.map(c => {
                    const esFoco = ciudadFoco?.nombre === c.nombre;
                    const radio = Math.max(8, Math.log10(c.poblacion) * 3);
                    return (
                        <CircleMarker
                            key={`c-${c.nombre}`}
                            center={[c.lat, c.lng]}
                            radius={radio}
                            pathOptions={{
                                fillColor: c.color,
                                fillOpacity: 0.85,
                                color: esFoco ? "#ffffff" : "#000000",
                                weight: esFoco ? 2 : 1
                            }}
                            eventHandlers={{
                                click: () => setCiudadFoco(esFoco ? null : c)
                            }}
                        >
                            <Popup>
                                <div className="text-xs text-gray-900 font-sans p-1">
                                    <div className="font-bold text-sm">{c.nombre}</div>
                                    <div className="text-gray-500 mb-1">{c.estado}</div>
                                    <div className="mt-1"><b>Intensidad MMI:</b> {c.intensidad} ({c.nivel_dano})</div>
                                    <div><b>Población:</b> {c.poblacion.toLocaleString()}</div>
                                    <div><b>Distancia:</b> {c.distancia_km} km</div>
                                    <div><b>Reporte:</b> {c.verificado ? "✅ Verificado" : "⏳ Evaluando"}</div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}

                {/* Réplicas */}
                {capasActivas.replicas && replicas.map(r => (
                    <CircleMarker
                        key={`rep-${r.id}`}
                        center={[r.lat, r.lng]}
                        radius={Math.max(5, r.magnitud * 1.8)}
                        pathOptions={{
                            fillColor: "#FCD34D",
                            fillOpacity: 0.8,
                            color: "#000000",
                            weight: 1
                        }}
                    >
                        <Popup>
                            <div className="text-xs text-gray-900 font-sans p-1">
                                <div className="font-bold text-amber-600">⚡ Réplica Detectada</div>
                                <div><b>Magnitud:</b> M{r.magnitud.toFixed(1)}</div>
                                <div><b>Fecha UTC:</b> {new Date(r.hora_utc).toLocaleTimeString()}</div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}

                {/* Epicentro Principal */}
                {capasActivas.epicentro && (
                    <>
                        <CircleMarker
                            center={[eventoSeleccionado.lat, eventoSeleccionado.lng]}
                            radius={14}
                            pathOptions={{
                                fillColor: "#DC2626",
                                fillOpacity: 0.5,
                                color: "#ffffff",
                                weight: 2
                            }}
                        >
                            <Popup>
                                <div className="text-xs text-gray-900 font-sans p-1">
                                    <div className="font-bold text-red-650 text-sm">💥 Epicentro Principal</div>
                                    <div className="font-semibold text-gray-700">{eventoSeleccionado.epicentro}</div>
                                    <div className="mt-1"><b>Magnitud:</b> Mw {eventoSeleccionado.magnitud}</div>
                                    <div><b>Profundidad:</b> {eventoSeleccionado.profundidad_km} km</div>
                                    <div><b>Alerta PAGER:</b> <span className="uppercase font-bold" style={{ color: colorPorNivel(eventoSeleccionado.alerta_pager) }}>{eventoSeleccionado.alerta_pager}</span></div>
                                </div>
                            </Popup>
                        </CircleMarker>

                        <Circle
                            center={[eventoSeleccionado.lat, eventoSeleccionado.lng]}
                            radius={40000}
                            pathOptions={{
                                color: "#DC2626",
                                fillColor: "transparent",
                                weight: 1.5,
                                dashArray: "4, 8"
                            }}
                        />
                    </>
                )}
            </MapContainer>

            {/* Leyenda y Coordenadas Flotantes */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-gray-900/90 rounded p-2.5 text-[10px] text-gray-300 border border-gray-700 shadow-md pointer-events-none">
                <div className="font-bold text-white mb-1">Intensidad Mercalli (MMI)</div>
                {ZONAS_IMPACTO.map(z => (
                    <div key={z.intensidad} className="flex items-center gap-1.5 mb-0.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: z.color, opacity: 0.85 }}></div>
                        <span>{z.intensidad}</span>
                    </div>
                ))}
                <div className="mt-1.5 pt-1.5 border-t border-gray-800">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div><span>Réplica</span></div>
                    <div className="flex items-center gap-1.5 mt-0.5"><div className="w-2.5 h-2.5 rounded-full bg-red-600"></div><span>Epicentro Principal</span></div>
                </div>
            </div>

            <div className="absolute top-3 right-3 z-[1000] bg-gray-900/95 px-2.5 py-1 rounded border border-gray-700 text-[10px] font-mono text-gray-400">
                Lat: {eventoSeleccionado.lat.toFixed(3)} | Lng: {eventoSeleccionado.lng.toFixed(3)}
            </div>
        </div>
    );
}

// ============================================================
// COMPONENTE HEADER
// ============================================================

function Header() {
    const { modoOscuro, setModoOscuro, sismos, loading, alertaSimulada, ambitoGeografico } = useApp();
    const sismosSignificativos = sismos.filter(s => s.magnitud >= 5.0).length;

    return (
        <header className="bg-gray-950 border-b border-red-900/40 px-3 sm:px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5">
                    <Pulso color="#DC2626" />
                    <span className="text-red-400 font-bold text-[9px] sm:text-xs tracking-wider">
                        {ambitoGeografico === "venezuela" ? "ALERTA VENEZUELA" : "MONITOREO GLOBAL"}
                    </span>
                </div>
                <div className="h-4 w-px bg-gray-800"></div>
                <div>
                    <span className="text-white font-bold text-xs sm:text-sm">🇻🇪 Earthquake helper</span>
                    <span className="text-gray-500 text-[10px] ml-2 hidden lg:inline">Portal Sísmico Nacional y Global</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {alertaSimulada && (
                    <div className="bg-purple-900 text-purple-200 text-[9px] px-2 py-0.5 rounded border border-purple-700 animate-pulse">
                        {alertaSimulada}
                    </div>
                )}
                {!loading && (
                    <div className="text-right hidden sm:block">
                        <div className="text-red-300 text-[10px] font-mono">{sismosSignificativos} Sismos fuertes</div>
                    </div>
                )}
                <button onClick={() => setModoOscuro(m => !m)} className="text-gray-400 text-[10px] hover:text-white border border-gray-700 rounded px-2 py-0.5 transition-colors">
                    {modoOscuro ? "☀" : "🌙"}
                </button>
            </div>
        </header>
    );
}

// ============================================================
// COMPONENTE PANEL DE INFORMACIÓN DEL SISMO SELECCIONADO
// ============================================================

function PanelSismo() {
    const { eventoSeleccionado, loading } = useApp();
    
    if (loading || !eventoSeleccionado) {
        return (
            <div className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center justify-center">
                <span className="text-gray-400 text-xs animate-pulse">Cargando datos sismográficos...</span>
            </div>
        );
    }

    const ev = eventoSeleccionado;

    return (
        <div className="bg-gray-900 border-b border-gray-800 px-3 sm:px-4 py-2.5">
            <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="min-w-40 flex-1">
                    <span className="text-red-400 text-[9px] font-bold uppercase tracking-wider block">Sismo Focalizado</span>
                    <h2 className="text-white font-bold text-xs sm:text-sm truncate max-w-xs md:max-w-md mt-0.5">{ev.epicentro}</h2>
                </div>

                <div className="flex gap-2 sm:gap-4 flex-wrap w-full sm:w-auto justify-between sm:justify-start">
                    {[
                        { label: "Magnitud", valor: `M ${ev.magnitud.toFixed(1)}`, color: "text-red-400" },
                        { label: "Profundidad", valor: `${Math.round(ev.profundidad_km)} km`, color: "text-orange-400" },
                        { label: "Hora UTC", valor: new Date(ev.hora_utc).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }), color: "text-blue-400" },
                        { label: "Reportes", valor: ev.felt || "0", color: "text-yellow-400" },
                        { label: "Alerta PAGER", valor: ev.alerta_pager?.toUpperCase() || "VERDE", color: colorPorNivel(ev.alerta_pager) },
                    ].map((m, i) => (
                        <div key={i} className="text-center min-w-[55px] sm:min-w-[75px] flex-1 sm:flex-initial bg-gray-950/20 p-1 rounded border border-gray-800/40 sm:border-transparent">
                            <div className={`text-xs sm:text-sm font-bold font-mono ${m.color}`}>{m.valor}</div>
                            <div className="text-gray-500 text-[8px] sm:text-[9px] leading-tight mt-0.5">{m.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// COMPONENTE SIDEBAR DE CONTROL Y LISTADO SÍSMICO RESPONSIVO
// ============================================================

function Sidebar() {
    const { 
        sidebarTab, setSidebarTab, sismos, eventoSeleccionado, setEventoSeleccionado,
        setCiudadFoco, busquedaUbicacion, setBusquedaUbicacion, filtroMinMag, setFiltroMinMag,
        feed, setFeed, capasActivas, toggleCapa, simularReplica, simulandoReplica, ciudadesCercanas,
        ambitoGeografico, setAmbitoGeografico, sidebarAbierto, setSidebarAbierto
    } = useApp();

    const sismosFiltrados = sismos.filter(s => 
        s.magnitud >= filtroMinMag && 
        (s.epicentro?.toLowerCase().includes(busquedaUbicacion.toLowerCase()) || 
         s.id.toLowerCase().includes(busquedaUbicacion.toLowerCase()))
    );

    const capas = [
        { key: "epicentro", label: "Epicentro principal", icon: "⊕" },
        { key: "intensidad", label: "Zonas de intensidad", icon: "🌊" },
        { key: "ciudades", label: "Ciudades afectadas", icon: "🏙" },
        { key: "replicas", label: "Réplicas registradas", icon: "⚡" },
        { key: "reportes", label: "Reportes ciudadanos", icon: "⚠" },
    ];

    return (
        <aside className={`
            fixed md:relative inset-y-0 left-0 z-[1500] md:z-0
            w-64 bg-gray-900 border-r border-gray-800 flex flex-col text-sm overflow-hidden flex-shrink-0
            transform ${sidebarAbierto ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
            transition-transform duration-305 ease-in-out
        `}>
            {/* AMBITO GEOGRÁFICO ACCENT - Foco Principal */}
            <div className="px-3 py-2 flex items-center justify-between border-b border-gray-800 bg-gray-950">
                <span className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Foco Geográfico</span>
                <div className="flex items-center gap-1.5">
                    <div className="flex gap-1 bg-gray-900 p-0.5 rounded border border-gray-800">
                        <button 
                            onClick={() => setAmbitoGeografico("venezuela")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${ambitoGeografico === "venezuela" ? "bg-red-900/40 text-red-200 border border-red-850" : "text-gray-500 hover:text-gray-300 border border-transparent"}`}
                        >
                            🇻🇪
                        </button>
                        <button 
                            onClick={() => setAmbitoGeografico("global")}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${ambitoGeografico === "global" ? "bg-red-900/40 text-red-200 border border-red-850" : "text-gray-500 hover:text-gray-300 border border-transparent"}`}
                        >
                            🌐
                        </button>
                    </div>
                    {/* Botón cerrar en mobile */}
                    <button 
                        onClick={() => setSidebarAbierto(false)} 
                        className="md:hidden text-gray-400 hover:text-white px-1.5 py-0.5 rounded border border-gray-700 bg-gray-800 text-[10px]"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* TABS SIDEBAR */}
            <div className="flex border-b border-gray-800 bg-gray-900/40">
                <button 
                    onClick={() => setSidebarTab("lista")}
                    className={`flex-1 py-2 text-xs font-bold transition-colors ${sidebarTab === "lista" ? "text-red-400 border-b-2 border-red-500 bg-gray-900/60" : "text-gray-500 hover:text-gray-300"}`}
                >
                    📢 Sismos ({sismosFiltrados.length})
                </button>
                <button 
                    onClick={() => setSidebarTab("config")}
                    className={`flex-1 py-2 text-xs font-bold transition-colors ${sidebarTab === "config" ? "text-red-400 border-b-2 border-red-500 bg-gray-900/60" : "text-gray-500 hover:text-gray-300"}`}
                >
                    ⚙️ Filtros
                </button>
            </div>

            {/* CONTENIDO DE TABS */}
            {sidebarTab === "lista" ? (
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                    <div className="mb-2">
                        <input 
                            value={busquedaUbicacion} 
                            onChange={e => setBusquedaUbicacion(e.target.value)}
                            className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 focus:outline-none focus:border-red-500" 
                            placeholder="🔍 Buscar localidad..." 
                        />
                    </div>

                    <div className="space-y-1.5 font-sans">
                        {sismosFiltrados.map(s => {
                            const esSeleccionado = eventoSeleccionado?.id === s.id;
                            const esVE = s.id.startsWith("ve-2026-") || isNearVenezuela(s.lat, s.lng, s.epicentro);
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => { 
                                        setEventoSeleccionado(s); 
                                        setCiudadFoco(null);
                                        setSidebarAbierto(false); // Autoclose en mobile al seleccionar
                                    }}
                                    className={`w-full text-left p-2 rounded text-xs transition-colors border ${esSeleccionado ? "bg-red-955 border-red-800 text-white" : "bg-gray-900/40 border-gray-850 hover:border-gray-700 text-gray-300"}`}
                                >
                                    <div className="flex justify-between items-start gap-1">
                                        <span className="font-bold truncate max-w-[130px] block">
                                            {esVE ? "🇻🇪 " : ""}{s.lugar || s.epicentro}
                                        </span>
                                        <span className="font-mono font-bold px-1 rounded text-[10px]" style={{ background: colorPorMagnitud(s.magnitud) + '33', color: colorPorMagnitud(s.magnitud) }}>
                                            M{s.magnitud.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[9px] text-gray-500 mt-1.5 font-mono">
                                        <span>{new Date(s.hora_utc).toLocaleDateString()}</span>
                                        <span>{Math.round(s.profundidad_km)} km</span>
                                    </div>
                                </button>
                            );
                        })}
                        {sismosFiltrados.length === 0 && (
                            <div className="text-gray-500 text-center py-8 text-xs leading-relaxed">
                                No se encontraron sismos con esta severidad.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {/* Feed de Origen */}
                    <div>
                        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Fuente de Datos (USGS)</div>
                        <select 
                            value={feed} 
                            onChange={e => setFeed(e.target.value)}
                            className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 focus:outline-none focus:border-red-500"
                        >
                            <option value="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson">Semana: M4.5+ (Global)</option>
                            <option value="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson">Mes: M4.5+ (Global)</option>
                            <option value="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson">Día: M2.5+ (Global)</option>
                            <option value="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson">Mes: Significativos (Global)</option>
                            <option value="offline">Sismo Histórico Venezuela (2026)</option>
                        </select>
                    </div>

                    {/* Magnitud Mínima */}
                    <div>
                        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex justify-between">
                            <span>Magnitud Mínima</span>
                            <span className="text-red-400 font-mono font-bold">M{filtroMinMag.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" 
                            min="1.0" 
                            max="8.0" 
                            step="0.5" 
                            value={filtroMinMag} 
                            onChange={e => setFiltroMinMag(parseFloat(e.target.value))}
                            className="w-full accent-red-650 bg-gray-700 rounded-lg appearance-none h-1 cursor-pointer" 
                        />
                    </div>

                    {/* Capas Activas */}
                    <div>
                        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Capas del Mapa</div>
                        {capas.map(c => (
                            <label key={c.key} className="flex items-center gap-2 py-1 cursor-pointer hover:text-white text-gray-300 transition-colors">
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] transition-colors ${capasActivas[c.key] ? "bg-red-600 border-red-500 text-white" : "bg-gray-800 border-gray-600"}`}>
                                    {capasActivas[c.key] && "✓"}
                                </div>
                                <input type="checkbox" className="hidden" checked={capasActivas[c.key]} onChange={() => toggleCapa(c.key)} />
                                <span className="text-xs">{c.icon} {c.label}</span>
                            </label>
                        ))}
                    </div>

                    {/* Herramientas */}
                    <div className="pt-2 border-t border-gray-800 space-y-2">
                        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Acciones</div>
                        <button 
                            onClick={simularReplica} 
                            disabled={simulandoReplica}
                            className="w-full bg-purple-955 hover:bg-purple-900 text-purple-100 text-xs py-2 px-3 rounded border border-purple-800 disabled:opacity-50 transition-colors"
                        >
                            {simulandoReplica ? "⏳ Calculando..." : "⚡ Simular Réplica Local"}
                        </button>
                        <button 
                            onClick={() => exportarCSV(ciudadesCercanas)}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 px-3 rounded border border-gray-700 transition-colors"
                        >
                            📥 Exportar Ciudades CSV
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}

// ============================================================
// COMPONENTE NAVEGACIÓN POR PESTAÑAS (TAB NAV) RESPONSIVO
// ============================================================

function TabNav() {
    const { tabActiva, setTabActiva } = useApp();
    const tabs = [
        { id: "mapa", label: "🗺️ Mapa" },
        { id: "impacto", label: "📊 Impacto" },
        { id: "alertas", label: "🚨 Alertas" },
        { id: "reportes", label: "📋 Reportes" },
        { id: "ciudades", label: "🏙️ Ciudades" },
    ];
    return (
        <nav className="flex overflow-x-auto scrollbar-none border-b border-gray-800 bg-gray-950 px-2 sm:px-4">
            {tabs.map(t => (
                <button
                    key={t.id}
                    onClick={() => setTabActiva(t.id)}
                    className={`px-3.5 py-3 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${tabActiva === t.id ? "border-red-500 text-red-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}
                >
                    {t.label}
                </button>
            ))}
        </nav>
    );
}

// ============================================================
// TABS CONTENIDOS: MAPA RESPONSIVO
// ============================================================

function TabMapa() {
    const { ciudadFoco, setCiudadFoco, sidebarAbierto, setSidebarAbierto } = useApp();
    
    return (
        <div className="flex h-full p-2 gap-2 relative">
            <div className="flex-1 min-w-0 relative">
                <MapaLeaflet />
                
                {/* Botón flotante para abrir sidebar en mobile */}
                {!sidebarAbierto && (
                    <button
                        onClick={() => setSidebarAbierto(true)}
                        className="md:hidden absolute top-3 left-3 z-[1000] bg-gray-900/95 text-white font-bold px-3 py-1.5 rounded border border-gray-750 flex items-center gap-1.5 shadow-md active:bg-gray-800"
                    >
                        <span>🔍</span>
                        <span className="text-[10px]">Lista / Filtros</span>
                    </button>
                )}
            </div>

            {/* Foco de Ciudad adaptado a Mobile */}
            {ciudadFoco && (
                <div className="
                    absolute bottom-3 right-3 left-3 md:static
                    w-auto md:w-60 z-[1010] md:z-0
                    bg-gray-900/95 border border-gray-850 rounded-lg p-3 overflow-y-auto max-h-[45%] md:max-h-none text-xs space-y-2.5
                    shadow-2xl backdrop-blur-sm
                ">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-gray-500 text-[8px] uppercase tracking-wider block">Ciudad Focalizada</span>
                            <h3 className="text-white font-bold text-sm mt-0.5">{ciudadFoco.nombre}</h3>
                            <span className="text-gray-400 text-[10px]">{ciudadFoco.estado}</span>
                        </div>
                        <button 
                            onClick={() => setCiudadFoco(null)}
                            className="text-gray-500 hover:text-white px-1.5 py-0.5 rounded border border-gray-700 bg-gray-800 text-[9px]"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-1.5 border-t border-b border-gray-800 py-2 font-sans">
                        {[
                            ["Distancia al epicentro", `${ciudadFoco.distancia_km} km`],
                            ["Intensidad Estimada MMI", ciudadFoco.intensidad],
                            ["Nivel de daño potencial", ciudadFoco.nivel_dano],
                            ["Población Estimada", ciudadFoco.poblacion.toLocaleString()],
                            ["Estado del Reporte", ciudadFoco.verificado ? "✅ Verificado" : "⏳ Evaluando"]
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between text-[10px]">
                                <span className="text-gray-500">{k}</span>
                                <span className="text-gray-200 font-medium font-mono">{v}</span>
                            </div>
                        ))}
                    </div>

                    <div>
                        <div className="text-gray-500 text-[9px] mb-1">Impacto Potencial</div>
                        <p className="text-gray-400 leading-relaxed text-[10px]">
                            {ZONAS_IMPACTO.find(z => z.intensidad.startsWith(ciudadFoco.intensidad))?.descripcion || 
                             "Daño leve o nulo. Sentido levemente por personas."}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// TABS CONTENIDOS: IMPACTO RESPONSIVO
// ============================================================

function TabImpacto() {
    const { eventoSeleccionado, ciudadesCercanas, replicas } = useApp();
    const [sliderIntensidad, setSliderIntensidad] = useState(3);
    
    if (!eventoSeleccionado) return null;

    const zonasVisibles = ZONAS_IMPACTO.slice(0, sliderIntensidad + 1);
    const pobExposicion = zonasVisibles.reduce((acc, val) => {
        const scale = Math.max(0.1, Math.min(2.0, (eventoSeleccionado.magnitud - 4) / 3));
        return acc + Math.round(val.poblacion_exp * scale);
    }, 0);

    return (
        <div className="p-3 sm:p-4 overflow-y-auto h-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-w-4xl">
                
                {/* Métricas Humanitarias Estimadas */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Métricas Estimadas de Impacto</div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { label: "Población Expuesta", valor: pobExposicion.toLocaleString(), sub: "Zonas de riesgo", color: "text-red-400" },
                            { label: "Max MMI Estimado", valor: estimateIntensity(eventoSeleccionado.magnitud, 5), sub: "En epicentro", color: "text-orange-400" },
                            { label: "Aviso de Tsunami", valor: eventoSeleccionado.tsunami ? "🚨 ACTIVO" : "✅ Sin Peligro", sub: "Costas", color: eventoSeleccionado.tsunami ? "text-red-400" : "text-green-400" },
                            { label: "Réplicas Totales", valor: replicas.length, sub: "Área local", color: "text-yellow-400" }
                        ].map((item, i) => (
                            <div key={i} className="p-2 bg-gray-800/40 rounded border border-gray-750 text-center">
                                <div className={`text-sm sm:text-base font-bold font-mono ${item.color}`}>{item.valor}</div>
                                <div className="text-gray-400 text-[9px] font-medium mt-1">{item.label}</div>
                                <div className="text-gray-600 text-[8px]">{item.sub}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Exposición por Radio de Intensidad */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Cálculo de Exposición por Radio</div>
                    <div>
                        <label className="text-[10px] sm:text-[11px] text-gray-500">Intensidad Filtro: <span className="text-white font-bold">{ZONAS_IMPACTO[sliderIntensidad]?.intensidad}</span></label>
                        <input 
                            type="range" 
                            min="0" 
                            max={ZONAS_IMPACTO.length - 1} 
                            value={sliderIntensidad} 
                            onChange={e => setSliderIntensidad(parseInt(e.target.value))}
                            className="w-full accent-red-650 h-1.5 bg-gray-700 rounded-lg cursor-pointer mt-1" 
                        />
                    </div>
                    
                    <div className="space-y-1 mt-2">
                        {zonasVisibles.map(z => {
                            const scale = Math.max(0.1, Math.min(2.0, (eventoSeleccionado.magnitud - 4) / 3));
                            const localExp = Math.round(z.poblacion_exp * scale);
                            return (
                                <div key={z.intensidad} className="flex justify-between items-center text-xs p-1 rounded hover:bg-gray-800/40">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: z.color }}></div>
                                        <span className="text-gray-450 text-[11px]">{z.intensidad}</span>
                                    </div>
                                    <span className="font-mono text-gray-200 text-[11px]">{localExp.toLocaleString()} exp.</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Ciudades con Mayor Riesgo */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 sm:p-4 space-y-3">
                    <div className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Respuesta Prioritaria Local</div>
                    <div className="space-y-1.5">
                        {ciudadesCercanas.slice(0, 5).map(c => (
                            <div key={c.nombre} className="flex items-center justify-between p-2 bg-gray-850/50 rounded border border-gray-750">
                                <div className="min-w-0 flex-1 pr-2">
                                    <div className="text-white text-xs font-bold truncate">{c.nombre}</div>
                                    <div className="text-gray-500 text-[9px] truncate">A {c.distancia_km} km · Pob: {c.poblacion.toLocaleString()}</div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className="text-xs font-bold block" style={{ color: c.color }}>MMI {c.intensidad}</span>
                                    <span className="text-[9px] text-gray-500 block">{c.nivel_dano}</span>
                                </div>
                            </div>
                        ))}
                        {ciudadesCercanas.length === 0 && (
                            <div className="text-gray-555 text-center py-6 text-xs font-sans">No hay ciudades dentro de los 350 km.</div>
                        )}
                    </div>
                </div>

                {/* Histograma de réplicas */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 sm:p-4 space-y-3 md:col-span-2">
                    <div className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Réplicas Recientes Cercanas (150 km)</div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {replicas.map((r, i) => (
                            <div key={r.id} className="flex flex-col items-center flex-shrink-0 min-w-14">
                                <div className="text-[9px] text-gray-500 font-mono">{new Date(r.hora_utc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                                <div 
                                    className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center font-bold text-xs text-white font-mono my-1"
                                    style={{ background: colorPorMagnitud(r.magnitud) }}
                                >
                                    M{r.magnitud.toFixed(1)}
                                </div>
                                <div className="text-[9px] text-gray-650 font-mono">+{i+1}h</div>
                            </div>
                        ))}
                        {replicas.length === 0 && (
                            <div className="text-gray-555 py-4 w-full text-center text-xs font-sans">No se registran réplicas significativas en esta área.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// TABS CONTENIDOS: ALERTAS
// ============================================================

function TabAlertas() {
    const { eventoSeleccionado } = useApp();
    
    if (!eventoSeleccionado) return null;

    const recomendaciones = [
        { nivel: "inmediato", titulo: "Evacuación Estructural", desc: "Evacuar edificios altos y casas construidas con materiales vulnerables en un radio de 50km.", icon: "🏘️" },
        { nivel: "inmediato", titulo: "Preparación para Réplicas", desc: "Espere réplicas. Colóquese debajo de muebles resistentes (mesas robustas) lejos de ventanas.", icon: "⚡" },
        { nivel: "urgente", titulo: "Fuga de Gas y Servicios", desc: "Cierre llaves de paso de gas e interruptores de luz. No encienda fósforos ni velas ante sospechas de fuga.", icon: "🔥" },
        { nivel: "urgente", titulo: "Comunicaciones de Socorro", desc: "Use el teléfono solo para emergencias extremas. Mantenga libres las líneas de socorro.", icon: "📞" },
        { nivel: "importante", titulo: "Aviso Marítimo / Tsunami", desc: eventoSeleccionado.tsunami ? "ALERTA DE TSUNAMI ACTIVA. Aléjese de playas y áreas costeras de forma inmediata." : "Sin riesgo de Tsunami. Las zonas de costa operan con normalidad.", icon: "🌊" }
    ];

    const estilos = {
        inmediato: "border-red-900 bg-red-955/40 text-red-400",
        urgente: "border-orange-955 bg-orange-955/30 text-orange-400",
        importante: "border-yellow-955 bg-yellow-955/20 text-yellow-400"
    };

    return (
        <div className="p-3 sm:p-4 overflow-y-auto h-full">
            <div className="max-w-2xl space-y-4">
                <div>
                    <div className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">Evaluación de Riesgo PAGER</div>
                    <div className={`p-3 sm:p-4 rounded-lg border flex gap-3 ${eventoSeleccionado.alerta_pager === "rojo" ? "border-red-900 bg-red-955/30 text-red-200" : "border-orange-900 bg-orange-955/30 text-orange-200"}`}>
                        <span className="text-xl sm:text-2xl flex-shrink-0">⚠️</span>
                        <div>
                            <h4 className="font-bold text-xs sm:text-sm">Alerta de Daños PAGER {eventoSeleccionado.alerta_pager?.toUpperCase() || "VERDE"}</h4>
                            <p className="text-[11px] sm:text-xs text-gray-350 leading-relaxed mt-1">
                                {eventoSeleccionado.alerta_pager === "rojo" ? 
                                 "Alta probabilidad de víctimas masivas y daños materiales graves. Priorizar ayuda humanitaria y despliegue logístico local." : 
                                 "Probabilidad baja de pérdidas generalizadas. Los daños suelen estar limitados a estructuras vulnerables no sismorresistentes."}
                            </p>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">Acciones Inmediatas de Supervivencia</div>
                    <div className="space-y-2">
                        {recomendaciones.map((r, i) => (
                            <div key={i} className={`p-3 rounded border flex gap-2.5 items-start ${estilos[r.nivel]}`}>
                                <span className="text-base sm:text-lg flex-shrink-0">{r.icon}</span>
                                <div>
                                    <div className="font-bold text-[10px] sm:text-xs uppercase">{r.nivel} · {r.titulo}</div>
                                    <p className="text-gray-300 text-[10px] sm:text-xs mt-0.5 leading-relaxed">{r.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// TABS CONTENIDOS: REPORTES CIUDADANOS RESPONSIVOS
// ============================================================

function TabReportes() {
    const { eventoSeleccionado, reportesPorSismo, agregarReporte, actualizarEstadoReporte, ciudadesCercanas } = useApp();
    const [form, setForm] = useState({ ciudad: "", descripcion: "", tipo: "colapso", prioridad: "alta" });
    const [verForm, setVerForm] = useState(false);

    if (!eventoSeleccionado) return null;

    const listaReportes = reportesPorSismo[eventoSeleccionado.id] || [];

    const handleFormSubmit = () => {
        if (!form.ciudad || !form.descripcion) return;
        
        const matchCity = ciudadesCercanas.find(c => c.nombre.toLowerCase() === form.ciudad.toLowerCase());
        const lat = matchCity ? matchCity.lat : eventoSeleccionado.lat + (Math.random() - 0.5) * 0.1;
        const lng = matchCity ? matchCity.lng : eventoSeleccionado.lng + (Math.random() - 0.5) * 0.1;

        agregarReporte(eventoSeleccionado.id, {
            ...form,
            estado: "pendiente",
            hora: "Recién ingresado",
            lat,
            lng
        });
        
        setForm({ ciudad: "", descripcion: "", tipo: "colapso", prioridad: "alta" });
        setVerForm(false);
    };

    const nextState = {
        pendiente: "activo",
        activo: "confirmado",
        confirmado: "pendiente"
    };

    return (
        <div className="p-3 sm:p-4 overflow-y-auto h-full">
            <div className="max-w-2xl space-y-3">
                <div className="flex justify-between items-center">
                    <div className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                        {listaReportes.length} Incidencias Reportadas
                    </div>
                    <button 
                        onClick={() => setVerForm(v => !v)}
                        className="bg-red-955 border border-red-800 hover:bg-red-900 text-red-200 text-xs py-1.5 px-3 rounded transition-colors"
                    >
                        {verForm ? "Cancelar" : "✏️ Reportar Incidencia"}
                    </button>
                </div>

                {verForm && (
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 sm:p-4 space-y-3 shadow-xl">
                        <h4 className="text-white text-xs font-bold">Enviar Reporte Vecinal</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                                <label className="text-[9px] text-gray-500 uppercase font-semibold">Ubicación</label>
                                <select 
                                    value={form.ciudad}
                                    onChange={e => setForm(f => ({ ...f, ciudad: e.target.value }))}
                                    className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 mt-1 focus:outline-none focus:border-red-500"
                                >
                                    <option value="">-- Ciudad Cercana --</option>
                                    {ciudadesCercanas.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre} ({c.estado})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] text-gray-500 uppercase font-semibold">Incidencia</label>
                                <select 
                                    value={form.tipo}
                                    onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                                    className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 mt-1"
                                >
                                    {["colapso", "heridos", "servicios", "infraestructura", "otro"].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] text-gray-500 uppercase font-semibold">Prioridad</label>
                                <select 
                                    value={form.prioridad}
                                    onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))}
                                    className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 mt-1"
                                >
                                    {["critica", "alta", "media"].map(p => <option key={p}>{p}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] text-gray-500 uppercase font-semibold">Descripción de Hechos</label>
                            <textarea 
                                value={form.descripcion}
                                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                                placeholder="Describe el estado de la zona..."
                                className="w-full bg-gray-800 text-white text-xs p-2 rounded border border-gray-700 mt-1 h-16 resize-none"
                            />
                        </div>
                        <button 
                            onClick={handleFormSubmit}
                            disabled={!form.ciudad || !form.descripcion}
                            className="bg-red-700 hover:bg-red-650 disabled:opacity-50 text-white font-bold py-2 px-4 rounded text-xs transition-colors w-full sm:w-auto"
                        >
                            Subir Reporte Oficial
                        </button>
                    </div>
                )}

                <div className="space-y-2">
                    {listaReportes.map(r => (
                        <div key={r.id} className="p-3 bg-gray-900/90 rounded border border-gray-800 flex flex-col gap-2 hover:border-gray-750 transition-colors">
                            <div className="flex justify-between items-start gap-1">
                                <div className="min-w-0 flex-1">
                                    <span className="font-bold text-white text-xs block sm:inline">{r.ciudad}</span>
                                    <span className="text-gray-500 text-[9px] font-mono sm:ml-2 block sm:inline">{r.hora} · {r.tipo}</span>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <Badge nivel={r.prioridad} />
                                    <Badge nivel={r.estado} texto={r.estado} />
                                </div>
                            </div>
                            <p className="text-gray-300 text-[11px] sm:text-xs leading-relaxed">{r.descripcion}</p>
                            <div className="flex justify-end pt-1">
                                <button 
                                    onClick={() => actualizarEstadoReporte(eventoSeleccionado.id, r.id, nextState[r.estado])}
                                    className="text-[9px] text-gray-500 hover:text-white border border-gray-700 px-2 py-0.5 rounded transition-colors"
                                >
                                    Cambiar Estado: → {nextState[r.estado]}
                                </button>
                            </div>
                        </div>
                    ))}
                    {listaReportes.length === 0 && (
                        <div className="text-gray-500 text-center py-10 text-xs">Sin reportes vecinales cargados.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// TABS CONTENIDOS: CIUDADES CERCANAS RESPONSIVAS
// ============================================================

function TabCiudades() {
    const { ciudadesCercanas, setCiudadFoco, setTabActiva } = useApp();
    const [busqueda, setBusqueda] = useState("");

    const filtered = ciudadesCercanas.filter(c => 
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        c.estado.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="p-3 sm:p-4 overflow-y-auto h-full space-y-3">
            <div className="max-w-xl space-y-2">
                <input 
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded p-2 text-xs text-white focus:outline-none focus:border-red-500"
                    placeholder="🔍 Buscar ciudad..." 
                />

                <div className="space-y-1">
                    {filtered.map(c => (
                        <div 
                            key={c.nombre}
                            onClick={() => { 
                                setCiudadFoco(c); 
                                setTabActiva("mapa"); 
                            }}
                            className="p-2.5 bg-gray-900/60 hover:bg-gray-850 rounded border border-gray-800 flex justify-between items-center cursor-pointer transition-colors"
                        >
                            <div className="min-w-0 flex-1 pr-2">
                                <span className="font-bold text-white text-xs block sm:inline">{c.nombre}</span>
                                <span className="text-gray-550 text-[9px] sm:text-[10px] sm:ml-2 block sm:inline">{c.estado}</span>
                                <div className="text-[9px] text-gray-500 mt-0.5 font-mono">
                                    Distancia: {c.distancia_km} km | Pob: {c.poblacion.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <span className="text-xs font-bold block" style={{ color: c.color }}>MMI {c.intensidad}</span>
                                <span className="text-[9px] text-gray-500">{c.nivel_dano}</span>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-gray-555 text-center py-8 text-xs font-sans">No se encontraron ciudades en esta escala.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// COMPONENTE DE CONTENIDO PRINCIPAL DE LA APP
// ============================================================

function AppContent() {
    const { tabActiva, modoOscuro, loading, error, sidebarAbierto, setSidebarAbierto } = useApp();

    return (
        <div className={`flex flex-col h-screen font-sans overflow-hidden ${modoOscuro ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-900"}`}>
            <Header />
            <PanelSismo />
            <TabNav />
            <div className="flex flex-1 min-h-0 relative">
                {/* Sidebar Responsivo */}
                {tabActiva === "mapa" && <Sidebar />}

                {/* Backdrop para mobile cuando el sidebar está abierto */}
                {tabActiva === "mapa" && sidebarAbierto && (
                    <div 
                        onClick={() => setSidebarAbierto(false)} 
                        className="md:hidden fixed inset-0 bg-black/60 z-[1400] transition-opacity duration-300"
                    />
                )}
                
                <main className="flex-1 min-h-0 overflow-hidden relative">
                    {loading ? (
                        <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm z-[2000] flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 rounded-full border-4 border-red-800 border-t-red-400 animate-spin"></div>
                            <span className="text-red-400 text-xs font-medium tracking-wide">Recuperando sismología...</span>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 bg-gray-950 z-[2000] flex flex-col items-center justify-center gap-3 p-4">
                            <span className="text-red-400 text-3xl">⚠️</span>
                            <span className="text-red-400 text-xs font-semibold text-center max-w-sm">{error}</span>
                            <span className="text-gray-500 text-[10px]">Cargando modo simulación automático...</span>
                        </div>
                    ) : null}

                    {tabActiva === "mapa" && <TabMapa />}
                    {tabActiva === "impacto" && <TabImpacto />}
                    {tabActiva === "alertas" && <TabAlertas />}
                    {tabActiva === "reportes" && <TabReportes />}
                    {tabActiva === "ciudades" && <TabCiudades />}
                </main>
            </div>
        </div>
    );
}

// Exportación Principal
export default function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}
