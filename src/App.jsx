import { useState, useEffect } from 'react';
import Header from './components/Header';
import BrandSelection from './components/BrandSelection';
import ConfigForm from './components/ConfigForm';
import Terminal from './components/Terminal';
import { useProvisioning } from './hooks/useProvisioning';

function App() {
  const [brand, setBrand] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [configResult, setConfigResult] = useState("");
  const [step, setStep] = useState(1);
  const [toasts, setToasts] = useState([]);
  const [lastSid, setLastSid] = useState("");

  const { generateConfig, processBulkCSV, bulkConfigs, setBulkConfigs } = useProvisioning();

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleToast = (e) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, ...e.detail }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4500);
    };
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleBrandSelect = (selectedBrand) => {
    setBrand(selectedBrand);
    setStep(2);
    setConfigResult("");
    setBulkConfigs(null);
  };

  const handleFormSubmit = (formData) => {
    const result = generateConfig(formData, brand);
    if (result) {
      setConfigResult(result);
      setLastSid(formData.sid || '');
      setStep(3);
      // Scroll ke hasil
      setTimeout(() => {
        document.getElementById('output')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleBulkUpload = (csvText) => {
    const result = processBulkCSV(csvText);
    if (result) {
      setConfigResult(result);
      setLastSid('');
      setStep(3);
      setBrand("");
      setTimeout(() => {
        document.getElementById('output')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleReset = () => {
    if (window.confirm("Yakin ingin mereset semua data? Semua input yang sudah diisi akan dihapus.")) {
      setBrand("");
      setConfigResult("");
      setStep(1);
      setLastSid("");
      setBulkConfigs(null);
      const event = new CustomEvent('show-toast', { detail: { message: "Form berhasil direset.", type: "info" } });
      window.dispatchEvent(event);
    }
  };

  return (
    <>
      <Header theme={theme} toggleTheme={toggleTheme} />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Konfigurasi <span>Registrasi ONT</span></h1>
        </div>
      </section>

      {/* Step Progress Indicator */}
      <section className="step-indicator-section">
        <div className="step-container">
          <div className={`step-item ${step === 1 ? 'step-active' : step > 1 ? 'step-done' : ''}`} id="step1">
            <div className="step-circle">
              <span className="step-num">1</span>
              <i className="fa-solid fa-check step-check"></i>
            </div>
            <div className="step-label">Pilih Brand OLT</div>
          </div>
          <div className={`step-line ${step > 1 ? 'step-line-done' : ''}`} id="line1"></div>
          <div className={`step-item ${step === 2 ? 'step-active' : step > 2 ? 'step-done' : ''}`} id="step2">
            <div className="step-circle">
              <span className="step-num">2</span>
              <i className="fa-solid fa-check step-check"></i>
            </div>
            <div className="step-label">Isi Data Konfigurasi</div>
          </div>
          <div className={`step-line ${step > 2 ? 'step-line-done' : ''}`} id="line2"></div>
          <div className={`step-item ${step === 3 ? 'step-active' : ''}`} id="step3">
            <div className="step-circle">
              <span className="step-num">3</span>
              <i className="fa-solid fa-check step-check"></i>
            </div>
            <div className="step-label">Generate Script</div>
          </div>
        </div>
      </section>

      {/* Main Application Workspace */}
      <main className="main-wrapper">
        <div id="regisForm" className="form-layout">
          <BrandSelection selectedBrand={brand} onSelect={handleBrandSelect} />

          {(brand || configResult) && (
            <div id="formContent" className="form-content-wrapper fade-in" style={{ display: 'block' }}>
              <ConfigForm
                brand={brand}
                onSubmit={handleFormSubmit}
                onReset={handleReset}
                onBulkUpload={handleBulkUpload}
              />
            </div>
          )}

          {configResult && (
            <Terminal
              result={configResult}
              bulkConfigs={bulkConfigs}
              brand={brand}
              sid={lastSid}
            />
          )}
        </div>
      </main>

      {/* Enterprise Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-links">
            <span><i className="fa-solid fa-shield-halved"></i> Internal Network Tool</span>
            <span>•</span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Container */}
      <div id="toastContainer" className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type} toast-visible`}>
            <div className="toast-icon">
              <i className={`fa-solid ${
                t.type === 'success' ? 'fa-circle-check' :
                t.type === 'error'   ? 'fa-circle-xmark' :
                t.type === 'warning' ? 'fa-triangle-exclamation' :
                'fa-circle-info'
              }`}></i>
            </div>
            <span className="toast-msg">{t.message}</span>
            <button
              className="toast-close"
              aria-label="Tutup notifikasi"
              onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default App;
