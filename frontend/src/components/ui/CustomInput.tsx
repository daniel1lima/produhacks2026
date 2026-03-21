import * as React from "react"
import { cn } from "@/lib/utils"

function CustomInput({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-border bg-background px-4 py-2",
        "text-base font-normal text-foreground antialiased",
        "placeholder:text-muted-foreground outline-none transition-colors",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { CustomInput }
