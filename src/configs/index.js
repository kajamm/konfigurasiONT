/* ==========================================================================
   CONFIGS — BARREL EXPORT
   Import semua brand config dari sini.
   Untuk menambah brand baru: buat file baru di folder ini, lalu daftarkan di sini.
   ========================================================================== */

export * as Huawei   from './huawei';
export * as Raisecom from './raisecom';
export * as ZTE_C320 from './zte_c320';
export * as ZTE_C610 from './zte_c610';
export * as BDCOM    from './bdcom';

/**
 * Map brand ID ke modul konfigurasi masing-masing.
 * Gunakan ini untuk lookup dinamis berdasarkan string brand.
 *
 * @example
 * import { BRAND_CONFIGS } from './configs';
 * const mod = BRAND_CONFIGS['Huawei'];
 * const config = mod.generateSingle({ ... });
 */
import * as HuaweiMod   from './huawei';
import * as RaisecomMod from './raisecom';
import * as ZteC320Mod  from './zte_c320';
import * as ZteC610Mod  from './zte_c610';
import * as BdcomMod    from './bdcom';

export const BRAND_CONFIGS = {
  Huawei:   HuaweiMod,
  Raisecom: RaisecomMod,
  ZTE_C320: ZteC320Mod,
  ZTE_C610: ZteC610Mod,
  BDCOM:    BdcomMod,
};
