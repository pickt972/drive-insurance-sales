import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  HelpCircle, 
  Save, 
  RefreshCw, 
  Plus, 
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFAQ, DEFAULT_FAQ, FAQData, FAQItem } from '@/hooks/useFAQ';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function FAQManagement() {
  const { faq, loading, saveFAQ, resetToDefaults } = useFAQ();
  const [editedFAQ, setEditedFAQ] = useState<FAQData>({ items: [], categories: [] });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading) {
      setEditedFAQ(faq);
      if (faq.categories.length > 0 && !activeTab) {
        setActiveTab(faq.categories[0]);
      }
    }
  }, [loading, faq]);

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleQuestionChange = (itemId: string, value: string) => {
    setEditedFAQ(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, question: value } : item
      )
    }));
  };

  const handleAnswerChange = (itemId: string, value: string) => {
    setEditedFAQ(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, answer: value } : item
      )
    }));
  };

  const handleCategoryChange = (itemId: string, newCategory: string) => {
    setEditedFAQ(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, category: newCategory } : item
      )
    }));
  };

  const addQuestion = (category: string) => {
    const newItem: FAQItem = {
      id: `faq-${Date.now()}`,
      question: '',
      answer: '',
      category
    };
    setEditedFAQ(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setOpenItems(prev => ({ ...prev, [newItem.id]: true }));
  };

  const removeQuestion = (itemId: string) => {
    setEditedFAQ(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const addCategory = () => {
    if (newCategory.trim() && !editedFAQ.categories.includes(newCategory.trim())) {
      setEditedFAQ(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }));
      setNewCategory('');
      setShowAddCategory(false);
      setActiveTab(newCategory.trim());
    }
  };

  const removeCategory = (category: string) => {
    setEditedFAQ(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category),
      items: prev.items.filter(item => item.category !== category)
    }));
    if (activeTab === category && editedFAQ.categories.length > 1) {
      setActiveTab(editedFAQ.categories.find(c => c !== category) || '');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await saveFAQ(editedFAQ);
    setSaving(false);

    if (success) {
      toast({
        title: '✅ FAQ sauvegardée',
        description: 'Les modifications ont été enregistrées',
      });
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la FAQ',
        variant: 'destructive'
      });
    }
  };

  const handleReset = async () => {
    setSaving(true);
    const success = await resetToDefaults();
    setSaving(false);

    if (success) {
      setEditedFAQ(DEFAULT_FAQ);
      setActiveTab(DEFAULT_FAQ.categories[0] || '');
      toast({
        title: '✅ Réinitialisation effectuée',
        description: 'La FAQ par défaut a été restaurée',
      });
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de réinitialiser la FAQ',
        variant: 'destructive'
      });
    }
  };

  const getItemsByCategory = (category: string) => {
    return editedFAQ.items.filter(item => item.category === category);
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Foire aux Questions</CardTitle>
                <CardDescription>
                  Gérez les questions/réponses fréquentes pour aider vos équipes
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Catégorie
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une catégorie</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nom de la catégorie</Label>
                      <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Ex: Services, Options..."
                        onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddCategory(false)}>
                        Annuler
                      </Button>
                      <Button onClick={addCategory} disabled={!newCategory.trim()}>
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Réinitialiser la FAQ ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action remplacera toute votre FAQ personnalisée par les valeurs par défaut.
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
              {editedFAQ.categories.map((category) => (
                <div key={category} className="relative group">
                  <TabsTrigger value={category} className="text-xs pr-6">
                    {category}
                    <Badge variant="secondary" className="ml-1 text-[10px]">
                      {getItemsByCategory(category).length}
                    </Badge>
                  </TabsTrigger>
                  {editedFAQ.categories.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCategory(category);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </TabsList>

            {editedFAQ.categories.map((category) => {
              const categoryItems = getItemsByCategory(category);

              return (
                <TabsContent key={category} value={category} className="space-y-3">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {categoryItems.map((item, index) => {
                        const isOpen = openItems[item.id] !== false;
                        
                        return (
                          <Collapsible key={item.id} open={isOpen} onOpenChange={() => toggleItem(item.id)}>
                            <Card className="border">
                              <CardHeader className="py-3 px-4">
                                <CollapsibleTrigger asChild>
                                  <div className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                                        {index + 1}
                                      </span>
                                      <span className="text-sm font-medium truncate">
                                        {item.question || 'Nouvelle question...'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeQuestion(item.id);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                      {isOpen ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                </CollapsibleTrigger>
                              </CardHeader>
                              <CollapsibleContent>
                                <CardContent className="pt-0 space-y-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Question</Label>
                                    <Input
                                      value={item.question}
                                      onChange={(e) => handleQuestionChange(item.id, e.target.value)}
                                      placeholder="Entrez la question..."
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Réponse</Label>
                                    <Textarea
                                      value={item.answer}
                                      onChange={(e) => handleAnswerChange(item.id, e.target.value)}
                                      placeholder="Entrez la réponse..."
                                      className="min-h-[100px]"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Catégorie</Label>
                                    <Select
                                      value={item.category}
                                      onValueChange={(value) => handleCategoryChange(item.id, value)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {editedFAQ.categories.map((cat) => (
                                          <SelectItem key={cat} value={cat}>
                                            {cat}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </CardContent>
                              </CollapsibleContent>
                            </Card>
                          </Collapsible>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => addQuestion(category)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une question
                  </Button>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
