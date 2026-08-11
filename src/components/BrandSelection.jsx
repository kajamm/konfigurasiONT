const brands = [
  { id: 'Huawei', name: 'Huawei', icon: 'fa-server', desc: 'F/S/P/ONT_ID' },
  { id: 'Raisecom', name: 'Raisecom', icon: 'fa-network-wired', desc: 'F/S/ONT_ID' },
  { id: 'ZTE_C320', name: 'ZTE C320', icon: 'fa-cube', desc: 'F/S/P/ONT_ID' },
  { id: 'ZTE_C610', name: 'ZTE C610', icon: 'fa-cubes', desc: 'F/S/P/ONT_ID' },
  { id: 'BDCOM', name: 'BDCOM', icon: 'fa-microchip', desc: 'F/S (Tanpa P)' }
];

export default function BrandSelection({ selectedBrand, onSelect }) {
  return (
    <article className="card brand-selection-card">
      <div className="card-header">
        <div className="card-header-icon">
          <i className="fa-solid fa-building-columns"></i>
        </div>
        <div>
          <h2 className="card-title">Pilih Brand OLT</h2>
          <p className="card-subtitle">Klik tile vendor OLT untuk membuka form konfigurasi</p>
        </div>
      </div>
      <div className="brand-grid">
        {brands.map(b => (
          <div 
            key={b.id} 
            className={`brand-tile ${selectedBrand === b.id ? 'active' : ''}`}
            onClick={() => onSelect(b.id)}
          >
            <div className="brand-tile-icon">
              <i className={`fa-solid ${b.icon}`}></i>
            </div>
            <div className="brand-tile-name">{b.name}</div>
            <div className="brand-tile-desc">{b.desc}</div>
          </div>
        ))}
      </div>
    </article>
  );
}
