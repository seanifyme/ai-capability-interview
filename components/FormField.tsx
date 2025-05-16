import { Controller, Control, FieldValues, Path } from "react-hook-form";

import {
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

/* ─── props ─────────────────────────────────────────────────── */
interface FormFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>;
    label: string;
    placeholder?: string;
    /* Allowed HTML input types + our custom “select” */
    type?: "text" | "email" | "password" | "select";
    /** Only used when type === "select" */
    options?: string[];
}

/* ─── component ─────────────────────────────────────────────── */
const FormField = <T extends FieldValues>({
                                              control,
                                              name,
                                              label,
                                              placeholder,
                                              type = "text",
                                              options = [],
                                          }: FormFieldProps<T>) => {
    /* Tailwind utility classes reused by both <input> and <select> */
    const baseClasses = "input";

    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="label">{label}</FormLabel>

                    <FormControl>
                        {type === "select" ? (
                            <select {...field} className={`${baseClasses} appearance-none`}>
                                <option value="">Select…</option>
                                {options.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <Input
                                {...field}
                                className={baseClasses}
                                type={type}
                                placeholder={placeholder}
                            />
                        )}
                    </FormControl>

                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

export default FormField;
