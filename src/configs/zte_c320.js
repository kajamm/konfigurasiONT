/* ==========================================================================
   ZTE C320 ONT — CONFIG GENERATOR
   Format FSP: Frame/Slot/Port/ONT_ID (4 bagian, contoh: 0/1/2/1)
   Interface: gpon-olt_ / gpon-onu_ (pakai underscore)
   ========================================================================== */

const VLAN_ACS = 2989;
export const DEFAULT_ACS_URL  = 'http://192.168.30.5:5000/acs/';
export const DEFAULT_ACS_USER = 'plniconplus';
export const DEFAULT_ACS_PASS = 'PlnIconPlus!2025';

/**
 * Generate single ZTE C320 ONT config
 * @param {Object} p - Parameter
 * @param {string} p.sid - Service ID
 * @param {string} p.sn - Serial Number (uppercase)
 * @param {string} p.nama - Nama pelanggan (uppercase, titik sebagai spasi)
 * @param {string} p.vlan - VLAN ID
 * @param {string} p.f - Frame
 * @param {string} p.s - Slot
 * @param {string} p.p - Port
 * @param {string} p.ont_id - ONT ID
 * @param {string} p.password - Password PPPoE
 * @param {boolean} p.isReplace - Ganti ONT
 * @param {string} p.acsUrl - ACS URL
 * @param {string} p.acsUsername - ACS Username
 * @param {string} p.acsPassword - ACS Password
 * @returns {string} config string
 */
export function generateSingle({ sid, sn, nama, vlan, f, s, p, ont_id, password, isReplace, acsUrl, acsUsername, acsPassword }) {
  const acsUrlVal  = acsUrl      || DEFAULT_ACS_URL;
  const acsUserVal = acsUsername || DEFAULT_ACS_USER;
  const acsPassVal = acsPassword || DEFAULT_ACS_PASS;

  let config = '';
  config += `config t\ninterface gpon-olt_${f}/${s}/${p}\n`;
  if (isReplace) config += `no onu ${ont_id}\n`;
  config += `onu ${ont_id} type ZTEG-F609 sn ${sn}\nexit\n`;
  config += `interface gpon-onu_${f}/${s}/${p}:${ont_id}\n`;
  config += `description ${sid}-${nama}\n`;
  config += `sn-bind enable sn\n`;
  config += `tcont 1 name HSI profile PPPOE\n`;
  config += `tcont 2 name ACS profile ACS-v2\n`;
  config += `gemport 1 name HSI tcont 1\n`;
  config += `gemport 2 name ACS tcont 2\n`;
  config += `service-port 1 vport 1 user-vlan ${vlan} vlan ${vlan}\n`;
  config += `service-port 2 vport 2 user-vlan ${VLAN_ACS} vlan ${VLAN_ACS}\n`;
  config += `exit\n`;
  config += `pon-onu-mng gpon-onu_${f}/${s}/${p}:${ont_id}\n`;
  config += `service HSI gemport 1 vlan ${vlan}\n`;
  config += `wan-ip 1 mode pppoe username ${sn} password ${password} vlan-profile vlan${vlan} host 1\n`;
  config += `wan-ip 2 mode dhcp vlan-profile vlan${VLAN_ACS} host 2\n`;
  config += `vlan port eth_0/1 mode tag vlan ${vlan}\n`;
  config += `vlan port eth_0/2 mode tag vlan ${vlan}\n`;
  config += `tr069-mgmt 1 state unlock\n`;
  config += `tr069-mgmt 1 acs ${acsUrlVal} validate basic username ${acsUserVal} password ${acsPassVal}\n`;
  config += `tr069-mgmt 1 tag pri 5 vlan ${VLAN_ACS}\n`;
  config += `wan 1 ssid 1 ethuni 1,2 service internet host 1\n`;
  config += `wan 2 service tr069\n`;
  config += `end\n`;
  config += `save\n`;

  return config;
}

/**
 * Generate bulk ZTE C320 ONT config (full provisioning)
 * @param {Object} p - Parameter (sama dengan generateSingle)
 * @returns {string} config string
 */
export function generateBulk(params) {
  return generateSingle(params) + '\n';
}

/**
 * Validasi Serial Number ZTE C320
 * @param {string} sn - Serial Number uppercase
 * @returns {boolean}
 */
export function validateSN(sn) {
  return /^(ZTE|RTEG)[A-Z0-9]{8,12}$/.test(sn);
}

/**
 * Info format FSP untuk ZTE C320
 */
export const fspInfo = {
  placeholder: 'Contoh: 0/1/2/1',
  hint: 'Format ZTE C320: Frame/Slot/Port/ONT_ID (4 bagian, contoh: 0/1/2/1)',
  parts: 4,
};

/**
 * Parse FSP string → { f, s, p, ont_id }
 * @param {string} fsp
 * @returns {{ f, s, p, ont_id } | null}
 */
export function parseFSP(fsp) {
  const parts = fsp.split('/');
  if (parts.length !== 4 || !parts.every(x => /^\d+$/.test(x.trim()))) return null;
  const [f, s, p, ont_id] = parts;
  return { f, s, p, ont_id };
}
