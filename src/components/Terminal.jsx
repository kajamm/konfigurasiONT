import { useState, useEffect } from 'react';

export default function Terminal({ result, bulkConfigs, brand, sid }) {
  const [autoCopy, setAutoCopy] = useState(true);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result)
      .then(() => {
        const event = new CustomEvent('show-toast', { detail: { message: "Konfigurasi berhasil disalin ke clipboard!", type: "success" } });
        window.dispatchEvent(event);
      })
      .catch(() => {
        const event = new CustomEvent('show-toast', { detail: { message: "Gagal menyalin ke clipboard. Coba pilih teks dan tekan Ctrl+C secara manual.", type: "error" } });
        window.dispatchEvent(event);
      });
  };

  // Auto-copy saat result baru muncul (jika autoCopy aktif)
  useEffect(() => {
    if (autoCopy && result) {
      handleCopy();
    }
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps



  return (
    <section id="output" className="fade-in">
      <div className="terminal-card">
        <div className="terminal-header">
          <div className="terminal-controls">
            <span className="control-dot dot-red"></span>
            <span className="control-dot dot-yellow"></span>
            <span className="control-dot dot-green"></span>
            <span className="terminal-title">
              <i className="fa-solid fa-terminal"></i> olt-script-output.cli
            </span>
          </div>
          <div className="terminal-actions">
            <label className="auto-copy-label" htmlFor="autoCopy">
              <input
                type="checkbox"
                id="autoCopy"
                checked={autoCopy}
                onChange={(e) => setAutoCopy(e.target.checked)}
              />
              <span>Auto-copy setelah generate</span>
            </label>

            <button type="button" className="copy-btn" onClick={handleCopy}>
              <i className="fa-regular fa-copy"></i> Salin
            </button>
          </div>
        </div>
        <pre id="configResult">{result}</pre>
      </div>
    </section>
  );
}
