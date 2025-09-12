import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Search, History, Filter } from 'lucide-react';
import { useObjectiveHistory } from '@/hooks/useObjectiveHistory';
import ObjectiveHistoryCard from './ObjectiveHistoryCard';
import { Skeleton } from '@/components/ui/skeleton';

const ObjectiveHistoryView = () => {
  const { history, loading } = useObjectiveHistory();
  const [filterEmployee, setFilterEmployee] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterAchieved, setFilterAchieved] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Get unique employees for filter
  const uniqueEmployees = Array.from(new Set(history.map(item => item.employee_name)));

  // Filter history based on filters
  const filteredHistory = history.filter(item => {
    const matchesEmployee = !filterEmployee || item.employee_name === filterEmployee;
    const matchesType = !filterType || item.objective_type === filterType;
    const matchesAchieved = !filterAchieved || 
      (filterAchieved === 'achieved' && item.objective_achieved) ||
      (filterAchieved === 'not-achieved' && !item.objective_achieved);
    const matchesSearch = !searchTerm || 
      item.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesEmployee && matchesType && matchesAchieved && matchesSearch;
  });

  const clearFilters = () => {
    setFilterEmployee('');
    setFilterType('');
    setFilterAchieved('');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique des objectifs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des objectifs
        </CardTitle>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="search">Rechercher</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nom ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Employé</Label>
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les employés" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les employés</SelectItem>
                {uniqueEmployees.map(employee => (
                  <SelectItem key={employee} value={employee}>
                    {employee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type d'objectif</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les types</SelectItem>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="yearly">Annuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Résultat</Label>
            <Select value={filterAchieved} onValueChange={setFilterAchieved}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les résultats" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les résultats</SelectItem>
                <SelectItem value="achieved">Objectifs atteints</SelectItem>
                <SelectItem value="not-achieved">Objectifs non atteints</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Effacer les filtres
          </Button>
          <span className="text-sm text-muted-foreground">
            {filteredHistory.length} objectif(s) trouvé(s)
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun historique trouvé</h3>
            <p className="text-muted-foreground">
              {history.length === 0 
                ? "Aucun objectif n'a encore été archivé." 
                : "Aucun objectif ne correspond à vos critères de recherche."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((historyItem) => (
              <ObjectiveHistoryCard
                key={historyItem.id}
                historyItem={historyItem}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ObjectiveHistoryView;