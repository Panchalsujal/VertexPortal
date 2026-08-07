export function Spinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`spinner ${size === 'sm' ? 'spinner-sm' : ''} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <Spinner />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading…</p>
    </div>
  );
}
