import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpCircle, Search, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useFAQ } from '@/hooks/useFAQ';
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
import { Button } from '@/components/ui/button';

export function FAQViewer() {
  const { faq, loading } = useFAQ();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const filteredItems = searchQuery.trim()
    ? faq.items.filter(item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faq.items;

  const getItemsByCategory = (category: string) => {
    return filteredItems.filter(item => item.category === category);
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && faq.categories.length > 0 && !activeTab) {
      setActiveTab(faq.categories[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">FAQ</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Foire aux Questions
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {searchQuery.trim() ? (
              /* Search results */
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-4">
                  {filteredItems.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun résultat pour "{searchQuery}"
                    </p>
                  ) : (
                    filteredItems.map((item) => (
                      <Collapsible 
                        key={item.id} 
                        open={openItems[item.id]} 
                        onOpenChange={() => toggleItem(item.id)}
                      >
                        <Card className="border">
                          <CollapsibleTrigger asChild>
                            <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1">
                                  <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                  <span className="text-sm font-medium">{item.question}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-[10px]">
                                    {item.category}
                                  </Badge>
                                  {openItems[item.id] ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0 pb-4">
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {item.answer}
                              </p>
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ))
                  )}
                </div>
              </ScrollArea>
            ) : (
              /* Category tabs */
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="flex flex-wrap h-auto gap-1 justify-start">
                  {faq.categories.map((category) => (
                    <TabsTrigger key={category} value={category} className="text-xs">
                      {category}
                      <Badge variant="secondary" className="ml-1 text-[10px]">
                        {getItemsByCategory(category).length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {faq.categories.map((category) => {
                  const categoryItems = getItemsByCategory(category);

                  return (
                    <TabsContent key={category} value={category} className="flex-1 mt-4">
                      <ScrollArea className="h-[350px]">
                        <div className="space-y-2 pr-4">
                          {categoryItems.map((item) => (
                            <Collapsible 
                              key={item.id} 
                              open={openItems[item.id]} 
                              onOpenChange={() => toggleItem(item.id)}
                            >
                              <Card className="border">
                                <CollapsibleTrigger asChild>
                                  <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 flex-1">
                                        <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span className="text-sm font-medium">{item.question}</span>
                                      </div>
                                      {openItems[item.id] ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </div>
                                  </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <CardContent className="pt-0 pb-4">
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                      {item.answer}
                                    </p>
                                  </CardContent>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
