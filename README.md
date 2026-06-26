# Earthquake helper 🚨

> **Plataforma premium y solidaria de monitoreo sísmico interactivo y reporte ciudadano en tiempo real.**  
> Un desarrollo de **WaveFrame** pensado para acompañar, informar y brindar apoyo técnico ante catástrofes sísmicas, con foco prioritario en el territorio de **Venezuela** y alcance global conectado a la **USGS**.

---

## 📖 Propósito y Filosofía
Ante emergencias extremas de tipo sísmico, la disponibilidad de información rápida, veraz y de fácil lectura es crucial para la seguridad de las personas. **Earthquake helper** nace con la humilde intención de aportar un granito de arena tecnológico, unificando en una interfaz intuitiva y adaptable los reportes científicos de la *United States Geological Survey (USGS)* con la información reportada por los propios ciudadanos en el lugar de los hechos.

---

## 🌟 Características Principales

*   🌎 **Mapa Interactivo Mundial (Leaflet.js):** Centrado por defecto en Venezuela (`Caracas`) con un tema oscuro táctico de alta legibilidad (*CartoDB Dark Matter*).
*   🇻🇪 **Foco Geográfico Inteligente:** Aísla automáticamente mediante una caja delimitadora (*Bounding Box*) los sismos del Caribe y Sudamérica que impactan sobre Venezuela, permitiendo alternar al feed global con un solo clic.
*   📊 **Estimador de Impacto Físico (MMI):** Aplica la fórmula de *Haversine* y ecuaciones físicas de atenuación para estimar la Intensidad Mercalli Modificada (MMI), el daño potencial y la población expuesta en ciudades cercanas.
*   ⚡ **Réplicas en Tiempo Real:** Consulta de manera automática eventos sísmicos secundarios ocurridos en un radio de 150 km alrededor del epicentro principal.
*   📋 **Reportes Ciudadanos:** Permite a los vecinos reportar incidencias (colapsos, heridos, fallas de servicios públicos de agua o electricidad y obstrucción de vías) en tiempo real.
*   📱 **Optimización Mobile de Primer Nivel:**
    *   *Drawer lateral* colapsable para pantallas pequeñas con fondo traslúcido (*backdrop*).
    *   *Bottom-sheet* flotante para detalles de impacto en el mapa.
    *   Barra de navegación de pestañas con scroll horizontal táctil.
*   💾 **Fusión de Datos y Respaldo Offline:** Integra sismos y réplicas del histórico del país si el usuario no tiene conexión a internet.

---

## 🛠️ Stack Tecnológico

*   **Núcleo:** [React 19](https://react.dev/)
*   **Empaquetador/Entorno:** [Vite 8](https://vite.dev/)
*   **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **Mapas y Georreferenciación:** [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)

---


## ❤️ Solidaridad y Aporte
Este proyecto es una contribución técnica abierta y sin fines de lucro. Creemos firmemente que la tecnología y el diseño digital deben estar siempre al servicio de la ayuda humanitaria y la protección de la vida.

---
*Desarrollado con cariño y respeto por el equipo de **WaveFrame Studio**.*
