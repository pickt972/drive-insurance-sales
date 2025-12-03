import { AuditLogViewer } from '@/components/Admin/AuditLogViewer';

export function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Journal d'audit</h2>
        <p className="text-gray-600">Traçabilité des modifications</p>
      </div>
      <AuditLogViewer />
    </div>
  );
}
