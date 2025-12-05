import { Check, X } from 'lucide-react';
import { validatePassword, PASSWORD_RULES } from '@/lib/passwordValidation';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password);

  if (!password) return null;

  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
      <p className="text-xs font-medium text-muted-foreground">Règles du mot de passe :</p>
      <ul className="space-y-1">
        {PASSWORD_RULES.map((rule) => {
          const isValid = validation[rule.key];
          return (
            <li
              key={rule.key}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                isValid ? "text-success" : "text-muted-foreground"
              )}
            >
              {isValid ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
