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
        body: formData
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
    <div style={{ border: "2px solid grey", padding: "20px" }}>
      <h2>Bulk Upload</h2>

      <p style={{ marginBottom: '10px', color: '#060606' }}>
        Upload a pipe-delimited (.txt) file to create users and assign points.
      </p>

      <input
        type="file"
        accept=".txt"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <div style={{ marginTop: '12px' }}>
        <button
          className="sd-nav-item"
          style={{ width: 'auto', color: '#060606' }}
          onClick={handleUpload}
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload File'}
        </button>
      </div>

      {/* RESULTS */}
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Results</h3>

          {result.error && (
            <p style={{ color: 'red' }}>{result.error}</p>
          )}

          {!result.error && (
            <>
              <p> Success: {result.success_count}</p>
              <p> Errors: {result.error_count}</p>

              {result.errors?.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <h4>Error Details</h4>
                  <ul>
                    {result.errors.map((err, i) => (
                      <li key={i} style={{ color: 'red' }}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.successes?.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <h4>Processed</h4>
                  <ul>
                    {result.successes.map((msg, i) => (
                      <li key={i}>{msg}</li>
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
