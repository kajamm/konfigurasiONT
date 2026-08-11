/* ==========================================================================
   HUAWEI ONT — CONFIG GENERATOR
   Format FSP: Frame/Slot/Port/ONT_ID (4 bagian, contoh: 0/1/2/1)
   ========================================================================== */

const VLAN_ACS = 2989;

/**
 * Generate single Huawei ONT config
 * @param {Object} p - Parameter
 * @param {string} p.sid - Service ID
 * @param {string} p.sn - Serial Number (uppercase, 16 HEX)
 * @param {string} p.nama - Nama pelanggan (uppercase, titik sebagai spasi)
 * @param {string} p.vlan - VLAN ID
 * @param {string} p.f - Frame
 * @param {string} p.s - Slot
 * @param {string} p.p - Port
 * @param {string} p.ont_id - ONT ID
 * @param {string} p.password - Password PPPoE
 * @param {boolean} p.isReplace - Ganti ONT
 * @param {string} p.servicePort - Service Port (wajib saat replace, max 2)
 * @param {string} p.lineProfile - Nama Line Profile
 * @returns {string} config string
 */
export function generateSingle({ sid, sn, nama, vlan, f, s, p, ont_id, password, isReplace, servicePort, lineProfile }) {
  const servicePorts = (servicePort || '')
    .split(/[\s\n,]+/)
    .map(item => item.trim())
    .filter(item => item !== '');

  let config = '';
  config += `config\n`;
  if (isReplace) {
    servicePorts.forEach(port => { config += `undo service-port ${port}\n`; });
    config += `\n`;
  }
  config += `interface gpon ${f}/${s}\n\n`;
  if (isReplace) config += `ont delete ${p} ${ont_id}\n\n`;
  config += `ont add ${p} ${ont_id} sn-auth ${sn} omci ont-lineprofile-name ${lineProfile} ont-srvprofile-name ${lineProfile} desc ${sid}-${nama}\n\n`;
  config += `ont ipconfig ${p} ${ont_id} pppoe vlan ${vlan} priority 0 user-account username ${sn} password ${password}\n\n`;
  config += `ont ipconfig ${p} ${ont_id} ip-index 2 dhcp vlan ${VLAN_ACS} priority 5\n\n`;
  config += `ont tr069-server-config ${p} ${ont_id} profile-id 2\n\n`;
  config += `ont internet-config ${p} ${ont_id} ip-index 0\n\n`;
  config += `ont wan-config ${p} ${ont_id} ip-index 0 profile-name ICONNET.AUTOPROV\n\n`;
  config += `ont wan-config ${p} ${ont_id} ip-index 2 profile-id 2\n\n`;
  config += `ont policy-route-config ${p} ${ont_id} profile-name ICONNET.AUTOPROV\n\n`;
  config += `ont port route ${p} ${ont_id} eth 1 enable\n\n`;
  config += `ont port route ${p} ${ont_id} eth 2 enable\n\n`;
  config += `quit\n\n`;
  config += `service-port vlan ${vlan} gpon ${f}/${s}/${p} ont ${ont_id} gemport 1 multi-service user-vlan ${vlan} tag-transform translate\n\n`;
  config += `service-port vlan ${VLAN_ACS} gpon ${f}/${s}/${p} ont ${ont_id} gemport 2 multi-service user-vlan ${VLAN_ACS} tag-transform translate\n\n`;
  config += `save`;
  return config;
}

/**
 * Generate bulk Huawei ONT config (mode ipconfig saja — untuk update credential)
 * @param {Object} p - Parameter
 */
export function generateBulk({ f, s, p, ont_id, vlan, sn, password }) {
  return `ont ipconfig ${p} ${ont_id} pppoe vlan ${vlan} priority 0 user-account username ${sn} password ${password}\n\n`;
}

/**
 * Validasi Serial Number Huawei
 * @param {string} sn - Serial Number uppercase
 * @returns {boolean}
 */
export function validateSN(sn) {
  return /^[A-F0-9]{16}$/.test(sn);
}

/**
 * Info format FSP untuk Huawei
 */
export const fspInfo = {
  placeholder: 'Contoh: 0/1/2/1',
  hint: 'Format Huawei: Frame/Slot/Port/ONT_ID (4 bagian, contoh: 0/1/2/1)',
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
