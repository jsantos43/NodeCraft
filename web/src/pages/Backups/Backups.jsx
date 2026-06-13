import React from 'react';
import { HardDrive } from 'lucide-react';
import Layout from '../../components/Layout/Layout.jsx';
import Card from '../../components/ui/Card.jsx';

export default function Backups() {
  return (
    <Layout title="Backups">
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: 12 }}>
          <HardDrive size={32} style={{ opacity: 0.3 }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Backups</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 300 }}>
            Backup management coming soon. You can create backups from individual server pages.
          </p>
        </div>
      </Card>
    </Layout>
  );
}
