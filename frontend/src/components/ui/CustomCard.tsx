import * as React from "react"
import { cn } from "@/lib/utils"

function CustomCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card shadow-none",
        className
      )}
      {...props}
    />
  )
}

function CustomCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-1 px-6 pt-6 pb-4", className)} {...props} />
  )
}

function CustomCardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2 className={cn("text-base font-normal text-foreground", className)} {...props} />
  )
}

function CustomCardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-base font-normal text-muted-foreground", className)} {...props} />
  )
}

function CustomCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("px-6 py-2", className)} {...props} />
  )
}

function CustomCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("px-6 pt-2 pb-6", className)} {...props} />
  )
}

export {
  CustomCard,
  CustomCardHeader,
  CustomCardTitle,
  CustomCardDescription,
  CustomCardContent,
  CustomCardFooter,
}
