import * as React from "react"
import { cn } from "@/lib/utils"

function CustomButton2({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2",
        "text-base font-normal text-foreground antialiased",
        "bg-transparent hover:border-indigo-600 hover:text-indigo-600 transition-colors",
        "disabled:cursor-not-allowed disabled:bg-zinc-800/55 disabled:text-zinc-300",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

export { CustomButton2 }
