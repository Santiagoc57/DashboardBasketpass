export const PRODUCT_COPY = {
  appName: "Basket Production",
  portalLabel: "",
  releaseLabel: "Consola operativa v0.1.0",
  collaboratorWordmark: {
    line1: "Basket",
    line2: "Production",
  },
  loginHero: {
    eyebrow: "Operación en vivo",
    titleLine1: "Basket",
    titleLine2: "Production",
    description:
      "Coordinación ejecutiva para transmisiones en vivo, gestión integral de talento y monitoreo del equipo técnico en tiempo real.",
  },
} as const;

export const BUSINESS_LABELS = {
  production: "Producción",
  productionShort: "Produ",
  responsible: "Responsable",
  relatos: "Relatos",
} as const;

export const AI_COPY = {
  assistantIdentity: `Eres un asistente interno de ${PRODUCT_COPY.appName}.`,
  portalCaptureContext: `para la plataforma de ${PRODUCT_COPY.appName}.`,
  globalGeminiHint:
    "Pide al administrador que abra Configuración > Gemini y cargue la API key global de la plataforma. Cuando quede guardada, la IA también estará disponible para colaboradores.",
  globalGeminiCaptureHint:
    "Pide al administrador que abra Configuración > Gemini y cargue la API key global de la plataforma. Cuando quede guardada, la lectura de capturas también estará disponible para colaboradores.",
} as const;

export const SECTION_COPY = {
  grid: {
    title: "Producción",
    description:
      "Organiza la jornada, asigna roles y supervisa la carga operativa del día.",
  },
  myDay: {
    title: "Mi jornada",
    description:
      "Revisa tus partidos del día, abre el grupo y reporta conexión, pago, incidencias y speedtest desde el celular.",
  },
  teams: {
    title: "Equipos",
    description:
      "Consulta ligas, sedes, responsables y cobertura activa de cada equipo.",
  },
  people: {
    title: "Personal",
    tableTitle: `Personal de ${PRODUCT_COPY.appName}`,
    directoryTitle: "Directorio de personal",
    description:
      "Gestión y coordinación de talento y equipos técnicos de producción.",
  },
  roles: {
    title: "Roles",
    description:
      "Administra categorías, orden y disponibilidad de los roles del sistema.",
  },
  settings: {
    title: "Configuración",
    description:
      "Ajusta tu perfil, la configuración de IA y algunas preferencias de interfaz para la plataforma.",
  },
} as const;
