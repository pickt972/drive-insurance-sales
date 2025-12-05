import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquareQuote, 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Sparkles,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useArgumentaires, DEFAULT_ARGUMENTAIRES, ArgumentairesMap, ArgumentaireData } from '@/hooks/useArgumentaires';
import { useInsuranceTypes } from '@/hooks/useInsuranceTypes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function ArgumentsManagement() {
  const { argumentaires, loading, saveArgumentaires, resetToDefaults } = useArgumentaires();
  const { insuranceTypes } = useInsuranceTypes();
  const [editedArgumentaires, setEditedArgumentaires] = useState<ArgumentairesMap>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      setEditedArgumentaires(argumentaires);
      // Set first insurance type as active tab
      if (insuranceTypes.length > 0 && !activeTab) {
        setActiveTab(insuranceTypes[0].name);
      }
    }
  }, [loading, argumentaires, insuranceTypes]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleArgumentChange = (typeName: string, index: number, value: string) => {
    setEditedArgumentaires(prev => {
      const typeData = prev[typeName] || { arguments: [], accroches: [] };
      const newArguments = [...typeData.arguments];
      newArguments[index] = value;
      return {
        ...prev,
        [typeName]: { ...typeData, arguments: newArguments }
      };
    });
  };

  const handleAccrocheChange = (typeName: string, index: number, value: string) => {
    setEditedArgumentaires(prev => {
      const typeData = prev[typeName] || { arguments: [], accroches: [] };
      const newAccroches = [...typeData.accroches];
      newAccroches[index] = value;
      return {
        ...prev,
        [typeName]: { ...typeData, accroches: newAccroches }
      };
    });
  };

  const addArgument = (typeName: string) => {
    setEditedArgumentaires(prev => {
      const typeData = prev[typeName] || { arguments: [], accroches: [] };
      return {
        ...prev,
        [typeName]: { 
          ...typeData, 
          arguments: [...typeData.arguments, ''] 
        }
      };
    });
  };

  const removeArgument = (typeName: string, index: number) => {
    setEditedArgumentaires(prev => {
      const typeData = prev[typeName] || { arguments: [], accroches: [] };
      const newArguments = typeData.arguments.filter((_, i) => i !== index);
      return {
        ...prev,
        [typeName]: { ...typeData, arguments: newArguments }
      };
    });
  };

  const addAccroche = (typeName: string) => {
    setEditedArgumentaires(prev => {
      const typeData = prev[typeName] || { arguments: [], accroches: [] };
      return {
        ...prev,
        [typeName]: { 
          ...typeData, 
          accroches: [...typeData.accroches, ''] 
        }
      };
    });
  };

  const removeAccroche = (typeName: string, index: number) => {
    setEditedArgumentaires(prev => {
      const typeData = prev[typeName] || { arguments: [], accroches: [] };
      const newAccroches = typeData.accroches.filter((_, i) => i !== index);
      return {
        ...prev,
        [typeName]: { ...typeData, accroches: newAccroches }
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await saveArgumentaires(editedArgumentaires);
    setSaving(false);

    if (success) {
      toast({
        title: '✅ Argumentaires sauvegardés',
        description: 'Les modifications ont été enregistrées',
      });
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les argumentaires',
        variant: 'destructive'
      });
    }
  };

  const handleReset = async () => {
    setSaving(true);
    const success = await resetToDefaults();
    setSaving(false);

    if (success) {
      setEditedArgumentaires(DEFAULT_ARGUMENTAIRES);
      toast({
        title: '✅ Réinitialisation effectuée',
        description: 'Les argumentaires par défaut ont été restaurés',
      });
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de réinitialiser les argumentaires',
        variant: 'destructive'
      });
    }
  };

  const getTypeData = (typeName: string): ArgumentaireData => {
    return editedArgumentaires[typeName] || DEFAULT_ARGUMENTAIRES[typeName] || { arguments: [], accroches: [] };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="modern-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                <MessageSquareQuote className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Argumentaires de vente</CardTitle>
                <CardDescription>
                  Gérez les phrases d'aide à la vente pour chaque type d'assurance
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Réinitialiser les argumentaires ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action remplacera tous vos argumentaires personnalisés par les valeurs par défaut.
                      Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>Réinitialiser</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
              {insuranceTypes.map((type) => (
                <TabsTrigger key={type.id} value={type.name} className="text-xs">
                  {type.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {insuranceTypes.map((type) => {
              const typeData = getTypeData(type.name);
              const isArgumentsOpen = openSections[`${type.name}-args`] !== false;
              const isAccrochesOpen = openSections[`${type.name}-accroches`] !== false;

              return (
                <TabsContent key={type.id} value={type.name} className="space-y-4">
                  {/* Arguments de vente */}
                  <Collapsible open={isArgumentsOpen} onOpenChange={() => toggleSection(`${type.name}-args`)}>
                    <Card>
                      <CardHeader className="py-3">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2">
                              <MessageSquareQuote className="h-4 w-4 text-primary" />
                              <CardTitle className="text-sm">Arguments de vente</CardTitle>
                              <Badge variant="secondary">{typeData.arguments.length}</Badge>
                            </div>
                            {isArgumentsOpen ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-2">
                              {typeData.arguments.map((arg, index) => (
                                <div key={index} className="flex gap-2 items-start">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold mt-2">
                                    {index + 1}
                                  </span>
                                  <Textarea
                                    value={arg}
                                    onChange={(e) => handleArgumentChange(type.name, index, e.target.value)}
                                    placeholder="Entrez un argument de vente..."
                                    className="min-h-[60px] text-sm"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removeArgument(type.name, index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => addArgument(type.name)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter un argument
                          </Button>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Phrases d'accroche */}
                  <Collapsible open={isAccrochesOpen} onOpenChange={() => toggleSection(`${type.name}-accroches`)}>
                    <Card className="border-green-200 bg-green-50/50">
                      <CardHeader className="py-3">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-green-600" />
                              <CardTitle className="text-sm text-green-800">Phrases d'accroche</CardTitle>
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                {typeData.accroches.length}
                              </Badge>
                            </div>
                            {isAccrochesOpen ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-2">
                            {typeData.accroches.map((accroche, index) => (
                              <div key={index} className="flex gap-2 items-center">
                                <Sparkles className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <Input
                                  value={accroche}
                                  onChange={(e) => handleAccrocheChange(type.name, index, e.target.value)}
                                  placeholder="Entrez une phrase d'accroche..."
                                  className="text-sm"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeAccroche(type.name, index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full border-green-300 text-green-700 hover:bg-green-100"
                            onClick={() => addAccroche(type.name)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une accroche
                          </Button>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
