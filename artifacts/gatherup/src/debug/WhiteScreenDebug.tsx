import React from "react";

export function WhiteScreenDebug() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#0b0b0f",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      zIndex: 999999,
      padding: 16,
      textAlign: "center",
    }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          App mounted
        </div>
        <div style={{ opacity: 0.8, fontSize: 14, lineHeight: 1.4 }}>
          If you still see a white screen, the React bundle is not executing.
          <br />
          Check browser Console + Network for the first failed request.
        </div>
      </div>
    </div>
  );
}

