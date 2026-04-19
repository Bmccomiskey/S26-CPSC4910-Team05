import { useState } from 'react';

export default function BulkUpload({ currentUser }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/upload/bulk', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ error: 'Upload failed' });
    }

    setLoading(false);
  };

  return (
    <div className="sd-section" style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
        Bulk Upload
      </h2>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
        Upload a pipe-delimited (.txt) file to create users and assign points.
      </p>

      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
      }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 14px', borderRadius: '8px',
          border: '1.5px dashed #cbd5e1', background: '#f8fafc',
          cursor: 'pointer', fontSize: '13px', color: '#475569', fontWeight: 500,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          {file ? file.name : 'Choose .txt file'}
          <input
            type="file"
            accept=".txt"
            style={{ display: 'none' }}
            onChange={(e) => { setFile(e.target.files[0]); setResult(null); }}
          />
        </label>

        <button
          className="sd-btn sd-btn-approve"
          style={{ opacity: !file || loading ? 0.5 : 1 }}
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? 'Uploading…' : 'Upload File'}
        </button>

        {file && !loading && (
          <button
            className="sd-btn sd-btn-reject"
            onClick={() => { setFile(null); setResult(null); }}
          >
            Clear
          </button>
        )}
      </div>

      {result && (
        <div style={{ marginTop: '20px' }}>
          {result.error ? (
            <div style={{
              padding: '12px 16px', borderRadius: '8px',
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', fontSize: '13px',
            }}>
              {result.error}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{
                  padding: '10px 18px', borderRadius: '8px',
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  fontSize: '13px', color: '#16a34a', fontWeight: 600,
                }}>
                  ✓ {result.success_count} succeeded
                </div>
                {result.error_count > 0 && (
                  <div style={{
                    padding: '10px 18px', borderRadius: '8px',
                    background: '#fef2f2', border: '1px solid #fecaca',
                    fontSize: '13px', color: '#dc2626', fontWeight: 600,
                  }}>
                    ✕ {result.error_count} failed
                  </div>
                )}
              </div>

              {result.errors?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', marginBottom: '6px' }}>
                    Error Details
                  </p>
                  <ul style={{ paddingLeft: '18px', margin: 0 }}>
                    {result.errors.map((err, i) => (
                      <li key={i} style={{ fontSize: '13px', color: '#dc2626', marginBottom: '4px' }}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.successes?.length > 0 && (
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#16a34a', marginBottom: '6px' }}>
                    Processed
                  </p>
                  <ul style={{ paddingLeft: '18px', margin: 0 }}>
                    {result.successes.map((msg, i) => (
                      <li key={i} style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
