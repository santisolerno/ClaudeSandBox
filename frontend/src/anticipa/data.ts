import type { CSSProperties } from "react";

export type Estado =
  | "elegible"
  | "auditoria"
  | "liquidacion"
  | "debito"
  | "adelantada"
  | "descargo";

export interface OsInfo {
  id: string;
  nombre: string;
  corto: string;
  tna: number;
  plazo: number;
}

export interface Factura {
  id: string;
  numero: string;
  os: string;
  periodo: string;
  pago: string;
  dias: number;
  monto: number;
  estado: Estado;
}

export interface Cuenta {
  id: string;
  nombre: string;
  detalle: string;
  ult: string;
  pref: boolean;
}

export interface Mail {
  m: string;
  principal: boolean;
}

export interface Op {
  id: string;
  fecha: string;
  os: string;
  bruto: number;
  quita: number;
  estado: string;
  deposito: string | null;
  ult: string;
}

// Las obras sociales con las que trabaja la prestadora, con su TNA y plazo medio de pago.
export const OS: Record<string, OsInfo> = {
  andina: { id: "andina", nombre: "Obra Social Andina", corto: "Andina", tna: 0.36, plazo: 92 },
  litoral: { id: "litoral", nombre: "OS Litoral Salud", corto: "Litoral", tna: 0.42, plazo: 104 },
  prevision: { id: "prevision", nombre: "Previsión Médica", corto: "Previsión", tna: 0.39, plazo: 88 },
};

export const BASE_FACTURAS: Factura[] = [
  { id: "f1", numero: "A-0001-00004512", os: "andina", periodo: "Julio 2026", pago: "04/11/2026", dias: 29, monto: 1284500, estado: "elegible" },
  { id: "f2", numero: "A-0001-00004538", os: "andina", periodo: "Agosto 2026", pago: "03/12/2026", dias: 58, monto: 1512300, estado: "elegible" },
  { id: "f3", numero: "A-0001-00004561", os: "andina", periodo: "Septiembre 2026", pago: "01/01/2027", dias: 87, monto: 1398000, estado: "auditoria" },
  { id: "f4", numero: "A-0001-00004520", os: "litoral", periodo: "Julio 2026", pago: "18/11/2026", dias: 43, monto: 842750, estado: "elegible" },
  { id: "f5", numero: "A-0001-00004547", os: "litoral", periodo: "Agosto 2026", pago: "17/12/2026", dias: 72, monto: 918400, estado: "elegible" },
  { id: "f6", numero: "A-0001-00004566", os: "litoral", periodo: "Septiembre 2026", pago: "15/01/2027", dias: 101, monto: 776900, estado: "auditoria" },
  { id: "f7", numero: "A-0001-00004529", os: "prevision", periodo: "Julio 2026", pago: "30/10/2026", dias: 24, monto: 655200, estado: "debito" },
  { id: "f8", numero: "A-0001-00004551", os: "prevision", periodo: "Agosto 2026", pago: "27/11/2026", dias: 52, monto: 701300, estado: "elegible" },
  { id: "f9", numero: "A-0001-00004570", os: "prevision", periodo: "Septiembre 2026", pago: "26/12/2026", dias: 81, monto: 688100, estado: "liquidacion" },
];

export const HIST_BASE: Op[] = [
  { id: "OP-2026-0081", fecha: "12/08/2026", os: "Previsión Médica", bruto: 690000, quita: 41630, estado: "Cobrado", deposito: "13/08/2026", ult: "4417" },
  { id: "OP-2026-0063", fecha: "08/06/2026", os: "Obra Social Andina", bruto: 1820000, quita: 97140, estado: "Cobrado", deposito: "09/06/2026", ult: "4417" },
];

export const LABEL: Record<Estado, string> = {
  elegible: "Disponible para solicitar",
  auditoria: "En revisión",
  liquidacion: "Aprobada, falta fecha de pago",
  debito: "Con observaciones",
  adelantada: "Adelanto solicitado",
  descargo: "Aviso enviado",
};

export const CHIP: Record<Estado, CSSProperties> = {
  elegible: { background: "#E5F3EA", color: "#1E6B3A" },
  auditoria: { background: "#FBF0DC", color: "#7A4A00" },
  liquidacion: { background: "#E6EEF8", color: "#1F4E8C" },
  debito: { background: "#FBE9E7", color: "#9B2C2C" },
  adelantada: { background: "#EEF0F2", color: "#4A5563" },
  descargo: { background: "#EFE9F7", color: "#5B3A8C" },
};

// [título, subtítulo] de la barra superior según pantalla.
export const TITLES: Record<string, [string, string]> = {
  inicio: [
    "Hola, Lucía",
    "Tus facturas abiertas: lo que facturaste y todavía no te pagaron. Podés solicitar un adelanto de las que ya están aprobadas.",
  ],
  facturas: ["Mis facturas", "Marcá las facturas disponibles y abajo vas a ver cuánto recibirías."],
  simulacion: ["Cuánto recibís", "Detalle del costo antes de decidir."],
  confirmar: ["Revisá y confirmá", "Chequeá los datos. Nada se envía hasta que confirmes."],
  listo: ["Solicitud enviada", "Te avisamos cuando esté aprobada."],
  comparar: ["Comparar costos", "Cada obra social tiene su propio costo por adelantar."],
  historial: ["Mis cobros", "Todas las veces que solicitaste un adelanto."],
  mas: ["Más", "Tu cuenta y otras opciones."],
  descargo: [
    "Factura que no aparece",
    "Si presentaste una factura y no la ves, avisanos. Se la enviamos a la obra social para que la revise.",
  ],
  config: ["Configuración", "Tus cuentas bancarias, datos, correos y contraseña."],
};

// Pantalla a la que vuelve la flecha "atrás".
export const BACK: Record<string, string> = {
  simulacion: "facturas",
  confirmar: "simulacion",
  descargo: "mas",
  config: "mas",
};

export const ars = (n: number): string => "$ " + Math.round(n).toLocaleString("es-AR");

export const pct = (n: number, d: number): string =>
  (n * 100).toLocaleString("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";

export const corto = (n: number): string =>
  "$ " + (n / 1000000).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " M";
