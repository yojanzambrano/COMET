import { useState, useEffect, useCallback, useRef } from "react";

const TIEMPO_POR_PERSONA = 0.208; // 12.5 segundos en minutos
const CARRERAS_PREGRADO = [
  "Ingeniería de Sistemas",
  "Ingeniería Civil",
  "Ingeniería Electrónica",
  "Ingeniería Mecánica",
  "Ingeniería Industrial",
  "ingeniería mecatrónica",
  "Administración de Empresas",
  
  "Contaduría Pública",
  "Derecho",
  "Psicología",
  "Medicina",
  "Enfermería",
  "Arquitectura",
  "Diseño Gráfico",
  "Comunicación Social",
  "Educación",
  "Matemáticas",
  "Física",
  "Química",
  "Biología",
  "Historia",
  "Filosofía",
  "Literatura",
  "Idiomas",
  "Economía",
  "Sociología",
  "Antropología",
  "Geografía",
  "Ciencias Políticas",
  "Relaciones Internacionales",
  "Trabajo Social"
];

const supabase = {
  from: (table) => ({
    select: () => ({
      eq: (col, val) => ({
        single: async () => {
          try {
            const stored = JSON.parse(localStorage.getItem(`${table}_data`) || "[]");
            const match = stored.find((r) => r[col] == val);
            return match ? { data: match, error: null } : { data: null, error: { message: "No encontrado" } };
          } catch { return { data: null, error: { message: "Error" } }; }
        },
      }),
    }),
    insert: async ([item]) => {
      try {
        const stored = JSON.parse(localStorage.getItem(`${table}_data`) || "[]");
        if (stored.find((r) => r.id == item.id)) return { error: { message: "El documento ya está registrado." } };
        stored.push(item);
        localStorage.setItem(`${table}_data`, JSON.stringify(stored));
        return { error: null };
      } catch { return { error: { message: "Error al guardar." } }; }
    },
    update: (payload) => ({
      eq: async (col, val) => {
        try {
          const stored = JSON.parse(localStorage.getItem(`${table}_data`) || "[]");
          const idx = stored.findIndex((r) => r[col] == val);
          if (idx !== -1) { stored[idx] = { ...stored[idx], ...payload }; localStorage.setItem(`${table}_data`, JSON.stringify(stored)); }
          return { error: null };
        } catch { return { error: { message: "Error al actualizar." } }; }
      },
    }),
  }),
};

const FilaService = {
  getFila: () => { try { return JSON.parse(localStorage.getItem("fila_comet") || "[]"); } catch { return []; } },
  guardarFila: (fila) => localStorage.setItem("fila_comet", JSON.stringify(fila)),
  agregarAFila: (usuario) => {
    const fila = FilaService.getFila().filter((u) => u.id !== usuario.id);
    const entrada = { id: usuario.id, nombre: usuario.nombre, estado: "EN_FILA", timestamp: Date.now(), ultimaActividad: Date.now() };
    fila.push(entrada);
    FilaService.guardarFila(fila);
    return entrada;
  },
  actualizarEstado: (id, estado) => {
    const fila = FilaService.getFila().map((u) => u.id == id ? { ...u, estado, ultimaActividad: Date.now() } : u);
    FilaService.guardarFila(fila);
  },
  limpiarInactivos: () => {
    const ahora = Date.now();
    const fila = FilaService.getFila().map((u) => u.estado === "EN_FILA" && ahora - u.ultimaActividad > TIMEOUT_INACTIVO ? { ...u, estado: "INACTIVO" } : u);
    FilaService.guardarFila(fila);
    return fila;
  },
  getFilaActiva: () => FilaService.limpiarInactivos().filter((u) => u.estado === "EN_FILA"),
};

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

function useFila(usuarioId) {
  const [filaActiva, setFilaActiva] = useState([]);
  const [miEntrada, setMiEntrada] = useState(null);
  const refrescar = useCallback(() => {
    const activa = FilaService.getFilaActiva();
    setFilaActiva(activa);
    const toda = FilaService.getFila();
    setMiEntrada(toda.find((u) => u.id == usuarioId) || null);
  }, [usuarioId]);
  useEffect(() => { refrescar(); const t = setInterval(refrescar, 5000); return () => clearInterval(t); }, [refrescar]);
  const posicion = miEntrada?.estado === "EN_FILA" ? filaActiva.findIndex((u) => u.id == usuarioId) + 1 : null;
  const tiempoEstimado = posicion ? Math.round((posicion - 1) * TIEMPO_POR_PERSONA) : 0;
  return { filaActiva, miEntrada, posicion, tiempoEstimado, refrescar };
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #f0f2f5;
    color: #1a2a3a;
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3, h4 { font-family: 'Sora', sans-serif; }

  button { cursor: pointer; font-family: 'DM Sans', sans-serif; border: none; outline: none; }
  input, select { font-family: 'DM Sans', sans-serif; outline: none; }

  :root {
    --navy: #0f1b2d;
    --navy-mid: #162236;
    --orange: #f57c20;
    --orange-light: #ff9a4a;
    --orange-dim: rgba(245,124,32,0.12);
    --white: #ffffff;
    --off-white: #f0f2f5;
    --border: #e2e8f0;
    --border-light: #f1f5f9;
    --text-primary: #1a2a3a;
    --text-secondary: #5a6a7a;
    --text-muted: #8a9ab0;
    --success: #22c55e;
    --success-bg: #f0fdf4;
    --danger: #ef4444;
    --danger-bg: #fef2f2;
    --shadow-sm: 0 1px 4px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 20px rgba(0,0,0,0.08);
    --shadow-lg: 0 10px 40px rgba(0,0,0,0.1);
    --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 24px;
  }

  /* NAV */
  .nav {
    background: var(--navy);
    height: 62px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2rem;
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 2px 12px rgba(0,0,0,0.25);
  }
  .nav-brand { display: flex; align-items: center; gap: 12px; }
  .nav-logo {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--orange), var(--orange-light));
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .nav-title { color: white; font-family: 'Sora', sans-serif; font-size: 1.2rem; font-weight: 700; letter-spacing: 0.06em; }
  .nav-sub { color: rgba(255,255,255,0.45); font-size: 0.68rem; letter-spacing: 0.03em; }
  .nav-right { display: flex; align-items: center; gap: 10px; }
  .nav-avatar {
    width: 34px; height: 34px; border-radius: 50%;
    background: rgba(255,255,255,0.12); border: 1.5px solid rgba(255,255,255,0.25);
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 13px; font-weight: 600; cursor: pointer;
  }
  .nav-user-name { color: rgba(255,255,255,0.85); font-size: 0.82rem; font-weight: 600; }

  /* PAGE */
  .page { min-height: calc(100vh - 62px); background: var(--off-white); padding: 2rem; }
  .page-center { min-height: calc(100vh - 62px); display: flex; align-items: center; justify-content: center; padding: 2rem; background: var(--off-white); }

  /* CARD */
  .card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-sm);
    padding: 2rem;
  }
  .card-sm { padding: 1.5rem; }
  .card-xs { padding: 1.25rem 1.5rem; }

  /* ALERT */
  .alert {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px 16px; border-radius: var(--r-sm);
    font-size: 0.875rem; font-weight: 500;
    animation: slideDown 0.25s ease;
    margin-bottom: 1rem;
  }
  .alert-success { background: var(--success-bg); border: 1px solid #bbf7d0; color: #15803d; }
  .alert-error { background: var(--danger-bg); border: 1px solid #fecaca; color: #b91c1c; }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

  /* BUTTONS */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 11px 22px; border-radius: var(--r-sm);
    font-size: 0.9rem; font-weight: 600; transition: all 0.2s;
    letter-spacing: 0.01em;
  }
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
  .btn-success:hover { background: #16a34a; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(34,197,94,0.4); }
  .btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
  .btn-sm { padding: 8px 16px; font-size: 0.82rem; }

  /* INPUTS */
  .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1rem; }
  .field-label { font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
  .input {
    width: 100%; padding: 11px 14px;
    border: 1.5px solid var(--border); border-radius: var(--r-sm);
    font-size: 0.875rem; color: var(--text-primary);
    background: #fafbfc; transition: all 0.2s;
  }
  .input:focus { border-color: var(--orange); background: white; box-shadow: 0 0 0 3px var(--orange-dim); }
  .input::placeholder { color: var(--text-muted); }
  .input-error { border-color: var(--danger) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
  .field-err { font-size: 0.75rem; color: var(--danger); }
  .field-hint { font-size: 0.73rem; color: var(--text-muted); }

  select.input {
    cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a9ab0' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px;
    background-color: #fafbfc;
  }

  /* BADGE */
  .badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 0.75rem; font-weight: 600;
  }
  .badge-green { background: rgba(34,197,94,0.12); color: #15803d; }
  .badge-orange { background: var(--orange-dim); color: var(--orange); }
  .badge-red { background: rgba(239,68,68,0.12); color: var(--danger); }
  .badge-gray { background: var(--border-light); color: var(--text-muted); }
  .badge-blue { background: rgba(59,130,246,0.12); color: #1d4ed8; }

  /* DOT */
  .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .dot-green { background: #22c55e; animation: pulse 1.2s infinite; }
  .dot-orange { background: var(--orange); }
  .dot-red { background: var(--danger); animation: pulse 1s infinite; }
  @keyframes pulse { 0%,100% { opacity:1; transform: scale(1); } 50% { opacity:0.5; transform: scale(1.4); } }

  /* DIVIDER */
  .divider { height: 1px; background: var(--border-light); margin: 1.25rem 0; }

  /* INFO ROW */
  .info-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid var(--border-light);
    font-size: 0.875rem;
  }
  .info-row:last-child { border-bottom: none; }
  .info-k { color: var(--text-muted); font-size: 0.8rem; }
  .info-v { color: var(--text-primary); font-weight: 600; }

  /* SECTION TITLE */
  .sec-title { font-family: 'Sora', sans-serif; font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
  .sec-sub { font-size: 0.8rem; color: var(--text-muted); }

  /* FOOTER NOTE */
  .note {
    display: flex; align-items: flex-start; gap: 8px;
    padding: 10px 14px; background: rgba(15,27,45,0.04);
    border-radius: var(--r-sm); font-size: 0.8rem; color: var(--text-secondary);
    margin-top: 1rem;
  }

  /* ── LOGIN PAGE ── */
  .login-wrap { max-width: 960px; width: 100%; display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; }
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
  .scan-line {
    position: absolute; left: 8px; right: 8px; height: 2px;
    background: linear-gradient(90deg, transparent, var(--orange), transparent);
    animation: scanMove 2s ease-in-out infinite; border-radius: 1px; opacity: 0.85;
  }
  @keyframes scanMove { 0%,100% { top: 12%; } 50% { top: 82%; } }

  /* BARCODE */
  .barcode-svg-wrap { display: flex; justify-content: center; align-items: center; }

  /* ── REGISTER ── */
  .register-wrap { max-width: 580px; width: 100%; }
  .reg-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 1.75rem; }
  .back-btn { background: none; border: none; color: var(--text-muted); font-size: 0.82rem; cursor: pointer; padding: 4px 0; flex-shrink: 0; margin-top: 4px; transition: color 0.2s; }
  .back-btn:hover { color: var(--orange); }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
  .full { grid-column: 1 / -1; }
  .type-btns { display: flex; gap: 0.75rem; margin-top: 4px; }
  .type-btn {
    flex: 1; padding: 10px 12px; border: 2px solid var(--border); border-radius: 10px;
    background: white; color: var(--text-secondary); font-size: 0.85rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .type-btn:hover { border-color: var(--orange); color: var(--orange); }
  .type-btn.active { border-color: var(--orange); background: var(--orange-dim); color: var(--orange); }

  /* REVEAL */
  .reveal { text-align: center; padding: 0.5rem; }
  .reveal-icon { font-size: 2.8rem; margin-bottom: 10px; }
  .reveal h2 { font-size: 1.4rem; font-weight: 800; margin-bottom: 6px; }
  .reveal p { font-size: 0.88rem; color: var(--text-secondary); }
  .reveal-info { background: #fafbfc; border: 1px solid var(--border); border-radius: var(--r-md); padding: 1rem; margin: 1.25rem 0; text-align: left; }
  .reveal-hint { display: flex; align-items: flex-start; gap: 8px; padding: 10px 14px; background: var(--orange-dim); border-radius: var(--r-sm); font-size: 0.8rem; color: var(--text-secondary); text-align: left; margin-top: 1rem; }

  /* ── DASHBOARD / MENU ── */
  .menu-page { max-width: 1000px; margin: 0 auto; }
  .menu-header { margin-bottom: 2rem; }
  .menu-header h2 { font-size: 1.6rem; font-weight: 800; }
  .menu-header p { color: var(--text-secondary); font-size: 0.95rem; margin-top: 4px; }

  .menu-status-bar {
    display: flex; align-items: center; gap: 12px; padding: 14px 18px;
    background: var(--success-bg); border: 1px solid #bbf7d0; border-radius: var(--r-md);
    margin-bottom: 1.5rem; cursor: pointer; transition: background 0.2s;
  }
  .menu-status-bar:hover { background: #dcfce7; }
  .menu-status-bar .label { font-size: 0.9rem; font-weight: 600; color: #15803d; flex: 1; }
  .menu-status-bar .arrow { color: #15803d; font-size: 1.1rem; }

  .menu-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 1.5rem; }
  .menu-card {
    background: white; border: 1px solid var(--border); border-radius: var(--r-lg);
    padding: 1.75rem 1.5rem; cursor: pointer; transition: all 0.2s;
    display: flex; flex-direction: column; gap: 6px; position: relative; overflow: hidden;
  }
  .menu-card:hover { border-color: var(--orange); transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .menu-card-icon { font-size: 2rem; margin-bottom: 6px; }
  .menu-card h3 { font-family: 'Sora', sans-serif; font-size: 1rem; font-weight: 700; color: var(--text-primary); }
  .menu-card p { font-size: 0.82rem; color: var(--text-muted); }
  .menu-card-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--orange), var(--orange-light)); opacity: 0; transition: opacity 0.2s; }
  .menu-card:hover .menu-card-accent { opacity: 1; }

  .menu-quick { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .quick-stat { background: white; border: 1px solid var(--border); border-radius: var(--r-md); padding: 1.25rem 1.5rem; }
  .quick-stat .qs-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 6px; }
  .quick-stat .qs-value { font-family: 'Sora', sans-serif; font-size: 2rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
  .quick-stat .qs-sub { font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; }

  /* ── QUEUE PAGE ── */
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

  .waiting-card { text-align: center; padding: 2.5rem 1.5rem; }
  .big-pos { font-family: 'Sora', sans-serif; font-size: 4rem; font-weight: 800; color: var(--navy); line-height: 1; margin-bottom: 4px; }
  .wait-label { font-size: 0.8rem; color: var(--text-muted); }

  /* ── PROFILE PAGE ── */
  .profile-page { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
  .profile-avatar-row { display: flex; align-items: center; gap: 16px; margin-bottom: 1.25rem; }
  .avatar-circle {
    width: 52px; height: 52px; border-radius: 50%;
    background: var(--navy); color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; font-weight: 700; flex-shrink: 0;
  }
  .barcode-section { padding-top: 1rem; }
  .barcode-outer { background: white; border: 1.5px solid var(--border); border-radius: var(--r-md); padding: 1.25rem 1.5rem; display: flex; justify-content: center; }

  /* ── EDIT PAGE ── */
  .edit-page { max-width: 560px; margin: 0 auto; }
  .page-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 1.75rem; }
  .page-header-text h2 { font-size: 1.35rem; font-weight: 800; }
  .page-header-text p { font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; }

  /* MISC */
  .mono { font-family: 'Courier New', monospace; font-size: 0.8rem; color: var(--text-secondary); }
  .flex-row { display: flex; gap: 10px; }
  .flex-end { justify-content: flex-end; }
  .mt-1 { margin-top: 0.75rem; }
  .mt-2 { margin-top: 1.5rem; }
  .mb-1 { margin-bottom: 0.75rem; }
  .mb-2 { margin-bottom: 1.5rem; }
  .text-center { text-align: center; }

  @media (max-width: 860px) {
    .login-wrap { grid-template-columns: 1fr; }
    .menu-grid { grid-template-columns: 1fr 1fr; }
    .queue-top, .queue-bottom { grid-template-columns: 1fr; }
    .menu-quick { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 540px) {
    .page { padding: 1rem; }
    .menu-grid { grid-template-columns: 1fr; }
    .menu-quick { grid-template-columns: 1fr; }
    .form-grid { grid-template-columns: 1fr; }
    .full { grid-column: 1; }
  }
`;

// ── BARCODE COMPONENT ──
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

// ── QUEUE PANEL ──
function QueuePanel({ filaActiva, miId }) {
  const GRUPO_SIZE = 10;
  const grupos = [];
  for (let i = 0; i < filaActiva.length; i += GRUPO_SIZE) {
    grupos.push({ num: Math.floor(i / GRUPO_SIZE) + 1, desde: i + 1, hasta: Math.min(i + GRUPO_SIZE, filaActiva.length), users: filaActiva.slice(i, i + GRUPO_SIZE) });
  }
  const miGrupo = grupos.find((g) => g.users.some((u) => u.id == miId));
  return (
    <div className="card queue-list-card">
      <div className="sec-title" style={{ marginBottom: "4px" }}>Cola en tiempo real</div>
      <div className="sec-sub" style={{ marginBottom: "1rem" }}>Grupos de {GRUPO_SIZE} personas</div>
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
                  <span className={`dot ${g.num === 1 ? "dot-green" : ""}`} style={{ display: g.num === 1 ? "block" : "none" }} />
                  {g.num === 1 ? "Ingresando" : esElMio ? "Tu grupo" : "Esperando"}
                </span>
              </div>
            );
          })}
        </>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-light)", fontSize: "0.73rem", color: "var(--text-muted)" }}>
        <span className="dot dot-green" />
        Actualización automática
      </div>
    </div>
  );
}

// ── LOGIN ──
function LoginPage({ onLogin, onRegister }) {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const { alerta, mostrar } = useAlerta();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id.trim()) return mostrar("Ingresa tu número de documento.", "error");
    setLoading(true);
    const { data } = await supabase.from("estudiantes").select("*").eq("id", parseInt(id)).single();
    if (data) { onLogin(data); } else { mostrar("Documento no registrado. Por favor crea tu cuenta.", "error"); }
    setLoading(false);
  };

  return (
    <div className="page-center">
      <div className="login-wrap">
        <div className="login-main">
          <div className="login-hero">
            <h2>Bienvenido a <span className="orange">COMET</span></h2>
            <p>Escanea tu código de barras o ingresa tu documento para unirte a la cola del comedor.</p>
          </div>
          <div className="card card-sm">
            <div className="text-center" style={{ marginBottom: "1.25rem" }}>
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
            <div className="or-row"><div className="or-line" /><span>O ingresa tu código manualmente</span><div className="or-line" /></div>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <input className="input" type="number" placeholder="Ingresa tu cédula o documento" value={id} onChange={(e) => setId(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-navy btn-block" disabled={loading}>
                {loading ? "Verificando..." : "Entrar / Iniciar sesión"}
              </button>
            </form>
            <Alert alerta={alerta} />
            <div className="note" style={{ marginTop: "1rem" }}>
              <span>ℹ️</span>
              <span>Al ingresar, serás agregado automáticamente a la cola en tiempo real.</span>
            </div>
            <div className="register-prompt">
              <p>¿No tienes cuenta?</p>
              <button className="btn btn-ghost btn-sm" onClick={onRegister}>Registrarse</button>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card card-sm" style={{ flex: 1 }}>
            <div className="sec-title" style={{ marginBottom: "4px" }}>Cola en tiempo real</div>
            <div className="sec-sub" style={{ marginBottom: "1.25rem" }}>Grupos de 10 personas</div>
            <div className="queue-header-row"><span>Grupo</span><span>Estado</span></div>
            {FilaService.getFilaActiva().length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>Cola vacía</div>
            ) : (
              Array.from({ length: Math.ceil(FilaService.getFilaActiva().length / 10) }, (_, i) => (
                <div key={i} className="queue-row">
                  <span className="queue-gnum">{String(i + 1).padStart(2, "0")}</span>
                  <span className={`badge ${i === 0 ? "badge-green" : "badge-gray"}`}>{i === 0 ? "Ingresando" : "Esperando"}</span>
                </div>
              ))
            )}
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
    if (!datos.correo.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) e.correo = "Correo inválido";
    if (!datos.id.trim()) e.id = "Campo requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const nuevo = { id: parseInt(datos.id), nombre: datos.nombre.toUpperCase().trim(), carrera: tipo === "Carreras de Pregrado" ? carrera : tipo, telefono: datos.telefono.trim(), correo: datos.correo.toLowerCase().trim(), rol: "ESTUDIANTE", created_at: new Date().toISOString() };
    const { error } = await supabase.from("estudiantes").insert([nuevo]);
    if (error) { mostrar(error.message, "error"); } else { setUsuario(nuevo); setStep(2); }
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
                {[["Nombre", usuario.nombre], ["Documento", usuario.id], ["Tipo de estudio", usuario.carrera], ["Correo", usuario.correo]].map(([k, v]) => (
                  <div className="info-row" key={k}><span className="info-k">{k}</span><span className="info-v">{v}</span></div>
                ))}
              </div>
              <div className="barcode-outer" style={{ marginBottom: "1rem" }}>
                <Barcode id={usuario.id} height={70} />
              </div>
              <div className="reveal-hint">
                <span>🔒</span>
                <span>Tu código de barras es único. Preséntalo en la ventanilla del comedor para ser atendido.</span>
              </div>
              <button className="btn btn-navy btn-block mt-2" onClick={() => onSuccess(usuario)}>
                Ir al inicio →
              </button>
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
            <button type="submit" className="btn btn-navy btn-block" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta y generar código"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── MAIN MENU ──
function MenuPage({ usuario, setVista }) {
  const { filaActiva, miEntrada } = useFila(usuario.id);
  const enFila = miEntrada?.estado === "EN_FILA";
  const posicion = enFila ? filaActiva.findIndex((u) => u.id == usuario.id) + 1 : null;
  const nombre = usuario.nombre?.split(" ")[0] || "Usuario";

  return (
    <div className="page">
      <div className="menu-page">
        <div className="menu-header">
          <h2>Hola, {nombre} 👋</h2>
          <p>{usuario.carrera} · {usuario.correo}</p>
        </div>
        {enFila && (
          <div className="menu-status-bar" onClick={() => setVista("fila")}>
            <span className="dot dot-green" />
            <span className="label">Estás en la fila · Posición #{posicion} · Toca para ver detalles</span>
            <span className="arrow">›</span>
          </div>
        )}
        <div className="menu-grid">
          {[
            { icon: "🚶‍♂️", title: "Tomar turno", desc: "Únete a la cola del comedor", vista: "fila", accent: true },
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
            <div className="qs-value">{filaActiva.length}</div>
            <div className="qs-sub">personas esperando</div>
          </div>
          <div className="quick-stat">
            <div className="qs-label">Tiempo estimado</div>
            <div className="qs-value">{Math.round(filaActiva.length * TIEMPO_POR_PERSONA * 60)}</div>
            <div className="qs-sub">segundos de espera</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── QUEUE ──
function QueuePage({ usuario, setVista }) {
  const { filaActiva, miEntrada, posicion, tiempoEstimado, refrescar } = useFila(usuario.id);
  const { alerta, mostrar } = useAlerta();
  const [loading, setLoading] = useState(false);
  const [escaneado, setEscaneado] = useState(false);
  const [segs, setSegs] = useState(tiempoEstimado * 60);
  useEffect(() => { setSegs(tiempoEstimado * 60); }, [tiempoEstimado]);
  useEffect(() => { if (!posicion || segs <= 0) return; const t = setInterval(() => setSegs((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, [posicion, segs]);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const enFila = miEntrada?.estado === "EN_FILA";

  const ingresar = async () => { setLoading(true); FilaService.agregarAFila(usuario); mostrar("Ingresaste a la fila exitosamente.", "success"); refrescar(); setLoading(false); };
  const salir = async () => { setLoading(true); FilaService.actualizarEstado(usuario.id, "SALIO"); mostrar("Saliste de la fila.", "success"); refrescar(); setLoading(false); };

  const radius = 38; const circ = 2 * Math.PI * radius;
  const prog = posicion && filaActiva.length > 0 ? Math.max(0.05, 1 - (posicion - 1) / filaActiva.length) : 0;

  return (
    <div className="page">
      <div className="queue-page">
        <div className="page-header" style={{ marginBottom: "1.5rem" }}>
          <button className="back-btn" style={{ marginTop: 4 }} onClick={() => setVista("menu")}>← Volver</button>
          <div className="page-header-text">
            <h2>Sistema de fila</h2>
            <p>Gestiona tu turno en el comedor estudiantil</p>
          </div>
        </div>

        <Alert alerta={alerta} />

        {enFila ? (
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
                <button className="btn btn-danger-ghost btn-sm btn-block mt-1" onClick={salir} disabled={loading}>
                  Salir de la fila
                </button>
              </div>
            </div>
            <div className="queue-bottom">
              <QueuePanel filaActiva={filaActiva} miId={usuario.id} />
              <div className="card notice-card">
                <div className="notice-title"><span>⚠️</span> Aviso importante</div>
                <p>Permanece atento a tu posición. Si no te presentas cuando sea tu turno, perderás tu lugar en la fila y deberás volver a registrarte.</p>
                <div className="divider" />
                <div className="sec-title" style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>Próximos en fila</div>
                {filaActiva.slice(0, 5).map((u, i) => (
                  <div className="info-row" key={u.id} style={{ fontSize: "0.8rem" }}>
                    <span className="info-k">#{i + 1}</span>
                    <span className="info-v">{u.nombre} ({u.id})</span>
                  </div>
                ))}
                <div className="divider" />
                <div className="info-row"><span className="info-k">Tu documento</span><span className="info-v mono">{usuario.id}</span></div>
                <div className="info-row"><span className="info-k">Nombre</span><span className="info-v">{usuario.nombre}</span></div>
                <div className="info-row" style={{ borderBottom: "none" }}><span className="info-k">Programa</span><span className="info-v">{usuario.carrera}</span></div>
              </div>
            </div>
          </>
        ) : miEntrada?.estado === "ATENDIDO" ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>✅</div>
            <h3 style={{ fontFamily: "Sora", fontSize: "1.3rem", marginBottom: 8 }}>¡Fuiste atendido!</h3>
            <p style={{ color: "var(--text-secondary)" }}>Que disfrutes tu comida. Hasta la próxima.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🚶‍♂️</div>
              <h3 style={{ fontFamily: "Sora", fontSize: "1.1rem", marginBottom: 8 }}>{miEntrada?.estado === "SALIO" ? "Volver a la fila" : "Unirte a la fila"}</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                {miEntrada?.estado === "SALIO" ? "Saliste de la fila. ¿Deseas volver a ingresar?" : "No estás en la fila. ¡Toma tu turno ahora!"}
              </p>
              <div className="barcode-outer" style={{ marginBottom: "1rem" }}>
                <Barcode id={usuario.id} height={60} />
              </div>
              {!escaneado ? (
                <button className="btn btn-orange btn-block" onClick={() => setEscaneado(true)}>
                  📱 Escanear código de barras
                </button>
              ) : (
                <button className="btn btn-navy btn-block" onClick={ingresar} disabled={loading}>
                  {loading ? "Ingresando..." : "🚶 Ingresar a la fila"}
                </button>
              )}
            </div>
            <QueuePanel filaActiva={filaActiva} miId={null} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── PROFILE ──
function ProfilePage({ usuario, setVista }) {
  const iniciales = usuario.nombre?.split(" ").slice(0, 2).map((p) => p[0]).join("") || "?";
  return (
    <div className="page">
      <div className="profile-page">
        <div className="page-header">
          <button className="back-btn" style={{ marginTop: 4 }} onClick={() => setVista("menu")}>← Volver</button>
          <div className="page-header-text"><h2>Mi perfil</h2><p>Información de tu cuenta</p></div>
        </div>
        <div className="card card-sm">
          <div className="profile-avatar-row">
            <div className="avatar-circle">{iniciales}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{usuario.nombre}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>{usuario.carrera}</div>
              <span className="badge badge-green" style={{ marginTop: 6 }}>✓ Activo</span>
            </div>
          </div>
          <div className="divider" style={{ margin: "0.75rem 0 1.25rem" }} />
          {[["Documento / ID", usuario.id], ["Nombre completo", usuario.nombre], ["Programa", usuario.carrera], ["Correo electrónico", usuario.correo], ["Teléfono", usuario.telefono || "—"], ["Rol", usuario.rol || "Estudiante"], ["Registro", usuario.created_at ? new Date(usuario.created_at).toLocaleDateString("es-CO") : "—"]].map(([k, v]) => (
            <div className="info-row" key={k}><span className="info-k">{k}</span><span className="info-v">{String(v)}</span></div>
          ))}
          <div className="flex-row mt-2">
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setVista("editar")}>✏️ Editar datos</button>
            <button className="btn btn-navy" style={{ flex: 1 }} onClick={() => setVista("fila")}>🚶 Ir a la fila</button>
          </div>
        </div>
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
      </div>
    </div>
  );
}

// ── EDIT ──
function EditPage({ usuario, onUpdate, setVista }) {
  const [datos, setDatos] = useState({ nombre: usuario.nombre || "", telefono: usuario.telefono || "", correo: usuario.correo || "", rol: usuario.rol || "ESTUDIANTE" });
  const [loading, setLoading] = useState(false);
  const { alerta, mostrar } = useAlerta();
  const cambiar = (e) => setDatos((p) => ({ ...p, [e.target.name]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    if (!datos.nombre || !datos.correo) return mostrar("Completa todos los campos.", "error");
    setLoading(true);
    const act = { ...usuario, nombre: datos.nombre.toUpperCase().trim(), telefono: datos.telefono.trim(), correo: datos.correo.toLowerCase().trim(), rol: datos.rol };
    const { error } = await supabase.from("estudiantes").update(act).eq("id", usuario.id);
    if (error) { mostrar(error.message, "error"); } else { mostrar("Datos actualizados correctamente.", "success"); setTimeout(() => { onUpdate(act); setVista("perfil"); }, 1400); }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="edit-page">
        <div className="page-header">
          <button className="back-btn" style={{ marginTop: 4 }} onClick={() => setVista("perfil")}>← Volver</button>
          <div className="page-header-text"><h2>Editar perfil</h2><p>Actualiza tu información personal</p></div>
        </div>
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
            <div className="field">
              <label className="field-label">Rol</label>
              <select className="input" name="rol" value={datos.rol} onChange={cambiar}>
                <option value="ESTUDIANTE">Estudiante</option>
                <option value="DOCENTE">Docente</option>
                <option value="ADMINISTRATIVO">Administrativo</option>
              </select>
            </div>
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

  useEffect(() => {
    try {
      FilaService.limpiarInactivos();
      const s = localStorage.getItem("sesion_comet");
      if (s) { const u = JSON.parse(s); setUsuario(u); setVista("menu"); }
    } catch {}
  }, []);

  const login = (u) => { setUsuario(u); localStorage.setItem("sesion_comet", JSON.stringify(u)); setVista("menu"); };
  const logout = () => { localStorage.removeItem("sesion_comet"); setUsuario(null); setVista("login"); };
  const update = (u) => { setUsuario(u); localStorage.setItem("sesion_comet", JSON.stringify(u)); };

  const iniciales = usuario?.nombre?.split(" ").slice(0, 2).map((p) => p[0]).join("") || "";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {vista !== "login" && vista !== "registro" && (
        <nav className="nav">
          <div className="nav-brand">
            <div className="nav-logo">🚀</div>
            <div>
              <div className="nav-title">COMET</div>
              <div className="nav-sub">Servicio de Comedor Estudiantil UP</div>
            </div>
          </div>
          <div className="nav-right">
            {usuario && (
              <>
                <div className="nav-avatar" onClick={() => setVista("perfil")} title="Mi perfil">{iniciales}</div>
                <span className="nav-user-name" style={{ cursor: "pointer" }} onClick={() => setVista("perfil")}>Mi perfil</span>
                <button className="btn btn-ghost btn-sm" style={{ color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }} onClick={logout}>Salir</button>
              </>
            )}
          </div>
        </nav>
      )}

      {vista === "login" && <LoginPage onLogin={login} onRegister={() => setVista("registro")} />}
      {vista === "registro" && <RegisterPage onSuccess={login} onBack={() => setVista("login")} />}
      {vista === "menu" && usuario && <MenuPage usuario={usuario} setVista={setVista} />}
      {vista === "fila" && usuario && <QueuePage usuario={usuario} setVista={setVista} />}
      {vista === "perfil" && usuario && <ProfilePage usuario={usuario} setVista={setVista} />}
      {vista === "editar" && usuario && <EditPage usuario={usuario} onUpdate={update} setVista={setVista} />}
    </>
  );
}
