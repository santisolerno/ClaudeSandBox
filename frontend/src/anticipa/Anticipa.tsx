import { useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";
import {
  OS,
  BASE_FACTURAS,
  HIST_BASE,
  LABEL,
  CHIP,
  TITLES,
  BACK,
  ars,
  pct,
  corto,
  type Estado,
  type Cuenta,
  type Factura,
  type Mail,
  type Op,
} from "./data";

// Palancas del modelo (en el diseño eran props del panel de propiedades).
const FEE = 0.01; // servicio Anticipa: 1%
const TNA_TARJETA = 0.7; // TNA tarjeta de crédito: 70%
const TNA_PRESTAMO = 0.95; // TNA préstamo personal: 95%
const PANTALLA_INICIAL: Screen = "login";

type Screen =
  | "login"
  | "verificando"
  | "inicio"
  | "facturas"
  | "simulacion"
  | "confirmar"
  | "listo"
  | "comparar"
  | "historial"
  | "mas"
  | "descargo"
  | "config";

interface State {
  screen: Screen;
  authMode: "ingresar" | "registro";
  selected: Record<string, boolean>;
  osSel: Record<string, boolean>;
  estSel: Record<string, boolean>;
  sheet: "os" | "estado" | null;
  terms: boolean;
  adelantadas: Record<string, boolean>;
  ops: Op[];
  descargos: Factura[];
  dOs: string;
  dNumero: string;
  dPeriodo: string;
  dMonto: string;
  descargoOk: boolean;
  cuentas: Cuenta[];
  cuentaSel: string | null;
  nCbu: string;
  nNombre: string;
  cuentaOk: string;
  cuentaSeq: number;
  mails: Mail[];
  nMail: string;
  mailOk: string;
  pwOk: boolean;
  datosOk: boolean;
  lastOp: { id: string; neto: number; ult: string } | null;
  opSeq: number;
}

const initialState: State = {
  screen: PANTALLA_INICIAL,
  authMode: "ingresar",
  selected: {},
  osSel: {},
  estSel: {},
  sheet: null,
  terms: false,
  adelantadas: {},
  ops: [],
  descargos: [],
  dOs: "litoral",
  dNumero: "",
  dPeriodo: "",
  dMonto: "",
  descargoOk: false,
  cuentas: [
    { id: "c1", nombre: "Cuenta principal", detalle: "Banco del Sur · Cuenta corriente · terminada en 4417", ult: "4417", pref: true },
    { id: "c2", nombre: "Caja de ahorro personal", detalle: "Banco Patagonia Austral · Caja de ahorro · terminada en 0932", ult: "0932", pref: false },
  ],
  cuentaSel: null,
  nCbu: "",
  nNombre: "",
  cuentaOk: "",
  cuentaSeq: 3,
  mails: [{ m: "lucia.ferraro@correo.com", principal: true }],
  nMail: "",
  mailOk: "",
  pwOk: false,
  datosOk: false,
  lastOp: null,
  opSeq: 94,
};

// Alterna una clave booleana en un objeto sin usar `delete` (evita TS2790).
function toggleKey(obj: Record<string, boolean>, k: string): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  Object.keys(obj).forEach((key) => {
    if (key !== k) next[key] = obj[key];
  });
  if (!obj[k]) next[k] = true;
  return next;
}

const chevron = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

function tabIcon(key: string): ReactNode {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (key) {
    case "inicio":
      return <svg {...common}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>;
    case "facturas":
      return <svg {...common}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></svg>;
    case "comparar":
      return <svg {...common}><path d="M6 20V10M12 20V4M18 20v-7" /></svg>;
    case "historial":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    default:
      return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
  }
}

function Anticipa() {
  const [s, setS] = useState<State>(initialState);
  const update = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));
  const go = (screen: Screen) => update({ screen, sheet: null });

  // ---- Facturas (base + avisos enviados, con estado derivado) ----
  const facturas = BASE_FACTURAS.concat(s.descargos).map((f) => {
    const estado: Estado = s.adelantadas[f.id] ? "adelantada" : f.estado;
    const o = OS[f.os];
    const eleg = estado === "elegible";
    const desc = (f.monto * o.tna * f.dias) / 365;
    const feeAmt = f.monto * FEE;
    const sel = !!s.selected[f.id] && eleg;
    const cardStyle: CSSProperties = {
      padding: "14px",
      display: "flex",
      gap: "12px",
      alignItems: "flex-start",
      cursor: "pointer",
      ...(sel ? { borderColor: "#0F5C55", background: "#F0F7F5", boxShadow: "0 0 0 1px #0F5C55" } : {}),
    };
    return {
      ...f,
      estadoKey: estado,
      osNombre: o.nombre,
      montoTxt: ars(f.monto),
      estadoTxt: LABEL[estado],
      chipStyle: CHIP[estado],
      elegible: eleg,
      noElegible: !eleg,
      desc,
      feeAmt,
      recibirTxt: ars(f.monto - desc - feeAmt),
      selected: sel,
      cardStyle,
      toggle: () => update({ selected: toggleKey(s.selected, f.id) }),
    };
  });

  const osOn = (k: string) => !Object.keys(s.osSel).length || !!s.osSel[k];
  const estOn = (k: string) => !Object.keys(s.estSel).length || !!s.estSel[k];
  const facturasVis = facturas.filter((f) => osOn(f.os) && estOn(f.estadoKey));
  const estadosOrden: Estado[] = ["elegible", "auditoria", "liquidacion", "debito", "adelantada", "descargo"];
  const togSel = (field: "osSel" | "estSel", k: string) => {
    const o = toggleKey(s[field], k);
    if (field === "osSel") update({ osSel: o });
    else update({ estSel: o });
  };
  const resumen = (sel: Record<string, boolean>, labelOf: (k: string) => string, todos: string) => {
    const ks = Object.keys(sel);
    if (!ks.length) return todos;
    if (ks.length === 1) return labelOf(ks[0]);
    return ks.length + " seleccionados";
  };
  const activo: CSSProperties = { borderColor: "#0F5C55", background: "#F0F7F5", fontWeight: 600 };
  const sheetOpciones =
    s.sheet === "os"
      ? Object.keys(OS).map((k) => ({
          label: OS[k].nombre,
          on: !!s.osSel[k],
          count: facturas.filter((f) => f.os === k && estOn(f.estadoKey)).length,
          toggle: () => togSel("osSel", k),
        }))
      : estadosOrden
          .map((k) => ({
            label: LABEL[k],
            on: !!s.estSel[k],
            count: facturas.filter((f) => f.estadoKey === k && osOn(f.os)).length,
            toggle: () => togSel("estSel", k),
          }))
          .filter((o) => o.count > 0 || o.on);

  // ---- Simulación ----
  const selList = facturas.filter((f) => f.selected);
  const bruto = selList.reduce((a, f) => a + f.monto, 0);
  const descTot = selList.reduce((a, f) => a + f.desc, 0);
  const feeTot = selList.reduce((a, f) => a + f.feeAmt, 0);
  const quita = descTot + feeTot;
  const neto = bruto - quita;
  const diasProm = bruto > 0 ? selList.reduce((a, f) => a + f.monto * f.dias, 0) / bruto : 0;
  const tnaEf = neto > 0 && diasProm > 0 ? ((quita / neto) * 365) / diasProm : 0;
  const costCard = (neto * TNA_TARJETA * diasProm) / 365;
  const costLoan = (neto * TNA_PRESTAMO * diasProm) / 365;
  const maxC = Math.max(quita, costCard, costLoan, 1);
  const hatch = "repeating-linear-gradient(45deg,#C2410C 0 6px,#E07A4F 6px 12px)";
  const opcionesComp = [
    { nombre: "Anticipa", mes: tnaEf / 12, costo: quita, propio: true },
    { nombre: "Tarjeta de crédito", mes: TNA_TARJETA / 12, costo: costCard, propio: false },
    { nombre: "Préstamo personal", mes: TNA_PRESTAMO / 12, costo: costLoan, propio: false },
  ].map((o) => {
    const base = Math.min(o.costo, quita);
    const extra = Math.max(o.costo - quita, 0);
    return {
      nombre: o.nombre,
      mesTxt: pct(o.mes, 1),
      costoTxt: ars(o.costo),
      nombreStyle: (o.propio ? { fontWeight: 700, color: "#0F5C55" } : { fontWeight: 600, color: "#10202F" }) as CSSProperties,
      costoStyle: (o.propio ? { fontWeight: 700, color: "#0F5C55" } : { fontWeight: 700, color: "#9A3412" }) as CSSProperties,
      baseStyle: { height: "100%", background: "#0F5C55", width: ((base / maxC) * 100).toFixed(2) + "%" } as CSSProperties,
      extraStyle: {
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        whiteSpace: "nowrap",
        background: hatch,
        width: ((extra / maxC) * 100).toFixed(2) + "%",
      } as CSSProperties,
      hasExtra: extra > 0,
      extraTxt: ars(extra),
    };
  });
  const simPorOs = Object.keys(OS)
    .map((k) => {
      const g = selList.filter((f) => f.os === k);
      if (!g.length) return null;
      const m = g.reduce((a, f) => a + f.monto, 0);
      return {
        nombre: OS[k].corto,
        tnaTxt: pct(OS[k].tna, 0),
        dias: Math.round(g.reduce((a, f) => a + f.monto * f.dias, 0) / m),
        descTxt: ars(g.reduce((a, f) => a + f.desc, 0)),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // ---- Inicio ----
  const pendientes = facturas.filter((f) => f.estadoKey !== "adelantada");
  const totalCobrar = pendientes.reduce((a, f) => a + f.monto, 0);
  const elegibles = facturas.filter((f) => f.elegible);
  const disponible = elegibles.reduce((a, f) => a + f.monto, 0);
  const historial = s.ops.concat(HIST_BASE).map((h) => ({
    ...h,
    brutoTxt: ars(h.bruto),
    quitaTxt: ars(h.quita),
    netoTxt: ars(h.bruto - h.quita),
    depTxt: h.deposito || "Pendiente de aprobación",
    depStyle: (h.deposito ? { fontWeight: 600 } : { color: "#5B6676", fontStyle: "italic" }) as CSSProperties,
    chipStyle: h.estado === "Cobrado" ? CHIP.elegible : CHIP.liquidacion,
  }));
  const adelantadoAnio = historial.reduce((a, h) => a + (h.bruto - h.quita), 0);
  const sumBy = (k: string, st: Estado) => facturas.filter((f) => f.os === k && f.estadoKey === st).reduce((a, f) => a + f.monto, 0);
  const maxOs = Math.max(...Object.keys(OS).map((k) => sumBy(k, "elegible") + sumBy(k, "auditoria")), 1);
  const porOs = Object.keys(OS).map((k) => {
    const disp = sumBy(k, "elegible");
    const aud = sumBy(k, "auditoria");
    const wD = disp > 0 ? Math.max(22, (disp / maxOs) * 100) : 0;
    const wA = aud > 0 ? Math.max(22, (aud / maxOs) * 100) : 0;
    return {
      nombre: OS[k].nombre,
      corto: OS[k].corto,
      tnaTxt: pct(OS[k].tna, 0),
      totalTxt: ars(disp + aud),
      dispCorto: corto(disp),
      audCorto: corto(aud),
      hasDisp: disp > 0,
      noDisp: !(disp > 0),
      hasAud: aud > 0,
      noAud: !(aud > 0),
      dispStyle: { height: "100%", background: "#0F5C55", width: wD.toFixed(1) + "%" } as CSSProperties,
      audStyle: { height: "100%", background: "#CDD3D9", width: wA.toFixed(1) + "%" } as CSSProperties,
      solicitar: () => update({ screen: "facturas", osSel: { [k]: true }, estSel: { elegible: true }, sheet: null }),
      verRevision: () => update({ screen: "facturas", osSel: { [k]: true }, estSel: { auditoria: true }, sheet: null }),
    };
  });

  // ---- Comparar ----
  const ej = 1000000;
  const ejD = 60;
  const comp = Object.keys(OS).map((k) => {
    const c = (ej * OS[k].tna * ejD) / 365 + ej * FEE;
    return {
      nombre: OS[k].nombre,
      costo: c,
      costoTxt: ars(c),
      costoPct: pct(c / ej, 1),
      mesTxt: pct(OS[k].tna / 12, 1),
      plazo: OS[k].plazo,
      elegTxt: corto(elegibles.filter((f) => f.os === k).reduce((a, f) => a + f.monto, 0)),
      ver: () => update({ screen: "facturas", osSel: { [k]: true }, estSel: {}, sheet: null }),
    };
  });
  const minC = Math.min(...comp.map((c) => c.costo));
  const comparar = comp
    .sort((a, b) => a.costo - b.costo)
    .map((c) => ({
      ...c,
      mejor: c.costo === minC,
      cardStyle: {
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        ...(c.costo === minC ? { borderColor: "#0F5C55", boxShadow: "0 0 0 1px #0F5C55" } : {}),
      } as CSSProperties,
    }));

  // ---- Cuentas / correos ----
  const prefCta = s.cuentas.find((c) => c.pref) || s.cuentas[0] || null;
  const selCtaId = s.cuentaSel && s.cuentas.some((c) => c.id === s.cuentaSel) ? s.cuentaSel : prefCta ? prefCta.id : null;
  const ctaActual = s.cuentas.find((c) => c.id === selCtaId) || { ult: "—" };
  const cuentasCheckout = s.cuentas.map((c) => ({
    ...c,
    on: c.id === selCtaId,
    elegir: () => update({ cuentaSel: c.id }),
    style: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px",
      borderRadius: "12px",
      cursor: "pointer",
      border: "1px solid " + (c.id === selCtaId ? "#0F5C55" : "#E3E6EA"),
      ...(c.id === selCtaId ? { background: "#F0F7F5" } : {}),
    } as CSSProperties,
  }));
  const cuentasConfig = s.cuentas.map((c) => ({
    ...c,
    noPref: !c.pref,
    boxStyle: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      padding: "12px",
      borderRadius: "12px",
      border: "1px solid " + (c.pref ? "#0F5C55" : "#E3E6EA"),
      ...(c.pref ? { background: "#F0F7F5" } : {}),
    } as CSSProperties,
    hacerPref: () =>
      update({
        cuentas: s.cuentas.map((x) => ({ ...x, pref: x.id === c.id })),
        cuentaSel: null,
        cuentaOk: c.nombre + " es ahora tu cuenta preferida.",
      }),
    eliminar: () => update({ cuentas: s.cuentas.filter((x) => x.id !== c.id), cuentaOk: "" }),
  }));
  const mailsList = s.mails.map((x, i) => ({
    m: x.m,
    principal: x.principal,
    noPrincipal: !x.principal,
    hacerPrincipal: () => update({ mails: s.mails.map((y, j) => ({ m: y.m, principal: j === i })), mailOk: "" }),
    quitar: () => update({ mails: s.mails.filter((_, j) => j !== i), mailOk: "" }),
  }));

  // ---- Navegación ----
  const t = TITLES[s.screen] || TITLES.inicio;
  const tabDef: Array<[Screen, string]> = [
    ["inicio", "Inicio"],
    ["facturas", "Facturas"],
    ["comparar", "Comparar"],
    ["historial", "Cobros"],
    ["mas", "Más"],
  ];
  const tabActivo: string =
    ({ simulacion: "facturas", confirmar: "facturas", listo: "historial", descargo: "mas", config: "mas" } as Record<string, string>)[s.screen] || s.screen;
  const tabs = tabDef.map((d) => {
    const on = d[0] === tabActivo;
    return {
      key: d[0],
      label: d[1],
      go: () => go(d[0]),
      current: (on ? "page" : "false") as "page" | "false",
      style: { color: on ? "#0F5C55" : "#6B7684" } as CSSProperties,
      iconWrap: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "52px",
        height: "28px",
        borderRadius: "999px",
        ...(on ? { background: "#E6F0EE" } : {}),
      } as CSSProperties,
    };
  });
  const isAuth = s.screen === "login" || s.screen === "verificando";
  const tabOn: CSSProperties = { minHeight: "42px", background: "#FFFFFF", color: "#10202F", boxShadow: "0 1px 2px rgba(16,32,47,.12)" };
  const tabOff: CSSProperties = { minHeight: "42px", background: "transparent", color: "#5B6676" };
  const descargosList = facturas.filter((f) => String(f.id).indexOf("d") === 0).reverse();

  const hasBack = !!BACK[s.screen];
  const confirmDisabled = !s.terms || selList.length === 0;

  const confirmar = () => {
    const ad = { ...s.adelantadas };
    selList.forEach((f) => {
      ad[f.id] = true;
    });
    const id = "OP-2026-0" + s.opSeq;
    const osNames = Array.from(new Set(selList.map((f) => f.osNombre))).join(", ");
    const op: Op = { id, fecha: "08/10/2026", os: osNames, bruto, quita, estado: "Solicitud en revisión", deposito: null, ult: ctaActual.ult };
    update({
      adelantadas: ad,
      selected: {},
      terms: false,
      ops: [op, ...s.ops],
      lastOp: { id, neto, ult: ctaActual.ult },
      opSeq: s.opSeq + 1,
      screen: "listo",
    });
  };

  const enviarDescargo = () => {
    const raw = String(s.dMonto || "")
      .replace(/[^0-9,]/g, "")
      .replace(",", ".");
    const m = Number(raw) || 512000;
    const nf: Factura = {
      id: "d" + (s.descargos.length + 1),
      numero: s.dNumero || "A-0001-00004575",
      os: s.dOs,
      periodo: s.dPeriodo || "Septiembre 2026",
      pago: "A confirmar",
      dias: OS[s.dOs].plazo,
      monto: m,
      estado: "descargo",
    };
    update({ descargos: s.descargos.concat([nf]), dNumero: "", dPeriodo: "", dMonto: "", descargoOk: true });
  };

  const agregarCuenta = () => {
    const v = String(s.nCbu || "").trim();
    if (!v) return;
    const dig = v.replace(/\D/g, "");
    const esCbu = dig.length >= 20;
    const nueva: Cuenta = {
      id: "c" + s.cuentaSeq,
      nombre: s.nNombre || (esCbu ? "Cuenta terminada en " + dig.slice(-4) : "Cuenta " + v),
      detalle: esCbu ? "CBU terminado en " + dig.slice(-4) : "Alias: " + v,
      ult: esCbu ? dig.slice(-4) : v,
      pref: s.cuentas.length === 0,
    };
    update({
      cuentas: s.cuentas.concat([nueva]),
      cuentaSeq: s.cuentaSeq + 1,
      nCbu: "",
      nNombre: "",
      cuentaOk: "Agregamos la cuenta. Ya podés elegirla al solicitar un adelanto.",
    });
  };

  const agregarMail = () => {
    const v = String(s.nMail || "").trim();
    if (!v) return;
    update({ mails: s.mails.concat([{ m: v, principal: s.mails.length === 0 }]), nMail: "", mailOk: "Te enviamos un código a " + v + " para confirmarlo." });
  };

  // ======================= AUTH =======================
  if (isAuth) {
    return (
      <div className="phone">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", background: "#0F1E2B" }}>
          <div style={{ padding: "40px 24px 28px", display: "flex", flexDirection: "column", gap: "22px", color: "#FFFFFF" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
                <rect width="32" height="32" rx="9" fill="#1E8A7F" />
                <path d="M9 16h12M16 10l6 6-6 6" stroke="#FFFFFF" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: "19px", fontWeight: 700 }}>Anticipa</span>
            </div>
            <h1 style={{ margin: 0, fontSize: "27px", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Tus honorarios ya están ganados. Cobralos cuando los necesitás.
            </h1>
            <span style={{ fontSize: "14px", lineHeight: 1.5, color: "#C9D3DC" }}>
              Ves todas tus facturas abiertas y, antes de confirmar, sabés cuánto recibís y cuánto cuesta.
            </span>
          </div>
          <div style={{ flex: 1, background: "#FFFFFF", borderRadius: "24px 24px 0 0", padding: "24px 20px 28px", display: "flex", flexDirection: "column", gap: "18px" }}>
            {s.screen === "verificando" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <span className="m-chip" style={{ background: "#E5F3EA", color: "#1E6B3A", alignSelf: "flex-start" }}>
                  Cuenta verificada
                </span>
                <h2 style={{ margin: 0, fontSize: "22px" }}>Encontramos tus obras sociales</h2>
                <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#45515F" }}>
                  Confirmamos que trabajás con estas obras sociales. Ya podés ver tus facturas de cada una:
                </p>
                {Object.keys(OS).map((k) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", border: "1px solid #E3E6EA", borderRadius: "12px", fontSize: "14px" }}>
                    <span style={{ fontWeight: 600 }}>{OS[k].nombre}</span>
                    <span style={{ color: "#5B6676", fontSize: "13px" }}>Conectada</span>
                  </div>
                ))}
                <button className="m-btn m-primary" onClick={() => go("inicio")}>
                  Ir a mi inicio
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ display: "flex", gap: "4px", padding: "4px", background: "#F1F3F4", borderRadius: "12px" }}>
                  <button className="m-btn" style={s.authMode === "ingresar" ? tabOn : tabOff} onClick={() => update({ authMode: "ingresar" })}>
                    Ingresar
                  </button>
                  <button className="m-btn" style={s.authMode === "registro" ? tabOn : tabOff} onClick={() => update({ authMode: "registro" })}>
                    Crear cuenta
                  </button>
                </div>
                <label className="m-field">
                  CUIT
                  <input className="m-input num" type="text" inputMode="numeric" placeholder="27-28456193-4" />
                </label>
                <label className="m-field">
                  Correo electrónico
                  <input className="m-input" type="email" placeholder="lucia.ferraro@correo.com" />
                </label>
                <label className="m-field">
                  Contraseña
                  <input className="m-input" type="password" placeholder="Mínimo 10 caracteres" />
                </label>
                {s.authMode === "registro" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <label className="m-field">
                      Repetir contraseña
                      <input className="m-input" type="password" />
                    </label>
                    <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.5, color: "#5B6676" }}>
                      Vamos a confirmar con qué obras sociales trabajás y te enviaremos un código por correo para verificar tu cuenta.
                    </p>
                    <button className="m-btn m-primary" onClick={() => go("verificando")}>
                      Crear cuenta
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <button className="m-btn m-primary" onClick={() => go("inicio")}>
                      Ingresar
                    </button>
                    <a href="#" style={{ fontSize: "14px", alignSelf: "center", padding: "10px" }}>
                      Olvidé mi contraseña
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ======================= APP =======================
  const showSelBar = s.screen === "facturas" && selList.length > 0;
  const showTabs = s.screen !== "simulacion" && s.screen !== "confirmar";

  return (
    <div className="phone">
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {/* App bar */}
        <header style={{ flex: "none", display: "flex", alignItems: "center", gap: "4px", minHeight: "60px", padding: "8px 12px", background: "#FFFFFF", borderBottom: "1px solid #E3E6EA", boxSizing: "border-box" }}>
          {hasBack ? (
            <button className="m-icon-btn" aria-label="Volver" onClick={() => go(BACK[s.screen] as Screen)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : (
            <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
                <rect width="32" height="32" rx="9" fill="#0F5C55" />
                <path d="M9 16h12M16 10l6 6-6 6" stroke="#FFFFFF" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <span style={{ flex: 1, minWidth: 0, fontSize: "17px", fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t[0]}</span>
          <button className="m-icon-btn" aria-label="Configuración" onClick={() => update({ screen: "config", cuentaOk: "", mailOk: "", pwOk: false, datosOk: false, sheet: null })}>
            <span style={{ width: "34px", height: "34px", borderRadius: "999px", background: "#E6F0EE", color: "#0F5C55", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>LF</span>
          </button>
        </header>

        {/* Contenido */}
        <main style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 16px 24px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{ fontSize: "14px", lineHeight: 1.5, color: "#45515F" }}>{t[1]}</span>

          {/* INICIO */}
          {s.screen === "inicio" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="m-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span className="m-label">Total en facturas abiertas</span>
                  <span className="num" style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.01em" }}>{ars(totalCobrar)}</span>
                  <span style={{ fontSize: "13px", color: "#5B6676", lineHeight: 1.4 }}>
                    {pendientes.length} facturas de 3 obras sociales · {ars(totalCobrar - disponible)} todavía en revisión
                  </span>
                  <button className="m-link" style={{ alignSelf: "flex-start", paddingLeft: 0 }} onClick={() => update({ screen: "facturas", osSel: {}, estSel: { auditoria: true, liquidacion: true, debito: true, descargo: true }, sheet: null })}>
                    Ver facturas bajo revisión
                  </button>
                </div>
                <div style={{ padding: "18px", borderRadius: "14px", background: "#0F5C55", color: "#FFFFFF", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span className="m-label" style={{ color: "#CFE6E2" }}>Disponible para solicitar adelanto</span>
                    <span className="num" style={{ fontSize: "28px", fontWeight: 700 }}>{ars(disponible)}</span>
                    <span style={{ fontSize: "13px", color: "#CFE6E2" }}>{elegibles.length} facturas ya aprobadas por la obra social</span>
                  </div>
                  <button className="m-btn m-light" onClick={() => update({ screen: "facturas", osSel: {}, estSel: { elegible: true }, sheet: null })}>
                    Solicitar adelanto
                  </button>
                </div>
                <div style={{ paddingTop: "12px", borderTop: "1px solid #EEF0F2", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "12px", color: "#5B6676" }}>Ya cobraste antes de tiempo en 2026</span>
                    <span style={{ fontSize: "14px" }}>
                      <span className="num" style={{ fontWeight: 650 }}>{ars(adelantadoAnio)}</span>{" "}
                      <span style={{ color: "#5B6676" }}>· {historial.length} {historial.length === 1 ? "vez" : "veces"}</span>
                    </span>
                  </div>
                  <button className="m-link" onClick={() => go("historial")}>Ver históricos</button>
                </div>
              </div>

              <div className="m-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <span style={{ fontSize: "16px", fontWeight: 650 }}>Facturas abiertas por obra social</span>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", fontSize: "11px", color: "#45515F" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#0F5C55" }} />Disponible para solicitar
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#CDD3D9" }} />En revisión
                  </span>
                </div>
                {porOs.map((o) => (
                  <div key={o.corto} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div className="m-row">
                      <span style={{ fontWeight: 600 }}>
                        {o.corto} <span style={{ fontWeight: 400, color: "#5B6676", fontSize: "12px" }}>· TNA {o.tnaTxt}</span>
                      </span>
                      <span className="num" style={{ fontWeight: 650 }}>{o.totalTxt}</span>
                    </div>
                    <div style={{ display: "flex", height: "30px", borderRadius: "8px", overflow: "hidden", background: "#F4F5F2" }}>
                      <button className="seg" type="button" aria-label={"Solicitar adelanto de " + o.nombre} disabled={o.noDisp} style={o.dispStyle} onClick={o.solicitar}>
                        {o.hasDisp && <span className="num" style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF" }}>{o.dispCorto}</span>}
                      </button>
                      <button className="seg" type="button" aria-label={"Ver facturas bajo revisión de " + o.nombre} disabled={o.noAud} style={o.audStyle} onClick={o.verRevision}>
                        {o.hasAud && <span className="num" style={{ fontSize: "11px", fontWeight: 700, color: "#33404F" }}>{o.audCorto}</span>}
                      </button>
                    </div>
                  </div>
                ))}
                <span style={{ fontSize: "12px", color: "#5B6676" }}>Tocá una barra para ver esas facturas.</span>
              </div>
            </div>
          )}

          {/* FACTURAS */}
          {s.screen === "facturas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="m-filter" style={Object.keys(s.osSel).length ? activo : undefined} aria-haspopup="dialog" onClick={() => update({ sheet: "os" })}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resumen(s.osSel, (k) => OS[k].corto, "Obra social")}</span>
                  {chevron}
                </button>
                <button className="m-filter" style={Object.keys(s.estSel).length ? activo : undefined} aria-haspopup="dialog" onClick={() => update({ sheet: "estado" })}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resumen(s.estSel, (k) => LABEL[k as Estado], "Estado")}</span>
                  {chevron}
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {(Object.keys(s.osSel).length > 0 || Object.keys(s.estSel).length > 0) && (
                  <button className="m-link" style={{ paddingLeft: 0 }} onClick={() => update({ osSel: {}, estSel: {} })}>
                    Quitar filtros
                  </button>
                )}
                <button className="m-link" style={{ marginLeft: "auto" }} onClick={() => update({ screen: "descargo", descargoOk: false, sheet: null })}>
                  ¿Falta una factura?
                </button>
              </div>
              {facturasVis.length === 0 && (
                <div className="m-card" style={{ padding: "20px", textAlign: "center", fontSize: "14px", color: "#5B6676" }}>No hay facturas con este filtro.</div>
              )}
              {facturasVis.map((f) => (
                <label key={f.id} className="m-card" style={f.cardStyle}>
                  <input type="checkbox" aria-label={"Seleccionar factura " + f.numero} checked={f.selected} disabled={f.noElegible} onChange={f.toggle} style={{ marginTop: "2px" }} />
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                        <span style={{ fontSize: "15px", fontWeight: 650 }}>{f.osNombre}</span>
                        <span className="num" style={{ fontSize: "12px", color: "#5B6676", whiteSpace: "normal" }}>{f.numero} · {f.periodo}</span>
                      </div>
                      <span className="num" style={{ fontSize: "16px", fontWeight: 700 }}>{f.montoTxt}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span className="m-chip" style={f.chipStyle}>{f.estadoTxt}</span>
                      <span className="num" style={{ fontSize: "12px", color: "#5B6676" }}>Te pagan el {f.pago}</span>
                    </div>
                    {f.elegible && (
                      <div className="m-row" style={{ fontSize: "13px", paddingTop: "8px", borderTop: "1px dashed #E3E6EA" }}>
                        <span style={{ color: "#45515F" }}>Monto a recibir</span>
                        <span className="num" style={{ fontWeight: 700, color: "#0F5C55" }}>{f.recibirTxt}</span>
                      </div>
                    )}
                  </div>
                </label>
              ))}
              <span style={{ fontSize: "12px", lineHeight: 1.5, color: "#5B6676" }}>Solo podés solicitar adelanto de las facturas que la obra social ya revisó y aprobó.</span>
            </div>
          )}

          {/* SIMULACIÓN */}
          {s.screen === "simulacion" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="m-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="m-row">
                  <span style={{ color: "#45515F" }}>Valor de las facturas</span>
                  <span className="num" style={{ fontWeight: 600 }}>{ars(bruto)}</span>
                </div>
                {simPorOs.map((g) => (
                  <div key={g.nombre} className="m-row" style={{ fontSize: "13px" }}>
                    <span style={{ color: "#5B6676" }}>
                      Cobrar {g.dias} días antes · {g.nombre} <span style={{ whiteSpace: "nowrap" }}>(TNA {g.tnaTxt})</span>
                    </span>
                    <span className="num">− {g.descTxt}</span>
                  </div>
                ))}
                <div className="m-row" style={{ fontSize: "13px" }}>
                  <span style={{ color: "#5B6676" }}>Servicio Anticipa ({pct(FEE, 1)})</span>
                  <span className="num">− {ars(feeTot)}</span>
                </div>
                <div className="m-row" style={{ paddingTop: "10px", borderTop: "1px solid #EEF0F2" }}>
                  <span style={{ fontWeight: 600 }}>Costo total</span>
                  <span className="num" style={{ fontWeight: 600 }}>− {ars(quita)}</span>
                </div>
                <div style={{ marginTop: "6px", padding: "16px", borderRadius: "12px", background: "#E6F0EE", display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#0F5C55" }}>Recibirías</span>
                  <span className="num" style={{ fontSize: "30px", fontWeight: 700, color: "#0B3F3A" }}>{ars(neto)}</span>
                  <span style={{ fontSize: "12px", lineHeight: 1.4, color: "#2F5F59" }}>Una vez aprobada la solicitud, el dinero llega a tu cuenta en 1 día hábil</span>
                </div>
              </div>

              <div className="m-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 650 }}>¿Conviene? Cuánto te costaría conseguir {ars(neto)} de otra forma</span>
                  <span style={{ fontSize: "12px", color: "#5B6676" }}>Mismo monto y mismo plazo ({Math.round(diasProm)} días)</span>
                </div>
                {opcionesComp.map((c) => (
                  <div key={c.nombre} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div className="m-row" style={{ fontSize: "13px" }}>
                      <span style={c.nombreStyle}>
                        {c.nombre} <span style={{ color: "#5B6676", fontWeight: 400 }}>· {c.mesTxt}/mes</span>
                      </span>
                      <span className="num" style={c.costoStyle}>{c.costoTxt}</span>
                    </div>
                    <div style={{ display: "flex", height: "28px", borderRadius: "6px", overflow: "hidden", background: "#F4F5F2" }}>
                      <div style={c.baseStyle} />
                      <div style={c.extraStyle}>
                        {c.hasExtra && <span className="num" style={{ padding: "3px 8px", borderRadius: "999px", background: "#FFFFFF", color: "#14532D", fontSize: "11px", fontWeight: 700 }}>Ahorrás {c.extraTxt}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", fontSize: "11px", color: "#5B6676" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#0F5C55" }} />Costo con Anticipa
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: hatch }} />Lo que pagarías de más
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: "#6B7684" }}>Costos de tarjeta y préstamo personal: valores de referencia para esta demo.</span>
              </div>
            </div>
          )}

          {/* CONFIRMAR */}
          {s.screen === "confirmar" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="m-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "15px", fontWeight: 650, marginBottom: "6px" }}>Facturas incluidas</span>
                {selList.map((f) => (
                  <div key={f.id} style={{ display: "flex", justifyContent: "space-between", gap: "10px", padding: "10px 0", borderBottom: "1px solid #EEF0F2" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>{f.osNombre}</span>
                      <span className="num" style={{ fontSize: "12px", color: "#5B6676", whiteSpace: "normal" }}>{f.numero} · vence {f.pago}</span>
                    </div>
                    <span className="num" style={{ fontWeight: 600, fontSize: "14px" }}>{f.montoTxt}</span>
                  </div>
                ))}
                <div className="m-row" style={{ paddingTop: "10px" }}>
                  <span style={{ color: "#45515F" }}>Costo total</span>
                  <span className="num">− {ars(quita)}</span>
                </div>
                <div className="m-row">
                  <span style={{ fontWeight: 650 }}>Recibirías</span>
                  <span className="num" style={{ fontSize: "20px", fontWeight: 700, color: "#0F5C55" }}>{ars(neto)}</span>
                </div>
              </div>

              <div className="m-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 650 }}>Dónde recibís el dinero</span>
                  <button className="m-link" onClick={() => update({ screen: "config", cuentaOk: "", mailOk: "", pwOk: false, datosOk: false, sheet: null })}>Editar</button>
                </div>
                {cuentasCheckout.map((c) => (
                  <label key={c.id} style={c.style}>
                    <input type="radio" name="cuenta-mobile" checked={c.on} onChange={c.elegir} />
                    <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>{c.nombre}</span>
                      <span style={{ fontSize: "12px", color: "#5B6676" }}>{c.detalle}</span>
                    </span>
                    {c.pref && <span className="m-chip" style={{ background: "#E6F0EE", color: "#0F5C55" }}>Preferida</span>}
                  </label>
                ))}
                <span style={{ fontSize: "12px", color: "#5B6676" }}>Usamos tu cuenta preferida. Podés elegir otra solo para esta solicitud.</span>
              </div>

              <div style={{ padding: "16px", background: "#FFFFFF", border: "1px solid #E3E6EA", borderRadius: "16px", fontSize: "14px", lineHeight: 1.55, color: "#33404F", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontWeight: 650, color: "#10202F" }}>Qué pasa cuando confirmás</span>
                <span>1. Revisamos tu solicitud. Cuando esté aprobada, recibís el dinero en 1 día hábil.</span>
                <span>2. En la fecha de pago, la obra social paga estas facturas directamente a Anticipa.</span>
                <span>3. Si la obra social descuenta parte de alguna factura, esa diferencia se descuenta de tus próximos cobros.</span>
              </div>

              <label style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "14px", lineHeight: 1.5, cursor: "pointer", padding: "4px 2px" }}>
                <input type="checkbox" checked={s.terms} onChange={() => update({ terms: !s.terms })} />
                <span>
                  Leí y acepto los <a href="#">términos y condiciones</a> y el <a href="#">acuerdo de cobro</a> de estas facturas.
                </span>
              </label>
            </div>
          )}

          {/* LISTO */}
          {s.screen === "listo" && (
            <div className="m-card" style={{ padding: "32px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", textAlign: "center" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "999px", background: "#E5F3EA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1E6B3A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5 9-10" />
                </svg>
              </div>
              <h2 style={{ margin: 0, fontSize: "22px" }}>Recibimos tu solicitud</h2>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5, color: "#45515F" }}>
                Te avisamos por correo cuando esté aprobada. A partir de ese momento, vas a recibir <strong className="num">{s.lastOp ? ars(s.lastOp.neto) : ""}</strong> en tu cuenta terminada en {s.lastOp ? s.lastOp.ult : ""} en 1 día hábil.
              </p>
              <span className="num" style={{ fontSize: "12px", color: "#5B6676" }}>Número de operación: {s.lastOp ? s.lastOp.id : ""}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "6px" }}>
                <button className="m-btn m-primary" onClick={() => go("historial")}>Ver mis cobros anticipados</button>
                <button className="m-btn m-ghost" onClick={() => go("inicio")}>Volver al inicio</button>
              </div>
            </div>
          )}

          {/* COMPARAR */}
          {s.screen === "comparar" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="m-card" style={{ padding: "14px 16px", fontSize: "13px", lineHeight: 1.5, color: "#45515F" }}>
                Ejemplo: adelantar <strong className="num" style={{ color: "#10202F" }}>$ 1.000.000</strong> que te pagarían dentro de <strong style={{ color: "#10202F" }}>60 días</strong> (incluye el costo del servicio).
              </div>
              {comparar.map((c) => (
                <div key={c.nombre} className="m-card" style={c.cardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 650 }}>{c.nombre}</span>
                    {c.mejor && <span className="m-chip" style={{ background: "#E5F3EA", color: "#1E6B3A" }}>Menor costo</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                    <span className="num" style={{ fontSize: "24px", fontWeight: 700 }}>{c.costoTxt}</span>
                    <span style={{ fontSize: "12px", color: "#5B6676" }}>{c.costoPct} del monto</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px", paddingTop: "12px", borderTop: "1px solid #EEF0F2" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "#5B6676" }}>Costo por mes</span>
                      <span className="num" style={{ fontSize: "14px", fontWeight: 600 }}>{c.mesTxt}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "#5B6676" }}>Suele pagarte en</span>
                      <span className="num" style={{ fontSize: "14px", fontWeight: 600 }}>{c.plazo} días</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "#5B6676" }}>Disponible</span>
                      <span className="num" style={{ fontSize: "14px", fontWeight: 600 }}>{c.elegTxt}</span>
                    </div>
                  </div>
                  <button className="m-btn m-ghost" style={{ minHeight: "44px" }} onClick={c.ver}>Ver facturas</button>
                </div>
              ))}
            </div>
          )}

          {/* HISTORIAL */}
          {s.screen === "historial" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {historial.map((h) => (
                <div key={h.id} className="m-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                      <span style={{ fontSize: "15px", fontWeight: 650 }}>{h.os}</span>
                      <span className="num" style={{ fontSize: "12px", color: "#5B6676" }}>Solicitado el {h.fecha} · N.º {h.id}</span>
                    </div>
                    <span className="m-chip" style={h.chipStyle}>{h.estado}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "#5B6676" }}>Valor facturas</span>
                      <span className="num" style={{ fontSize: "13px" }}>{h.brutoTxt}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "#5B6676" }}>Costo</span>
                      <span className="num" style={{ fontSize: "13px", color: "#45515F" }}>{h.quitaTxt}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "11px", color: "#5B6676" }}>Recibiste</span>
                      <span className="num" style={{ fontSize: "13px", fontWeight: 700 }}>{h.netoTxt}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", paddingTop: "10px", borderTop: "1px solid #EEF0F2", fontSize: "12px" }}>
                    <span style={{ color: "#5B6676" }}>Depósito</span>
                    <span style={{ textAlign: "right" }}>
                      <span className="num" style={h.depStyle}>{h.depTxt}</span> <span style={{ color: "#5B6676" }}>· cuenta …{h.ult}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* MÁS */}
          {s.screen === "mas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="m-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "48px", height: "48px", borderRadius: "999px", background: "#E6F0EE", color: "#0F5C55", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>LF</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                  <span style={{ fontSize: "16px", fontWeight: 650 }}>Dra. Lucía Ferraro</span>
                  <span className="num" style={{ fontSize: "12px", color: "#5B6676" }}>Cardiología · CUIT 27-28456193-4</span>
                </div>
              </div>
              <div className="m-card" style={{ overflow: "hidden" }}>
                <button className="m-menu" onClick={() => update({ screen: "config", cuentaOk: "", mailOk: "", pwOk: false, datosOk: false, sheet: null })}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F5C55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
                  </svg>
                  <span style={{ flex: 1 }}>Configuración</span>
                  <span style={{ color: "#9AA5B1" }}>›</span>
                </button>
                <button className="m-menu" onClick={() => update({ screen: "descargo", descargoOk: false, sheet: null })}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F5C55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <path d="M14 3v6h6M12 12v5M9.5 14.5h5" />
                  </svg>
                  <span style={{ flex: 1 }}>Factura que no aparece</span>
                  <span style={{ color: "#9AA5B1" }}>›</span>
                </button>
                <a className="m-menu" href="#">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F5C55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5V14M12 17.5h.01" />
                  </svg>
                  <span style={{ flex: 1 }}>Ayuda</span>
                  <span style={{ color: "#9AA5B1" }}>›</span>
                </a>
              </div>
              <div className="m-card" style={{ overflow: "hidden" }}>
                <button className="m-menu" style={{ color: "#9B2C2C" }} onClick={() => update({ screen: "login", authMode: "ingresar" })}>
                  <span style={{ flex: 1 }}>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}

          {/* DESCARGO */}
          {s.screen === "descargo" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {s.descargoOk && (
                <div style={{ padding: "14px", borderRadius: "12px", background: "#E5F3EA", color: "#1E6B3A", fontSize: "14px", fontWeight: 600, lineHeight: 1.4 }}>
                  Recibimos tu aviso. La obra social lo revisa y, si está todo bien, la factura aparece en tu lista.
                </div>
              )}
              <div className="m-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <label className="m-field">
                  Obra social
                  <select className="m-input" value={s.dOs} onChange={(e: ChangeEvent<HTMLSelectElement>) => update({ dOs: e.target.value })}>
                    <option value="andina">Obra Social Andina</option>
                    <option value="litoral">OS Litoral Salud</option>
                    <option value="prevision">Previsión Médica</option>
                  </select>
                </label>
                <label className="m-field">
                  Número de factura
                  <input className="m-input num" type="text" placeholder="A-0001-00004575" value={s.dNumero} onChange={(e: ChangeEvent<HTMLInputElement>) => update({ dNumero: e.target.value })} />
                </label>
                <label className="m-field">
                  Mes de las atenciones
                  <input className="m-input" type="text" placeholder="Septiembre 2026" value={s.dPeriodo} onChange={(e: ChangeEvent<HTMLInputElement>) => update({ dPeriodo: e.target.value })} />
                </label>
                <label className="m-field">
                  Monto de la factura
                  <input className="m-input num" type="text" inputMode="numeric" placeholder="$ 512.000" value={s.dMonto} onChange={(e: ChangeEvent<HTMLInputElement>) => update({ dMonto: e.target.value })} />
                </label>
                <label className="m-field">
                  Foto o PDF de la factura
                  <input className="m-input" type="file" accept="image/*,application/pdf" style={{ paddingTop: "12px", fontSize: "14px" }} />
                </label>
                <label className="m-field">
                  Comentarios (opcional)
                  <textarea className="m-input" placeholder="Ej.: la entregué el 03/10 y no aparece." />
                </label>
                <button className="m-btn m-primary" onClick={enviarDescargo}>Enviar aviso</button>
              </div>
              <div className="m-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ fontSize: "15px", fontWeight: 650 }}>Avisos enviados</span>
                {descargosList.length === 0 && <span style={{ fontSize: "14px", color: "#5B6676" }}>Todavía no enviaste avisos.</span>}
                {descargosList.map((d) => (
                  <div key={d.id} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "10px 0", borderTop: "1px solid #EEF0F2" }}>
                    <div className="m-row">
                      <span className="num" style={{ fontWeight: 600, fontSize: "13px" }}>{d.numero}</span>
                      <span className="num">{d.montoTxt}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "#5B6676" }}>{d.osNombre} · {d.periodo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONFIGURACIÓN */}
          {s.screen === "config" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="m-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ fontSize: "16px", fontWeight: 650 }}>Cuentas bancarias</span>
                {s.cuentaOk && <div style={{ padding: "12px", borderRadius: "10px", background: "#E5F3EA", color: "#1E6B3A", fontSize: "13px", fontWeight: 600 }}>{s.cuentaOk}</div>}
                {cuentasConfig.map((c) => (
                  <div key={c.id} style={c.boxStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>{c.nombre}</span>
                      {c.pref && <span className="m-chip" style={{ background: "#E6F0EE", color: "#0F5C55" }}>Preferida</span>}
                    </div>
                    <span style={{ fontSize: "12px", color: "#5B6676" }}>{c.detalle}</span>
                    {c.noPref && (
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button className="m-link" style={{ paddingLeft: 0 }} onClick={c.hacerPref}>Usar como preferida</button>
                        <button className="m-link" style={{ color: "#9B2C2C" }} onClick={c.eliminar}>Quitar</button>
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "14px", borderTop: "1px solid #EEF0F2" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>Agregar una cuenta</span>
                  <label className="m-field">
                    CBU o alias
                    <input className="m-input num" type="text" placeholder="22 números o un alias" value={s.nCbu} onChange={(e: ChangeEvent<HTMLInputElement>) => update({ nCbu: e.target.value })} />
                  </label>
                  <label className="m-field">
                    Nombre para reconocerla (opcional)
                    <input className="m-input" type="text" placeholder="Ej.: Cuenta del consultorio" value={s.nNombre} onChange={(e: ChangeEvent<HTMLInputElement>) => update({ nNombre: e.target.value })} />
                  </label>
                  <span style={{ fontSize: "12px", lineHeight: 1.4, color: "#5B6676" }}>Tiene que estar a tu nombre (mismo CUIT). Te pedimos un código que te enviamos por correo.</span>
                  <button className="m-btn m-primary" onClick={agregarCuenta}>Agregar cuenta</button>
                </div>
              </div>

              <div className="m-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "18px" }}>
                <span style={{ fontSize: "16px", fontWeight: 650 }}>Mis datos</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>Datos personales</span>
                  {s.datosOk && <div style={{ padding: "12px", borderRadius: "10px", background: "#E5F3EA", color: "#1E6B3A", fontSize: "13px", fontWeight: 600 }}>Guardamos tus datos.</div>}
                  <label className="m-field">
                    Nombre y apellido
                    <input className="m-input" type="text" defaultValue="Lucía Ferraro" />
                  </label>
                  <label className="m-field">
                    Especialidad
                    <input className="m-input" type="text" defaultValue="Cardiología" />
                  </label>
                  <label className="m-field">
                    CUIT
                    <input className="m-input num" type="text" defaultValue="27-28456193-4" disabled style={{ background: "#F4F5F2", color: "#5B6676" }} />
                  </label>
                  <label className="m-field">
                    Teléfono
                    <input className="m-input num" type="tel" defaultValue="+54 9 11 5555-0142" />
                  </label>
                  <button className="m-btn m-ghost" onClick={() => update({ datosOk: true })}>Guardar cambios</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "16px", borderTop: "1px solid #EEF0F2" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>Correos electrónicos</span>
                  {s.mailOk && <div style={{ padding: "12px", borderRadius: "10px", background: "#E5F3EA", color: "#1E6B3A", fontSize: "13px", fontWeight: 600 }}>{s.mailOk}</div>}
                  {mailsList.map((m, i) => (
                    <div key={i} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "8px 0", borderBottom: "1px solid #EEF0F2" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", overflowWrap: "anywhere" }}>{m.m}</span>
                        {m.principal && <span className="m-chip" style={{ background: "#E6F0EE", color: "#0F5C55" }}>Principal</span>}
                      </div>
                      {m.noPrincipal && (
                        <div style={{ display: "flex", gap: "12px" }}>
                          <button className="m-link" style={{ paddingLeft: 0 }} onClick={m.hacerPrincipal}>Hacer principal</button>
                          <button className="m-link" style={{ color: "#9B2C2C" }} onClick={m.quitar}>Quitar</button>
                        </div>
                      )}
                    </div>
                  ))}
                  <label className="m-field">
                    Agregar un correo
                    <input className="m-input" type="email" placeholder="nombre@correo.com" value={s.nMail} onChange={(e: ChangeEvent<HTMLInputElement>) => update({ nMail: e.target.value })} />
                  </label>
                  <button className="m-btn m-ghost" onClick={agregarMail}>Agregar correo</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "16px", borderTop: "1px solid #EEF0F2" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>Contraseña</span>
                  {s.pwOk && <div style={{ padding: "12px", borderRadius: "10px", background: "#E5F3EA", color: "#1E6B3A", fontSize: "13px", fontWeight: 600 }}>Cambiamos tu contraseña.</div>}
                  <label className="m-field">
                    Contraseña actual
                    <input className="m-input" type="password" />
                  </label>
                  <label className="m-field">
                    Contraseña nueva
                    <input className="m-input" type="password" placeholder="Mínimo 10 caracteres" />
                  </label>
                  <label className="m-field">
                    Repetí la contraseña nueva
                    <input className="m-input" type="password" />
                  </label>
                  <button className="m-btn m-ghost" onClick={() => update({ pwOk: true })}>Cambiar contraseña</button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Barra de acción fija */}
        {showSelBar && (
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#FFFFFF", borderTop: "1px solid #E3E6EA", boxShadow: "0 -6px 16px rgba(16,32,47,.06)" }}>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
              <span style={{ fontSize: "12px", color: "#5B6676" }}>{selList.length === 1 ? "1 factura" : selList.length + " facturas"} · recibirías</span>
              <span className="num" style={{ fontSize: "19px", fontWeight: 700, color: "#0F5C55" }}>{ars(neto)}</span>
            </div>
            <button className="m-btn m-primary" style={{ width: "auto", flex: "none" }} onClick={() => go("simulacion")}>Ver detalle</button>
          </div>
        )}
        {s.screen === "simulacion" && (
          <div style={{ flex: "none", padding: "12px 16px", background: "#FFFFFF", borderTop: "1px solid #E3E6EA" }}>
            <button className="m-btn m-primary" onClick={() => update({ screen: "confirmar", terms: false, cuentaSel: null })}>Solicitar adelanto</button>
          </div>
        )}
        {s.screen === "confirmar" && (
          <div style={{ flex: "none", padding: "12px 16px", background: "#FFFFFF", borderTop: "1px solid #E3E6EA" }}>
            <button className="m-btn m-primary" disabled={confirmDisabled} onClick={confirmar}>Enviar solicitud</button>
          </div>
        )}

        {/* Navegación inferior */}
        {showTabs && (
          <nav aria-label="Secciones" style={{ flex: "none", display: "flex", background: "#FFFFFF", borderTop: "1px solid #E3E6EA", padding: "4px 4px 10px" }}>
            {tabs.map((tab) => (
              <button key={tab.key} className="m-tab" style={tab.style} aria-current={tab.current} onClick={tab.go}>
                <span style={tab.iconWrap}>{tabIcon(tab.key)}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Hoja inferior de filtros */}
        {s.sheet && (
          <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(16,32,47,.45)" }}>
            <button aria-label="Cerrar" style={{ flex: 1, border: 0, background: "transparent", cursor: "pointer" }} onClick={() => update({ sheet: null })} />
            <div role="dialog" aria-label={s.sheet === "os" ? "Filtrar por obra social" : "Filtrar por estado"} style={{ background: "#FFFFFF", borderRadius: "20px 20px 0 0", padding: "10px 20px 20px", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "70%", overflowY: "auto" }}>
              <span style={{ width: "40px", height: "4px", borderRadius: "99px", background: "#D3D9DE", alignSelf: "center", marginBottom: "8px" }} />
              <span style={{ fontSize: "17px", fontWeight: 650, paddingBottom: "6px" }}>{s.sheet === "os" ? "Filtrar por obra social" : "Filtrar por estado"}</span>
              {sheetOpciones.map((o) => (
                <label key={o.label} className="m-opt">
                  <input type="checkbox" checked={o.on} onChange={o.toggle} />
                  <span style={{ flex: 1 }}>{o.label}</span>
                  <span className="num" style={{ fontSize: "13px", color: "#5B6676" }}>{o.count}</span>
                </label>
              ))}
              <div style={{ display: "flex", gap: "10px", paddingTop: "12px" }}>
                <button className="m-btn m-ghost" onClick={() => update(s.sheet === "os" ? { osSel: {} } : { estSel: {} })}>Mostrar todos</button>
                <button className="m-btn m-primary" onClick={() => update({ sheet: null })}>Aplicar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Anticipa;
