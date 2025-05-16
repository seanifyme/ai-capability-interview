import { Controller, Control, FieldValues, Path } from "react-hook-form";
import {
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

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
    const base = "input w-full border border-white/60";          // reuse existing Tailwind ‘input’ classes
    const sm   = "py-2 px-3 text-sm";     // compact tweak
    const cls  = compact ? `${base} ${sm}` : base;

    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="label">{label}</FormLabel>
                    <FormControl>
                        {type === "select" ? (
                            <select {...field} className={`${cls} appearance-none`}>
                                <option value="">Select…</option>
                                {options.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <Input {...field} className={cls} type={type} placeholder={placeholder} />
                        )}
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

export default FormField;
