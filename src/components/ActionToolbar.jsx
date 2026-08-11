import { useRef } from 'react';

export default function ActionToolbar({ onReset, onBulkUpload }) {
  const fileInputRef = useRef(null);

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
    <div className="toolbar-buttons" style={{marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
      <button type="button" onClick={() => fileInputRef.current?.click()} style={{backgroundColor: 'var(--surface-subtle)', color: 'var(--text)', border: '1px solid var(--border)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
        <i className="fa-solid fa-file-csv"></i> Bulk CSV
      </button>
      <input type="file" ref={fileInputRef} accept=".csv" style={{display: 'none'}} onChange={handleFileChange} />
      
      <button type="button" onClick={onReset} style={{backgroundColor: 'var(--surface-subtle)', color: 'var(--text)', border: '1px solid var(--border)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
        <i className="fa-solid fa-rotate-left"></i> Reset
      </button>
    </div>
  );
}
