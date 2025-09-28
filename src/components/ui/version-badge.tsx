import React from 'react';
import { Badge } from '@/components/ui/badge';
import { versioningSystem } from '@/lib/versioning';
import { GitBranch } from 'lucide-react';

export const VersionBadge = () => {
  const currentVersion = versioningSystem.getCurrentVersion();
  const stats = versioningSystem.getStats();
  
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-mono">
        <GitBranch className="h-3 w-3 mr-1" />
        v{currentVersion}
      </Badge>
      {stats.metadata?.autoBackupEnabled && (
        <Badge variant="success" className="rounded-full px-2 py-1 text-xs">
          🔄 Auto
        </Badge>
      )}
    </div>
  );
};