import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarIcon, X, CheckCircle, Trash2, Pencil, Check, XCircle, FileText } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subDays, startOfQuarter, endOfQuarter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { exportSalesPDF } from '@/utils/pdfExport';

interface EditingCell {
  saleId: string;
  field: string;
  value: string;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export function AdminSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date range filter state
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  
  // Employee filter state
  const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  
  // Insurance type filter state
  const [insuranceTypes, setInsuranceTypes] = useState<{ id: string; name: string }[]>([]);
  const [selectedInsuranceType, setSelectedInsuranceType] = useState<string>('all');
  
  // Status filter state
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Agency filter state
  const [agencies, setAgencies] = useState<string[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Stats state (calculated from all data, not just current page)
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Load employees and insurance types
  useEffect(() => {
    const loadEmployees = async () => {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name');
      setEmployees(data || []);
    };
    const loadInsuranceTypes = async () => {
      const { data } = await (supabase as any)
        .from('insurance_types')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setInsuranceTypes(data || []);
    };
    const loadAgencies = async () => {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('agency')
        .not('agency', 'is', null);
      const uniqueAgencies = [...new Set((data || []).map((p: any) => p.agency as string).filter(Boolean))] as string[];
      setAgencies(uniqueAgencies.sort());
    };
    loadEmployees();
    loadInsuranceTypes();
    loadAgencies();
  }, []);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const supabaseAny = supabase as any;
      
      // Build the base query
      let query = supabaseAny
        .from('insurance_sales')
        .select(`
          *,
          insurance_types(name),
          profiles:user_id(full_name)
        `, { count: 'exact' });
      
      // Apply date range filter
      if (startDate) {
        query = query.gte('sale_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('sale_date', format(endDate, 'yyyy-MM-dd'));
      }
      
      // Apply employee filter
      if (selectedEmployee && selectedEmployee !== 'all') {
        query = query.eq('user_id', selectedEmployee);
      }
      
      // Apply insurance type filter
      if (selectedInsuranceType && selectedInsuranceType !== 'all') {
        query = query.eq('insurance_type_id', selectedInsuranceType);
      }
      
      // Apply status filter
      if (selectedStatus && selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      
      // Apply agency filter
      if (selectedAgency && selectedAgency !== 'all') {
        query = query.eq('agency', selectedAgency);
      }
      
      // Apply search filter if present
      if (searchTerm) {
        query = query.or(`contract_number.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%`);
      }
      
      // Calculate range for pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      // Execute paginated query
      const { data, error, count } = await query
        .order('sale_date', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error loading sales:', error);
      }
      
      setSales(data || []);
      setTotalCount(count || 0);
      
      // Load aggregated stats separately (for all matching records)
      await loadStats(searchTerm, startDate, endDate, selectedEmployee, selectedInsuranceType, selectedStatus, selectedAgency);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, startDate, endDate, selectedEmployee, selectedInsuranceType, selectedStatus, selectedAgency]);

  const loadStats = async (search: string, start?: Date, end?: Date, employeeId?: string, insuranceTypeId?: string, status?: string, agency?: string) => {
    try {
      const supabaseAny = supabase as any;
      
      let query = supabaseAny
        .from('insurance_sales')
        .select('amount, commission_amount');
      
      if (start) {
        query = query.gte('sale_date', format(start, 'yyyy-MM-dd'));
      }
      if (end) {
        query = query.lte('sale_date', format(end, 'yyyy-MM-dd'));
      }
      
      if (employeeId && employeeId !== 'all') {
        query = query.eq('user_id', employeeId);
      }
      
      if (insuranceTypeId && insuranceTypeId !== 'all') {
        query = query.eq('insurance_type_id', insuranceTypeId);
      }
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      
      if (agency && agency !== 'all') {
        query = query.eq('agency', agency);
      }
      
      if (search) {
        query = query.or(`contract_number.ilike.%${search}%,client_name.ilike.%${search}%`);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        const sumAmount = data.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);
        const sumCommission = data.reduce((sum: number, s: any) => sum + Number(s.commission_amount || 0), 0);
        setTotalAmount(sumAmount);
        setTotalCommission(sumCommission);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, selectedEmployee, selectedInsuranceType, selectedStatus, selectedAgency]);

  const clearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const setThisMonth = () => {
    setStartDate(startOfMonth(new Date()));
    setEndDate(endOfMonth(new Date()));
  };

  const setLast7Days = () => {
    setStartDate(subDays(new Date(), 7));
    setEndDate(new Date());
  };

  const setLast30Days = () => {
    setStartDate(subDays(new Date(), 30));
    setEndDate(new Date());
  };

  const setThisQuarter = () => {
    setStartDate(startOfQuarter(new Date()));
    setEndDate(endOfQuarter(new Date()));
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === sales.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sales.map(s => s.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Clear selection when sales change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [sales]);

  const bulkValidate = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('insurance_sales')
        .update({ status: 'validated' })
        .in('id', Array.from(selectedIds));
      
      if (error) throw error;
      
      toast({
        title: 'Ventes validées',
        description: `${selectedIds.size} vente(s) validée(s) avec succès`,
      });
      setSelectedIds(new Set());
      loadSales();
    } catch (error) {
      console.error('Error validating sales:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de valider les ventes',
        variant: 'destructive',
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} vente(s) ?`)) return;
    
    setBulkLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('insurance_sales')
        .delete()
        .in('id', Array.from(selectedIds));
      
      if (error) throw error;
      
      toast({
        title: 'Ventes supprimées',
        description: `${selectedIds.size} vente(s) supprimée(s) avec succès`,
      });
      setSelectedIds(new Set());
      loadSales();
    } catch (error) {
      console.error('Error deleting sales:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer les ventes',
        variant: 'destructive',
      });
    } finally {
      setBulkLoading(false);
    }
  };

  // Inline editing functions
  const startEditing = (saleId: string, field: string, currentValue: string) => {
    setEditingCell({ saleId, field, value: currentValue || '' });
  };

  const cancelEditing = () => {
    setEditingCell(null);
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    
    setSavingEdit(true);
    try {
      const updateData: Record<string, any> = {};
      
      if (editingCell.field === 'amount') {
        const numValue = parseFloat(editingCell.value);
        if (isNaN(numValue) || numValue < 0) {
          toast({ title: 'Erreur', description: 'Montant invalide', variant: 'destructive' });
          return;
        }
        updateData.amount = numValue;
      } else if (editingCell.field === 'status') {
        updateData.status = editingCell.value;
      } else {
        updateData[editingCell.field] = editingCell.value.trim();
      }
      
      const { error } = await (supabase as any)
        .from('insurance_sales')
        .update(updateData)
        .eq('id', editingCell.saleId);
      
      if (error) throw error;
      
      toast({ title: 'Modifié', description: 'Vente mise à jour avec succès' });
      setEditingCell(null);
      loadSales();
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({ title: 'Erreur', description: 'Impossible de modifier la vente', variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const renderEditableCell = (sale: any, field: string, displayValue: string, className?: string) => {
    const isEditing = editingCell?.saleId === sale.id && editingCell?.field === field;
    
    if (isEditing) {
      if (field === 'status') {
        return (
          <div className="flex items-center gap-1">
            <Select value={editingCell.value} onValueChange={(v) => setEditingCell({ ...editingCell, value: v })}>
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="validated">Validé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveEdit} disabled={savingEdit}>
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEditing}>
              <XCircle className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        );
      }
      
      return (
        <div className="flex items-center gap-1">
          <Input
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onKeyDown={handleKeyDown}
            className="h-8 w-full min-w-[80px]"
            autoFocus
            type={field === 'amount' ? 'number' : 'text'}
            step={field === 'amount' ? '0.01' : undefined}
          />
          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={saveEdit} disabled={savingEdit}>
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={cancelEditing}>
            <XCircle className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      );
    }
    
    return (
      <div 
        className={cn("group cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded flex items-center gap-1", className)}
        onClick={() => startEditing(sale.id, field, field === 'amount' ? sale.amount?.toString() : (sale[field] || ''))}
      >
        <span>{displayValue}</span>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />
      </div>
    );
  };

  const exportToCSV = async () => {
    // Export all matching records, not just current page
    try {
      const supabaseAny = supabase as any;
      let query = supabaseAny
        .from('insurance_sales')
        .select(`
          *,
          insurance_types(name),
          profiles:user_id(full_name)
        `)
        .order('sale_date', { ascending: false });
      
      if (startDate) {
        query = query.gte('sale_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('sale_date', format(endDate, 'yyyy-MM-dd'));
      }
      
      if (selectedEmployee && selectedEmployee !== 'all') {
        query = query.eq('user_id', selectedEmployee);
      }
      
      if (selectedInsuranceType && selectedInsuranceType !== 'all') {
        query = query.eq('insurance_type_id', selectedInsuranceType);
      }
      
      if (selectedStatus && selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      
      if (selectedAgency && selectedAgency !== 'all') {
        query = query.eq('agency', selectedAgency);
      }
      
      if (searchTerm) {
        query = query.or(`contract_number.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%`);
      }
      
      const { data } = await query;
      
      if (!data) return;
      
      const headers = ['Date', 'Employé', 'Type', 'Contrat', 'Client', 'Montant', 'Commission', 'Agence', 'Statut'];
      const rows = data.map((sale: any) => [
        format(new Date(sale.sale_date), 'dd/MM/yyyy'),
        sale.profiles?.full_name || '-',
        sale.insurance_types?.name || '-',
        sale.contract_number || '-',
        sale.client_name || '-',
        sale.amount,
        sale.commission_amount,
        sale.agency || '-',
        sale.status,
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ventes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const exportToPDF = async () => {
    try {
      const supabaseAny = supabase as any;
      let query = supabaseAny
        .from('insurance_sales')
        .select(`
          *,
          insurance_types(name),
          profiles:user_id(full_name)
        `)
        .order('sale_date', { ascending: false });
      
      if (startDate) {
        query = query.gte('sale_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('sale_date', format(endDate, 'yyyy-MM-dd'));
      }
      
      if (selectedEmployee && selectedEmployee !== 'all') {
        query = query.eq('user_id', selectedEmployee);
      }
      
      if (selectedInsuranceType && selectedInsuranceType !== 'all') {
        query = query.eq('insurance_type_id', selectedInsuranceType);
      }
      
      if (selectedStatus && selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      
      if (selectedAgency && selectedAgency !== 'all') {
        query = query.eq('agency', selectedAgency);
      }
      
      if (searchTerm) {
        query = query.or(`contract_number.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%`);
      }
      
      const { data } = await query;
      
      if (!data || data.length === 0) {
        toast({ title: 'Aucune donnée', description: 'Aucune vente à exporter', variant: 'destructive' });
        return;
      }
      
      const salesForPDF = data.map((sale: any) => ({
        sale_date: sale.sale_date,
        employee_name: sale.profiles?.full_name || '-',
        insurance_type: sale.insurance_types?.name || '-',
        contract_number: sale.contract_number || '-',
        amount: sale.amount || 0,
        commission: sale.commission_amount || 0,
        customer_name: sale.client_name || '-',
      }));
      
      exportSalesPDF(salesForPDF, 'Rapport des ventes - Administration');
      toast({ title: 'Export PDF', description: 'Le rapport PDF a été généré avec succès' });
    } catch (error) {
      console.error('PDF Export error:', error);
      toast({ title: 'Erreur', description: 'Impossible de générer le PDF', variant: 'destructive' });
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Toutes les ventes</h2>
          <p className="text-muted-foreground">Gestion et suivi des ventes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700">
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
            <p className="text-sm text-muted-foreground">Ventes totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{totalAmount.toFixed(2)} €</div>
            <p className="text-sm text-muted-foreground">Montant total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{totalCommission.toFixed(2)} €</div>
            <p className="text-sm text-muted-foreground">Commissions totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Table with filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            {/* Search and items per page */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par contrat ou client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Par page:</span>
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(v) => {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt.toString()}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Date range and employee filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Du:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[160px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "Date début"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Date presets */}
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={setLast7Days} className="text-xs">
                  7 jours
                </Button>
                <Button variant="outline" size="sm" onClick={setLast30Days} className="text-xs">
                  30 jours
                </Button>
                <Button variant="outline" size="sm" onClick={setThisMonth} className="text-xs">
                  Ce mois
                </Button>
                <Button variant="outline" size="sm" onClick={setThisQuarter} className="text-xs">
                  Ce trimestre
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Au:</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[160px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM/yyyy") : "Date fin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Employé:</span>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tous les employés" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les employés</SelectItem>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Type:</span>
                <Select value={selectedInsuranceType} onValueChange={setSelectedInsuranceType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {insuranceTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Statut:</span>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Tous" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="validated">Validé</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Agence:</span>
                <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Toutes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les agences</SelectItem>
                    {agencies.map(agency => (
                      <SelectItem key={agency} value={agency}>{agency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" size="sm" onClick={setThisMonth}>
                Ce mois
              </Button>
              
              {(startDate || endDate || selectedEmployee !== 'all' || selectedInsuranceType !== 'all' || selectedStatus !== 'all' || selectedAgency !== 'all') && (
                <Button variant="ghost" size="sm" onClick={() => {
                  clearDateFilter();
                  setSelectedEmployee('all');
                  setSelectedInsuranceType('all');
                  setSelectedStatus('all');
                  setSelectedAgency('all');
                }}>
                  <X className="h-4 w-4 mr-1" />
                  Effacer filtres
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions Bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.size} vente(s) sélectionnée(s)
              </span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={bulkValidate}
                  disabled={bulkLoading}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Valider
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={bulkDelete}
                  disabled={bulkLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          )}
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={sales.length > 0 && selectedIds.size === sales.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Sélectionner tout"
                    />
                  </TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Employé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>N° Contrat</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead>Agence</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      Aucune vente trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id} className={selectedIds.has(sale.id) ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(sale.id)}
                          onCheckedChange={() => toggleSelectOne(sale.id)}
                          aria-label={`Sélectionner vente ${sale.contract_number}`}
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">{sale.profiles?.full_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sale.insurance_types?.name || '-'}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {renderEditableCell(sale, 'contract_number', sale.contract_number || '-')}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(sale, 'client_name', sale.client_name || '-')}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderEditableCell(sale, 'amount', `${Number(sale.amount).toFixed(2)} €`, 'font-medium justify-end')}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {Number(sale.commission_amount || 0).toFixed(2)} €
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(sale, 'agency', sale.agency || '-')}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(
                          sale, 
                          'status', 
                          <Badge
                            variant={sale.status === 'validated' ? 'default' : 'secondary'}
                            className={sale.status === 'validated' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {sale.status === 'validated' ? 'Validé' : 'En attente'}
                          </Badge> as any
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalCount)} sur {totalCount} résultats
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1 mx-2">
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => goToPage(pageNum)}
                        className="w-8 h-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
