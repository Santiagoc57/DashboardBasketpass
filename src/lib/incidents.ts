export type IncidentSeverity = "Baja" | "Media" | "Alta" | "Crítica";

export type IncidentProblem = {
  label: string;
  active: boolean;
};

export type IncidentActivityEvent = {
  time: string;
  actor: string;
  action: string;
  detail?: string;
  tone?: "accent" | "warning" | "neutral" | "success";
};

export type IncidentRecord = {
  id: string;
  matchCode: string;
  matchLabel: string;
  competition: string;
  eventDate: string;
  severity: IncidentSeverity;
  operatorControl: string;
  streamer: string;
  mainIssue: string;
  updatedRelative: string;
  updatedAt: string;
  venue: string;
  roundLabel: string;
  testTime: string;
  transmissionType: string;
  signalDelivery: string;
  aptoLineal: boolean;
  testCheck: string;
  startCheck: string;
  graphicsCheck: string;
  speedtest: string;
  ping: string;
  gpuLoad: string;
  speedtestAttachment?: {
    fileName: string;
    fileSizeLabel: string;
  } | null;
  pingAttachment?: {
    fileName: string;
    fileSizeLabel: string;
  } | null;
  gpuAttachment?: {
    fileName: string;
    fileSizeLabel: string;
  } | null;
  venueImages?: Array<{
    fileName: string;
    fileSizeLabel: string;
  }>;
  observations: string;
  reporter: string;
  problems: IncidentProblem[];
  activity: IncidentActivityEvent[];
};

export const INCIDENT_DIRECTORY: IncidentRecord[] = [
  {
    id: "#BK-8842",
    matchCode: "BOC - ATE",
    matchLabel: "Boca Juniors vs Atenas de Córdoba",
    competition: "Liga Nacional - J24",
    eventDate: "12 mar 2026",
    severity: "Crítica",
    operatorControl: "J. Martínez",
    streamer: "L. Correa",
    mainIssue: "Caída de conexión e inconsistencia de OCR",
    updatedRelative: "Hace 2 m",
    updatedAt: "14:05:22 GMT-5",
    venue: "Luis Conde, Buenos Aires",
    roundLabel: "Jornada 24",
    testTime: "13:48",
    transmissionType: "Encoder",
    signalDelivery: "BP / IMG / SPT",
    aptoLineal: false,
    testCheck: "Prueba parcial",
    startCheck: "Inicio con incidencia",
    graphicsCheck: "Marcador manual",
    speedtest: "12.4 Mbps",
    ping: "45 ms",
    gpuLoad: "88%",
    speedtestAttachment: {
      fileName: "speedtest_boca_ate.png",
      fileSizeLabel: "2.4 MB",
    },
    pingAttachment: {
      fileName: "ping_boca_ate.png",
      fileSizeLabel: "1.1 MB",
    },
    gpuAttachment: {
      fileName: "gpu_boca_ate.png",
      fileSizeLabel: "884 KB",
    },
    venueImages: [
      { fileName: "cancha_luis_conde_01.jpg", fileSizeLabel: "1.8 MB" },
      { fileName: "cabina_luis_conde_02.jpg", fileSizeLabel: "2.1 MB" },
    ],
    observations:
      "Se detecta caída recurrente en la señal de subida del pabellón. El encoder local presenta pérdida de paquetes superior al 15%. Se recomienda conmutar a respaldo satelital si el bitrate baja de 8 Mbps.",
    reporter: "J. Martínez",
    problems: [
      { label: "Problema Internet", active: true },
      { label: "OCR", active: true },
      { label: "Problema IMG", active: false },
      { label: "Gráfica", active: false },
      { label: "Overlays (GES)", active: false },
    ],
    activity: [
      {
        time: "14:05",
        actor: "J. Martínez",
        action: "Marcó Problema Internet",
        detail: "Registró pérdida de paquetes en el encoder local.",
        tone: "accent",
      },
      {
        time: "14:04",
        actor: "L. Correa",
        action: "Marcó Error OCR",
        detail: "El marcador dejó de leer correctamente en la salida.",
        tone: "warning",
      },
      {
        time: "14:01",
        actor: "Sistema",
        action: "Actualizó la gravedad a Crítica",
        detail: "La incidencia quedó priorizada para seguimiento inmediato.",
        tone: "accent",
      },
    ],
  },
  {
    id: "#BK-8841",
    matchCode: "QUI - INS",
    matchLabel: "Quimsa vs Instituto de Córdoba",
    competition: "Liga Nacional - J24",
    eventDate: "12 mar 2026",
    severity: "Alta",
    operatorControl: "R. Sosa",
    streamer: "M. Paredes",
    mainIssue: "Desincronía de gráfica y overlays en el segundo cuarto",
    updatedRelative: "Hace 5 m",
    updatedAt: "14:01:10 GMT-5",
    venue: "Ciudad, Santiago del Estero",
    roundLabel: "Jornada 24",
    testTime: "13:42",
    transmissionType: "Cancha",
    signalDelivery: "BP / IMG",
    aptoLineal: true,
    testCheck: "Prueba completa",
    startCheck: "Inicio con demora",
    graphicsCheck: "Overlays reiniciados",
    speedtest: "18.2 Mbps",
    ping: "61 ms",
    gpuLoad: "65%",
    speedtestAttachment: {
      fileName: "speedtest_quimsa_ins.png",
      fileSizeLabel: "2.0 MB",
    },
    pingAttachment: {
      fileName: "ping_quimsa_ins.png",
      fileSizeLabel: "992 KB",
    },
    gpuAttachment: {
      fileName: "gpu_quimsa_ins.png",
      fileSizeLabel: "801 KB",
    },
    venueImages: [
      { fileName: "ciudad_sde_campo.jpg", fileSizeLabel: "1.4 MB" },
    ],
    observations:
      "La carga de overlays desde GES volvió con retraso después de reiniciar la sesión gráfica. El partido sigue al aire con marcador manual.",
    reporter: "R. Sosa",
    problems: [
      { label: "Problema Internet", active: false },
      { label: "OCR", active: false },
      { label: "Problema IMG", active: false },
      { label: "Gráfica", active: true },
      { label: "Overlays (GES)", active: true },
    ],
    activity: [
      {
        time: "14:01",
        actor: "R. Sosa",
        action: "Marcó Gráfica",
        detail: "Se reiniciaron overlays por desincronía en el segundo cuarto.",
        tone: "warning",
      },
      {
        time: "13:58",
        actor: "M. Paredes",
        action: "Actualizó la observación operativa",
        detail: "Se dejó el partido con marcador manual como respaldo.",
        tone: "neutral",
      },
      {
        time: "13:56",
        actor: "Sistema",
        action: "Asignó gravedad Alta",
        detail: "El incidente quedó priorizado por impacto en gráfica.",
        tone: "warning",
      },
    ],
  },
  {
    id: "#BK-8840",
    matchCode: "BOC - RIV",
    matchLabel: "Bochas Sport Club vs River Plate",
    competition: "Liga Argentina - J18",
    eventDate: "12 mar 2026",
    severity: "Media",
    operatorControl: "A. Juárez",
    streamer: "S. Dávila",
    mainIssue: "Prueba técnica incompleta y audio IFB inestable",
    updatedRelative: "Hace 12 m",
    updatedAt: "13:54:33 GMT-5",
    venue: "Bochas Sport Club, Colonia Caroya",
    roundLabel: "Jornada 18",
    testTime: "13:35",
    transmissionType: "Encoder / Offtube",
    signalDelivery: "BP",
    aptoLineal: true,
    testCheck: "Prueba incompleta",
    startCheck: "Inicio bajo seguimiento",
    graphicsCheck: "Gráfica estable",
    speedtest: "22.1 Mbps",
    ping: "60 ms",
    gpuLoad: "40%",
    speedtestAttachment: {
      fileName: "speedtest_bochas_river.png",
      fileSizeLabel: "2.1 MB",
    },
    pingAttachment: {
      fileName: "ping_bochas_river.png",
      fileSizeLabel: "918 KB",
    },
    gpuAttachment: {
      fileName: "gpu_bochas_river.png",
      fileSizeLabel: "764 KB",
    },
    venueImages: [
      { fileName: "bochas_club_tribuna.jpg", fileSizeLabel: "1.5 MB" },
    ],
    observations:
      "La prueba quedó incompleta por un retorno inestable del IFB. No hubo caída de señal, pero el equipo dejó seguimiento abierto para el inicio.",
    reporter: "A. Juárez",
    problems: [
      { label: "Problema Internet", active: false },
      { label: "OCR", active: false },
      { label: "Problema IMG", active: false },
      { label: "Gráfica", active: false },
      { label: "Overlays (GES)", active: false },
    ],
    activity: [
      {
        time: "13:54",
        actor: "A. Juárez",
        action: "Cargó speedtest",
        detail: "Se registró subida de 22.1 Mbps y ping de 60 ms.",
        tone: "neutral",
      },
      {
        time: "13:51",
        actor: "S. Dávila",
        action: "Marcó prueba incompleta",
        detail: "El IFB quedó inestable durante la revisión previa.",
        tone: "warning",
      },
      {
        time: "13:48",
        actor: "Sistema",
        action: "Clasificó la incidencia como Media",
        detail: "Se mantiene seguimiento para el inicio del partido.",
        tone: "neutral",
      },
    ],
  },
  {
    id: "#BK-8839",
    matchCode: "FER - OBR",
    matchLabel: "Ferro Carril Oeste vs Obras Basket",
    competition: "Liga Nacional - J24",
    eventDate: "12 mar 2026",
    severity: "Baja",
    operatorControl: "M. Díaz",
    streamer: "P. Vera",
    mainIssue: "Alerta menor de telemetría resuelta en la previa",
    updatedRelative: "Hace 45 m",
    updatedAt: "13:21:08 GMT-5",
    venue: "Héctor Etchart, Buenos Aires",
    roundLabel: "Jornada 24",
    testTime: "12:58",
    transmissionType: "Encoder",
    signalDelivery: "BP / IMG",
    aptoLineal: true,
    testCheck: "Prueba OK",
    startCheck: "Inicio normal",
    graphicsCheck: "Sin novedad",
    speedtest: "27.5 Mbps",
    ping: "32 ms",
    gpuLoad: "25%",
    speedtestAttachment: {
      fileName: "speedtest_ferro_obras.png",
      fileSizeLabel: "1.7 MB",
    },
    pingAttachment: {
      fileName: "ping_ferro_obras.png",
      fileSizeLabel: "850 KB",
    },
    gpuAttachment: {
      fileName: "gpu_ferro_obras.png",
      fileSizeLabel: "710 KB",
    },
    venueImages: [
      { fileName: "etchart_cabina.jpg", fileSizeLabel: "1.2 MB" },
    ],
    observations:
      "El sistema de monitoreo reportó una deriva breve de telemetría. Se recompuso antes del inicio y no afectó la salida al aire.",
    reporter: "M. Díaz",
    problems: [
      { label: "Problema Internet", active: false },
      { label: "OCR", active: false },
      { label: "Problema IMG", active: false },
      { label: "Gráfica", active: false },
      { label: "Overlays (GES)", active: false },
    ],
    activity: [
      {
        time: "13:21",
        actor: "M. Díaz",
        action: "Registró alerta de telemetría",
        detail: "La deriva fue menor y no afectó la salida al aire.",
        tone: "success",
      },
      {
        time: "13:17",
        actor: "P. Vera",
        action: "Completó chequeo previo",
        detail: "Sin hallazgos adicionales en la revisión de gráfica.",
        tone: "neutral",
      },
      {
        time: "13:12",
        actor: "Sistema",
        action: "Asignó gravedad Baja",
        detail: "Seguimiento preventivo únicamente.",
        tone: "success",
      },
    ],
  },
];
