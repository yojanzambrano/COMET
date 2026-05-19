import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";

// ── CONSTANTES ──
const ADMIN_ID = 1122338806;
const TIEMPO_POR_PERSONA = 0.208;

// Normaliza el objeto de usuario mapeando columnas de Supabase
// (con mayúsculas/tildes) a claves internas consistentes
function normalizeUsuario(u) {
  if (!u) return u;
  return {
    ...u,
    correo: u["Correo"] || u.correo || "",
    telefono: u["teléfono"] || u.telefono || "",
  };
}

const CARRERAS_PREGRADO = [
  "Ingeniería de Sistemas","Ingeniería Civil","Ingeniería Electrónica","Ingeniería Mecánica",
  "Ingeniería Industrial","Ingeniería Mecatrónica","Administración de Empresas","Contaduría Pública",
  "Derecho","Psicología","Medicina","Enfermería","Arquitectura","Diseño Gráfico",
  "Comunicación Social","Educación","Matemáticas","Física","Química","Biología",
  "Historia","Filosofía","Literatura","Idiomas","Economía","Sociología",
  "Antropología","Geografía","Ciencias Políticas","Relaciones Internacionales","Trabajo Social"
];

// ── SUPABASE COLA SERVICE ──
// Columnas reales en cola_activa: user_id (int8), nombre (text), identificacion (text), Estado (text)
const ColaService = {
  getColaActiva: async () => {
    const { data } = await supabase
      .from("cola_activa")
      .select("*")
      .order("created_at", { ascending: true });
    return data || [];
  },
  agregarACola: async (usuario) => {
    const { data: existe } = await supabase
      .from("cola_activa")
      .select("user_id")
      .eq("user_id", usuario.id)
      .maybeSingle();
    if (existe) return { error: null, yaEstaba: true };
    const { error } = await supabase.from("cola_activa").insert([{
      user_id: usuario.id,
      nombre: usuario.nombre,
      identificacion: String(usuario.id),
      Estado: "espera",
    }]);
    return { error, yaEstaba: false };
  },
  salirDeCola: async (estudianteId) => {
    const { error } = await supabase
      .from("cola_activa")
      .delete()
      .eq("user_id", estudianteId);
    return { error };
  },
  getMiEntrada: async (estudianteId) => {
    const { data } = await supabase
      .from("cola_activa")
      .select("*")
      .eq("user_id", estudianteId)
      .maybeSingle();
    return data || null;
  },
};

// ── HOOKS ──
function useAlerta() {
  const [alerta, setAlerta] = useState({ texto: "", tipo: "" });
  const timerRef = useRef(null);
  const mostrar = useCallback((texto, tipo = "success") => {
    clearTimeout(timerRef.current);
    setAlerta({ texto, tipo });
    timerRef.current = setTimeout(() => setAlerta({ texto: "", tipo: "" }), 3500);
  }, []);
  return { alerta, mostrar };
}

function useColaRealtime() {
  const [cola, setCola] = useState([]);
  const cargar = useCallback(async () => {
    const data = await ColaService.getColaActiva();
    setCola(data);
  }, []);
  useEffect(() => {
    cargar();
    const channel = supabase.channel("cola_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cola_activa" }, () => cargar())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [cargar]);
  return { cola, refrescar: cargar };
}

// ── ESTILOS ──
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { font-family: 'DM Sans', sans-serif; background: #f0f2f5; color: #1a2a3a; -webkit-font-smoothing: antialiased; }
  h1, h2, h3, h4 { font-family: 'Sora', sans-serif; }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; border: none; outline: none; }
  input, select { font-family: 'DM Sans', sans-serif; outline: none; }
  :root {
    --navy: #0f1b2d; --navy-mid: #162236;
    --orange: #f57c20; --orange-light: #ff9a4a; --orange-dim: rgba(245,124,32,0.12);
    --purple: #7c3aed; --purple-dim: rgba(124,58,237,0.10);
    --white: #ffffff; --off-white: #f0f2f5;
    --border: #e2e8f0; --border-light: #f1f5f9;
    --text-primary: #1a2a3a; --text-secondary: #5a6a7a; --text-muted: #8a9ab0;
    --success: #22c55e; --success-bg: #f0fdf4;
    --danger: #ef4444; --danger-bg: #fef2f2;
    --shadow-sm: 0 1px 4px rgba(0,0,0,0.07); --shadow-md: 0 4px 20px rgba(0,0,0,0.08);
    --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 24px;
  }
  /* NAV */
  .nav { background: var(--navy); height: 62px; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 12px rgba(0,0,0,0.25); }
  .nav-brand { display: flex; align-items: center; gap: 12px; }
  .nav-logo { width: 36px; height: 36px; background: linear-gradient(135deg, var(--orange), var(--orange-light)); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .nav-title { color: white; font-family: 'Sora', sans-serif; font-size: 1.2rem; font-weight: 700; letter-spacing: 0.06em; }
  .nav-sub { color: rgba(255,255,255,0.45); font-size: 0.68rem; letter-spacing: 0.03em; }
  .nav-right { display: flex; align-items: center; gap: 10px; }
  .nav-avatar { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 600; cursor: pointer; }
  .nav-user-name { color: rgba(255,255,255,0.85); font-size: 0.82rem; font-weight: 600; }
  .nav-admin-badge { background: var(--purple-dim); color: #7c3aed; border: 1px solid rgba(124,58,237,0.3); padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
  /* PAGE */
  .page { min-height: calc(100vh - 62px); background: var(--off-white); padding: 2rem; }
  .page-center { min-height: calc(100vh - 62px); display: flex; align-items: center; justify-content: center; padding: 2rem; background: var(--off-white); }
  /* CARD */
  .card { background: var(--white); border: 1px solid var(--border); border-radius: var(--r-lg); box-shadow: var(--shadow-sm); padding: 2rem; }
  .card-sm { padding: 1.5rem; }
  .card-xs { padding: 1.25rem 1.5rem; }
  /* ALERT */
  .alert { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: var(--r-sm); font-size: 0.875rem; font-weight: 500; animation: slideDown 0.25s ease; margin-bottom: 1rem; }
  .alert-success { background: var(--success-bg); border: 1px solid #bbf7d0; color: #15803d; }
  .alert-error { background: var(--danger-bg); border: 1px solid #fecaca; color: #b91c1c; }
  @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  /* BUTTONS */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 22px; border-radius: var(--r-sm); font-size: 0.9rem; font-weight: 600; transition: all 0.2s; letter-spacing: 0.01em; }
  .btn-block { width: 100%; }
  .btn-navy { background: var(--navy); color: white; }
  .btn-navy:hover { background: #1e3050; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(15,27,45,0.3); }
  .btn-orange { background: var(--orange); color: white; }
  .btn-orange:hover { background: var(--orange-light); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(245,124,32,0.4); }
  .btn-ghost { background: transparent; color: var(--text-secondary); border: 1.5px solid var(--border); }
  .btn-ghost:hover { border-color: var(--navy); color: var(--navy); background: rgba(15,27,45,0.04); }
  .btn-danger-ghost { background: transparent; color: var(--danger); border: 1.5px solid rgba(239,68,68,0.3); }
  .btn-danger-ghost:hover { background: var(--danger-bg); border-color: var(--danger); }
  .btn-success { background: #22c55e; color: white; }
  .btn-success:hover { background: #16a34a; transform: translateY(-1px); }
  .btn-purple { background: var(--purple); color: white; }
  .btn-purple:hover { background: #6d28d9; transform: translateY(-1px); }
  .btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
  .btn-sm { padding: 8px 16px; font-size: 0.82rem; }
  /* INPUTS */
  .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1rem; }
  .field-label { font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
  .input { width: 100%; padding: 11px 14px; border: 1.5px solid var(--border); border-radius: var(--r-sm); font-size: 0.875rem; color: var(--text-primary); background: #fafbfc; transition: all 0.2s; }
  .input:focus { border-color: var(--orange); background: white; box-shadow: 0 0 0 3px var(--orange-dim); }
  .input::placeholder { color: var(--text-muted); }
  .input-error { border-color: var(--danger) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
  .field-err { font-size: 0.75rem; color: var(--danger); }
  .field-hint { font-size: 0.73rem; color: var(--text-muted); }
  select.input { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a9ab0' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px; background-color: #fafbfc; }
  /* BADGE */
  .badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
  .badge-green { background: rgba(34,197,94,0.12); color: #15803d; }
  .badge-orange { background: var(--orange-dim); color: var(--orange); }
  .badge-red { background: rgba(239,68,68,0.12); color: var(--danger); }
  .badge-gray { background: var(--border-light); color: var(--text-muted); }
  .badge-blue { background: rgba(59,130,246,0.12); color: #1d4ed8; }
  .badge-purple { background: var(--purple-dim); color: var(--purple); }
  /* DOT */
  .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .dot-green { background: #22c55e; animation: pulse 1.2s infinite; }
  .dot-orange { background: var(--orange); }
  .dot-red { background: var(--danger); animation: pulse 1s infinite; }
  @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(1.4); } }
  /* DIVIDER */
  .divider { height: 1px; background: var(--border-light); margin: 1.25rem 0; }
  /* INFO ROW */
  .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-light); font-size: 0.875rem; }
  .info-row:last-child { border-bottom: none; }
  .info-k { color: var(--text-muted); font-size: 0.8rem; }
  .info-v { color: var(--text-primary); font-weight: 600; }
  /* SECTION TITLE */
  .sec-title { font-family: 'Sora', sans-serif; font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
  .sec-sub { font-size: 0.8rem; color: var(--text-muted); }
  /* NOTE */
  .note { display: flex; align-items: flex-start; gap: 8px; padding: 10px 14px; background: rgba(15,27,45,0.04); border-radius: var(--r-sm); font-size: 0.8rem; color: var(--text-secondary); margin-top: 1rem; }
  /* LOGIN */
  .login-wrap { max-width: 1100px; width: 100%; display: grid; grid-template-columns: 1fr 360px; gap: 1.5rem; }
  .login-main { display: flex; flex-direction: column; gap: 1.25rem; }
  .login-hero h2 { font-size: 1.7rem; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; }
  .login-hero p { color: var(--text-secondary); font-size: 0.95rem; }
  .orange { color: var(--orange); }
  .or-row { display: flex; align-items: center; gap: 10px; margin: 0.75rem 0; font-size: 0.78rem; color: var(--text-muted); }
  .or-line { flex: 1; height: 1px; background: var(--border); }
  .register-prompt { display: flex; align-items: center; justify-content: center; gap: 10px; padding-top: 1rem; border-top: 1px solid var(--border-light); margin-top: 0.75rem; }
  .register-prompt p { font-size: 0.84rem; color: var(--text-secondary); }
  /* SCANNER */
  .scanner-box { position: relative; width: 180px; height: 110px; margin: 0.75rem auto 0.5rem; display: flex; align-items: center; justify-content: center; }
  .corner { position: absolute; width: 18px; height: 18px; border-color: var(--orange); border-style: solid; }
  .c-tl { top:0; left:0; border-width: 3px 0 0 3px; border-radius: 2px 0 0 0; }
  .c-tr { top:0; right:0; border-width: 3px 3px 0 0; border-radius: 0 2px 0 0; }
  .c-bl { bottom:0; left:0; border-width: 0 0 3px 3px; border-radius: 0 0 0 2px; }
  .c-br { bottom:0; right:0; border-width: 0 3px 3px 0; border-radius: 0 0 2px 0; }
  .scan-line { position: absolute; left: 8px; right: 8px; height: 2px; background: linear-gradient(90deg, transparent, var(--orange), transparent); animation: scanMove 2s ease-in-out infinite; border-radius: 1px; opacity: 0.85; }
  @keyframes scanMove { 0%,100% { top:12%; } 50% { top:82%; } }
  /* BARCODE */
  .barcode-outer { background: white; border: 1.5px solid var(--border); border-radius: var(--r-md); padding: 1.25rem 1.5rem; display: flex; justify-content: center; }
  /* REGISTER */
  .register-wrap { max-width: 580px; width: 100%; }
  .reg-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 1.75rem; }
  .back-btn { background: none; border: none; color: var(--text-muted); font-size: 0.82rem; cursor: pointer; padding: 4px 0; flex-shrink: 0; margin-top: 4px; transition: color 0.2s; }
  .back-btn:hover { color: var(--orange); }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
  .full { grid-column: 1 / -1; }
  .type-btns { display: flex; gap: 0.75rem; margin-top: 4px; }
  .type-btn { flex: 1; padding: 10px 12px; border: 2px solid var(--border); border-radius: 10px; background: white; color: var(--text-secondary); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
  .type-btn:hover { border-color: var(--orange); color: var(--orange); }
  .type-btn.active { border-color: var(--orange); background: var(--orange-dim); color: var(--orange); }
  /* REVEAL */
  .reveal { text-align: center; padding: 0.5rem; }
  .reveal-icon { font-size: 2.8rem; margin-bottom: 10px; }
  .reveal h2 { font-size: 1.4rem; font-weight: 800; margin-bottom: 6px; }
  .reveal p { font-size: 0.88rem; color: var(--text-secondary); }
  .reveal-info { background: #fafbfc; border: 1px solid var(--border); border-radius: var(--r-md); padding: 1rem; margin: 1.25rem 0; text-align: left; }
  .reveal-hint { display: flex; align-items: flex-start; gap: 8px; padding: 10px 14px; background: var(--orange-dim); border-radius: var(--r-sm); font-size: 0.8rem; color: var(--text-secondary); text-align: left; margin-top: 1rem; }
  /* MENU */
  .menu-page { max-width: 1100px; margin: 0 auto; }
  .menu-header { margin-bottom: 2rem; }
  .menu-header h2 { font-size: 1.6rem; font-weight: 800; }
  .menu-header p { color: var(--text-secondary); font-size: 0.95rem; margin-top: 4px; }
  .menu-status-bar { display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: var(--success-bg); border: 1px solid #bbf7d0; border-radius: var(--r-md); margin-bottom: 1.5rem; cursor: pointer; transition: background 0.2s; }
  .menu-status-bar:hover { background: #dcfce7; }
  .menu-status-bar .label { font-size: 0.9rem; font-weight: 600; color: #15803d; flex: 1; }
  .menu-status-bar .arrow { color: #15803d; font-size: 1.1rem; }
  .menu-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 1.5rem; }
  .menu-card { background: white; border: 1px solid var(--border); border-radius: var(--r-lg); padding: 1.75rem 1.5rem; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; gap: 6px; position: relative; overflow: hidden; }
  .menu-card:hover { border-color: var(--orange); transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .menu-card-icon { font-size: 2rem; margin-bottom: 6px; }
  .menu-card h3 { font-family: 'Sora', sans-serif; font-size: 1rem; font-weight: 700; }
  .menu-card p { font-size: 0.82rem; color: var(--text-muted); }
  .menu-card-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--orange), var(--orange-light)); opacity: 0; transition: opacity 0.2s; }
  .menu-card:hover .menu-card-accent { opacity: 1; }
  .menu-quick { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .quick-stat { background: white; border: 1px solid var(--border); border-radius: var(--r-md); padding: 1.25rem 1.5rem; }
  .quick-stat .qs-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 6px; }
  .quick-stat .qs-value { font-family: 'Sora', sans-serif; font-size: 2rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
  .quick-stat .qs-sub { font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; }
  /* QUEUE PAGE */
  .queue-page { max-width: 900px; margin: 0 auto; }
  .queue-top { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
  .group-card { text-align: center; padding: 2rem 1.5rem; }
  .group-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 8px; }
  .group-num { font-family: 'Sora', sans-serif; font-size: 5rem; font-weight: 800; color: var(--orange); line-height: 1; }
  .group-pos { font-size: 1rem; font-weight: 600; color: var(--text-secondary); margin: 6px 0 14px; }
  .timer-card { text-align: center; padding: 2rem 1.5rem; }
  .timer-ring-wrap { position: relative; width: 96px; height: 96px; margin: 1rem auto; }
  .timer-inner { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; }
  .timer-num { font-family: 'Sora', sans-serif; font-size: 1.5rem; font-weight: 800; color: var(--navy); }
  .timer-unit { font-size: 0.65rem; color: var(--text-muted); margin-top: -2px; }
  .queue-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  .queue-list-card { padding: 1.5rem; }
  .queue-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 12px; border-radius: var(--r-sm); margin-bottom: 2px; transition: background 0.15s; }
  .queue-row:hover { background: #fafbfc; }
  .queue-row-me { background: rgba(245,124,32,0.06) !important; border: 1px solid rgba(245,124,32,0.2); }
  .queue-gnum { font-family: 'Sora', sans-serif; font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }
  .queue-grange { font-size: 0.72rem; color: var(--text-muted); margin-left: 4px; }
  .queue-header-row { display: flex; justify-content: space-between; padding: 6px 12px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); border-bottom: 1px solid var(--border-light); margin-bottom: 4px; }
  .notice-card { background: rgba(245,124,32,0.04); border-color: rgba(245,124,32,0.2) !important; padding: 1.5rem; }
  .notice-title { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 700; color: var(--orange); margin-bottom: 8px; }
  .notice-card p { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.65; }
  /* PROFILE */
  .profile-page { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
  .profile-avatar-row { display: flex; align-items: center; gap: 16px; margin-bottom: 1.25rem; }
  .avatar-circle { width: 52px; height: 52px; border-radius: 50%; background: var(--navy); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 700; flex-shrink: 0; }
  .avatar-admin { background: linear-gradient(135deg, var(--purple), #6d28d9) !important; }
  /* EDIT */
  .edit-page { max-width: 560px; margin: 0 auto; }
  .page-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 1.75rem; }
  .page-header-text h2 { font-size: 1.35rem; font-weight: 800; }
  .page-header-text p { font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; }
  /* ADMIN */
  .admin-page { max-width: 1200px; margin: 0 auto; }
  .admin-hero { background: linear-gradient(135deg, #0f1b2d 0%, #1e1065 100%); border-radius: var(--r-xl); padding: 2rem; margin-bottom: 1.5rem; color: white; display: flex; align-items: center; justify-content: space-between; }
  .admin-hero h2 { font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; }
  .admin-hero p { opacity: 0.6; font-size: 0.85rem; }
  .admin-badge-hero { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; color: white; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
  .stat-card { background: white; border: 1px solid var(--border); border-radius: var(--r-lg); padding: 1.5rem; position: relative; overflow: hidden; }
  .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
  .stat-orange::before { background: linear-gradient(90deg, var(--orange), var(--orange-light)); }
  .stat-green::before { background: linear-gradient(90deg, #22c55e, #4ade80); }
  .stat-blue::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
  .stat-purple::before { background: linear-gradient(90deg, #7c3aed, #a78bfa); }
  .stat-icon { font-size: 1.8rem; margin-bottom: 8px; }
  .stat-val { font-family: 'Sora', sans-serif; font-size: 2.2rem; font-weight: 800; line-height: 1; }
  .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; font-weight: 700; }
  .admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
  .admin-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .admin-table th { text-align: left; padding: 8px 12px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); border-bottom: 1px solid var(--border); background: #fafbfc; }
  .admin-table td { padding: 10px 12px; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
  .admin-table tr:last-child td { border-bottom: none; }
  .admin-table tr:hover td { background: #fafbfc; }
  .admin-tabs { display: flex; gap: 8px; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border); padding-bottom: 0; }
  .admin-tab { padding: 8px 16px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.2s; background: none; border-top: none; border-left: none; border-right: none; }
  .admin-tab.active { color: var(--orange); border-bottom-color: var(--orange); }
  .admin-tab:hover { color: var(--navy); }
  .realtime-cola-table { width: 100%; border-collapse: collapse; }
  .realtime-cola-table th { text-align: left; padding: 10px 14px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); border-bottom: 1px solid var(--border); background: #fafbfc; }
  .realtime-cola-table td { padding: 12px 14px; border-bottom: 1px solid var(--border-light); font-size: 0.88rem; }
  .realtime-cola-table tr:last-child td { border-bottom: none; }
  .realtime-cola-table tr:hover td { background: #fafbfc; }
  /* PUBLIC QUEUE */
  .public-queue-wrap { max-width: 1100px; width: 100%; }
  .public-queue-table { width: 100%; border-collapse: collapse; }
  .public-queue-table th { text-align: left; padding: 12px 16px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); border-bottom: 2px solid var(--border); }
  .public-queue-table td { padding: 14px 16px; border-bottom: 1px solid var(--border-light); font-size: 0.9rem; }
  .public-queue-table tr:hover td { background: #fafbfc; }
  /* MISC */
  .mono { font-family: 'Courier New', monospace; font-size: 0.8rem; color: var(--text-secondary); }
  .flex-row { display: flex; gap: 10px; }
  .flex-end { justify-content: flex-end; }
  .mt-1 { margin-top: 0.75rem; }
  .mt-2 { margin-top: 1.5rem; }
  .mb-1 { margin-bottom: 0.75rem; }
  .mb-2 { margin-bottom: 1.5rem; }
  .text-center { text-align: center; }
  @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2,1fr); } .admin-grid { grid-template-columns: 1fr; } }
  @media (max-width: 860px) { .login-wrap { grid-template-columns: 1fr; } .menu-grid { grid-template-columns: 1fr 1fr; } .queue-top,.queue-bottom { grid-template-columns: 1fr; } .menu-quick { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 540px) { .page { padding: 1rem; } .menu-grid,.menu-quick,.form-grid { grid-template-columns: 1fr; } .full { grid-column: 1; } .stats-grid { grid-template-columns: 1fr 1fr; } }
`;

// ── BARCODE ──
function Barcode({ id, height = 60 }) {
  const idStr = String(id).padStart(10, "0");
  const bars = [];
  let x = 10;
  for (let i = 0; i < idStr.length; i++) {
    const d = parseInt(idStr[i]);
    for (let b = 0; b < 3; b++) {
      const w = b % 2 === 0 ? (d % 3) + 1 : 1;
      bars.push({ x, w: w * 2, c: (b + d) % 3 === 0 ? "#0f1b2d" : "#2d4a6e" });
      x += w * 2 + 1;
    }
    x += 2;
  }
  const all = [{ x: 4, w: 2, c: "#0f1b2d" }, { x: 7, w: 1, c: "#0f1b2d" }, ...bars, { x: x + 1, w: 2, c: "#0f1b2d" }];
  const tw = x + 15;
  return (
    <svg width={tw} height={height + 20} viewBox={`0 0 ${tw} ${height + 20}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={tw} height={height + 20} fill="white" />
      {all.map((b, i) => <rect key={i} x={b.x} y={5} width={b.w} height={height - 5} fill={b.c} />)}
      <text x={tw / 2} y={height + 16} textAnchor="middle" fontFamily="Courier New, monospace" fontSize="10" fill="#5a6a7a">{idStr}</text>
    </svg>
  );
}

// ── ALERT ──
function Alert({ alerta }) {
  if (!alerta.texto) return null;
  return <div className={`alert alert-${alerta.tipo}`}>{alerta.tipo === "success" ? "✓ " : "✕ "}{alerta.texto}</div>;
}

// ── QUEUE PANEL (tiempo real desde Supabase) ──
function QueuePanel({ cola, miId }) {
  const GRUPO_SIZE = 10;
  const grupos = [];
  for (let i = 0; i < cola.length; i += GRUPO_SIZE) {
    grupos.push({ num: Math.floor(i / GRUPO_SIZE) + 1, desde: i + 1, hasta: Math.min(i + GRUPO_SIZE, cola.length), users: cola.slice(i, i + GRUPO_SIZE) });
  }
  const miGrupo = grupos.find((g) => g.users.some((u) => u.user_id == miId));
  return (
    <div className="card queue-list-card">
      <div className="sec-title" style={{ marginBottom: "4px" }}>Cola en tiempo real</div>
      <div className="sec-sub" style={{ marginBottom: "1rem" }}>Grupos de {GRUPO_SIZE} personas · Datos en vivo</div>
      {grupos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          <div style={{ fontSize: "2rem", opacity: 0.2, marginBottom: 8 }}>🏁</div>
          <p>La cola está vacía</p>
        </div>
      ) : (
        <>
          <div className="queue-header-row"><span>Grupo</span><span>Estado</span></div>
          {grupos.map((g) => {
            const esElMio = miGrupo?.num === g.num;
            return (
              <div key={g.num} className={`queue-row${esElMio ? " queue-row-me" : ""}`}>
                <div>
                  <span className="queue-gnum">{String(g.num).padStart(2, "0")}</span>
                  <span className="queue-grange">({g.desde} – {g.hasta})</span>
                </div>
                <span className={`badge ${g.num === 1 ? "badge-green" : esElMio ? "badge-orange" : "badge-gray"}`}>
                  {g.num === 1 && <span className="dot dot-green" />}
                  {g.num === 1 ? "Ingresando" : esElMio ? "Tu grupo" : "Esperando"}
                </span>
              </div>
            );
          })}
        </>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-light)", fontSize: "0.73rem", color: "var(--text-muted)" }}>
        <span className="dot dot-green" />
        Actualización en tiempo real (Supabase)
      </div>
    </div>
  );
}

// ── LOGIN ──
function LoginPage({ onLogin, onRegister }) {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const { alerta, mostrar } = useAlerta();
  const { cola } = useColaRealtime();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id.trim()) return mostrar("Ingresa tu número de documento.", "error");
    setLoading(true);
    const { data } = await supabase.from("estudiantes").select("*").eq("id", parseInt(id)).single();
    if (data) {
      if (data.bloqueado === true) { mostrar("Tu cuenta está bloqueada. Contacta al administrador.", "error"); setLoading(false); return; }
      onLogin(normalizeUsuario(data));
    } else {
      mostrar("Documento no registrado. Por favor crea tu cuenta.", "error");
    }
    setLoading(false);
  };

  return (
    <div className="page-center" style={{ alignItems: "flex-start", paddingTop: "2rem" }}>
      <div className="public-queue-wrap">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem" }}>
          {/* COLA PÚBLICA */}
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <h2 style={{ fontFamily: "Sora", fontSize: "1.5rem", fontWeight: 800 }}>
                Bienvenido a <span className="orange">COMET</span>
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: 4 }}>
                Comedor Estudiantil UP · Cola en tiempo real
              </p>
            </div>
            <div className="card" style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div>
                  <div className="sec-title" style={{ marginBottom: 2 }}>👥 Personas en cola</div>
                  <div className="sec-sub">Actualización automática en tiempo real</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  <span className="dot dot-green" />
                  En vivo · {cola.length} {cola.length === 1 ? "persona" : "personas"}
                </div>
              </div>
              {cola.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "3rem", opacity: 0.2, marginBottom: 12 }}>🏁</div>
                  <p style={{ fontWeight: 600 }}>La cola está vacía</p>
                  <p style={{ fontSize: "0.82rem", marginTop: 4 }}>Sé el primero en unirte</p>
                </div>
              ) : (
                <table className="public-queue-table">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>#</th>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cola.map((entrada, i) => (
                      <tr key={entrada.id}>
                        <td>
                          <span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: "1rem", color: i === 0 ? "var(--orange)" : "var(--text-primary)" }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{entrada.nombre}</td>
                        <td><span className="mono">{entrada.identificacion}</span></td>
                        <td>
                          <span className={`badge ${i === 0 ? "badge-green" : "badge-orange"}`}>
                            {i === 0 && <span className="dot dot-green" />}
                            {i === 0 ? "Siendo atendido" : "En espera"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {/* LOGIN FORM */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card card-sm">
              <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
                <div className="sec-title">Escanea tu código de barras</div>
              </div>
              <div className="scanner-box">
                <div className="corner c-tl" /><div className="corner c-tr" />
                <div className="corner c-bl" /><div className="corner c-br" />
                <div style={{ display: "flex", gap: 2 }}>
                  {Array.from({ length: 28 }, (_, i) => (
                    <div key={i} style={{ width: i % 3 === 0 ? 3 : i % 5 === 0 ? 2 : 1, height: 70, background: i % 4 === 0 ? "#0f1b2d" : "transparent" }} />
                  ))}
                </div>
                <div className="scan-line" />
              </div>
              <div className="or-row"><div className="or-line" /><span>O ingresa tu código</span><div className="or-line" /></div>
              <form onSubmit={handleSubmit}>
                <div className="field">
                  <input className="input" type="number" placeholder="Cédula o documento" value={id} onChange={(e) => setId(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-navy btn-block" disabled={loading}>
                  {loading ? "Verificando..." : "Entrar / Iniciar sesión"}
                </button>
              </form>
              <Alert alerta={alerta} />
              <div className="register-prompt">
                <p>¿No tienes cuenta?</p>
                <button className="btn btn-ghost btn-sm" onClick={onRegister}>Registrarse</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── REGISTER ──
function RegisterPage({ onSuccess, onBack }) {
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState("");
  const [carrera, setCarrera] = useState("");
  const [semestre, setSemestre] = useState("");
  const [datos, setDatos] = useState({ nombre: "", telefono: "", correo: "", id: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const { alerta, mostrar } = useAlerta();

  const cambiar = (e) => { setDatos((p) => ({ ...p, [e.target.name]: e.target.value })); setErrors((p) => ({ ...p, [e.target.name]: "" })); };

  const validate = () => {
    const e = {};
    if (!datos.nombre.trim()) e.nombre = "Campo requerido";
    if (!datos.telefono.trim()) e.telefono = "Campo requerido";
    if (!tipo) e.tipo = "Selecciona un tipo";
    if (tipo === "Carreras de Pregrado" && !carrera) e.carrera = "Selecciona una carrera";
    if (!semestre) e.semestre = "Campo requerido";
    if (!datos.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) e.correo = "Correo inválido";
    if (!datos.id.trim()) e.id = "Campo requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    // Verificar si el documento ya existe
    const { data: existe } = await supabase
      .from("estudiantes")
      .select("id")
      .eq("id", parseInt(datos.id))
      .maybeSingle();
    if (existe) {
      mostrar("Ya existe un estudiante con ese documento.", "error");
      setLoading(false);
      return;
    }

    // Columnas exactas de Supabase: id, nombre, Correo, carrera, rol, teléfono, bloqueado, semestre
    const nuevo = {
      id: parseInt(datos.id),
      nombre: datos.nombre.toUpperCase().trim(),
      carrera: tipo === "Carreras de Pregrado" ? carrera : tipo,
      semestre,
      "teléfono": datos.telefono.trim(),
      "Correo": datos.correo.toLowerCase().trim(),
      rol: "ESTUDIANTE",
      bloqueado: false,
    };

    const { error } = await supabase.from("estudiantes").insert([nuevo]);
    if (error) {
      mostrar(error.message, "error");
    } else {
      // Guardar con claves internas para el estado local
      setUsuario({ ...nuevo, correo: nuevo["Correo"], telefono: nuevo["teléfono"] });
      setStep(2);
    }
    setLoading(false);
  };

  if (step === 2 && usuario) {
    return (
      <div className="page-center">
        <div className="register-wrap">
          <div className="card">
            <div className="reveal">
              <div className="reveal-icon">🎉</div>
              <h2>¡Registro exitoso!</h2>
              <p>Tu cuenta ha sido creada. Guarda tu código de barras para el comedor.</p>
              <div className="reveal-info">
                {[["Nombre", usuario.nombre], ["Documento", usuario.id], ["Tipo de estudio", usuario.carrera], ["Semestre", usuario.semestre], ["Correo", usuario.correo]].map(([k, v]) => (
                  <div className="info-row" key={k}><span className="info-k">{k}</span><span className="info-v">{v}</span></div>
                ))}
              </div>
              <div className="barcode-outer" style={{ marginBottom: "1rem" }}>
                <Barcode id={usuario.id} height={70} />
              </div>
              <div className="reveal-hint">
                <span>🔒</span>
                <span>Tu código de barras es único. Preséntalo en la ventanilla del comedor.</span>
              </div>
              <button className="btn btn-navy btn-block mt-2" onClick={() => onSuccess(usuario)}>Ir al inicio →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-center">
      <div className="register-wrap">
        <div className="card">
          <div className="reg-header">
            <button className="back-btn" onClick={onBack}>← Volver</button>
            <div>
              <h2 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.5rem", fontWeight: 800 }}>Crear cuenta</h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>Regístrate para acceder al Comedor Estudiantil UP</p>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label className="field-label">Nombre completo *</label>
                <input className={`input${errors.nombre ? " input-error" : ""}`} name="nombre" placeholder="Ej. Juan Pérez" value={datos.nombre} onChange={cambiar} />
                {errors.nombre && <span className="field-err">{errors.nombre}</span>}
              </div>
              <div className="field">
                <label className="field-label">Teléfono *</label>
                <input className={`input${errors.telefono ? " input-error" : ""}`} name="telefono" type="tel" placeholder="Ej. 3101234567" value={datos.telefono} onChange={cambiar} />
                {errors.telefono && <span className="field-err">{errors.telefono}</span>}
              </div>
            </div>
            <div className="field">
              <label className="field-label">Tipo de estudio *</label>
              <div className="type-btns">
                <button type="button" className={`type-btn${tipo === "Carreras de Pregrado" ? " active" : ""}`} onClick={() => { setTipo("Carreras de Pregrado"); setCarrera(""); setErrors((p) => ({ ...p, tipo: "", carrera: "" })); }}>📚 Carreras de Pregrado</button>
              </div>
              {errors.tipo && <span className="field-err">{errors.tipo}</span>}
            </div>
            {tipo === "Carreras de Pregrado" && (
              <div className="field">
                <label className="field-label">Selecciona tu carrera *</label>
                <select className={`input${errors.carrera ? " input-error" : ""}`} value={carrera} onChange={(e) => { setCarrera(e.target.value); setErrors((p) => ({ ...p, carrera: "" })); }}>
                  <option value="">Selecciona una carrera</option>
                  {CARRERAS_PREGRADO.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.carrera && <span className="field-err">{errors.carrera}</span>}
              </div>
            )}
            <div className="field">
              <label className="field-label">Semestre actual *</label>
              <select className={`input${errors.semestre ? " input-error" : ""}`} value={semestre} onChange={(e) => { setSemestre(e.target.value); setErrors((p) => ({ ...p, semestre: "" })); }}>
                <option value="">Selecciona tu semestre</option>
                {["1°","2°","3°","4°","5°","6°","7°","8°","9°","10°"].map((s) => (
                  <option key={s} value={s}>{s} Semestre</option>
                ))}
              </select>
              {errors.semestre && <span className="field-err">{errors.semestre}</span>}
            </div>
            <div className="field">
              <label className="field-label">Correo electrónico *</label>
              <input className={`input${errors.correo ? " input-error" : ""}`} name="correo" type="email" placeholder="Ej. juan@unipamplona.edu.co" value={datos.correo} onChange={cambiar} />
              {errors.correo && <span className="field-err">{errors.correo}</span>}
            </div>
            <div className="field">
              <label className="field-label">Cédula / Documento *</label>
              <input className={`input${errors.id ? " input-error" : ""}`} name="id" type="number" placeholder="Ej. 1090123456" value={datos.id} onChange={cambiar} />
              {errors.id && <span className="field-err">{errors.id}</span>}
              <span className="field-hint">🔒 No modificable después del registro</span>
            </div>
            <Alert alerta={alerta} />
            <button type="submit" className="btn btn-navy btn-block" disabled={loading}>{loading ? "Creando cuenta..." : "Crear cuenta y generar código"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── ADMIN PANEL ──
function AdminPage({ usuario, setVista }) {
  const { cola, refrescar: refrescarCola } = useColaRealtime();
  const [estudiantes, setEstudiantes] = useState([]);
  const [tab, setTab] = useState("overview");
  const [loadingEst, setLoadingEst] = useState(false);
  const [bloqueandoId, setBloqueandoId] = useState(null);
  const { alerta, mostrar } = useAlerta();

  const cargarEstudiantes = useCallback(async () => {
    setLoadingEst(true);
    const { data, error } = await supabase.from("estudiantes").select("*").order("created_at", { ascending: false });
    if (error) {
      mostrar(`Error al cargar estudiantes: ${error.message}`, "error");
    } else {
      setEstudiantes(data || []);
    }
    setLoadingEst(false);
  }, []);

  useEffect(() => { cargarEstudiantes(); }, [cargarEstudiantes]);

  const toggleBloqueo = async (est) => {
    setBloqueandoId(est.id);
    const estaActivo = est.bloqueado !== true;
    const nuevoEstado = !estaActivo;
    const { error } = await supabase
      .from("estudiantes")
      .update({ bloqueado: nuevoEstado })
      .eq("id", est.id);
    if (error) {
      mostrar(`Error al actualizar estado: ${error.message}`, "error");
    } else {
      mostrar(`Estudiante ${nuevoEstado ? "bloqueado" : "activado"} correctamente.`, "success");
      cargarEstudiantes();
    }
    setBloqueandoId(null);
  };

  // Estadísticas
  const totalEstudiantes = estudiantes.filter(e => e.id !== ADMIN_ID).length;
  const activos = estudiantes.filter(e => e.id !== ADMIN_ID && !e.bloqueado).length;
  const bloqueados = estudiantes.filter(e => e.id !== ADMIN_ID && e.bloqueado === true).length;
  const enCola = cola.length;

  // Carreras
  const carrerasCount = {};
  estudiantes.filter(e => e.id !== ADMIN_ID).forEach(e => {
    const c = e.carrera || "Sin carrera";
    carrerasCount[c] = (carrerasCount[c] || 0) + 1;
  });
  const carrerasArr = Object.entries(carrerasCount).sort((a, b) => b[1] - a[1]);

  return (
    <div className="page">
      <div className="admin-page">
        <Alert alerta={alerta} />

        {/* HERO */}
        <div className="admin-hero">
          <div>
            <h2>🛡️ Panel de Administrador</h2>
            <p>Bienvenido, {usuario.nombre?.split(" ")[0]}. Tienes acceso completo al sistema COMET.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <span className="admin-badge-hero">⚙️ ADMINISTRADOR</span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem" }}>Doc: {usuario.id}</span>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card stat-orange">
            <div className="stat-icon">👥</div>
            <div className="stat-val">{totalEstudiantes}</div>
            <div className="stat-label">Estudiantes registrados</div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-icon">✅</div>
            <div className="stat-val">{activos}</div>
            <div className="stat-label">Estudiantes activos</div>
          </div>
          <div className="stat-card stat-blue">
            <div className="stat-icon">🚶</div>
            <div className="stat-val">{enCola}</div>
            <div className="stat-label">En cola ahora</div>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-icon">🔒</div>
            <div className="stat-val">{bloqueados}</div>
            <div className="stat-label">Bloqueados</div>
          </div>
        </div>

        {/* TABS */}
        <div className="admin-tabs">
          {[["overview", "📊 Resumen"], ["cola", "🚶 Cola en tiempo real"], ["estudiantes", "👤 Estudiantes"], ["carreras", "📚 Carreras"]].map(([key, label]) => (
            <button key={key} className={`admin-tab${tab === key ? " active" : ""}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="admin-grid">
            <div className="card card-sm">
              <div className="sec-title" style={{ marginBottom: "1rem" }}>🚶 Cola activa</div>
              {cola.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>Cola vacía</div>
              ) : (
                <table className="realtime-cola-table">
                  <thead>
                    <tr><th>#</th><th>Nombre</th><th>Código</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {cola.slice(0, 8).map((e, i) => (
                      <tr key={e.id}>
                        <td><b style={{ color: i === 0 ? "var(--orange)" : "inherit" }}>{i + 1}</b></td>
                        <td style={{ fontWeight: 600 }}>{e.nombre}</td>
                        <td><span className="mono">{e.identificacion}</span></td>
                        <td><span className={`badge ${i === 0 ? "badge-green" : "badge-orange"}`}>{i === 0 ? "Atendiendo" : "Espera"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {cola.length > 8 && <div style={{ textAlign: "center", marginTop: 8, fontSize: "0.8rem", color: "var(--text-muted)" }}>+{cola.length - 8} más en cola</div>}
            </div>
            <div className="card card-sm">
              <div className="sec-title" style={{ marginBottom: "1rem" }}>📚 Top carreras</div>
              {carrerasArr.slice(0, 8).map(([carrera, count]) => (
                <div key={carrera} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-light)", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-secondary)", flex: 1, marginRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{carrera}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: `${Math.min(80, count * 12)}px`, height: 6, background: "var(--orange)", borderRadius: 3, opacity: 0.7 }} />
                    <span style={{ fontWeight: 700, minWidth: 24, textAlign: "right" }}>{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COLA EN TIEMPO REAL */}
        {tab === "cola" && (
          <div className="card card-sm">
            {/* Banner del estudiante siendo atendido */}
            {cola.length > 0 && (
              <div style={{
                background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                border: "1.5px solid #86efac",
                borderRadius: "var(--r-md)",
                padding: "1rem 1.5rem",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                  <span style={{ fontSize: "2rem" }}>🍽️</span>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#15803d", marginBottom: 2 }}>Siendo atendido ahora</div>
                    <div style={{ fontFamily: "Sora", fontWeight: 800, fontSize: "1.25rem", color: "#14532d" }}>
                      {cola[0].nombre || cola[0]["nombre"] || "—"}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#166534", marginTop: 2 }}>
                      Doc: <span className="mono">{cola[0].identificacion || cola[0].user_id}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-success btn-sm"
                  style={{ minWidth: 130 }}
                  onClick={async () => {
                    const { error } = await ColaService.salirDeCola(cola[0].user_id);
                    if (error) mostrar("Error al marcar como atendido.", "error");
                    else { mostrar(`✅ ${cola[0].nombre} atendido y removido de la cola.`, "success"); refrescarCola(); }
                  }}
                >✅ Marcar atendido</button>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <div className="sec-title" style={{ marginBottom: 2 }}>Cola en tiempo real</div>
                <div className="sec-sub">{cola.length} {cola.length === 1 ? "persona" : "personas"} en espera</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="dot dot-green" />
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>En vivo</span>
                <button className="btn btn-ghost btn-sm" onClick={refrescarCola}>↻ Actualizar</button>
              </div>
            </div>
            {cola.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "3rem", opacity: 0.2, marginBottom: 12 }}>🏁</div>
                <p style={{ fontWeight: 600 }}>Cola vacía</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="realtime-cola-table" style={{ width: "100%" }}>
                  <thead>
                    <tr><th style={{ width: 50 }}>#</th><th>Nombre</th><th>Documento</th><th>Estado</th><th>Ingreso</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {cola.map((e, i) => {
                      const nombreMostrar = e.nombre || e["nombre"] || "Sin nombre";
                      const docMostrar = e.identificacion || String(e.user_id || "—");
                      return (
                        <tr key={e.id || e.user_id} style={{ background: i === 0 ? "rgba(34,197,94,0.05)" : "transparent" }}>
                          <td><span style={{ fontFamily: "Sora", fontWeight: 800, fontSize: "1rem", color: i === 0 ? "var(--orange)" : "var(--text-primary)" }}>{String(i + 1).padStart(2, "0")}</span></td>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{nombreMostrar}</div>
                          </td>
                          <td><span className="mono" style={{ fontSize: "0.85rem" }}>{docMostrar}</span></td>
                          <td>
                            <span className={`badge ${i === 0 ? "badge-green" : "badge-orange"}`}>
                              {i === 0 && <span className="dot dot-green" />}
                              {i === 0 ? "Siendo atendido" : "En espera"}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{e.created_at ? new Date(e.created_at).toLocaleTimeString("es-CO") : "—"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {i < 5 && (
                                <button
                                  className="btn btn-success btn-sm"
                                  style={{ whiteSpace: "nowrap" }}
                                  onClick={async () => {
                                    const nombre = nombreMostrar;
                                    const { error } = await ColaService.salirDeCola(e.user_id);
                                    if (error) mostrar("Error al marcar como atendido.", "error");
                                    else { mostrar(`✅ ${nombre} atendido.`, "success"); refrescarCola(); }
                                  }}
                                >✅ Atendido</button>
                              )}
                              <button
                                className="btn btn-danger-ghost btn-sm"
                                style={{ whiteSpace: "nowrap" }}
                                onClick={async () => {
                                  const nombre = nombreMostrar;
                                  const { error } = await ColaService.salirDeCola(e.user_id);
                                  if (error) mostrar("Error al sacar de cola.", "error");
                                  else { mostrar(`${nombre} removido de la cola.`, "success"); refrescarCola(); }
                                }}
                              >✕ Sacar</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ESTUDIANTES */}
        {tab === "estudiantes" && (
          <div className="card card-sm">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <div className="sec-title" style={{ marginBottom: 2 }}>Gestión de estudiantes</div>
                <div className="sec-sub">{totalEstudiantes} registrados · {activos} activos · {bloqueados} bloqueados</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={cargarEstudiantes} disabled={loadingEst}>↻ Actualizar</button>
            </div>
            {loadingEst ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Cargando...</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr><th>#</th><th>Nombre</th><th>Documento</th><th>Carrera</th><th>Semestre</th><th>Correo</th><th>Estado</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {estudiantes.filter(e => e.id !== ADMIN_ID).map((e, i) => (
                      <tr key={e.id}>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {e.foto
                              ? <img src={e.foto} alt="" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
                              : <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--navy)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>{(e.nombre || "?")[0]}</div>
                            }
                            {e.nombre}
                          </div>
                        </td>
                        <td><span className="mono">{e.id}</span></td>
                        <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.carrera}</td>
                        <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{e.semestre || "—"}</td>
                        <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{e.correo}</td>
                        <td>
                          <span className={`badge ${e.bloqueado === true ? "badge-red" : "badge-green"}`}>
                            {e.bloqueado === true ? "🔒 Bloqueado" : "✅ Activo"}
                          </span>
                        </td>
                        <td>
                          {/* FUNCIÓN DESACTIVADA TEMPORALMENTE - NO ELIMINAR */}
                          <button
                            className={`btn btn-sm ${e.bloqueado === true ? "btn-success" : "btn-danger-ghost"}`}
                            onClick={() => toggleBloqueo(e)}
                            disabled={true}
                            style={{ opacity: 0.3, cursor: "not-allowed", pointerEvents: "none" }}
                          >
                            {e.bloqueado === true ? "Activar" : "Bloquear"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CARRERAS */}
        {tab === "carreras" && (
          <div className="card card-sm">
            <div className="sec-title" style={{ marginBottom: "1.25rem" }}>Distribución por carreras</div>
            {carrerasArr.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Sin datos</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
                {carrerasArr.map(([carrera, count]) => {
                  const pct = totalEstudiantes > 0 ? Math.round((count / totalEstudiantes) * 100) : 0;
                  return (
                    <div key={carrera} style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "#fafbfc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{carrera}</span>
                        <span style={{ fontFamily: "Sora", fontWeight: 800, color: "var(--orange)" }}>{count}</span>
                      </div>
                      <div style={{ height: 6, background: "var(--border)", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: "var(--orange)", borderRadius: 3, transition: "width 0.5s" }} />
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>{pct}% del total</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN MENU ──
function MenuPage({ usuario, setVista }) {
  const { cola } = useColaRealtime();
  const miEntrada = cola.find(e => e.user_id == usuario.id);
  const enCola = !!miEntrada;
  const posicion = enCola ? cola.findIndex(e => e.user_id == usuario.id) + 1 : null;
  const nombre = usuario.nombre?.split(" ")[0] || "Usuario";

  return (
    <div className="page">
      <div className="menu-page">
        <div className="menu-header">
          <h2>Hola, {nombre} 👋</h2>
          <p>{usuario.carrera} · {usuario.correo}</p>
        </div>
        {enCola && (
          <div className="menu-status-bar" onClick={() => setVista("fila")}>
            <span className="dot dot-green" />
            <span className="label">Estás en la fila · Posición #{posicion} · Toca para ver detalles</span>
            <span className="arrow">›</span>
          </div>
        )}
        <div className="menu-grid">
          {[
            { icon: "📺", title: "Cola en tiempo real", desc: "Ver la cola del comedor en vivo", vista: "fila", accent: true },
            { icon: "👤", title: "Mi perfil", desc: "Ver información y código de barras", vista: "perfil" },
            { icon: "✏️", title: "Editar datos", desc: "Actualiza tu información personal", vista: "editar" },
          ].map((item) => (
            <div key={item.vista} className="menu-card" onClick={() => setVista(item.vista)}>
              <div className="menu-card-accent" />
              <div className="menu-card-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="menu-quick">
          <div className="quick-stat">
            <div className="qs-label">En fila ahora</div>
            <div className="qs-value">{cola.length}</div>
            <div className="qs-sub">personas esperando</div>
          </div>
          <div className="quick-stat">
            <div className="qs-label">Tiempo estimado</div>
            <div className="qs-value">{Math.round(cola.length * TIEMPO_POR_PERSONA * 60)}</div>
            <div className="qs-sub">segundos de espera</div>
          </div>
        </div>

        {/* COLA EN TIEMPO REAL - parte inferior */}
        <div className="card card-sm" style={{ marginTop: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <div className="sec-title" style={{ marginBottom: 2 }}>🚶 Cola en tiempo real</div>
              <div className="sec-sub">{cola.length === 0 ? "Sin personas en espera" : `${cola.length} ${cola.length === 1 ? "persona" : "personas"} esperando`}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="dot dot-green" />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>En vivo</span>
            </div>
          </div>
          {cola.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              <span style={{ fontSize: "2rem", display: "block", opacity: 0.25, marginBottom: 8 }}>🏁</span>
              Cola vacía por ahora
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {cola.map((e, i) => {
                const nombreMostrar = e.nombre || e["nombre"] || "Sin nombre";
                const docMostrar = e.identificacion || String(e.user_id || "—");
                return (
                  <div
                    key={e.id || e.user_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      borderRadius: "var(--r-sm)",
                      background: e.user_id == usuario.id
                        ? "rgba(245,124,32,0.08)"
                        : i === 0
                        ? "rgba(34,197,94,0.07)"
                        : "#fafbfc",
                      border: e.user_id == usuario.id
                        ? "1.5px solid rgba(245,124,32,0.3)"
                        : i === 0
                        ? "1.5px solid rgba(34,197,94,0.25)"
                        : "1px solid var(--border-light)",
                    }}
                  >
                    <span style={{
                      fontFamily: "Sora",
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: i === 0 ? "var(--success)" : "var(--text-muted)",
                      minWidth: 28,
                      textAlign: "center"
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                        {nombreMostrar}
                        {e.user_id == usuario.id && (
                          <span className="badge badge-orange" style={{ fontSize: "0.65rem", padding: "1px 7px" }}>Tú</span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 1 }}>
                        Doc: <span className="mono">{docMostrar}</span>
                      </div>
                    </div>
                    <span className={`badge ${i === 0 ? "badge-green" : "badge-orange"}`} style={{ fontSize: "0.72rem" }}>
                      {i === 0 ? <><span className="dot dot-green" style={{ marginRight: 4 }} />Atendiendo</> : "En espera"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {cola.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "0.75rem" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setVista("fila")}>Ver detalle completo →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── QUEUE PAGE (visualización de cola + unirse) ──
function QueuePage({ usuario, setVista }) {
  const { cola, refrescar } = useColaRealtime();
  const { alerta, mostrar } = useAlerta();
  const [loading, setLoading] = useState(false);
  const [escaneado, setEscaneado] = useState(false);

  const miEntrada = cola.find(e => e.user_id == usuario.id);
  const enCola = !!miEntrada;
  const posicion = enCola ? cola.findIndex(e => e.user_id == usuario.id) + 1 : null;
  const tiempoSegs = posicion ? Math.round((posicion - 1) * TIEMPO_POR_PERSONA * 60) : 0;

  const [segs, setSegs] = useState(tiempoSegs);
  useEffect(() => { setSegs(tiempoSegs); }, [tiempoSegs]);
  useEffect(() => {
    if (!enCola || segs <= 0) return;
    const t = setInterval(() => setSegs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [enCola, segs]);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const ingresar = async () => {
    setLoading(true);
    const { error, yaEstaba } = await ColaService.agregarACola(usuario);
    if (error) { mostrar(error.message, "error"); }
    else if (yaEstaba) { mostrar("Ya estás en la cola.", "success"); }
    else { mostrar("Ingresaste a la fila exitosamente.", "success"); refrescar(); }
    setLoading(false);
  };

  const salir = async () => {
    setLoading(true);
    const { error } = await ColaService.salirDeCola(usuario.id);
    if (error) { mostrar(error.message, "error"); }
    else { mostrar("Saliste de la fila.", "success"); refrescar(); }
    setLoading(false);
  };

  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const prog = posicion && cola.length > 0 ? Math.max(0.05, 1 - (posicion - 1) / cola.length) : 0;

  return (
    <div className="page">
      <div className="queue-page">
        <div className="page-header" style={{ marginBottom: "1.5rem" }}>
          <button className="back-btn" style={{ marginTop: 4 }} onClick={() => setVista("menu")}>← Volver</button>
          <div className="page-header-text">
            <h2>Cola en tiempo real</h2>
            <p>Visualización y gestión de tu turno en el comedor</p>
          </div>
        </div>
        <Alert alerta={alerta} />

        {enCola ? (
          <>
            <div className="queue-top">
              <div className="card group-card">
                <div className="group-label">Tu posición</div>
                <div className="group-num">{posicion}</div>
                <div className="group-pos">{posicion === 1 ? "¡Es tu turno!" : `${posicion - 1} persona${posicion - 1 !== 1 ? "s" : ""} delante`}</div>
                <span className={`badge ${posicion === 1 ? "badge-green" : "badge-orange"}`}>
                  <span className={`dot ${posicion === 1 ? "dot-green" : "dot-orange"}`} />
                  {posicion === 1 ? "Dirígete a la ventanilla" : "En espera"}
                </span>
              </div>
              <div className="card timer-card">
                <div className="group-label">Tiempo estimado</div>
                <div className="timer-ring-wrap">
                  <svg width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
                    <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--orange)" strokeWidth="6" strokeDasharray={circ} strokeDashoffset={circ * (1 - prog)} strokeLinecap="round" transform="rotate(-90 48 48)" style={{ transition: "stroke-dashoffset 0.5s" }} />
                  </svg>
                  <div className="timer-inner">
                    <div className="timer-num">{fmt(segs)}</div>
                    <div className="timer-unit">min:seg</div>
                  </div>
                </div>
                <button className="btn btn-danger-ghost btn-sm btn-block mt-1" onClick={salir} disabled={loading}>Salir de la fila</button>
              </div>
            </div>
            <div className="queue-bottom">
              <QueuePanel cola={cola} miId={usuario.id} />
              <div className="card notice-card">
                <div className="notice-title"><span>⚠️</span> Aviso importante</div>
                <p>Permanece atento a tu posición. Si no te presentas cuando sea tu turno, perderás tu lugar en la fila.</p>
                <div className="divider" />
                <div className="sec-title" style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>Próximos en fila</div>
                {cola.slice(0, 5).map((u, i) => (
                  <div className="info-row" key={u.id} style={{ fontSize: "0.8rem" }}>
                    <span className="info-k">#{i + 1}</span>
                    <span className="info-v">{u.nombre} · <span className="mono">{u.identificacion}</span></span>
                  </div>
                ))}
                <div className="divider" />
                <div className="info-row"><span className="info-k">Tu documento</span><span className="info-v mono">{usuario.id}</span></div>
                <div className="info-row"><span className="info-k">Nombre</span><span className="info-v">{usuario.nombre}</span></div>
                <div className="info-row" style={{ borderBottom: "none" }}><span className="info-k">Programa</span><span className="info-v">{usuario.carrera}</span></div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🚶‍♂️</div>
              <h3 style={{ fontFamily: "Sora", fontSize: "1.1rem", marginBottom: 8 }}>Unirte a la fila</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>No estás en la fila. ¡Toma tu turno ahora!</p>
              <div className="barcode-outer" style={{ marginBottom: "1rem" }}>
                <Barcode id={usuario.id} height={60} />
              </div>
              {!escaneado ? (
                <button className="btn btn-orange btn-block" onClick={() => setEscaneado(true)}>📱 Escanear código de barras</button>
              ) : (
                <button className="btn btn-navy btn-block" onClick={ingresar} disabled={loading}>{loading ? "Ingresando..." : "🚶 Ingresar a la fila"}</button>
              )}
            </div>
            <QueuePanel cola={cola} miId={null} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── PROFILE ──
function ProfilePage({ usuario, setVista }) {
  const iniciales = usuario.nombre?.split(" ").slice(0, 2).map((p) => p[0]).join("") || "?";
  const esAdmin = parseInt(usuario.id) === ADMIN_ID;
  return (
    <div className="page">
      <div className="profile-page">
        <div className="page-header">
          <button className="back-btn" style={{ marginTop: 4 }} onClick={() => setVista(esAdmin ? "admin" : "menu")}>← Volver</button>
          <div className="page-header-text"><h2>Mi perfil</h2><p>Información de tu cuenta</p></div>
        </div>
        <div className="card card-sm">
          <div className="profile-avatar-row">
            {usuario.foto ? (
              <img src={usuario.foto} alt="Foto de perfil" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border)", flexShrink: 0 }} />
            ) : (
              <div className={`avatar-circle${esAdmin ? " avatar-admin" : ""}`}>{iniciales}</div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{usuario.nombre}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>{esAdmin ? "Administrador del sistema" : usuario.carrera}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <span className="badge badge-green">✓ Activo</span>
                {esAdmin && <span className="badge badge-purple">🛡️ Admin</span>}
              </div>
            </div>
          </div>
          <div className="divider" style={{ margin: "0.75rem 0 1.25rem" }} />
          {[["Documento / ID", usuario.id], ["Nombre completo", usuario.nombre], ["Programa", esAdmin ? "Administrador" : usuario.carrera], ["Semestre", esAdmin ? "—" : (usuario.semestre || "—")], ["Correo electrónico", usuario.correo], ["Teléfono", usuario.telefono || "—"], ["Rol", esAdmin ? "ADMINISTRADOR" : (usuario.rol || "Estudiante")], ["Registro", usuario.created_at ? new Date(usuario.created_at).toLocaleDateString("es-CO") : "—"]].map(([k, v]) => (
            <div className="info-row" key={k}><span className="info-k">{k}</span><span className="info-v">{String(v)}</span></div>
          ))}
          <div className="flex-row mt-2">
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setVista("editar")}>✏️ Editar datos</button>
            {esAdmin
              ? <button className="btn btn-purple" style={{ flex: 1 }} onClick={() => setVista("admin")}>🛡️ Panel Admin</button>
              : <button className="btn btn-navy" style={{ flex: 1 }} onClick={() => setVista("fila")}>📺 Ver cola</button>
            }
          </div>
        </div>
        {!esAdmin && (
          <div className="card card-sm">
            <div className="sec-title" style={{ marginBottom: 4 }}>Código de identificación</div>
            <div className="sec-sub" style={{ marginBottom: "1.25rem" }}>Presenta este código en la ventanilla del comedor</div>
            <div className="barcode-outer">
              <Barcode id={usuario.id} height={72} />
            </div>
            <div className="note">
              <span>🔒</span>
              <span>Este código es único e intransferible. No compartas tu documento con terceros.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── EDIT ──
function EditPage({ usuario, onUpdate, setVista }) {
  const [datos, setDatos] = useState({ nombre: usuario.nombre || "", telefono: usuario.telefono || usuario["teléfono"] || "", correo: usuario.correo || usuario["Correo"] || "", rol: usuario.rol || "ESTUDIANTE" });
  const [semestre, setSemestre] = useState(usuario.semestre || "");
  const [loading, setLoading] = useState(false);
  const [fotoLoading, setFotoLoading] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(usuario.foto || null);
  const fileInputRef = useRef(null);
  const { alerta, mostrar } = useAlerta();
  const esAdmin = parseInt(usuario.id) === ADMIN_ID;
  const cambiar = (e) => setDatos((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) return mostrar("Solo se permiten imágenes JPG, PNG, WEBP o GIF.", "error");
    if (file.size > 2 * 1024 * 1024) return mostrar("La imagen no puede superar 2 MB.", "error");

    setFotoLoading(true);
    const objectUrl = URL.createObjectURL(file);
    setFotoPreview(objectUrl);

    const ext = file.name.split(".").pop();
    const path = `fotos/${usuario.id}_${Date.now()}.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error("No se pudo obtener la URL pública.");

      const { error: dbError } = await supabase
        .from("estudiantes")
        .update({ foto: publicUrl })
        .eq("id", usuario.id);

      if (dbError) throw dbError;

      setFotoPreview(publicUrl);
      onUpdate({ ...usuario, foto: publicUrl });
      mostrar("Foto de perfil actualizada correctamente.", "success");
    } catch (err) {
      mostrar(`Error al subir foto: ${err.message}`, "error");
      setFotoPreview(usuario.foto || null);
    }
    setFotoLoading(false);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!datos.nombre || !datos.correo) return mostrar("Completa todos los campos.", "error");
    setLoading(true);

    // Solo enviamos los campos que existen en Supabase con sus nombres exactos
    const cambios = {
      nombre: datos.nombre.toUpperCase().trim(),
      "teléfono": datos.telefono.trim(),
      "Correo": datos.correo.toLowerCase().trim(),
      rol: datos.rol,
      semestre: semestre || null,
    };

    const { error } = await supabase
      .from("estudiantes")
      .update(cambios)
      .eq("id", usuario.id);

    if (error) {
      mostrar(error.message, "error");
    } else {
      // Actualizar estado local con los nuevos datos
      const act = {
        ...usuario,
        nombre: cambios.nombre,
        telefono: cambios["teléfono"],
        "teléfono": cambios["teléfono"],
        correo: cambios["Correo"],
        "Correo": cambios["Correo"],
        rol: cambios.rol,
        semestre: cambios.semestre,
      };
      mostrar("Datos actualizados correctamente.", "success");
      setTimeout(() => { onUpdate(act); setVista(esAdmin ? "admin" : "perfil"); }, 1400);
    }
    setLoading(false);
  };

  const iniciales = usuario.nombre?.split(" ").slice(0, 2).map((p) => p[0]).join("") || "?";

  return (
    <div className="page">
      <div className="edit-page">
        <div className="page-header">
          <button className="back-btn" style={{ marginTop: 4 }} onClick={() => setVista("perfil")}>← Volver</button>
          <div className="page-header-text"><h2>Editar perfil</h2><p>Actualiza tu información personal</p></div>
        </div>

        {/* FOTO DE PERFIL */}
        <div className="card card-sm" style={{ marginBottom: "1rem" }}>
          <div className="sec-title" style={{ marginBottom: "1rem" }}>📷 Foto de perfil</div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Foto de perfil"
                  style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "2.5px solid var(--border)" }}
                />
              ) : (
                <div className={`avatar-circle${esAdmin ? " avatar-admin" : ""}`} style={{ width: 72, height: 72, fontSize: "1.4rem" }}>
                  {iniciales}
                </div>
              )}
              {fotoLoading && (
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(15,27,45,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontSize: "0.7rem" }}>...</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.6rem" }}>
                Sube una foto JPG, PNG o WEBP. Máximo 2 MB.
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={handleFotoChange}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={fotoLoading}
              >
                {fotoLoading ? "Subiendo..." : fotoPreview ? "🔄 Cambiar foto" : "📷 Subir foto"}
              </button>
              {fotoPreview && !fotoLoading && (
                <button
                  type="button"
                  className="btn btn-danger-ghost btn-sm"
                  style={{ marginLeft: 8 }}
                  onClick={async () => {
                    const { error } = await supabase.from("estudiantes").update({ foto: null }).eq("id", usuario.id);
                    if (!error) { setFotoPreview(null); onUpdate({ ...usuario, foto: null }); mostrar("Foto eliminada.", "success"); }
                    else mostrar("Error al eliminar foto.", "error");
                  }}
                >
                  🗑️ Quitar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DATOS */}
        <div className="card card-sm">
          <div className="field">
            <label className="field-label">Documento (no editable)</label>
            <input className="input" value={usuario.id} disabled style={{ opacity: 0.6 }} />
          </div>
          <form onSubmit={guardar}>
            {[["nombre", "Nombre completo", "text", "Tu nombre"], ["telefono", "Teléfono", "tel", "Tu teléfono"], ["correo", "Correo electrónico", "email", "Tu correo"]].map(([n, l, t, ph]) => (
              <div className="field" key={n}>
                <label className="field-label">{l}</label>
                <input className="input" type={t} name={n} placeholder={ph} value={datos[n]} onChange={cambiar} required={n !== "telefono"} />
              </div>
            ))}
            {!esAdmin && (
              <>
                <div className="field">
                  <label className="field-label">Semestre actual</label>
                  <select className="input" value={semestre} onChange={(e) => setSemestre(e.target.value)}>
                    <option value="">— Sin especificar —</option>
                    {["1°","2°","3°","4°","5°","6°","7°","8°","9°","10°"].map((s) => (
                      <option key={s} value={s}>{s} Semestre</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Rol</label>
                  <select className="input" name="rol" value={datos.rol} onChange={cambiar}>
                    <option value="ESTUDIANTE">Estudiante</option>
                    <option value="DOCENTE">Docente</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                  </select>
                </div>
              </>
            )}
            <Alert alerta={alerta} />
            <div className="flex-row">
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setVista("perfil")}>Cancelar</button>
              <button type="submit" className="btn btn-navy" style={{ flex: 2 }} disabled={loading}>{loading ? "Guardando..." : "💾 Guardar cambios"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── APP ROOT ──
export default function App() {
  const [vista, setVista] = useState("login");
  const [usuario, setUsuario] = useState(null);

  // Cargar sesión guardada
  useEffect(() => {
    try {
      const s = localStorage.getItem("sesion_comet");
      if (s) {
        const u = normalizeUsuario(JSON.parse(s));
        setUsuario(u);
        setVista(parseInt(u.id) === ADMIN_ID ? "admin" : "menu");
      }
    } catch {}
  }, []);

  // Suscripción en tiempo real: si el perfil del usuario cambia en Supabase,
  // se actualiza automáticamente en la app sin necesidad de recargar
  useEffect(() => {
    if (!usuario?.id) return;
    const channel = supabase
      .channel("perfil_realtime_" + usuario.id)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "estudiantes", filter: `id=eq.${usuario.id}` },
        (payload) => {
          const nuevo = normalizeUsuario({ ...usuario, ...payload.new });
          setUsuario(nuevo);
          localStorage.setItem("sesion_comet", JSON.stringify(nuevo));
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [usuario?.id]);

  const login = (u) => {
    setUsuario(u);
    localStorage.setItem("sesion_comet", JSON.stringify(u));
    setVista(parseInt(u.id) === ADMIN_ID ? "admin" : "menu");
  };
  const logout = () => { localStorage.removeItem("sesion_comet"); setUsuario(null); setVista("login"); };
  const update = (u) => { setUsuario(u); localStorage.setItem("sesion_comet", JSON.stringify(u)); };

  const iniciales = usuario?.nombre?.split(" ").slice(0, 2).map((p) => p[0]).join("") || "";
  const esAdmin = usuario && parseInt(usuario.id) === ADMIN_ID;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {vista !== "login" && vista !== "registro" && (
        <nav className="nav">
          <div className="nav-brand">
            <img src="data:image/jpeg;base64,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" alt="COMET" style={{ width: "36px", height: "36px", borderRadius: "10px", objectFit: "cover" }} />
            <div>
              <div className="nav-title">COMET</div>
              <div className="nav-sub">Servicio de Comedor Estudiantil UP</div>
            </div>
          </div>
          <div className="nav-right">
            {usuario && (
              <>
                {esAdmin && <span className="nav-admin-badge">🛡️ Admin</span>}
                <div className="nav-avatar" onClick={() => setVista("perfil")} title="Mi perfil"
                  style={esAdmin ? { background: "linear-gradient(135deg, #7c3aed, #6d28d9)", border: "1.5px solid rgba(167,139,250,0.4)", overflow: "hidden" } : { overflow: "hidden" }}
                >
                  {usuario.foto
                    ? <img src={usuario.foto} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    : iniciales
                  }
                </div>
                <span className="nav-user-name" style={{ cursor: "pointer" }} onClick={() => setVista("perfil")}>
                  {esAdmin ? "Administrador" : "Mi perfil"}
                </span>
                {esAdmin && (
                  <button className="btn btn-sm btn-purple" onClick={() => setVista("admin")}>Panel Admin</button>
                )}
                <button className="btn btn-ghost btn-sm" style={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }} onClick={logout}>Salir</button>
              </>
            )}
          </div>
        </nav>
      )}

      {vista === "login" && <LoginPage onLogin={login} onRegister={() => setVista("registro")} />}
      {vista === "registro" && <RegisterPage onSuccess={login} onBack={() => setVista("login")} />}
      {vista === "admin" && usuario && esAdmin && <AdminPage usuario={usuario} setVista={setVista} />}
      {vista === "menu" && usuario && !esAdmin && <MenuPage usuario={usuario} setVista={setVista} />}
      {vista === "fila" && usuario && !esAdmin && <QueuePage usuario={usuario} setVista={setVista} />}
      {vista === "perfil" && usuario && <ProfilePage usuario={usuario} setVista={setVista} />}
      {vista === "editar" && usuario && <EditPage usuario={usuario} onUpdate={update} setVista={setVista} />}
    </>
  );
}
