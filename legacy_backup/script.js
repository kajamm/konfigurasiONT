/* ==========================================================================
   ONT CONFIG STUDIO — SCRIPT.JS
   Refactored: DOMContentLoaded, Toast System, FSP Validation,
   Professional Messages, ACS Config, Download Feature, Step Indicator
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  // ==========================================================================
  // 1. TOAST NOTIFICATION SYSTEM
  // ==========================================================================
  function showToast(message, type = "info", duration = 4500) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const icons = {
      success: "fa-circle-check",
      error: "fa-circle-xmark",
      warning: "fa-triangle-exclamation",
      info: "fa-circle-info",
    };

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${icons[type] || icons.info}"></i></div>
      <span class="toast-msg">${message}</span>
      <button class="toast-close" aria-label="Tutup notifikasi">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => dismissToast(toast));
    container.appendChild(toast);

    // Double RAF to trigger CSS transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add("toast-visible"));
    });

    const timer = setTimeout(() => dismissToast(toast), duration);
    toast._timer = timer;

    return toast;
  }

  function dismissToast(toast) {
    clearTimeout(toast._timer);
    toast.classList.remove("toast-visible");
    toast.classList.add("toast-hiding");
    setTimeout(() => toast.remove(), 350);
  }

  // ==========================================================================
  // 2. STEP INDICATOR
  // ==========================================================================
  function setStep(step) {
    const steps = document.querySelectorAll(".step-item");
    const lines = document.querySelectorAll(".step-line");

    steps.forEach((el, i) => {
      el.classList.remove("step-active", "step-done");
      const num = i + 1;
      if (num < step) el.classList.add("step-done");
      else if (num === step) el.classList.add("step-active");
    });

    lines.forEach((line, i) => {
      line.classList.toggle("step-line-done", i < step - 1);
    });
  }

  // ==========================================================================
  // 3. FIELD STATE HELPERS (pakai CSS class, bukan inline style)
  // ==========================================================================
  function setFieldState(inputElem, state) {
    // state: null = reset, true = valid, false = error
    if (!inputElem) return;
    inputElem.classList.remove("field-valid", "field-error");
    if (state === true) inputElem.classList.add("field-valid");
    else if (state === false) inputElem.classList.add("field-error");
  }

  // ==========================================================================
  // 3b. HIGHLIGHT EMPTY REQUIRED FIELDS
  // Menandai kolom kosong dengan border merah + animasi shake,
  // scroll ke kolom pertama yang kosong, dan auto-clear saat user mengetik.
  // ==========================================================================
  function highlightEmptyFields(fields) {
    // fields: array of { elem, label }
    const emptyLabels = [];
    let firstEmpty = null;

    fields.forEach(({ elem, label }) => {
      if (!elem) return;
      const val = elem.value.trim();
      if (!val) {
        // Tandai merah
        setFieldState(elem, false);

        // Animasi shake — hapus lalu tambahkan kembali agar bisa re-trigger
        elem.classList.remove("field-shake");
        void elem.offsetWidth; // reflow untuk reset animasi
        elem.classList.add("field-shake");
        setTimeout(() => elem.classList.remove("field-shake"), 600);

        emptyLabels.push(`<strong>${label}</strong>`);
        if (!firstEmpty) firstEmpty = elem;

        // Auto-clear error saat user mulai mengisi
        const clearOnInput = () => {
          if (elem.value.trim()) {
            setFieldState(elem, null);
            elem.removeEventListener("input", clearOnInput);
            elem.removeEventListener("change", clearOnInput);
          }
        };
        elem.addEventListener("input", clearOnInput);
        elem.addEventListener("change", clearOnInput);
      }
    });

    // Scroll & fokus ke kolom pertama yang kosong
    if (firstEmpty) {
      firstEmpty.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => firstEmpty.focus(), 400);
    }

    return emptyLabels;
  }

  // ==========================================================================
  // 4. DOM ELEMENTS
  // ==========================================================================
  const brandSelect = document.getElementById("brand");
  const dynamicFields = document.getElementById("dynamicFields");
  const formContent = document.getElementById("formContent");
  const fspInput = document.getElementById("fsp");
  const fspHint = document.getElementById("fspHint");
  const brandTiles = document.querySelectorAll(".brand-tile");
  const autoPassword = document.getElementById("autoPassword");
  const passwordField = document.getElementById("password");
  const snInput = document.getElementById("sn");
  const vlanInput = document.getElementById("vlan");

  // ==========================================================================
  // 5. AUTO PASSWORD — TANGGAL HARI INI
  // ==========================================================================
  function autofillPassword() {
    if (autoPassword.value === "yes") {
      const today = new Date();
      const formatted = today.toISOString().split("T")[0].replace(/-/g, "");
      passwordField.value = formatted;
      passwordField.readOnly = true;
      passwordField.classList.add("readonly-filled");
      document.getElementById("passwordHint").textContent =
        `Password otomatis: ${formatted} (tanggal hari ini)`;
    } else {
      passwordField.value = "";
      passwordField.readOnly = false;
      passwordField.classList.remove("readonly-filled");
      document.getElementById("passwordHint").textContent =
        'Pilih "Ya" untuk auto-isi dengan tanggal hari ini';
    }
  }

  autofillPassword(); // Jalankan saat load untuk set initial state
  autoPassword.addEventListener("change", autofillPassword);

  // ==========================================================================
  // 6. BRAND TILES — KLIK EVENT
  // ==========================================================================
  brandTiles.forEach(tile => {
    tile.addEventListener("click", () => {
      const selected = tile.getAttribute("data-brand");
      brandSelect.value = selected;
      brandSelect.dispatchEvent(new Event("change"));
    });
  });

  // ==========================================================================
  // 7. UPDATE FSP FORMAT BERDASARKAN BRAND
  // ==========================================================================
  function updateFspFormat(brand) {
    if (!fspInput || !fspHint) return;
    switch (brand) {
      case "Huawei":
        fspInput.placeholder = "Contoh: 0/1/2/1";
        fspHint.textContent = "Format Huawei: Frame/Slot/Port/ONT_ID (4 bagian, contoh: 0/1/2/1)";
        break;
      case "Raisecom":
        fspInput.placeholder = "Contoh: 0/1/1";
        fspHint.textContent = "Format Raisecom: Frame/Slot/ONT_ID (3 bagian, contoh: 0/1/1)";
        break;
      case "ZTE_C320":
        fspInput.placeholder = "Contoh: 0/1/2/1";
        fspHint.textContent = "Format ZTE C320: Frame/Slot/Port/ONT_ID (4 bagian, contoh: 0/1/2/1)";
        break;
      case "ZTE_C610":
        fspInput.placeholder = "Contoh: 0/1/2/1";
        fspHint.textContent = "Format ZTE C610: Frame/Slot/Port/ONT_ID (4 bagian, contoh: 0/1/2/1)";
        break;
      case "BDCOM":
        fspInput.placeholder = "Contoh: 1/2";
        fspHint.textContent = "Format BDCOM: Frame/Slot (2 bagian, contoh: 1/2) — Angka tidak boleh diawali 0";
        break;
      default:
        fspInput.placeholder = "Pilih brand terlebih dahulu";
        fspHint.textContent = "Format FSP akan menyesuaikan brand yang dipilih";
        break;
    }
  }

  // ==========================================================================
  // 8. VALIDASI NUMERIK (VLAN & LINE PROFILE)
  // ==========================================================================
  function validateNumericField(inputElem) {
    if (!inputElem) return true;
    const val = inputElem.value.trim();
    if (val === "") { setFieldState(inputElem, null); return true; }
    const valid = /^\d+$/.test(val);
    setFieldState(inputElem, valid);
    return valid;
  }

  if (vlanInput) {
    vlanInput.addEventListener("input", () => validateNumericField(vlanInput));
  }

  // ==========================================================================
  // 9. VALIDASI FSP REAL-TIME
  // ==========================================================================
  function validateFSP() {
    if (!fspInput) return true;
    const brand = brandSelect.value;
    const val = fspInput.value.trim();

    if (!val || !brand) { setFieldState(fspInput, null); return true; }

    const parts = val.split("/");
    const allNumeric = parts.every(p => /^\d+$/.test(p.trim()));

    if (brand === "BDCOM") {
      const valid = /^[1-9]\d*\/[1-9]\d*$/.test(val);
      setFieldState(fspInput, valid);
      return valid;
    }

    const expectedParts = brand === "Raisecom" ? 3 : 4;
    const valid = parts.length === expectedParts && allNumeric;
    setFieldState(fspInput, valid);
    return valid;
  }

  if (fspInput) {
    fspInput.addEventListener("input", validateFSP);
  }

  // ==========================================================================
  // 10. VALIDASI SERIAL NUMBER (SN)
  // ==========================================================================
  function validateSN() {
    const brand = brandSelect.value;
    const sn = snInput.value.trim().toUpperCase();

    if (!sn) { setFieldState(snInput, null); return false; }

    let valid = false;
    if (brand === "Huawei") {
      valid = /^[A-F0-9]{16}$/.test(sn);
    } else if (brand === "Raisecom") {
      valid = /^RCMG[A-Z0-9]{8,12}$/.test(sn) ||
        /^ZTE[A-Z0-9]{8,12}$/.test(sn) ||
        /^AIS[A-Z0-9]{8,12}$/.test(sn);
    } else if (brand === "ZTE_C320" || brand === "ZTE_C610") {
      valid = /^(ZTE|RTEG)[A-Z0-9]{8,12}$/.test(sn);
    } else {
      valid = /^[A-Z0-9]{8,20}$/.test(sn);
    }

    setFieldState(snInput, valid);
    return valid;
  }

  snInput.addEventListener("input", validateSN);
  brandSelect.addEventListener("change", () => {
    if (snInput.value.trim()) validateSN();
  });

  // ==========================================================================
  // 11. BRAND CHANGE HANDLER
  // ==========================================================================
  brandSelect.addEventListener("change", () => {
    const selected = brandSelect.value;

    // Sync active state pada tiles
    brandTiles.forEach(tile => {
      tile.classList.toggle("active", tile.getAttribute("data-brand") === selected);
    });

    // Reset dynamic fields
    dynamicFields.innerHTML = "";

    const advancedCard = document.getElementById("advancedCard");

    if (selected) {
      if (formContent) formContent.classList.remove("hidden");
      setStep(2);

      // Inject brand-specific fields dengan proper .form-group wrapper
      if (selected === "Huawei") {
        dynamicFields.innerHTML = `
          <div class="form-group form-grid-full" id="servicePortGroup">
            <label for="servicePort">
              <i class="fa-solid fa-plug-circle-plus"></i>
              Service-Port
              <span class="label-badge" id="servicePortBadge">Wajib saat Replace</span>
            </label>
            <input type="text" id="servicePort"
              placeholder="Contoh: 3300 atau 3300, 2123">
            <span class="field-hint">
              Hanya dibutuhkan saat Replace ONT — untuk perintah <code>undo service-port</code>
            </span>
          </div>
          <div class="form-group form-grid-full">
            <label for="lineProfileHuawei">
              <i class="fa-solid fa-list-check"></i> Nama Line Profile
            </label>
            <input type="text" id="lineProfileHuawei"
              placeholder="Contoh: NEWAP">
          </div>
        `;

        // Fungsi toggle visibilitas Service-Port berdasarkan pilihan Replace
        const updateServicePortVisibility = () => {
          const isReplaceNow = document.getElementById("replace").value === "true";
          const spGroup = document.getElementById("servicePortGroup");
          const spInput = document.getElementById("servicePort");
          if (!spGroup || !spInput) return;

          if (isReplaceNow) {
            // Tampilkan field Service-Port
            spGroup.classList.remove("field-group-hidden");
            spGroup.classList.add("field-group-visible");
          } else {
            // Sembunyikan dan bersihkan nilai
            spGroup.classList.remove("field-group-visible");
            spGroup.classList.add("field-group-hidden");
            spInput.value = "";
            setFieldState(spInput, null); // Reset error state jika ada
          }
        };

        // Jalankan segera sesuai nilai replace saat ini
        updateServicePortVisibility();

        // Pantau perubahan dropdown Replace
        document.getElementById("replace")
          .addEventListener("change", updateServicePortVisibility);
      } else if (selected === "Raisecom") {
        dynamicFields.innerHTML = `
          <div class="form-group form-grid-full">
            <label for="lineProfileRaisecom">
              <i class="fa-solid fa-list-check"></i> Line Profile ID (Angka saja)
            </label>
            <input type="text" id="lineProfileRaisecom"
              placeholder="Contoh: 1">
            <span class="field-hint">Line Profile ID wajib berupa angka saja</span>
          </div>
        `;
        const lpElem = document.getElementById("lineProfileRaisecom");
        if (lpElem) {
          lpElem.addEventListener("input", () => validateNumericField(lpElem));
        }
      }

      // Tampilkan Advanced Settings hanya untuk brand yang pakai ACS
      const needsACS = ["ZTE_C320", "ZTE_C610", "BDCOM"].includes(selected);
      if (advancedCard) advancedCard.style.display = needsACS ? "" : "none";

      updateFspFormat(selected);
    } else {
      if (formContent) formContent.classList.add("hidden");
      updateFspFormat("");
      const outputSection = document.getElementById("output");
      if (outputSection) outputSection.style.display = "none";
      if (advancedCard) advancedCard.style.display = "none";
      setStep(1);
    }
  });

  // ==========================================================================
  // 12. ADVANCED SETTINGS TOGGLE
  // ==========================================================================
  const advancedToggle = document.getElementById("advancedToggle");
  const advancedBody = document.getElementById("advancedBody");

  if (advancedToggle && advancedBody) {
    advancedToggle.addEventListener("click", () => {
      const isOpen = advancedBody.style.display !== "none";
      advancedBody.style.display = isOpen ? "none" : "";
      advancedToggle.setAttribute("aria-expanded", String(!isOpen));
      const toggleIcon = advancedToggle.querySelector(".toggle-icon");
      if (toggleIcon) toggleIcon.classList.toggle("rotated", !isOpen);
      const toggleLabel = advancedToggle.querySelector("span");
      if (toggleLabel) toggleLabel.textContent = isOpen ? "Lihat Pengaturan" : "Sembunyikan";
    });
  // ==========================================================================
  // 13. FORM SUBMIT — GENERATE KONFIGURASI
  // ==========================================================================
  document.getElementById("regisForm").addEventListener("submit", function (e) {
    e.preventDefault();

    window.bulkConfigs = null;

    const sid = document.getElementById("sid").value.trim();
    const sn = snInput.value.trim().toUpperCase();
    const nama = document.getElementById("nama").value.trim().toUpperCase().replace(/\s+/g, ".");
    const brand = brandSelect.value;
    const fspVal = document.getElementById("fsp").value.trim();
    const vlan = document.getElementById("vlan").value.trim();
    const password = document.getElementById("password").value.trim();
    const isReplace = document.getElementById("replace").value === "true";

    // --- Validasi Kelengkapan Field: highlight kolom yang kosong ---
    const requiredFields = [
      { elem: document.getElementById("nama"), label: "Customer Name" },
      { elem: document.getElementById("sid"), label: "SID (Service ID)" },
      { elem: document.getElementById("password"), label: "Password PPPoE" },
      { elem: snInput, label: "Serial Number (SN)" },
      { elem: document.getElementById("fsp"), label: "F/S/P/ONT ID" },
      { elem: vlanInput, label: "VLAN" },
    ];

    // Tambahkan field dinamis sesuai brand
    if (brand === "Huawei") {
      const lpElem = document.getElementById("lineProfileHuawei");
      if (lpElem) requiredFields.push({ elem: lpElem, label: "Nama Line Profile" });
      // Service-Port HANYA wajib saat Replace ONT = Ya
      if (isReplace) {
        const spElem = document.getElementById("servicePort");
        if (spElem) requiredFields.push({ elem: spElem, label: "Service-Port" });
      }
    } else if (brand === "Raisecom") {
      const lpElem = document.getElementById("lineProfileRaisecom");
      if (lpElem) requiredFields.push({ elem: lpElem, label: "Line Profile ID" });
    }

    const emptyLabels = highlightEmptyFields(requiredFields);
    if (emptyLabels.length > 0) {
      const fieldList = emptyLabels.join(", ");
      showToast(
        `Kolom berikut belum diisi: ${fieldList}`,
        "warning",
        6000
      );
      return;
    }

    // --- Validasi VLAN Numerik ---
    if (!/^\d+$/.test(vlan)) {
      showToast("VLAN harus berupa angka saja. Contoh: 2900", "error");
      return;
    }

    // --- Validasi Serial Number ---
    if (!validateSN()) {
      showToast("Serial Number tidak valid. Periksa format SN sesuai dengan brand yang dipilih.", "error");
      return;
    }

    // --- Validasi FSP ---
    if (!validateFSP()) {
      showToast("Format FSP tidak sesuai dengan brand yang dipilih. Periksa kembali input FSP.", "error");
      return;
    }

    // --- Parsing FSP Parts ---
    const fspParts = fspVal.split("/");
    let f, s, p, ont_id;

    if (brand === "Raisecom" && fspParts.length === 3) {
      [f, s, ont_id] = fspParts;
    } else if (brand === "BDCOM") {
      [f, s] = fspVal.split("/");
    } else if (fspParts.length === 4) {
      [f, s, p, ont_id] = fspParts;
    } else {
      showToast("Format FSP tidak sesuai dengan brand yang dipilih. Periksa kembali.", "error");
      return;
    }

    let config = "";

    // =========================================================
    // HUAWEI
    // =========================================================
    if (brand === "Huawei") {
      const servicePort = document.getElementById("servicePort")?.value || "";
      const lineProfile = document.getElementById("lineProfileHuawei")?.value.trim() || "";

      // (validasi sudah ditangani oleh highlightEmptyFields di atas)

      const servicePorts = servicePort
        .split(/[\s\n,]+/)
        .map(item => item.trim())
        .filter(item => item !== "");

      if (servicePorts.length > 2) {
        showToast("Maksimal hanya 2 Service Port yang diizinkan. Contoh: 3300, 2123", "error");
        return;
      }

      config += `config\n`;
      if (isReplace) {
        servicePorts.forEach(port => { config += `undo service-port ${port}\n`; });
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
      config += `service-port vlan ${vlan} gpon ${f}/${s}/${p} ont ${ont_id} gemport 1 multi-service user-vlan ${vlan} tag-transform translate\n\n`;
      config += `service-port vlan 2989 gpon ${f}/${s}/${p} ont ${ont_id} gemport 2 multi-service user-vlan 2989 tag-transform translate\n\n`;
      config += `save`;
    }

    // =========================================================
    // RAISECOM
    // =========================================================
    else if (brand === "Raisecom") {
      const lineProfile = document.getElementById("lineProfileRaisecom")?.value.trim() || "";

      if (!lineProfile || !/^\d+$/.test(lineProfile)) {
        showToast("Line Profile ID Raisecom harus berupa angka saja. Contoh: 1", "error");
        return;
      }

      const isZTESN = sn.startsWith("ZTE");

      config += `config\n`;
      config += `interface gpon-olt ${f}/${s}\n`;
      if (isReplace) config += `no create gpon-onu ${ont_id}\n`;
      config += `create gpon-onu ${ont_id} sn ${sn} line-profile-id ${lineProfile} service-profile-id 3\n`;
      config += `quit\n`;
      config += `interface gpon-onu ${f}/${s}/${ont_id}\n`;
      config += `description ${sid}-${nama}\nquit\n`;

      if (isZTESN) {
        // ZTE SN di Raisecom: konfigurasi lebih singkat
        document.getElementById("configResult").textContent = config;
        document.getElementById("output").style.display = "block";
        document.getElementById("output").scrollIntoView({ behavior: "smooth" });
        setStep(3);
        showToast("Konfigurasi ZTE SN pada Raisecom berhasil di-generate!", "success");
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

    // =========================================================
    // ZTE C320
    // =========================================================
    else if (brand === "ZTE_C320") {
      const acsUrl = document.getElementById("acsUrl")?.value.trim() || "http://192.168.30.5:5000/acs/";
      const acsUser = document.getElementById("acsUsername")?.value.trim() || "plniconplus";
      const acsPass = document.getElementById("acsPassword")?.value.trim() || "PlnIconPlus!2025";
      const vlan_acs = 2989;

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
      config += `service-port 2 vport 2 user-vlan ${vlan_acs} vlan ${vlan_acs}\n`;
      config += `exit\n`;
      config += `pon-onu-mng gpon-onu_${f}/${s}/${p}:${ont_id}\n`;
      config += `service HSI gemport 1 vlan ${vlan}\n`;
      config += `wan-ip 1 mode pppoe username ${sn} password ${password} vlan-profile vlan${vlan} host 1\n`;
      config += `wan-ip 2 mode dhcp vlan-profile vlan${vlan_acs} host 2\n`;
      config += `vlan port eth_0/1 mode tag vlan ${vlan}\n`;
      config += `vlan port eth_0/2 mode tag vlan ${vlan}\n`;
      config += `tr069-mgmt 1 state unlock\n`;
      config += `tr069-mgmt 1 acs ${acsUrl} validate basic username ${acsUser} password ${acsPass}\n`;
      config += `tr069-mgmt 1 tag pri 5 vlan ${vlan_acs}\n`;
      config += `wan 1 ssid 1 ethuni 1,2 service internet host 1\n`;
      config += `wan 2 service tr069\n`;
      config += `end\n`;
      config += `save\n`;
    }

    // =========================================================
    // ZTE C610
    // =========================================================
    else if (brand === "ZTE_C610") {
      const acsUrl = document.getElementById("acsUrl")?.value.trim() || "http://192.168.30.5:5000/acs/";
      const acsUser = document.getElementById("acsUsername")?.value.trim() || "plniconplus";
      const acsPass = document.getElementById("acsPassword")?.value.trim() || "PlnIconPlus!2025";
      const vlan_acs = 2989;

      config += `config t\ninterface gpon_olt-${f}/${s}/${p}\n`;
      if (isReplace) config += `no onu ${ont_id}\n`;
      config += `onu ${ont_id} type ZTEG-F609 sn ${sn}\nexit\n`;
      config += `interface gpon_onu-${f}/${s}/${p}:${ont_id}\n`;
      config += `description ${sid}-${nama}\n`;
      config += `tcont 1 name HSI profile PPPOE\n`;
      config += `tcont 2 name ACS profile ACS-v2\n`;
      config += `gemport 1 name HSI tcont 1\n`;
      config += `gemport 2 name ACS tcont 2\n`;
      config += `exit\n`;
      config += `interface vport-${f}/${s}/${p}.${ont_id}:1\n`;
      config += `service-port 1 user-vlan ${vlan} vlan ${vlan}\n`;
      config += `exit\n`;
      config += `interface vport-${f}/${s}/${p}.${ont_id}:2\n`;
      config += `service-port 1 user-vlan ${vlan_acs} vlan ${vlan_acs}\n`;
      config += `exit\n`;
      config += `pon-onu-mng gpon_onu-${f}/${s}/${p}:${ont_id}\n`;
      config += `service HSI gemport 1 vlan ${vlan}\n`;
      config += `service ACS gemport 2 vlan ${vlan_acs}\n`;
      config += `wan-ip 1 ipv4 mode pppoe username ${sn} password ${password} vlan-profile vlan${vlan} host 1\n`;
      config += `wan-ip 2 ipv4 mode dhcp vlan-profile vlan${vlan_acs} host 2\n`;
      config += `vlan port eth_0/1 mode tag vlan ${vlan}\n`;
      config += `vlan port eth_0/2 mode tag vlan ${vlan}\n`;
      config += `tr069-mgmt 1 state unlock\n`;
      config += `tr069-mgmt 1 acs ${acsUrl} validate basic username ${acsUser} password ${acsPass}\n`;
      config += `tr069-mgmt 1 tag pri 5 vlan ${vlan_acs}\n`;
      config += `wan 1 ssid 1 ethuni 1,2 service internet host 1\n`;
      config += `wan 2 service tr069\n`;
      config += `dhcp-ip ethuni eth_0/1 from-onu\n`;
      config += `dhcp-ip ethuni eth_0/2 from-onu\n`;
      config += `end\n`;
      config += `save\n`;
    }

    // =========================================================
    // BDCOM
    // =========================================================
    else if (brand === "BDCOM") {
      const vlan_acs = 2989;

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
      config += `gpon onu wan 2 tci vlan ${vlan_acs}\n`;
      config += `gpon onu tcont-virtual-port-bind-profile tvbind-default-ACS-v2\n`;
      config += `gpon onu flow-mapping-profile flow-mapping-default-hgu-ACS-v2\n`;
      config += `gpon onu veip 1 veip-profile ACS-v2\n`;
      config += `gpon onu ip-host 2 option dhcp\n`;
      config += `quit\n`;
      config += `write all\n`;
    }

    // Tampilkan Output
    document.getElementById("configResult").textContent = config;
    document.getElementById("output").style.display = "block";
    showToast("Konfigurasi berhasil di-generate!", "success");

    // Fokus ke hasil
    document.getElementById("output").scrollIntoView({ behavior: "smooth" });

    // Auto-Copy
    const autoCopy = document.getElementById("autoCopy");
    if (autoCopy && autoCopy.checked) {
      setTimeout(() => {
        if (typeof window.copyConfig === "function") {
          window.copyConfig();
        }
      }, 500);
    }
    setStep(3);
  });

  // ==========================================================================
  // 14. SALIN KONFIGURASI
  // ==========================================================================
  window.copyConfig = function () {
    const configText = document.getElementById("configResult").textContent;
    if (!configText.trim()) {
      showToast("Belum ada konfigurasi untuk disalin.", "warning");
      return;
    }
    navigator.clipboard.writeText(configText)
      .then(() => showToast("Konfigurasi berhasil disalin ke clipboard!", "success"))
      .catch(() => showToast("Gagal menyalin ke clipboard. Coba pilih teks dan tekan Ctrl+C secara manual.", "error"));
  };

  // ==========================================================================
  // 15. UNDUH KONFIGURASI SEBAGAI FILE .CLI
  // ==========================================================================
  window.downloadConfig = function () {
    const configText = document.getElementById("configResult").textContent;
    if (!configText.trim()) {
      showToast("Belum ada konfigurasi untuk diunduh.", "warning");
      return;
    }

    if (window.bulkConfigs && Object.keys(window.bulkConfigs).length > 0) {
      // BULK MODE: Unduh per brand
      const ts = new Date().toISOString().split("T")[0];
      let count = 0;
      for (const [brand, cfg] of Object.entries(window.bulkConfigs)) {
        if (!cfg.trim()) continue;
        const filename = `bulk-${brand}-${ts}.cli`;
        const blob = new Blob([cfg], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        count++;
      }
      showToast(`${count} file konfigurasi (berdasarkan Brand) berhasil diunduh.`, "success");
    } else {
      // SINGLE MODE
      const sid = document.getElementById("sid").value.trim() || "ont";
      const brandSelect = document.getElementById("brand");
      const brand = brandSelect.value;
      if (!brand) return;

      window.bulkConfigs = null;
      const ts = new Date().toISOString().split("T")[0];
      const filename = `config-${brand}-${sid}-${ts}.cli`;

      const blob = new Blob([configText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`File "${filename}" berhasil diunduh.`, "success");
    }
  };

  // ==========================================================================
  // 16. RESET FORM
  // ==========================================================================
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Yakin ingin mereset semua data? Semua input yang sudah diisi akan dihapus.")) return;

    document.getElementById("regisForm").reset();
    brandSelect.value = "";
    brandSelect.dispatchEvent(new Event("change"));

    document.getElementById("output").style.display = "none";
    document.getElementById("configResult").textContent = "";
    document.getElementById("dynamicFields").innerHTML = "";

    // Reset semua field state classes
    document.querySelectorAll(".field-valid, .field-error").forEach(el => {
      el.classList.remove("field-valid", "field-error");
    });

    // Set autoPassword ke "yes" dan update password field
    autoPassword.value = "yes";
    autofillPassword();

    setStep(1);
    showToast("Form berhasil direset.", "info");
  });

  // ==========================================================================
  // 17. DARK/LIGHT MODE THEME TOGGLE
  // ==========================================================================
  const themeToggle = document.getElementById("themeToggle");
  const currentTheme = localStorage.getItem("theme") || "light";

  // Set initial theme
  if (currentTheme === "dark") {
    document.body.setAttribute("data-theme", "dark");
    if (themeToggle) {
      themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      let theme = document.body.getAttribute("data-theme");
      if (theme !== "dark") {
        document.body.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
      } else {
        document.body.removeAttribute("data-theme");
        localStorage.setItem("theme", "light");
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
      }
    });
  }

  // ==========================================================================
  // INITIAL STATE
  // ==========================================================================
  setStep(1);

  // ==========================================================================
  // 18. BULK PROVISIONING (CSV UPLOAD)
  // ==========================================================================
  const bulkUploadBtn = document.getElementById("bulkUploadBtn");
  const csvFileInput = document.getElementById("csvFileInput");

  if (bulkUploadBtn && csvFileInput) {
    bulkUploadBtn.addEventListener("click", () => {
      csvFileInput.click();
    });

    csvFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        const text = evt.target.result;
        processBulkCSV(text);
        csvFileInput.value = ""; // Reset input
      };
      reader.readAsText(file);
    });
  }

  function processBulkCSV(csvText) {
    // Format yang diharapkan:
    // Brand, SN, FSP, VLAN, SID, Nama, Password, Replace(Ya/Tidak), ServicePort(Huawei), LineProfile
    const rows = csvText.split(/\r?\n/).filter(r => r.trim() !== "");
    if (rows.length === 0) {
      showToast("File CSV kosong.", "error");
      return;
    }

    // Ambil header
    const header = rows[0].toLowerCase();
    if (!header.includes("brand") || !header.includes("sn")) {
      showToast("Format CSV tidak valid. Pastikan header sesuai template.", "error");
      return;
    }

    let bulkConfigResult = "";
    let successCount = 0;
    let errorCount = 0;
    
    window.bulkConfigs = {};

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      // Pemisahan koma sederhana (tidak support koma di dalam quote untuk skrip ini, disarankan pakai delimiter khusus jika butuh)
      const cols = row.split(",").map(c => c.trim());
      
      // Default mappings berdasarkan urutan
      // 0: Brand, 1: SN, 2: FSP, 3: VLAN, 4: SID, 5: Nama, 6: Password, 7: Replace, 8: ServicePort, 9: LineProfile
      if (cols.length < 6) {
        bulkConfigResult += `! Error baris ${i + 1}: Data kurang lengkap\n\n`;
        errorCount++;
        continue;
      }

      const brand = cols[0];
      const sn = cols[1].toUpperCase();
      const fspVal = cols[2];
      const vlan = cols[3];
      const sid = cols[4];
      const nama = cols[5].toUpperCase().replace(/\s+/g, ".");
      const password = cols[6] || "";
      const isReplace = (cols[7] && cols[7].toLowerCase() === "ya");
      const servicePort = cols[8] || "";
      const lineProfile = cols[9] || "";
      const acsUrl = "http://192.168.30.5:5000/acs/";
      const acsUser = "plniconplus";
      const acsPass = "PlnIconPlus!2025";
      const vlan_acs = 2989;

      // Parsing FSP
      const fspParts = fspVal.split("/");
      let f, s, p, ont_id;

      if (brand === "Raisecom" && fspParts.length === 3) {
        [f, s, ont_id] = fspParts;
      } else if (brand === "BDCOM") {
        [f, s] = fspParts;
      } else if (fspParts.length === 4) {
        [f, s, p, ont_id] = fspParts;
      } else {
        bulkConfigResult += `! Error baris ${i + 1}: FSP ${fspVal} tidak valid untuk brand ${brand}\n\n`;
        errorCount++;
        continue;
      }

      let config = "";
      if (brand !== "Huawei" && brand !== "Raisecom") {
        config = `! === START CONFIG BARIS ${i + 1} (${brand} - ${sn}) ===\n`;
      }

      if (brand === "Huawei" || brand === "Raisecom") {
        const portVal = brand === "Raisecom" ? s : p;
        config += `ont ipconfig ${portVal} ${ont_id} pppoe vlan ${vlan} priority 0 user-account username ${sn} password ${password}\n\n`;
      } else if (brand === "ZTE_C320") {
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
        config += `service-port 2 vport 2 user-vlan ${vlan_acs} vlan ${vlan_acs}\n`;
        config += `exit\n`;
        config += `pon-onu-mng gpon-onu_${f}/${s}/${p}:${ont_id}\n`;
        config += `service HSI gemport 1 vlan ${vlan}\n`;
        config += `wan-ip 1 mode pppoe username ${sn} password ${password} vlan-profile vlan${vlan} host 1\n`;
        config += `wan-ip 2 mode dhcp vlan-profile vlan${vlan_acs} host 2\n`;
        config += `vlan port eth_0/1 mode tag vlan ${vlan}\n`;
        config += `vlan port eth_0/2 mode tag vlan ${vlan}\n`;
        config += `tr069-mgmt 1 state unlock\n`;
        config += `tr069-mgmt 1 acs ${acsUrl} validate basic username ${acsUser} password ${acsPass}\n`;
        config += `tr069-mgmt 1 tag pri 5 vlan ${vlan_acs}\n`;
        config += `wan 1 ssid 1 ethuni 1,2 service internet host 1\n`;
        config += `wan 2 service tr069\n`;
        config += `end\n`;
        config += `save\n\n`;
      } else if (brand === "ZTE_C610") {
        config += `config t\ninterface gpon_olt-${f}/${s}/${p}\n`;
        if (isReplace) config += `no onu ${ont_id}\n`;
        config += `onu ${ont_id} type ZTEG-F609 sn ${sn}\nexit\n`;
        config += `interface gpon_onu-${f}/${s}/${p}:${ont_id}\n`;
        config += `description ${sid}-${nama}\n`;
        config += `tcont 1 name HSI profile PPPOE\n`;
        config += `tcont 2 name ACS profile ACS-v2\n`;
        config += `gemport 1 name HSI tcont 1\n`;
        config += `gemport 2 name ACS tcont 2\n`;
        config += `exit\n`;
        config += `interface vport-${f}/${s}/${p}.${ont_id}:1\n`;
        config += `service-port 1 user-vlan ${vlan} vlan ${vlan}\n`;
        config += `exit\n`;
        config += `interface vport-${f}/${s}/${p}.${ont_id}:2\n`;
        config += `service-port 1 user-vlan ${vlan_acs} vlan ${vlan_acs}\n`;
        config += `exit\n`;
        config += `pon-onu-mng gpon_onu-${f}/${s}/${p}:${ont_id}\n`;
        config += `service HSI gemport 1 vlan ${vlan}\n`;
        config += `service ACS gemport 2 vlan ${vlan_acs}\n`;
        config += `wan-ip 1 ipv4 mode pppoe username ${sn} password ${password} vlan-profile vlan${vlan} host 1\n`;
        config += `wan-ip 2 ipv4 mode dhcp vlan-profile vlan${vlan_acs} host 2\n`;
        config += `vlan port eth_0/1 mode tag vlan ${vlan}\n`;
        config += `vlan port eth_0/2 mode tag vlan ${vlan}\n`;
        config += `tr069-mgmt 1 state unlock\n`;
        config += `tr069-mgmt 1 acs ${acsUrl} validate basic username ${acsUser} password ${acsPass}\n`;
        config += `tr069-mgmt 1 tag pri 5 vlan ${vlan_acs}\n`;
        config += `wan 1 ssid 1 ethuni 1,2 service internet host 1\n`;
        config += `wan 2 service tr069\n`;
        config += `dhcp-ip ethuni eth_0/1 from-onu\n`;
        config += `dhcp-ip ethuni eth_0/2 from-onu\n`;
        config += `end\n`;
        config += `save\n\n`;
      } else if (brand === "BDCOM") {
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
        config += `gpon onu wan 2 tci vlan ${vlan_acs}\n`;
        config += `gpon onu tcont-virtual-port-bind-profile tvbind-default-ACS-v2\n`;
        config += `gpon onu flow-mapping-profile flow-mapping-default-hgu-ACS-v2\n`;
        config += `gpon onu veip 1 veip-profile ACS-v2\n`;
        config += `gpon onu ip-host 2 option dhcp\n`;
        config += `quit\n`;
        config += `write all\n\n`;
      } else {
        bulkConfigResult += `! Error baris ${i + 1}: Brand '${brand}' tidak dikenali\n\n`;
        errorCount++;
        config += `end\n\n`;
      }
      
      if (!window.bulkConfigs[brand]) window.bulkConfigs[brand] = "";
      window.bulkConfigs[brand] += config;

      successCount++;
    }

    // Gabungkan hasil ke terminal berdasarkan brand
    for (const [brand, cfg] of Object.entries(window.bulkConfigs)) {
      if (cfg.trim()) {
        bulkConfigResult += `! ========================================\n`;
        bulkConfigResult += `! BULK CONFIG - ${brand.toUpperCase()}\n`;
        bulkConfigResult += `! ========================================\n\n${cfg}\n`;
      }
    }

    // Tampilkan di terminal
    document.getElementById("configResult").textContent = bulkConfigResult;
    document.getElementById("output").style.display = "block";
    document.getElementById("output").scrollIntoView({ behavior: "smooth" });
    
    // Auto Copy jika aktif
    const autoCopy = document.getElementById("autoCopy");
    if (autoCopy && autoCopy.checked) {
      setTimeout(() => { if (typeof window.copyConfig === "function") window.copyConfig(); }, 500);
    }

    showToast(`Bulk config selesai: ${successCount} berhasil, ${errorCount} gagal.`, successCount > 0 ? "success" : "warning", 5000);
  }



}); // End DOMContentLoaded
