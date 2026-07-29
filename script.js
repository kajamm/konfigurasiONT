// Autofill password dari tanggal hari ini
window.onload = () => {
  const auto = document.getElementById("autoPassword");
  const passwordField = document.getElementById("password");

  const autofillPassword = () => {
    if (auto.value === "yes") {
      const today = new Date();
      const formatted = today.toISOString().split("T")[0].replace(/-/g, "");
      passwordField.value = formatted;
      passwordField.readOnly = true;
    } else {
      passwordField.value = "";
      passwordField.readOnly = false;
    }
  };

  autofillPassword(); // dijalankan saat pertama kali load
  auto.addEventListener("change", autofillPassword);
};

// Dinamis input berdasarkan brand
const brandSelect = document.getElementById("brand");
const dynamicFields = document.getElementById("dynamicFields");

brandSelect.addEventListener("change", () => {
  const selected = brandSelect.value;
  dynamicFields.innerHTML = "";

  if (selected === "Huawei") {
    dynamicFields.innerHTML = `
      <label>Service-Port</label>
      <input type="text" id="servicePort" placeholder="Contoh: 3300,2123" required>
      <label>Nama Line Profile</label>
      <input type="text" id="lineProfileHuawei" placeholder="Misal: NEWAP" required>
    `;
  } else if (selected === "Raisecom") {
    dynamicFields.innerHTML = `
      <label>Line Profile ID</label>
      <input type="text" id="lineProfileRaisecom" placeholder="Misal: 1" required>
    `;
  }
});

// Validasi real-time SN berdasarkan brand
const snInput = document.getElementById("sn");

function validateSN() {
  const brand = brandSelect.value;
  const sn = snInput.value.trim().toUpperCase();

  let isValid = false;
  let message = "";

  if (brand === "Huawei") {
    isValid = /^[A-F0-9]{16}$/.test(sn);
    message = "SN Huawei harus 16 karakter HEX (A-F, 0-9)";
  } else if (brand === "Raisecom") {
    isValid = /^RCMG[A-Z0-9]{8,12}$/.test(sn) || /^ZTE[A-Z0-9]{8,12}$/.test(sn) || /^AIS[A-Z0-9]{8,12}$/.test(sn);
    message = "SN harus Raisecom, ZTE atau AIS";
  } else if (brand === "ZTE_C320" || brand === "ZTE_C610") {
    isValid = /^(ZTE|RTEG)[A-Z0-9]{8,12}$/.test(sn);
    message = "SN ZTE harus diawali ZTE dan panjang 12–16 karakter";
  } else {
    isValid = /^[A-Z0-9]{8,20}$/.test(sn);
    message = "Format SN tidak dikenali";
  }

  if (!isValid) {
    snInput.style.borderColor = "red";
    snInput.title = message;
  } else {
    snInput.style.borderColor = "";
    snInput.title = "";
  }

  return isValid;
}

snInput.addEventListener("input", validateSN);
brandSelect.addEventListener("change", validateSN);

// Submit Form
document.getElementById("regisForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const sid = document.getElementById("sid").value;
  const sn = snInput.value.trim().toUpperCase();
  const nama = document.getElementById("nama").value.toUpperCase().replace(/\s+/g, ".");
  const brand = brandSelect.value;
  const fspInput = document.getElementById("fsp").value;
  const vlan = document.getElementById("vlan").value;
  const password = document.getElementById("password").value;
  const isReplace = document.getElementById("replace").value === "true";

  if (!sid || !sn || !nama || !fspInput || !vlan || !password) {
    alert("⚠️ Semua kolom wajib diisi!!! .");
    return;
  }

  if (!validateSN()) {
    alert("❌ Serial Number tidak valid (cek lagi yee)!! .");
    return;
  }


  const fspParts = fspInput.split("/");

  let f, s, p, ont_id;

  if (brand === "Raisecom" && fspParts.length === 3) {
    [f, s, ont_id] = fspParts;
  } else if (brand === "BDCOM") {
    const bdcomPattern = /^[1-9]\d*\/[1-9]\d*$/;
    if (!bdcomPattern.test(fspInput.trim())) {
      alert("⚠️ hapus 0 nya yudo goblokkk!! (format BDCOM harus f/s, contoh: 1/2)");
      return;
    }
    [f, s] = fspInput.trim().split("/"); // pakai fspInput, bukan fsp
  } else if (fspParts.length === 4) {
    [f, s, p, ont_id] = fspParts;
  } else {
    alert("⚠️ Format FSP tidak sesuai dengan brand yang dipilih (fokus blok!!!)");
    return;
  }


  let config = "";

  // Huawei
  if (brand === "Huawei") {
    const servicePort = document.getElementById("servicePort")?.value;
    const lineProfile = document.getElementById("lineProfileHuawei")?.value;

    if (!servicePort || !lineProfile) {
      alert("Harap isi Service-Port dan Line Profile untuk OLT Huawei.");
      return;
    }

    const servicePorts = servicePort
      .split(/[\s\n,]+/)
      .map(item => item.trim())
      .filter(item => item !== "");

    config += `config\n`;
    if (isReplace) {
      servicePorts.forEach(port => {
        config += `undo service-port ${port}\n`;
      });
      config += `\n`;
    }

    config += `interface gpon ${f}/${s}\n\n`;

    if (isReplace) config += `ont delete ${p} ${ont_id}\n\n`;

    config += `ont add ${p} ${ont_id} sn-auth ${sn} omci ont-lineprofile-name ${lineProfile} ont-srvprofile-name ${lineProfile} desc ${sid}-${nama}\n\n`;

    config += `ont ipconfig ${p} ${ont_id} pppoe vlan ${vlan} priority 0 user-account username ${sn} password ${password}\n\n`;

    config += `ont ipconfig ${p} ${ont_id} ip-index 2 dhcp vlan 2989 priority 5\n\n`;

    config += `ont tr069-server-config ${p} ${ont_id} profile-id 2\n\n`;

    config += `ont internet-config ${p} ${ont_id} ip-index 0\n\n`;

    config += `ont wan-config ${p} ${ont_id} ip-index 0 profile-name ICONNET.AUTOPROV\n\n`;

    config += `ont wan-config ${p} ${ont_id} ip-index 2 profile-id 2\n\n`;

    config += `ont policy-route-config ${p} ${ont_id} profile-name ICONNET.AUTOPROV\n\n`;

    config += `ont port route ${p} ${ont_id} eth 1 enable\n\n`;

    config += `ont port route ${p} ${ont_id} eth 2 enable\n\n`;

    config += `quit\n\n`;

    if (servicePorts.length > 0) {
      config += `service-port ${servicePorts[0]} vlan ${vlan} gpon ${f}/${s}/${p} ont ${ont_id} gemport 1 multi-service user-vlan ${vlan} tag-transform translate\n\n`;
    } else {
      config += `service-port vlan ${vlan} gpon ${f}/${s}/${p} ont ${ont_id} gemport 1 multi-service user-vlan ${vlan} tag-transform translate\n\n`;
    }

    if (servicePorts.length > 1) {
      config += `service-port ${servicePorts[1]} vlan 2989 gpon ${f}/${s}/${p} ont ${ont_id} gemport 2 multi-service user-vlan 2989 tag-transform translate\n\n`;
    } else {
      config += `service-port vlan 2989 gpon ${f}/${s}/${p} ont ${ont_id} gemport 2 multi-service user-vlan 2989 tag-transform translate\n\n`;
    }

    config += `save`;

  }

  // Raisecom
  else if (brand === "Raisecom") {
    const lineProfile = document.getElementById("lineProfileRaisecom")?.value;
    const isZTESN = sn.startsWith("ZTE");

    config += `config\n`;
    config += `interface gpon-olt ${f}/${s}\n`;
    if (isReplace) config += `no create gpon-onu ${ont_id}\n`;
    config += `create gpon-onu ${ont_id} sn ${sn} line-profile-id ${lineProfile} service-profile-id 1\n`;
    config += `quit\n`;
    config += `interface gpon-onu ${f}/${s}/${ont_id}\n`;
    config += `description ${sid}-${nama}\nquit\n`;

    if (isZTESN) {
      document.getElementById("configResult").textContent = config;
      document.getElementById("output").style.display = "block";
      document.getElementById("output").scrollIntoView({ behavior: "smooth" });
      return;
    }

    config += `gpon-onu ${f}/${s}/${ont_id}\n`;
    config += `iphost 1 mode pppoe\n`;
    config += `iphost 1 pppoe username ${sn} password ${password}\n`;
    config += `iphost 1 vlan ${vlan}\n`;
    config += `iphost 1 service mode route nat enable cos 0 portlist 1,2 ssidlist 1\n`;
    config += `iphost 1 service Internet\n`;
    config += `iphost 2 mode dhcp\n`;
    config += `iphost 2 vlan 2989\n`;
    config += `iphost 2 service management\nend`;

  }

  // ZTE_C320
  else if (brand === "ZTE_C320") {
    // Asumsi VLAN ACS adalah 2989 sesuai referensi, bisa diganti dengan parameter dinamis jika perlu
    const vlan_acs = 2989;

    config += `config t\ninterface gpon-olt_${f}/${s}/${p}\n`;
    if (isReplace) config += `no onu ${ont_id}\n`;
    config += `onu ${ont_id} type ZTEG-F609 sn ${sn}\nexit\n`;

    // Interface ONU
    config += `interface gpon-onu_${f}/${s}/${p}:${ont_id}\n`;
    config += `description ${sid}-${nama}\n`;
    config += `sn-bind enable sn\n`;
    config += `tcont 1 name HSI profile PPPOE\n`;
    config += `tcont 2 name ACS profile ACS-v2\n`; // Tambahan TCONT ACS
    config += `gemport 1 name HSI tcont 1\n`;
    config += `gemport 2 name ACS tcont 2\n`;
    config += `service-port 1 vport 1 user-vlan ${vlan} vlan ${vlan}\n`;
    config += `service-port 2 vport 2 user-vlan ${vlan_acs} vlan ${vlan_acs}\n`; // Tambahan Service Port ACS
    config += `exit\n`;

    // PON ONU MNG
    config += `pon-onu-mng gpon-onu_${f}/${s}/${p}:${ont_id}\n`;
    config += `service HSI gemport 1 vlan ${vlan}\n`;
    config += `wan-ip 1 mode pppoe username ${sn} password ${password} vlan-profile vlan${vlan} host 1\n`;
    config += `wan-ip 2 mode dhcp vlan-profile vlan${vlan_acs} host 2\n`; // Tambahan WAN IP 2 untuk TR069
    config += `vlan port eth_0/1 mode tag vlan ${vlan}\n`;
    config += `vlan port eth_0/2 mode tag vlan ${vlan}\n`; // Tambahan tag VLAN untuk eth_0/2

    // Tambahan Konfigurasi TR069 dan Binding WAN
    config += `tr069-mgmt 1 state unlock\n`;
    config += `tr069-mgmt 1 acs http://192.168.30.5:5000/acs/ validate basic username plniconplus password PlnIconPlus!2025\n`;
    config += `tr069-mgmt 1 tag pri 5 vlan ${vlan_acs}\n`;
    config += `wan 1 ssid 1 ethuni 1,2 service internet host 1\n`;
    config += `wan 2 service tr069\n`;

    // Catatan: Baris 'dhcp-ip ethuni eth_0/1 from-onu' dari code lama kamu 
    // tidak ada di referensi config terbaru. Jika tetap butuh, uncomment baris di bawah:
    // config += `dhcp-ip ethuni eth_0/1 from-onu\n`;

    config += `end\n`;
  }

  // ZTE_C610
  else if (brand === "ZTE_C610") {
    // Menentukan VLAN ACS (bisa dibuat dinamis jika perlu)
    const vlan_acs = 2989;

    config += `config t\ninterface gpon_olt-${f}/${s}/${p}\n`;
    if (isReplace) config += `no onu ${ont_id}\n`;
    config += `onu ${ont_id} type ZTEG-F609 sn ${sn}\nexit\n`;

    // Interface GPON ONU
    config += `interface gpon_onu-${f}/${s}/${p}:${ont_id}\n`;
    config += `description ${sid}-${nama}\n`;
    config += `tcont 1 name HSI profile PPPOE\n`;
    config += `tcont 2 name ACS profile ACS-v2\n`; // Tambahan TCONT ACS
    config += `gemport 1 name HSI tcont 1\n`;
    config += `gemport 2 name ACS tcont 2\n`; // Tambahan Gemport ACS
    config += `exit\n`;

    // VPORT 1 untuk HSI (Internet)
    config += `interface vport-${f}/${s}/${p}.${ont_id}:1\n`;
    config += `service-port 1 user-vlan ${vlan} vlan ${vlan}\n`;
    config += `exit\n`;

    // VPORT 2 untuk ACS (Management TR069) - Khas C610/C600
    config += `interface vport-${f}/${s}/${p}.${ont_id}:2\n`;
    config += `service-port 1 user-vlan ${vlan_acs} vlan ${vlan_acs}\n`;
    config += `exit\n`;

    // PON ONU MNG
    config += `pon-onu-mng gpon_onu-${f}/${s}/${p}:${ont_id}\n`;
    config += `service HSI gemport 1 vlan ${vlan}\n`;
    config += `service ACS gemport 2 vlan ${vlan_acs}\n`; // Mapping service ACS

    // Penambahan index "1" dan "2" pada wan-ip karena ada multiple WAN
    config += `wan-ip 1 ipv4 mode pppoe username ${sn} password ${password} vlan-profile vlan${vlan} host 1\n`;
    config += `wan-ip 2 ipv4 mode dhcp vlan-profile vlan${vlan_acs} host 2\n`;

    config += `vlan port eth_0/1 mode tag vlan ${vlan}\n`;
    config += `vlan port eth_0/2 mode tag vlan ${vlan}\n`;

    // Konfigurasi TR069 Management & Binding WAN
    config += `tr069-mgmt 1 state unlock\n`;
    config += `tr069-mgmt 1 acs http://192.168.30.5:5000/acs/ validate basic username plniconplus password PlnIconPlus!2025\n`;
    config += `tr069-mgmt 1 tag pri 5 vlan ${vlan_acs}\n`;
    config += `wan 1 ssid 1 ethuni 1,2 service internet host 1\n`;
    config += `wan 2 service tr069\n`;

    config += `dhcp-ip ethuni eth_0/1 from-onu\n`;
    config += `dhcp-ip ethuni eth_0/2 from-onu\n`;
    config += `end\n`;
  }

  // BDCOM
  else if (brand === "BDCOM") {
    // Asumsi VLAN ACS adalah 2989 sesuai referensi
    const vlan_acs = 2989;

    config += `config\ninterface gpon 0/${f}:${s}\n`;
    config += `description ${sid}-${nama}\n`;

    // Konfigurasi WAN 1 (Internet / HSI)
    config += `gpon onu wan 1 admin-status enable\n`;
    config += `gpon onu wan 1 nat enable\n`;
    config += `gpon onu wan 1 service-type internet\n`;
    config += `gpon onu wan 1 connection-type pppoe\n`;
    config += `gpon onu wan 1 pppoe username ${sn} password ${password}\n`;
    config += `gpon onu wan 1 tci vlan ${vlan}\n`;
    config += `gpon onu wan 1 bind lan1 lan2 ssid1\n`;
    config += `gpon onu wan 1 auto-get-dns-address enable\n`;
    config += `gpon onu wan 1 lan-dhcp enable\n`; // Tambahan dari referensi baru

    // Konfigurasi WAN 2 (Management TR069 / ACS)
    config += `gpon onu wan 2 admin-status enable\n`;
    config += `gpon onu wan 2 nat disable\n`;
    config += `gpon onu wan 2 service-type tr069\n`;
    config += `gpon onu wan 2 connection-type dhcp\n`;
    config += `gpon onu wan 2 tci vlan ${vlan_acs}\n`; // Typo dari referensi ("wan 1") dikoreksi menjadi "wan 2"

    // Konfigurasi Profile ACS & IP Host
    config += `gpon onu tcont-virtual-port-bind-profile tvbind-default-ACS-v2\n`;
    config += `gpon onu flow-mapping-profile flow-mapping-default-hgu-ACS-v2\n`;
    config += `gpon onu veip 1 veip-profile ACS-v2\n`;
    config += `gpon onu ip-host 2 option dhcp\n`;

    config += `quit\n`;
    config += `write all\n`;
  }

  document.getElementById("configResult").textContent = config;
  document.getElementById("output").style.display = "block";
  document.getElementById("output").scrollIntoView({ behavior: "smooth" });
});

// Tombol Salin
function copyConfig() {
  const configText = document.getElementById("configResult").textContent;
  navigator.clipboard.writeText(configText).then(() => {
    alert("✅ Konfigurasi berhasil disalin, Selamat bekerja!");
  }).catch(() => {
    alert("❌ Gagal menyalin konfigurasi (ada yang salah niyee!!!) .");
  });
}

// Tombol Reset
document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("regisForm").reset();
  document.getElementById("output").style.display = "none";
  document.getElementById("configResult").textContent = "";
  document.getElementById("dynamicFields").innerHTML = "";
  const autoPassword = document.getElementById("autoPassword");
  autoPassword.value = "yes";
  autoPassword.dispatchEvent(new Event("change"));
});












