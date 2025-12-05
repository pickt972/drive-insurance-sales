import { FAQManagement } from '@/components/Admin/FAQManagement';

export function AdminFAQPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Foire aux Questions</h2>
        <p className="text-muted-foreground">
          Gérez les questions/réponses pour aider vos équipes au quotidien
        </p>
      </div>
      <FAQManagement />
    </div>
  );
}
