import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, Target, Download } from 'lucide-react';

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-24 flex-col">
            <FileText className="h-6 w-6 mb-2" />
            <span className="text-sm">Rapport mensuel</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col">
            <Users className="h-6 w-6 mb-2" />
            <span className="text-sm">Gérer équipe</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col">
            <Target className="h-6 w-6 mb-2" />
            <span className="text-sm">Nouveaux objectifs</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col">
            <Download className="h-6 w-6 mb-2" />
            <span className="text-sm">Exporter données</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
