/* ==========================================================================
   RAISECOM ONT — CONFIG GENERATOR
   Format FSP: Frame/Slot/ONT_ID (3 bagian, contoh: 0/1/1)
   Catatan: SN dengan prefix ZTE → konfigurasi lebih singkat (early return)
   ========================================================================== */

const VLAN_ACS = 2989;

/**
 * Generate single Raisecom ONT config
 * @param {Object} p - Parameter
 * @param {string} p.sid - Service ID
 * @param {string} p.sn - Serial Number (uppercase)
 * @param {string} p.nama - Nama pelanggan (uppercase, titik sebagai spasi)
 * @param {string} p.vlan - VLAN ID
 * @param {string} p.f - Frame
 * @param {string} p.s - Slot
 * @param {string} p.ont_id - ONT ID
 * @param {string} p.password - Password PPPoE
 * @param {boolean} p.isReplace - Ganti ONT
 * @param {string|number} p.lineProfile - Line Profile ID (angka)
 * @returns {string} config string
 */
export function generateSingle({ sid, sn, nama, vlan, f, s, ont_id, password, isReplace, lineProfile }) {
  const lpId = lineProfile || '1';
  const isZTESN = sn.startsWith('ZTE');

  let config = '';
  config += `config\n`;
  config += `interface gpon-olt ${f}/${s}\n`;
  if (isReplace) config += `no create gpon-onu ${ont_id}\n`;
  config += `create gpon-onu ${ont_id} sn ${sn} line-profile-id ${lpId} service-profile-id 3\n`;
  config += `quit\n`;
  config += `interface gpon-onu ${f}/${s}/${ont_id}\n`;
  config += `description ${sid}-${nama}\nquit\n`;

  // SN ZTE di OLT Raisecom: konfigurasi lebih singkat (tidak perlu iphost)
  if (isZTESN) return config;

  config += `gpon-onu ${f}/${s}/${ont_id}\n`;
  config += `iphost 1 mode pppoe\n`;
  config += `iphost 1 pppoe username ${sn} password ${password}\n`;
  config += `iphost 1 vlan ${vlan}\n`;
  config += `iphost 1 service mode route nat enable cos 0 portlist 1,2 ssidlist 1\n`;
  config += `iphost 1 service Internet\n`;
  config += `iphost 2 mode dhcp\n`;
  config += `iphost 2 vlan ${VLAN_ACS}\n`;
  config += `iphost 2 service management\nend`;

  return config;
}

/**
 * Generate bulk Raisecom ONT config (mode ipconfig saja — untuk update credential)
 * @param {Object} p - Parameter
 */
export function generateBulk({ f, s, ont_id, vlan, sn, password }) {
  return `ont ipconfig ${s} ${ont_id} pppoe vlan ${vlan} priority 0 user-account username ${sn} password ${password}\n\n`;
}

/**
 * Validasi Serial Number Raisecom
 * @param {string} sn - Serial Number uppercase
 * @returns {boolean}
 */
export function validateSN(sn) {
  return (
    /^RCMG[A-Z0-9]{8,12}$/.test(sn) ||
    /^ZTE[A-Z0-9]{8,12}$/.test(sn)  ||
    /^AIS[A-Z0-9]{8,12}$/.test(sn)
  );
}

/**
 * Info format FSP untuk Raisecom
 */
export const fspInfo = {
  placeholder: 'Contoh: 0/1/1',
  hint: 'Format Raisecom: Frame/Slot/ONT_ID (3 bagian, contoh: 0/1/1)',
  parts: 3,
};

/**
 * Parse FSP string → { f, s, ont_id }
 * @param {string} fsp
 * @returns {{ f, s, ont_id } | null}
 */
export function parseFSP(fsp) {
  const parts = fsp.split('/');
  if (parts.length !== 3 || !parts.every(x => /^\d+$/.test(x.trim()))) return null;
  const [f, s, ont_id] = parts;
  return { f, s, ont_id };
}
