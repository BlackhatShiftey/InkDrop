import { useState, useRef, useEffect, useCallback } from "react";

const REPO_URL = "https://github.com/BlackhatShiftey/inkdrop";

export default function InkDropManager() {
  const [signatures, setSignatures] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState("draw");
  const [penSize, setPenSize] = useState(3);
  const [showSaved, setShowSaved] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);

  const displayCanvasRef = useRef(null);
  const exportCanvasRef = useRef(null);
  const lastPoint = useRef(null);

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const toast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  // --- Canvas Drawing (Dual Canvas: display=white ink, export=dark ink) ---
  const getPos = (e) => {
    const canvas = displayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const drawLine = (from, to) => {
    [displayCanvasRef, exportCanvasRef].forEach((ref, i) => {
      const ctx = ref.current?.getContext("2d");
      if (!ctx) return;
      ctx.strokeStyle = i === 0 ? "#e8e4df" : "#111827";
      ctx.lineWidth = penSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPoint.current = getPos(e);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    if (lastPoint.current) drawLine(lastPoint.current, pos);
    lastPoint.current = pos;
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    [displayCanvasRef, exportCanvasRef].forEach((ref, i) => {
      const canvas = ref.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (i === 0) {
        ctx.fillStyle = "#1a1a24";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });
  };

  const initCanvas = useCallback(() => {
    const dc = displayCanvasRef.current;
    if (dc) {
      const ctx = dc.getContext("2d");
      ctx.fillStyle = "#1a1a24";
      ctx.fillRect(0, 0, dc.width, dc.height);
    }
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  // --- Save & Download ---
  const saveSig = () => {
    const canvas = exportCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const name = `sig-${Date.now().toString(36)}`;
    setSignatures((prev) => [
      ...prev,
      { id: name, data: dataUrl, created: new Date().toLocaleString() },
    ]);
    clearCanvas();
    initCanvas();
    toast("Signature saved to library");
  };

  const downloadSig = (sig) => {
    const a = document.createElement("a");
    a.href = sig.data;
    a.download = `inkdrop-${sig.id}.png`;
    a.click();
    toast("Downloading signature...");
  };

  const downloadAll = () => {
    if (signatures.length === 0) return toast("No signatures to download");
    signatures.forEach((sig, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = sig.data;
        a.download = `inkdrop-${sig.id}.png`;
        a.click();
      }, i * 300);
    });
    toast(`Downloading ${signatures.length} signature(s)...`);
  };

  const deleteSig = (id) => {
    setSignatures((prev) => prev.filter((s) => s.id !== id));
    toast("Signature removed");
  };

  const downloadFromCanvas = () => {
    const canvas = exportCanvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `inkdrop-draft-${Date.now().toString(36)}.png`;
    a.click();
    toast("Downloading current drawing...");
  };

  // --- Styles ---
  const styles = {
    app: {
      minHeight: "100vh",
      background: "linear-gradient(170deg, #0d0d14 0%, #12121e 40%, #0f1118 100%)",
      color: "#c8c4be",
      fontFamily: "'Outfit', 'DM Sans', sans-serif",
      padding: "0",
      position: "relative",
      overflow: "hidden",
    },
    grain: {
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
      pointerEvents: "none",
      zIndex: 0,
    },
    content: {
      position: "relative",
      zIndex: 1,
      maxWidth: 880,
      margin: "0 auto",
      padding: "32px 20px 20px",
    },
    header: {
      textAlign: "center",
      marginBottom: 36,
      opacity: animateIn ? 1 : 0,
      transform: animateIn ? "translateY(0)" : "translateY(-20px)",
      transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    logo: {
      fontSize: 42,
      fontWeight: 800,
      letterSpacing: "-1.5px",
      background: "linear-gradient(135deg, #e8e4df 0%, #a89f91 50%, #c7a94f 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: 6,
    },
    tagline: {
      fontSize: 14,
      color: "#6b6660",
      letterSpacing: "3px",
      textTransform: "uppercase",
      fontWeight: 300,
    },
    tabs: {
      display: "flex",
      gap: 0,
      marginBottom: 24,
      background: "#16161f",
      borderRadius: 12,
      padding: 4,
      border: "1px solid #222230",
    },
    tab: (active) => ({
      flex: 1,
      padding: "12px 0",
      textAlign: "center",
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      color: active ? "#e8e4df" : "#5a5650",
      background: active ? "#222230" : "transparent",
      borderRadius: 9,
      cursor: "pointer",
      transition: "all 0.3s ease",
      border: "none",
      letterSpacing: "0.5px",
    }),
    canvasWrap: {
      background: "#1a1a24",
      borderRadius: 16,
      border: "1px solid #2a2a38",
      overflow: "hidden",
      marginBottom: 16,
      position: "relative",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)",
    },
    canvas: {
      width: "100%",
      height: 240,
      display: "block",
      cursor: "crosshair",
      touchAction: "none",
    },
    canvasLabel: {
      position: "absolute",
      top: 14,
      left: 18,
      fontSize: 11,
      color: "#3a3a48",
      letterSpacing: "2px",
      textTransform: "uppercase",
      fontWeight: 500,
      pointerEvents: "none",
    },
    canvasHint: {
      position: "absolute",
      bottom: 14,
      right: 18,
      fontSize: 11,
      color: "#3a3a48",
      pointerEvents: "none",
    },
    controls: {
      display: "flex",
      gap: 10,
      marginBottom: 20,
      flexWrap: "wrap",
    },
    btn: (variant = "default") => {
      const base = {
        padding: "10px 20px",
        borderRadius: 10,
        border: "none",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.25s ease",
        letterSpacing: "0.3px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      };
      if (variant === "primary")
        return { ...base, background: "linear-gradient(135deg, #c7a94f, #a88a2d)", color: "#0d0d14", flex: 1 };
      if (variant === "danger")
        return { ...base, background: "#2a1a1a", color: "#c75050", border: "1px solid #3a2020" };
      if (variant === "download")
        return { ...base, background: "#1a2a1a", color: "#50c770", border: "1px solid #203a20", flex: 1 };
      if (variant === "ghost")
        return { ...base, background: "transparent", color: "#6b6660", border: "1px solid #2a2a38" };
      return { ...base, background: "#222230", color: "#c8c4be", border: "1px solid #2a2a38" };
    },
    penControl: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "8px 16px",
      background: "#16161f",
      borderRadius: 10,
      border: "1px solid #222230",
      marginBottom: 20,
    },
    penLabel: { fontSize: 12, color: "#5a5650", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" },
    slider: {
      flex: 1,
      height: 4,
      WebkitAppearance: "none",
      appearance: "none",
      background: "#2a2a38",
      borderRadius: 2,
      outline: "none",
    },
    // Library
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: 16,
      marginBottom: 24,
    },
    card: {
      background: "#16161f",
      borderRadius: 14,
      border: "1px solid #222230",
      overflow: "hidden",
      transition: "all 0.3s ease",
    },
    cardThumb: {
      width: "100%",
      height: 100,
      objectFit: "contain",
      background: "#f8f6f0",
      padding: 12,
    },
    cardFooter: {
      padding: "12px 14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardDate: { fontSize: 11, color: "#4a4640" },
    cardActions: { display: "flex", gap: 6 },
    iconBtn: (color) => ({
      width: 32,
      height: 32,
      borderRadius: 8,
      border: "none",
      background: color === "green" ? "#1a2a1a" : color === "red" ? "#2a1a1a" : "#222230",
      color: color === "green" ? "#50c770" : color === "red" ? "#c75050" : "#6b6660",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
      transition: "all 0.2s ease",
    }),
    // GitHub Banner
    ghBanner: {
      background: "linear-gradient(135deg, #16161f 0%, #1a1a28 100%)",
      borderRadius: 16,
      border: "1px solid #222230",
      padding: "24px 28px",
      marginTop: 8,
      display: "flex",
      alignItems: "center",
      gap: 20,
      flexWrap: "wrap",
      boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
    },
    ghLeft: { flex: 1, minWidth: 200 },
    ghTitle: {
      fontSize: 16,
      fontWeight: 700,
      color: "#e8e4df",
      marginBottom: 4,
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    ghSub: { fontSize: 12, color: "#5a5650", lineHeight: 1.5 },
    ghButtons: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    },
    ghStarBtn: {
      padding: "10px 22px",
      borderRadius: 10,
      border: "1px solid #c7a94f40",
      background: "linear-gradient(135deg, #2a2418 0%, #1f1c14 100%)",
      color: "#c7a94f",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 8,
      transition: "all 0.3s ease",
      letterSpacing: "0.3px",
      textDecoration: "none",
    },
    ghProfileBtn: {
      padding: "10px 18px",
      borderRadius: 10,
      border: "1px solid #2a2a38",
      background: "#1a1a24",
      color: "#8a8680",
      fontSize: 12,
      fontWeight: 500,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 6,
      transition: "all 0.2s ease",
      textDecoration: "none",
    },
    empty: {
      textAlign: "center",
      padding: "60px 20px",
      color: "#3a3a48",
    },
    toast: {
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#222230",
      color: "#e8e4df",
      padding: "12px 24px",
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 500,
      border: "1px solid #333340",
      boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      zIndex: 100,
      animation: "fadeUp 0.3s ease",
    },
    divider: {
      height: 1,
      background: "linear-gradient(90deg, transparent, #2a2a38, transparent)",
      margin: "24px 0",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "3px 10px",
      borderRadius: 6,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: "1px",
      textTransform: "uppercase",
    },
  };

  return (
    <div style={styles.app}>
      <div style={styles.grain} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #c7a94f;
          cursor: pointer;
          border: 2px solid #0d0d14;
        }
        button:hover { opacity: 0.85; transform: scale(1.01); }
        a:hover { opacity: 0.85; }
        .sig-card:hover { border-color: #3a3a48 !important; transform: translateY(-2px); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2a38; border-radius: 3px; }
      `}</style>

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>InkDrop</div>
          <div style={styles.tagline}>Draw it once · Drop it anywhere</div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button style={styles.tab(activeTab === "draw")} onClick={() => setActiveTab("draw")}>
            ✦ Draw
          </button>
          <button
            style={styles.tab(activeTab === "library")}
            onClick={() => { setActiveTab("library"); setShowSaved(true); }}
          >
            ◫ Library {signatures.length > 0 && `(${signatures.length})`}
          </button>
        </div>

        {/* Draw Tab */}
        {activeTab === "draw" && (
          <div style={{ opacity: animateIn ? 1 : 0, transition: "opacity 0.5s ease 0.2s" }}>
            {/* Pen Control */}
            <div style={styles.penControl}>
              <span style={styles.penLabel}>Pen</span>
              <input
                type="range"
                min={1}
                max={8}
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                style={styles.slider}
              />
              <span style={{ ...styles.penLabel, minWidth: 20, textAlign: "right" }}>{penSize}px</span>
            </div>

            {/* Canvas */}
            <div style={styles.canvasWrap}>
              <span style={styles.canvasLabel}>Sign here</span>
              <span style={styles.canvasHint}>
                <span style={{ ...styles.badge, background: "#1a2a1a", color: "#50c770" }}>Live</span>
              </span>
              <canvas
                ref={displayCanvasRef}
                width={800}
                height={300}
                style={styles.canvas}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              />
              {/* Hidden export canvas (dark ink on transparent) */}
              <canvas
                ref={exportCanvasRef}
                width={800}
                height={300}
                style={{ display: "none" }}
              />
            </div>

            {/* Action Buttons */}
            <div style={styles.controls}>
              <button style={styles.btn("primary")} onClick={saveSig}>
                ◆ Save to Library
              </button>
              <button style={styles.btn("download")} onClick={downloadFromCanvas}>
                ↓ Download PNG
              </button>
              <button style={styles.btn("danger")} onClick={() => { clearCanvas(); initCanvas(); }}>
                ✕ Clear
              </button>
            </div>

            {/* Quick preview of saved sigs */}
            {signatures.length > 0 && (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 0 16px" }}>
                {signatures.slice(-5).map((sig) => (
                  <img
                    key={sig.id}
                    src={sig.data}
                    alt={sig.id}
                    style={{
                      height: 48,
                      borderRadius: 8,
                      background: "#f8f6f0",
                      padding: 6,
                      border: "1px solid #222230",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    onClick={() => downloadSig(sig)}
                    title="Click to download"
                  />
                ))}
                <span style={{ fontSize: 11, color: "#3a3a48", alignSelf: "center", paddingLeft: 8, whiteSpace: "nowrap" }}>
                  {signatures.length} saved · click to download
                </span>
              </div>
            )}
          </div>
        )}

        {/* Library Tab */}
        {activeTab === "library" && (
          <div>
            {signatures.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ fontSize: 13, color: "#5a5650" }}>
                  {signatures.length} signature{signatures.length !== 1 ? "s" : ""} saved
                </span>
                <button style={styles.btn("download")} onClick={downloadAll}>
                  ↓ Download All
                </button>
              </div>
            )}

            {signatures.length === 0 ? (
              <div style={styles.empty}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>✦</div>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>No signatures yet</div>
                <div style={{ fontSize: 12, color: "#2a2a38" }}>
                  Switch to the Draw tab and create your first signature
                </div>
              </div>
            ) : (
              <div style={styles.grid}>
                {signatures.map((sig) => (
                  <div key={sig.id} className="sig-card" style={styles.card}>
                    <img src={sig.data} alt={sig.id} style={styles.cardThumb} />
                    <div style={styles.cardFooter}>
                      <span style={styles.cardDate}>{sig.created}</span>
                      <div style={styles.cardActions}>
                        <button
                          style={styles.iconBtn("green")}
                          onClick={() => downloadSig(sig)}
                          title="Download PNG"
                        >
                          ↓
                        </button>
                        <button
                          style={styles.iconBtn("red")}
                          onClick={() => deleteSig(sig.id)}
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div style={styles.divider} />

        {/* GitHub Advertising Banner */}
        <div style={styles.ghBanner}>
          <div style={styles.ghLeft}>
            <div style={styles.ghTitle}>
              <span style={{ fontSize: 20 }}>⬡</span>
              InkDrop is Open Source
            </div>
            <div style={styles.ghSub}>
              Built by <strong style={{ color: "#c8c4be" }}>BlackhatShiftey</strong> — Free forever.
              <br />
              Star the repo to support the project and stay updated on new features.
            </div>
          </div>
          <div style={styles.ghButtons}>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.ghStarBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #3a3018 0%, #2a2418 100%)";
                e.currentTarget.style.borderColor = "#c7a94f80";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #2a2418 0%, #1f1c14 100%)";
                e.currentTarget.style.borderColor = "#c7a94f40";
              }}
            >
              ★ Star on GitHub
            </a>
            <a
              href="https://github.com/BlackhatShiftey"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.ghProfileBtn}
            >
              ◎ BlackhatShiftey
            </a>
          </div>
        </div>

        {/* GitHub Official Star Widget */}
        <div style={{ textAlign: "center", marginTop: 16, marginBottom: 12 }}>
          <iframe
            src="https://ghbtns.com/github-btn.html?user=BlackhatShiftey&repo=inkdrop&type=star&count=true&size=large"
            frameBorder="0"
            scrolling="0"
            width="170"
            height="30"
            title="GitHub Star"
            style={{ borderRadius: 6, overflow: "hidden" }}
          />
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "12px 0 24px", color: "#2a2a38", fontSize: 11, letterSpacing: "1px" }}>
          INKDROP v1.0 — DRAW IT ONCE · DROP IT ANYWHERE
        </div>
      </div>

      {/* Toast */}
      {toastMsg && <div style={styles.toast}>{toastMsg}</div>}
    </div>
  );
}
