import { Check, X } from "lucide-react";

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

interface PasswordRequirementsProps {
  password: string;
}

const requirements: Requirement[] = [
  {
    label: "At least 3 characters long",
    test: (password) => password.length >= 3,
  },
  {
    label: "Mix of letters and numbers",
    test: (password) => /[a-zA-Z]/.test(password) && /[0-9]/.test(password),
  },
  {
    label: "Special characters make it stronger",
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  return (
    <div className="mt-2 space-y-1.5 bg-white/5 p-2.5 rounded-lg">
      <p className="text-xs text-white/70 font-medium">Password requirements:</p>
      <ul className="text-xs space-y-1">
        {requirements.map((req, index) => {
          const isMet = req.test(password);
          return (
            <li
              key={index}
              className={`flex items-center gap-2 ${
                isMet ? "text-green-400" : "text-red-400"
              }`}
            >
              {isMet ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
} 