import { Controller, Control, FieldValues, Path } from "react-hook-form";
import {
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    label: string;
    placeholder?: string;
    type?: "text" | "email" | "password" | "select";
    options?: string[];
    compact?: boolean;                    // 🆕
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
    const inputClasses = cn(
        "w-full bg-transparent border border-white/60 rounded-md text-white placeholder:text-white/60",
        "focus:border-white/80 focus:ring-1 focus:ring-white/20",
        "py-2 px-3 text-sm"
    );

    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-light-100 font-normal text-sm mb-1">{label}</FormLabel>
                    <FormControl>
                        {type === "select" ? (
                            <select {...field} className={inputClasses}>
                                <option value="">Select...</option>
                                {options.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <Input {...field} className={inputClasses} type={type} placeholder={placeholder} />
                        )}
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

export default FormField;
