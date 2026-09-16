const metrics = [
  { label: 'Ingresos', value: '$1.250.000' },
  { label: 'Gastos', value: '$780.000' },
  { label: 'Deuda total', value: '$340.000' },
  { label: 'Ahorro', value: '$250.000' },
];

const recentTransactions = [
  { title: 'Salario', amount: '+ $900.000', type: 'income' },
  { title: 'Arriendo', amount: '- $450.000', type: 'expense' },
  { title: 'Compra tarjeta', amount: '- $160.000', type: 'expense' },
  { title: 'Aporte ahorro', amount: '+ $30.000', type: 'income' },
];

export default function HomePage() {
  return (
    <main style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6b7280', fontSize: 12 }}>Dashboard</p>
        <h1 style={{ margin: '0.5rem 0 0', fontSize: '2.2rem' }}>Estado financiero</h1>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {metrics.map((metric) => (
          <article key={metric.label} style={{ border: '1px solid #e5e7eb', borderRadius: 16, padding: '1rem 1.25rem', background: '#fff' }}>
            <div style={{ color: '#6b7280', fontSize: 14 }}>{metric.label}</div>
            <div style={{ marginTop: 8, fontWeight: 700, fontSize: 24 }}>{metric.value}</div>
          </article>
        ))}
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginTop: '2rem' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 16, background: '#fff', padding: '1.25rem' }}>
          <h2 style={{ marginTop: 0 }}>Movimientos recientes</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recentTransactions.map((item) => (
              <li key={item.title} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
                <span>{item.title}</span>
                <strong style={{ color: item.type === 'income' ? '#15803d' : '#b91c1c' }}>{item.amount}</strong>
              </li>
            ))}
          </ul>
        </div>

        <aside style={{ border: '1px solid #e5e7eb', borderRadius: 16, background: '#fff', padding: '1.25rem' }}>
          <h2 style={{ marginTop: 0 }}>Acciones</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {['Registrar ingreso', 'Registrar gasto', 'Crear deuda', 'Crear ahorro', 'Pagar a persona'].map((action) => (
              <button key={action} type="button" style={{ textAlign: 'left', padding: '0.8rem', borderRadius: 10, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}>
                {action}
              </button>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
