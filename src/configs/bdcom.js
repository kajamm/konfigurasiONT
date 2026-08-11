/* ==========================================================================
   BDCOM ONT — CONFIG GENERATOR
   Format FSP: Frame/Slot (2 bagian, contoh: 1/2 — angka tidak boleh diawali 0)
   Interface: gpon 0/{f}:{s}
   ACS: hardcoded via profile (tcont-virtual-port-bind-profile, flow-mapping-profile, veip)
   ========================================================================== */

const VLAN_ACS = 2989;

/**
 * Generate single BDCOM ONT config
 * @param {Object} p - Parameter
 * @param {string} p.sid - Service ID
 * @param {string} p.sn - Serial Number (uppercase)
 * @param {string} p.nama - Nama pelanggan (uppercase, titik sebagai spasi)
 * @param {string} p.vlan - VLAN ID
 * @param {string} p.f - Frame
 * @param {string} p.s - Slot
 * @param {string} p.password - Password PPPoE
 * @returns {string} config string
 */
export function generateSingle({ sid, sn, nama, vlan, f, s, password }) {
  let config = '';
  config += `config\ninterface gpon 0/${f}:${s}\n`;
  config += `description ${sid}-${nama}\n`;
  config += `gpon onu wan 1 admin-status enable\n`;
  config += `gpon onu wan 1 nat enable\n`;
  config += `gpon onu wan 1 service-type internet\n`;
  config += `gpon onu wan 1 connection-type pppoe\n`;
  config += `gpon onu wan 1 pppoe username ${sn} password ${password}\n`;
  config += `gpon onu wan 1 tci vlan ${vlan}\n`;
  config += `gpon onu wan 1 bind lan1 lan2 ssid1\n`;
  config += `gpon onu wan 1 auto-get-dns-address enable\n`;
  config += `gpon onu wan 1 lan-dhcp enable\n`;
  config += `gpon onu wan 2 admin-status enable\n`;
  config += `gpon onu wan 2 nat disable\n`;
  config += `gpon onu wan 2 service-type tr069\n`;
  config += `gpon onu wan 2 connection-type dhcp\n`;
  config += `gpon onu wan 2 tci vlan ${VLAN_ACS}\n`;
  config += `gpon onu tcont-virtual-port-bind-profile tvbind-default-ACS-v2\n`;
  config += `gpon onu flow-mapping-profile flow-mapping-default-hgu-ACS-v2\n`;
  config += `gpon onu veip 1 veip-profile ACS-v2\n`;
  config += `gpon onu ip-host 2 option dhcp\n`;
  config += `quit\n`;
  config += `write all\n`;
  return config;
}

/**
 * Generate bulk BDCOM ONT config (full provisioning)
 * @param {Object} p - Parameter (sama dengan generateSingle)
 * @returns {string} config string
 */
export function generateBulk(params) {
  return generateSingle(params) + '\n';
}

/**
 * Validasi Serial Number BDCOM (alfanumerik, 8-20 karakter)
 * @param {string} sn - Serial Number uppercase
 * @returns {boolean}
 */
export function validateSN(sn) {
  return /^[A-Z0-9]{8,20}$/.test(sn);
}

/**
 * Info format FSP untuk BDCOM
 */
export const fspInfo = {
  placeholder: 'Contoh: 1/2',
  hint: 'Format BDCOM: Frame/Slot (2 bagian, contoh: 1/2) — Angka tidak boleh diawali 0',
  parts: 2,
};

/**
 * Parse FSP string → { f, s }
 * @param {string} fsp
 * @returns {{ f, s } | null}
 */
export function parseFSP(fsp) {
  const parts = fsp.split('/');
  if (parts.length !== 2) return null;
  const [f, s] = parts;
  // Angka tidak boleh diawali 0
  if (!/^[1-9]\d*$/.test(f) || !/^[1-9]\d*$/.test(s)) return null;
  return { f, s };
}
