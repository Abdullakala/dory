import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('Admin');

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
      }}
    >
      <section
        style={{
          width: 'min(760px, 100%)',
          background: 'var(--card)',
          borderRadius: '18px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.06)',
          padding: '28px',
        }}
      >
        <p style={{ color: 'var(--muted)', margin: 0 }}>{t('Brand')}</p>
        <h1 style={{ margin: '10px 0 8px', fontSize: '32px', lineHeight: 1.2 }}>
          {t('HomeTitle')}
        </h1>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7 }}>
          {t('HomeDescription')}
        </p>
      </section>
    </main>
  );
}
