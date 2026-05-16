import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-500 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#2F6B3F]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F1E6]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#1F4D2E] to-[#2F6B3F] text-[#F6F1E6] shadow-[0_8px_24px_rgba(31,77,46,0.22)] hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(31,77,46,0.28)] hover:from-[#245735] hover:to-[#357a48]",
        destructive:
          "bg-gradient-to-r from-[#7A9E7E] to-[#2F6B3F] text-[#F6F1E6] shadow-[0_8px_22px_rgba(47,107,63,0.2)] hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(47,107,63,0.26)]",
        outline:
          "border border-[#7A9E7E] bg-[#F6F1E6]/85 text-[#1F4D2E] hover:bg-[#EDE6DA] hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(31,77,46,0.12)]",
        secondary:
          "border border-[#A3B18A] bg-[#EDE6DA] text-[#1F4D2E] hover:bg-[#F6F1E6] hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(31,77,46,0.12)]",
        ghost: "text-[#1F4D2E] hover:bg-[#EDE6DA]/80",
        link: "text-[#2F6B3F] underline-offset-4 hover:text-[#1F4D2E] hover:underline",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-10 px-3.5",
        lg: "h-12 px-6",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };