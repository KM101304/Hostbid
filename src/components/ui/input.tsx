import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  props,
  ref,
) {
  return <input ref={ref} {...props} className={cn("field-input", props.className)} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea(props, ref) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={cn("field-input min-h-36 resize-y py-4", props.className)}
    />
  );
  },
);
