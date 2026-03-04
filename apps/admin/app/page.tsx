export default function Page() {
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
        <p style={{ color: 'var(--muted)', margin: 0 }}>Dory</p>
        <h1 style={{ margin: '10px 0 8px', fontSize: '32px', lineHeight: 1.2 }}>
          Admin 运营管理后台
        </h1>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.7 }}>
          这里是全局运营管理应用入口。你可以在此基础上添加用户管理、内容审核、配置中心和审计报表等模块。
        </p>
      </section>
    </main>
  );
}
