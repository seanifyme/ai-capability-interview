import { Controller, Control, FieldValues, Path } from "react-hook-form";
import {
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { 
    User, 
    Mail, 
    Lock,
    Briefcase,
    Users,
    Building2,
    MapPin,
    Eye,
    EyeOff
} from "lucide-react";

interface FormFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    label: string;
    placeholder?: string;
    type?: "text" | "email" | "password" | "select";
    options?: string[];
    compact?: boolean;
}

const FormField = <T extends FieldValues>({
    control,
    name,
    label,
    placeholder,
    type = "text",
    options = [],
    compact = false,
}: FormFieldProps<T>) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputClasses = cn(
        "w-full bg-transparent border border-white/60 rounded-lg text-white placeholder:text-white/60",
        "focus:border-white/80 focus:ring-1 focus:ring-white/20",
        "py-2.5 pl-10 pr-4 text-sm"  // Added left padding for icon
    );

    const getIcon = () => {
        switch (name) {
            case 'name':
                return <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />;
            case 'email':
                return <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />;
            case 'password':
                return <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />;
            case 'jobTitle':
                return <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />;
            case 'seniority':
                return <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />;
            case 'department':
                return <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />;
            case 'location':
                return <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />;
            default:
                return null;
        }
    };

    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-light-100 font-normal text-sm mb-1">{label}</FormLabel>
                    <FormControl>
                        <div className="relative">
                            {getIcon()}
                            {type === "select" ? (
                                <select {...field} className={inputClasses}>
                                    <option value="">Select...</option>
                                    {options.map((opt) => (
                                        <option key={opt} value={opt} className="bg-[#040D30] text-white">
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <>
                                    <Input 
                                        {...field} 
                                        className={inputClasses} 
                                        type={type === "password" ? (showPassword ? "text" : "password") : type}
                                        placeholder={placeholder}
                                    />
                                    {type === "password" && (
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

export default FormField;
