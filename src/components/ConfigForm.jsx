import { useState, useEffect, useRef } from 'react';

export default function ConfigForm({ brand, onSubmit, onReset, onBulkUpload }) {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    sid: '', sn: '', nama: '', vlan: '', fsp: '', password: '', 
    autoPassword: 'no', isReplace: false, servicePort: '',
    lineProfileHuawei: '', lineProfileRaisecom: '',
    acsUrl: 'http://192.168.30.5:5000/acs/', acsUsername: 'plniconplus', acsPassword: 'PlnIconPlus!2025'
  });

  // Auto password: YYYYMMDD dari tanggal hari ini
  useEffect(() => {
    if (formData.autoPassword === 'yes') {
      const today = new Date();
      const formatted = today.toISOString().split('T')[0].replace(/-/g, '');
      setFormData(prev => ({ ...prev, password: formatted }));
    } else {
      setFormData(prev => ({ ...prev, password: '' }));
    }
  }, [formData.autoPassword]);

  // Reset form saat brand berubah
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      fsp: '', sn: '', servicePort: '', lineProfileHuawei: '', lineProfileRaisecom: ''
    }));
  }, [brand]);

  const getFspPlaceholder = () => {
    switch (brand) {
      case 'Huawei':    return 'Contoh: 0/1/2/1';
      case 'Raisecom':  return 'Contoh: 0/1/1';
      case 'ZTE_C320':  return 'Contoh: 0/1/2/1';
      case 'ZTE_C610':  return 'Contoh: 0/1/2/1';
      case 'BDCOM':     return 'Contoh: 1/2';
      default:          return 'Pilih brand terlebih dahulu';
    }
  };

  const getFspHint = () => {
    switch (brand) {
      case 'Huawei':   return 'Format Huawei: Frame/Slot/Port/ONT_ID (4 bagian, contoh: 0/1/2/1)';
      case 'Raisecom': return 'Format Raisecom: Frame/Slot/ONT_ID (3 bagian, contoh: 0/1/1)';
      case 'ZTE_C320': return 'Format ZTE C320: Frame/Slot/Port/ONT_ID (4 bagian, contoh: 0/1/2/1)';
      case 'ZTE_C610': return 'Format ZTE C610: Frame/Slot/Port/ONT_ID (4 bagian, contoh: 0/1/2/1)';
      case 'BDCOM':    return 'Format BDCOM: Frame/Slot (2 bagian, contoh: 1/2) — Angka tidak boleh diawali 0';
      default:         return 'Format FSP akan menyesuaikan brand yang dipilih';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let formattedValue = value;
    if (name === 'nama') {
      formattedValue = value.toUpperCase().replace(/\s+/g, ".");
    } else if (name === 'sn') {
      formattedValue = value.toUpperCase();
    } else if (name === 'fsp') {
      // Hanya izinkan angka dan slash (/)
      formattedValue = value.replace(/[^0-9/]/g, "");
    } else if (name === 'vlan') {
      // VLAN hanya angka
      formattedValue = value.replace(/[^0-9]/g, "");
    }
    // SID bisa alphanumeric — tidak ada filter khusus

    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : formattedValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      onBulkUpload(evt.target.result);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* Card 1: Customer Metadata */}
      <article className="card">
        <div className="card-header">
          <div className="card-header-icon">
            <i className="fa-solid fa-user-gear"></i>
          </div>
          <div>
            <h2 className="card-title">Customer Details</h2>
            <p className="card-subtitle">Identitas dan Service ID pelanggan</p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="nama">
              <i className="fa-solid fa-user"></i> Customer Name
            </label>
            <input
              type="text" id="nama" name="nama"
              placeholder="Masukkan nama pelanggan"
              value={formData.nama} onChange={handleChange} required
            />
          </div>

          <div className="form-group">
            <label htmlFor="sid">
              <i className="fa-solid fa-id-card"></i> SID (Service ID)
            </label>
            <input
              type="text" id="sid" name="sid"
              placeholder="Contoh: 16258930"
              value={formData.sid} onChange={handleChange} required
            />
          </div>
        </div>
      </article>

      {/* Card 2: Security & Credentials */}
      <article className="card">
        <div className="card-header">
          <div className="card-header-icon">
            <i className="fa-solid fa-key"></i>
          </div>
          <div>
            <h2 className="card-title">Authentication &amp; Password</h2>
            <p className="card-subtitle">Atur kredensial akses PPPoE</p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="autoPassword">
              <i className="fa-solid fa-calendar-check"></i> Password Otomatis Hari Ini?
            </label>
            <select id="autoPassword" name="autoPassword" value={formData.autoPassword} onChange={handleChange}>
              <option value="no">Tidak — Isi Manual</option>
              <option value="yes">Ya — Gunakan Tanggal Hari Ini</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <i className="fa-solid fa-lock"></i> Password PPPoE
            </label>
            <input
              type="text" id="password" name="password"
              placeholder="Masukkan password PPPoE"
              value={formData.password} onChange={handleChange}
              readOnly={formData.autoPassword === 'yes'}
              className={formData.autoPassword === 'yes' ? 'readonly-filled' : ''}
            />
            <span className="field-hint" id="passwordHint">
              {formData.autoPassword === 'yes'
                ? `Password otomatis: ${formData.password} (tanggal hari ini)`
                : 'Pilih "Ya" untuk auto-isi dengan tanggal hari ini'}
            </span>
          </div>
        </div>
      </article>

      {/* Card 3: Network & Hardware Settings */}
      <article className="card">
        <div className="card-header">
          <div className="card-header-icon">
            <i className="fa-solid fa-diagram-project"></i>
          </div>
          <div>
            <h2 className="card-title">PON &amp; Port Configuration</h2>
            <p className="card-subtitle">Spesifikasi Serial Number, VLAN, dan Interface</p>
          </div>
        </div>

        <div className="form-grid">
          {/* Serial Number */}
          <div className="form-group form-grid-full">
            <label htmlFor="sn">
              <i className="fa-solid fa-barcode"></i> Serial Number (SN)
            </label>
            <input
              type="text" id="sn" name="sn"
              placeholder="Masukkan Serial Number ONT"
              value={formData.sn} onChange={handleChange} required
            />
            <span id="snHint" className="field-hint">
              Huawei (16 Karakter HEX), Raisecom/ZTE (Prefix RCMG/ZTE/AIS/RTEG)
            </span>
          </div>

          {/* F/S/P/ONT ID */}
          <div className="form-group">
            <label htmlFor="fsp">
              <i className="fa-solid fa-network-wired"></i> F/S/P/ONT ID
            </label>
            <input
              type="text" id="fsp" name="fsp"
              placeholder={getFspPlaceholder()}
              value={formData.fsp} onChange={handleChange} required
            />
            <span id="fspHint" className="field-hint">{getFspHint()}</span>
          </div>

          {/* VLAN */}
          <div className="form-group">
            <label htmlFor="vlan">
              <i className="fa-solid fa-ethernet"></i> VLAN
            </label>
            <input
              type="text" id="vlan" name="vlan"
              placeholder="Contoh: 2900"
              value={formData.vlan} onChange={handleChange} required
            />
            <span id="vlanHint" className="field-hint">Wajib berupa angka (contoh: 2900)</span>
          </div>

          {/* Replace ONT */}
          <div className="form-group form-grid-full">
            <label htmlFor="replace">
              <i className="fa-solid fa-arrows-rotate"></i> Ganti ONT ? (Replace)
            </label>
            <select id="replace" name="isReplace"
              value={formData.isReplace ? "true" : "false"}
              onChange={(e) => setFormData(prev => ({ ...prev, isReplace: e.target.value === "true" }))}
            >
              <option value="false">Tidak — Registrasi Baru</option>
              <option value="true">Ya — Ganti ONT Lama</option>
            </select>
          </div>

          {/* Dynamic Fields: Huawei */}
          {brand === 'Huawei' && (
            <>
              <div className={`form-group form-grid-full ${formData.isReplace ? 'field-group-visible' : 'field-group-hidden'}`} id="servicePortGroup">
                <label htmlFor="servicePort">
                  <i className="fa-solid fa-plug-circle-plus"></i> Service-Port
                  <span className="label-badge" id="servicePortBadge">Wajib saat Replace</span>
                </label>
                <input
                  type="text" id="servicePort" name="servicePort"
                  placeholder="Contoh: 3300 atau 3300, 2123"
                  value={formData.servicePort} onChange={handleChange}
                />
                <span className="field-hint">
                  Hanya dibutuhkan saat Replace ONT — untuk perintah <code>undo service-port</code>
                </span>
              </div>

              <div className="form-group form-grid-full">
                <label htmlFor="lineProfileHuawei">
                  <i className="fa-solid fa-list-check"></i> Nama Line Profile
                </label>
                <input
                  type="text" id="lineProfileHuawei" name="lineProfileHuawei"
                  placeholder="Contoh: NEWAP"
                  value={formData.lineProfileHuawei} onChange={handleChange}
                />
              </div>
            </>
          )}

          {/* Dynamic Fields: Raisecom */}
          {brand === 'Raisecom' && (
            <div className="form-group form-grid-full">
              <label htmlFor="lineProfileRaisecom">
                <i className="fa-solid fa-list-check"></i> Line Profile ID (Angka saja)
              </label>
              <input
                type="text" id="lineProfileRaisecom" name="lineProfileRaisecom"
                placeholder="Contoh: 1"
                value={formData.lineProfileRaisecom} onChange={handleChange}
              />
              <span className="field-hint">Line Profile ID wajib berupa angka saja</span>
            </div>
          )}
        </div>
      </article>

      {/* Advanced Settings: ACS / TR-069 (hanya untuk ZTE & BDCOM tidak — sesuai legacy) */}
      {(brand === 'ZTE_C320' || brand === 'ZTE_C610') && (
        <article className="card advanced-card" id="advancedCard">
          <div className="card-header advanced-card-header">
            <div className="card-header-icon">
              <i className="fa-solid fa-gear"></i>
            </div>
            <div className="advanced-header-text">
              <h2 className="card-title">Advanced Settings — ACS / TR-069</h2>
              <p className="card-subtitle">Konfigurasi server ACS untuk provisioning TR-069</p>
            </div>
          </div>
          <div className="form-grid" style={{ padding: '1.5rem' }}>
            <div className="form-group form-grid-full">
              <label htmlFor="acsUrl"><i className="fa-solid fa-server"></i> ACS URL</label>
              <input type="text" id="acsUrl" name="acsUrl" value={formData.acsUrl} onChange={handleChange} />
              <span className="field-hint">URL server ACS untuk konfigurasi TR-069</span>
            </div>
            <div className="form-group">
              <label htmlFor="acsUsername"><i className="fa-solid fa-user-shield"></i> ACS Username</label>
              <input type="text" id="acsUsername" name="acsUsername" value={formData.acsUsername} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="acsPassword"><i className="fa-solid fa-shield-halved"></i> ACS Password</label>
              <input type="text" id="acsPassword" name="acsPassword" value={formData.acsPassword} onChange={handleChange} />
            </div>
          </div>
        </article>
      )}

      {/* Action Toolbar */}
      <div className="action-toolbar">
        <button type="submit" id="generateBtn">
          <i className="fa-solid fa-rocket"></i> Generate
        </button>

        <div className="toolbar-buttons">
          <button type="button" id="bulkUploadBtn" className="bulk-btn" onClick={() => fileInputRef.current?.click()}>
            <i className="fa-solid fa-file-csv"></i> Bulk CSV
          </button>
          <input type="file" ref={fileInputRef} accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />

          <button type="button" id="resetBtn" onClick={onReset}>
            <i className="fa-solid fa-rotate-left"></i> Reset
          </button>
        </div>
      </div>
    </form>
  );
}
