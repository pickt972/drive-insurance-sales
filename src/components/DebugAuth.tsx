import { useAuth } from '@/hooks/useAuth';

export function DebugAuth() {
  const { user, profile, role, isLoading, isAdmin, isAuthenticated } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-100 border-t-2 border-yellow-400 p-2 text-xs z-50">
      <div className="flex flex-wrap gap-4">
        <span><strong>Loading:</strong> {isLoading ? '⏳' : '✅'}</span>
        <span><strong>Auth:</strong> {isAuthenticated ? '✅' : '❌'}</span>
        <span><strong>Admin:</strong> {isAdmin ? '✅' : '❌'}</span>
        <span><strong>Role:</strong> {role || 'null'}</span>
        <span><strong>Email:</strong> {user?.email || 'null'}</span>
      </div>
    </div>
  );
}
