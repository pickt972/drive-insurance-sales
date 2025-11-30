import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, Target, Download } from 'lucide-react';

export function QuickActions() {
  return (
    <Card className="modern-card border-primary/20 animate-gentle-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
            <Target className="h-5 w-5 text-primary" />
          </div>
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-28 flex-col gap-3 group hover:shadow-lg hover:scale-105 transition-all duration-300 border-primary/20 hover:border-primary hover:bg-primary/5"
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-info/10 to-info/5 group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-6 w-6 text-info" />
            </div>
            <span className="text-sm font-semibold">Rapport mensuel</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-28 flex-col gap-3 group hover:shadow-lg hover:scale-105 transition-all duration-300 border-success/20 hover:border-success hover:bg-success/5"
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-success/10 to-success/5 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-success" />
            </div>
            <span className="text-sm font-semibold">Gérer équipe</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-28 flex-col gap-3 group hover:shadow-lg hover:scale-105 transition-all duration-300 border-orange/20 hover:border-orange hover:bg-orange/5"
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange/10 to-orange/5 group-hover:scale-110 transition-transform duration-300">
              <Target className="h-6 w-6 text-orange" />
            </div>
            <span className="text-sm font-semibold">Nouveaux objectifs</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-28 flex-col gap-3 group hover:shadow-lg hover:scale-105 transition-all duration-300 border-purple/20 hover:border-purple hover:bg-purple/5"
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple/10 to-purple/5 group-hover:scale-110 transition-transform duration-300">
              <Download className="h-6 w-6 text-purple" />
            </div>
            <span className="text-sm font-semibold">Exporter données</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
