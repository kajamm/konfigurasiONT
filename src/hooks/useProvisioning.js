/* ==========================================================================
   useProvisioning — React Hook
   Orchestrates config generation using brand-specific modules from src/configs/.
   
   Untuk menambah brand baru:
     1. Buat file config baru di src/configs/<nama_brand>.js
     2. Daftarkan di src/configs/index.js
     3. Tambahkan validasi khusus di bawah jika perlu
   ========================================================================== */

import { useState } from 'react';
import { BRAND_CONFIGS } from '../configs';

export function useProvisioning() {
  const [bulkConfigs, setBulkConfigs] = useState(null);

  const showToast = (message, type = 'info') => {
    const event = new CustomEvent('show-toast', { detail: { message, type } });
    window.dispatchEvent(event);
  };

  // ==========================================================================
  // SINGLE CONFIG GENERATION
  // ==========================================================================
  const generateConfig = (formData, brand) => {
    setBulkConfigs(null);

    const mod = BRAND_CONFIGS[brand];
    if (!mod) {
      showToast('Pilih Brand OLT terlebih dahulu!', 'error');
      return null;
    }

    let { sid, sn, nama, vlan, fsp, password, autoPassword, isReplace,
          servicePort, lineProfileHuawei, lineProfileRaisecom,
          acsUrl, acsUsername, acsPassword } = formData;

    // --- Auto password: format YYYYMMDD dari tanggal hari ini ---
    if (autoPassword === 'yes') {
      password = new Date().toISOString().split('T')[0].replace(/-/g, '');
    }

    // --- Validasi field wajib ---
    const requiredMap = {
      'Customer Name':   nama,
      'SID':             sid,
      'Serial Number':   sn,
      'VLAN':            vlan,
      'F/S/P/ONT ID':   fsp,
      'Password PPPoE':  password,
    };
    for (const [label, val] of Object.entries(requiredMap)) {
      if (!val || !String(val).trim()) {
        showToast(`${label} tidak boleh kosong!`, 'error');
        return null;
      }
    }

    // --- Validasi VLAN numerik ---
    if (!/^\d+$/.test(vlan)) {
      showToast('VLAN harus berupa angka saja. Contoh: 2900', 'error');
      return null;
    }

    // --- Validasi Serial Number per brand ---
    const snUpper = sn.toUpperCase();
    if (!mod.validateSN(snUpper)) {
      showToast('Serial Number tidak valid. Periksa format SN sesuai brand yang dipilih.', 'error');
      return null;
    }

    // --- Validasi & parse FSP ---
    const fspParsed = mod.parseFSP(fsp.trim());
    if (!fspParsed) {
      showToast(`Format FSP tidak valid untuk brand ${brand}. ${mod.fspInfo.hint}`, 'error');
      return null;
    }

    // --- Normalize ---
    const namaNorm = nama.toUpperCase().replace(/\s+/g, '.');

    // --- Validasi brand-specific ---
    if (brand === 'Huawei') {
      if (!lineProfileHuawei || !lineProfileHuawei.trim()) {
        showToast('Nama Line Profile tidak boleh kosong untuk Huawei!', 'error');
        return null;
      }
      const sp = (servicePort || '').split(/[\s\n,]+/).map(s => s.trim()).filter(Boolean);
      if (sp.length > 2) {
        showToast('Maksimal hanya 2 Service Port yang diizinkan. Contoh: 3300, 2123', 'error');
        return null;
      }
      if (isReplace && sp.length === 0) {
        showToast('Service-Port wajib diisi saat Replace ONT!', 'error');
        return null;
      }
    }

    if (brand === 'Raisecom') {
      const lp = lineProfileRaisecom || '1';
      if (!/^\d+$/.test(lp)) {
        showToast('Line Profile ID Raisecom harus berupa angka saja. Contoh: 1', 'error');
        return null;
      }
    }

    // --- Build params dan generate ---
    const params = {
      sid,
      sn: snUpper,
      nama: namaNorm,
      vlan,
      password,
      isReplace,
      ...fspParsed,
      // Huawei-specific
      servicePort,
      lineProfile: brand === 'Huawei' ? lineProfileHuawei : (lineProfileRaisecom || '1'),
      // ZTE-specific
      acsUrl,
      acsUsername,
      acsPassword,
    };

    const config = mod.generateSingle(params);

    showToast('Konfigurasi berhasil di-generate!', 'success');
    return config;
  };

  // ==========================================================================
  // BULK CSV PROCESSING
  // ==========================================================================
  const processBulkCSV = (csvText) => {
    const rows = csvText.split(/\r?\n/).filter(r => r.trim() !== '');
    if (rows.length === 0) {
      showToast('File CSV kosong.', 'error');
      return null;
    }

    const header = rows[0].toLowerCase();
    if (!header.includes('brand') || !header.includes('sn')) {
      showToast('Format CSV tidak valid. Pastikan header sesuai template.', 'error');
      return null;
    }

    let bConfigs = {};
    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i < rows.length; i++) {
      // Kolom: 0=Brand, 1=SN, 2=FSP, 3=VLAN, 4=SID, 5=Nama, 6=Password, 7=Replace, 8=ServicePort, 9=LineProfile
      const cols    = rows[i].split(',').map(c => c.trim());
      if (cols.length < 6) { errorCount++; continue; }

      const brand      = cols[0];
      const sn         = cols[1].toUpperCase();
      const fspVal     = cols[2];
      const vlan       = cols[3];
      const sid        = cols[4];
      const nama       = cols[5].toUpperCase().replace(/\s+/g, '.');
      const password   = cols[6] || '';
      const isReplace  = (cols[7] && cols[7].toLowerCase() === 'ya');
      const servicePort = cols[8] || '';
      const lineProfile = cols[9] || '';

      const mod = BRAND_CONFIGS[brand];
      if (!mod) { errorCount++; continue; }

      const fspParsed = mod.parseFSP(fspVal);
      if (!fspParsed) { errorCount++; continue; }

      const params = {
        sid, sn, nama, vlan, password, isReplace,
        servicePort, lineProfile,
        ...fspParsed,
        // ZTE: pakai default ACS values (tidak ada di CSV)
        acsUrl:      'http://192.168.30.5:5000/acs/',
        acsUsername: 'plniconplus',
        acsPassword: 'PlnIconPlus!2025',
      };

      let config = '';
      if (brand !== 'Huawei' && brand !== 'Raisecom') {
        config += `! === START CONFIG BARIS ${i + 1} (${brand} - ${sn}) ===\n`;
      }
      config += mod.generateBulk(params);

      if (!bConfigs[brand]) bConfigs[brand] = '';
      bConfigs[brand] += config;
      successCount++;
    }

    setBulkConfigs(bConfigs);

    let bulkConfigResult = '';
    for (const [brand, cfg] of Object.entries(bConfigs)) {
      if (cfg.trim()) {
        bulkConfigResult += `! ========================================\n`;
        bulkConfigResult += `! BULK CONFIG - ${brand.toUpperCase()}\n`;
        bulkConfigResult += `! ========================================\n\n${cfg}\n`;
      }
    }

    showToast(
      `Bulk config selesai: ${successCount} berhasil, ${errorCount} gagal.`,
      successCount > 0 ? 'success' : 'warning'
    );
    return bulkConfigResult;
  };

  return { generateConfig, processBulkCSV, bulkConfigs, setBulkConfigs };
}
