import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarIcon, X, CheckCircle, Trash2, Pencil, Check, XCircle, FileText, Settings2, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Copy, Eye, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useEffect, useState, useCallback, useMemo } from 'react';
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

const COLUMNS = [
  { key: 'date', label: 'Date', default: true, sortKey: 'sale_date' },
  { key: 'employee', label: 'Employé', default: true, sortKey: null },
  { key: 'type', label: 'Type', default: true, sortKey: null },
  { key: 'contract', label: 'N° Contrat', default: true, sortKey: 'contract_number' },
  { key: 'client', label: 'Client', default: true, sortKey: 'client_name' },
  { key: 'amount', label: 'Montant', default: true, sortKey: 'amount' },
  { key: 'commission', label: 'Commission', default: true, sortKey: 'commission_amount' },
  { key: 'agency', label: 'Agence', default: true, sortKey: 'agency' },
  { key: 'status', label: 'Statut', default: true, sortKey: 'status' },
] as const;

type ColumnKey = typeof COLUMNS[number]['key'];

export function AdminSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date range filter state
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  
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
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(COLUMNS.filter(c => c.default).map(c => c.key))
  );
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>('sale_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const toggleColumn = (key: ColumnKey) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(key)) {
      newVisible.delete(key);
    } else {
      newVisible.add(key);
    }
    setVisibleColumns(newVisible);
  };

  const isColumnVisible = (key: ColumnKey) => visibleColumns.has(key);
  
  const handleSort = (sortKey: string | null) => {
    if (!sortKey) return;
    if (sortColumn === sortKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(sortKey);
      setSortDirection('desc');
    }
  };
  
  const getSortIcon = (sortKey: string | null) => {
    if (!sortKey) return null;
    if (sortColumn !== sortKey) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" /> 
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };
  
  // Calculate stats for selected rows
  const selectedStats = useMemo(() => {
    if (selectedIds.size === 0) return null;
    const selectedSales = sales.filter(s => selectedIds.has(s.id));
    return {
      count: selectedSales.length,
      totalAmount: selectedSales.reduce((sum, s) => sum + Number(s.amount || 0), 0),
      totalCommission: selectedSales.reduce((sum, s) => sum + Number(s.commission_amount || 0), 0),
    };
  }, [selectedIds, sales]);
  
  // State for viewing sale details
  const [viewingSale, setViewingSale] = useState<any | null>(null);
  
  // State for editing sale
  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [savingEditForm, setSavingEditForm] = useState(false);
  
  // State for deleting sale
  const [deletingSale, setDeletingSale] = useState<any | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingLoading, setDeletingLoading] = useState(false);
  
  // Open edit dialog
  const openEditDialog = (sale: any) => {
    setEditingSale(sale);
    setEditForm({
      client_name: sale.client_name || '',
      client_phone: sale.client_phone || '',
      contract_number: sale.contract_number || '',
      amount: sale.amount || 0,
      agency: sale.agency || '',
      status: sale.status || 'pending',
      notes: sale.notes || '',
      sale_date: sale.sale_date,
      insurance_type_id: sale.insurance_type_id || '',
    });
  };
  
  // Save edited sale
  const saveEditedSale = async () => {
    if (!editingSale) return;
    setSavingEditForm(true);
    try {
      const { error } = await (supabase as any)
        .from('insurance_sales')
        .update({
          client_name: editForm.client_name,
          client_phone: editForm.client_phone,
          contract_number: editForm.contract_number,
          amount: parseFloat(editForm.amount) || 0,
          agency: editForm.agency,
          status: editForm.status,
          notes: editForm.notes,
          sale_date: editForm.sale_date,
          insurance_type_id: editForm.insurance_type_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingSale.id);
      
      if (error) throw error;
      
      toast({ title: 'Vente modifiée', description: 'Les modifications ont été enregistrées (trace dans les logs)' });
      setEditingSale(null);
      loadSales();
    } catch (error: any) {
      console.error('Error updating sale:', error);
      toast({ title: 'Erreur', description: error.message || 'Impossible de modifier la vente', variant: 'destructive' });
    } finally {
      setSavingEditForm(false);
    }
  };
  
  // Delete sale with reason
  const deleteSale = async () => {
    if (!deletingSale) return;
    setDeletingLoading(true);
    try {
      // First update the notes with the deletion reason (for audit trail)
      await (supabase as any)
        .from('insurance_sales')
        .update({ notes: `[SUPPRIMÉ: ${deleteReason || 'Aucune raison'}] ${deletingSale.notes || ''}` })
        .eq('id', deletingSale.id);
      
      // Then delete
      const { error } = await (supabase as any)
        .from('insurance_sales')
        .delete()
        .eq('id', deletingSale.id);
      
      if (error) throw error;
      
      toast({ title: 'Vente supprimée', description: 'La vente a été supprimée (trace conservée dans les logs d\'audit)' });
      setDeletingSale(null);
      setDeleteReason('');
      loadSales();
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      toast({ title: 'Erreur', description: error.message || 'Impossible de supprimer la vente', variant: 'destructive' });
    } finally {
      setDeletingLoading(false);
    }
  };
  
  // Duplicate sale function
  const duplicateSale = async (sale: any) => {
    try {
      const newSale = {
        user_id: sale.user_id,
        insurance_type_id: sale.insurance_type_id,
        amount: sale.amount,
        sale_date: format(new Date(), 'yyyy-MM-dd'),
        client_name: sale.client_name,
        client_phone: sale.client_phone,
        agency: sale.agency,
        status: 'pending',
        notes: sale.notes,
        contract_number: `${sale.contract_number}-COPY`,
      };
      
      const { error } = await (supabase as any)
        .from('insurance_sales')
        .insert(newSale);
      
      if (error) throw error;
      
      toast({ title: 'Vente dupliquée', description: 'La vente a été dupliquée avec succès' });
      loadSales();
    } catch (error) {
      console.error('Error duplicating sale:', error);
      toast({ title: 'Erreur', description: 'Impossible de dupliquer la vente', variant: 'destructive' });
    }
  };

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
      
      // Execute paginated query with dynamic sorting
      const { data, error, count } = await query
        .order(sortColumn, { ascending: sortDirection === 'asc' })
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
  }, [currentPage, itemsPerPage, searchTerm, startDate, endDate, selectedEmployee, selectedInsuranceType, selectedStatus, selectedAgency, sortColumn, sortDirection]);

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

  // Reset to page 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, selectedEmployee, selectedInsuranceType, selectedStatus, selectedAgency, sortColumn, sortDirection]);

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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Colonnes
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-background">
                    <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {COLUMNS.map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.key}
                        checked={isColumnVisible(col.key)}
                        onCheckedChange={() => toggleColumn(col.key)}
                      >
                        {col.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Date range and employee filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Du:</span>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
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
                      onSelect={(date) => {
                        setStartDate(date);
                        setStartDateOpen(false);
                      }}
                      onTodaySelect={(date) => {
                        setStartDate(date);
                        setStartDateOpen(false);
                      }}
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
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
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
                      onSelect={(date) => {
                        setEndDate(date);
                        setEndDateOpen(false);
                      }}
                      onTodaySelect={(date) => {
                        setEndDate(date);
                        setEndDateOpen(false);
                      }}
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
          {selectedIds.size > 0 && selectedStats && (
            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedIds.size} vente(s) sélectionnée(s)
              </span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Montant: <span className="font-medium text-foreground">{selectedStats.totalAmount.toFixed(2)} €</span>
                </span>
                <span className="text-muted-foreground">
                  Commission: <span className="font-medium text-green-600">{selectedStats.totalCommission.toFixed(2)} €</span>
                </span>
              </div>
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
                  {isColumnVisible('date') && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('sale_date')}
                    >
                      <div className="flex items-center">Date{getSortIcon('sale_date')}</div>
                    </TableHead>
                  )}
                  {isColumnVisible('employee') && <TableHead>Employé</TableHead>}
                  {isColumnVisible('type') && <TableHead>Type</TableHead>}
                  {isColumnVisible('contract') && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('contract_number')}
                    >
                      <div className="flex items-center">N° Contrat{getSortIcon('contract_number')}</div>
                    </TableHead>
                  )}
                  {isColumnVisible('client') && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('client_name')}
                    >
                      <div className="flex items-center">Client{getSortIcon('client_name')}</div>
                    </TableHead>
                  )}
                  {isColumnVisible('amount') && (
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center justify-end">Montant{getSortIcon('amount')}</div>
                    </TableHead>
                  )}
                  {isColumnVisible('commission') && (
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('commission_amount')}
                    >
                      <div className="flex items-center justify-end">Commission{getSortIcon('commission_amount')}</div>
                    </TableHead>
                  )}
                  {isColumnVisible('agency') && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('agency')}
                    >
                      <div className="flex items-center">Agence{getSortIcon('agency')}</div>
                    </TableHead>
                  )}
                  {isColumnVisible('status') && (
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">Statut{getSortIcon('status')}</div>
                    </TableHead>
                  )}
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={2 + visibleColumns.size} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2 + visibleColumns.size} className="text-center py-8">
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
                      {isColumnVisible('date') && (
                        <TableCell>
                          {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: fr })}
                        </TableCell>
                      )}
                      {isColumnVisible('employee') && (
                        <TableCell className="font-medium">{sale.profiles?.full_name || '-'}</TableCell>
                      )}
                      {isColumnVisible('type') && (
                        <TableCell>
                          <Badge variant="outline">{sale.insurance_types?.name || '-'}</Badge>
                        </TableCell>
                      )}
                      {isColumnVisible('contract') && (
                        <TableCell className="font-mono text-sm">
                          {renderEditableCell(sale, 'contract_number', sale.contract_number || '-')}
                        </TableCell>
                      )}
                      {isColumnVisible('client') && (
                        <TableCell>
                          {renderEditableCell(sale, 'client_name', sale.client_name || '-')}
                        </TableCell>
                      )}
                      {isColumnVisible('amount') && (
                        <TableCell className="text-right">
                          {renderEditableCell(sale, 'amount', `${Number(sale.amount).toFixed(2)} €`, 'font-medium justify-end')}
                        </TableCell>
                      )}
                      {isColumnVisible('commission') && (
                        <TableCell className="text-right text-green-600 font-medium">
                          {Number(sale.commission_amount || 0).toFixed(2)} €
                        </TableCell>
                      )}
                      {isColumnVisible('agency') && (
                        <TableCell>
                          {renderEditableCell(sale, 'agency', sale.agency || '-')}
                        </TableCell>
                      )}
                      {isColumnVisible('status') && (
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
                      )}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background">
                            <DropdownMenuItem onClick={() => setViewingSale(sale)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(sale)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateSale(sale)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeletingSale(sale)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Sale Details Dialog */}
          <Dialog open={!!viewingSale} onOpenChange={() => setViewingSale(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Détails de la vente</DialogTitle>
              </DialogHeader>
              {viewingSale && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <p className="font-medium">{format(new Date(viewingSale.sale_date), 'dd MMMM yyyy', { locale: fr })}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Statut:</span>
                      <p>
                        <Badge variant={viewingSale.status === 'validated' ? 'default' : 'secondary'}>
                          {viewingSale.status === 'validated' ? 'Validé' : 'En attente'}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Client:</span>
                      <p className="font-medium">{viewingSale.client_name || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Téléphone:</span>
                      <p className="font-medium">{viewingSale.client_phone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">N° Contrat:</span>
                      <p className="font-mono">{viewingSale.contract_number || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p>{viewingSale.insurance_types?.name || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Montant:</span>
                      <p className="font-bold text-lg">{Number(viewingSale.amount).toFixed(2)} €</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Commission:</span>
                      <p className="font-bold text-lg text-green-600">{Number(viewingSale.commission_amount || 0).toFixed(2)} €</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Employé:</span>
                      <p className="font-medium">{viewingSale.profiles?.full_name || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Agence:</span>
                      <p>{viewingSale.agency || '-'}</p>
                    </div>
                  </div>
                  {viewingSale.notes && (
                    <div>
                      <span className="text-muted-foreground text-sm">Notes:</span>
                      <p className="text-sm mt-1 p-2 bg-muted rounded">{viewingSale.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Sale Dialog */}
          <Dialog open={!!editingSale} onOpenChange={() => setEditingSale(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Modifier la vente</DialogTitle>
              </DialogHeader>
              {editingSale && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date de vente</label>
                      <Input
                        type="date"
                        value={editForm.sale_date}
                        onChange={(e) => setEditForm({ ...editForm, sale_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type d'assurance</label>
                      <Select value={editForm.insurance_type_id} onValueChange={(v) => setEditForm({ ...editForm, insurance_type_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {insuranceTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Client</label>
                      <Input
                        value={editForm.client_name}
                        onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                        placeholder="Nom du client"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Téléphone</label>
                      <Input
                        value={editForm.client_phone}
                        onChange={(e) => setEditForm({ ...editForm, client_phone: e.target.value })}
                        placeholder="Téléphone"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">N° Contrat</label>
                      <Input
                        value={editForm.contract_number}
                        onChange={(e) => setEditForm({ ...editForm, contract_number: e.target.value })}
                        placeholder="Numéro de contrat"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Montant (€)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Agence</label>
                      <Select value={editForm.agency} onValueChange={(v) => setEditForm({ ...editForm, agency: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {agencies.map((ag) => (
                            <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Statut</label>
                      <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="validated">Validé</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes</label>
                    <Input
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Notes additionnelles..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setEditingSale(null)}>Annuler</Button>
                    <Button onClick={saveEditedSale} disabled={savingEditForm}>
                      {savingEditForm ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={!!deletingSale} onOpenChange={() => { setDeletingSale(null); setDeleteReason(''); }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-destructive">Supprimer la vente</DialogTitle>
              </DialogHeader>
              {deletingSale && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Êtes-vous sûr de vouloir supprimer cette vente ? Cette action est irréversible mais une trace sera conservée dans les logs d'audit.
                  </p>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p><strong>Contrat:</strong> {deletingSale.contract_number}</p>
                    <p><strong>Client:</strong> {deletingSale.client_name}</p>
                    <p><strong>Montant:</strong> {Number(deletingSale.amount).toFixed(2)} €</p>
                    <p><strong>Employé:</strong> {deletingSale.profiles?.full_name}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Motif de suppression *</label>
                    <Input
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Ex: Erreur de saisie, doublon, fausse vente..."
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setDeletingSale(null); setDeleteReason(''); }}>
                      Annuler
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={deleteSale} 
                      disabled={deletingLoading || !deleteReason.trim()}
                    >
                      {deletingLoading ? 'Suppression...' : 'Supprimer définitivement'}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

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
