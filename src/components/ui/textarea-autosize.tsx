import * as React from "react";
import TextareaAutosize from "react-textarea-autosize";

import { cn } from "@/lib/utils";

export interface TextareaAutosizeProps
  extends React.ComponentProps<typeof TextareaAutosize> {
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  onValueChange?: (value: string) => void;
}

const TextareaAutosizeComponent = React.forwardRef<
  HTMLTextAreaElement,
  TextareaAutosizeProps
>(({ className, textareaRef, onValueChange, onChange, ...props }, ref) => {
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onValueChange?.(e.target.value);
      onChange?.(e);
    },
    [onChange, onValueChange]
  );

  return (
    <TextareaAutosize
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={textareaRef || ref}
      onChange={handleChange}
      {...props}
    />
  );
});
TextareaAutosizeComponent.displayName = "TextareaAutosize";

export { TextareaAutosizeComponent as TextareaAutosize };
