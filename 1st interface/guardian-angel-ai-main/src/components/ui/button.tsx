import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90",
        outline:
          "border-2 border-input bg-background hover:bg-muted hover:border-muted-foreground/30",
        secondary:
          "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Emergency variants
        sos: "bg-emergency text-primary-foreground shadow-sos hover:bg-emergency-dark animate-sos-glow text-lg font-bold",
        emergency: "bg-emergency text-primary-foreground shadow-emergency hover:bg-emergency-dark",
        "emergency-outline": "border-2 border-emergency text-emergency bg-emergency-light hover:bg-emergency hover:text-primary-foreground",
        safe: "bg-safe text-secondary-foreground shadow-md hover:bg-safe/90",
        "safe-outline": "border-2 border-safe text-safe bg-safe-light hover:bg-safe hover:text-secondary-foreground",
        medical: "bg-medical text-success-foreground shadow-md hover:bg-medical/90",
        warning: "bg-warning text-accent-foreground shadow-md hover:bg-warning/90",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-11 w-11",
        "icon-lg": "h-14 w-14",
        "icon-xl": "h-20 w-20",
        // SOS specific size
        sos: "h-40 w-40 rounded-full text-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
