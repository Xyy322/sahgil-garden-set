import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-[#1F4D2E] placeholder:text-[#7A9E7E] selection:bg-[#2F6B3F] selection:text-[#F6F1E6] border-[#A3B18A] flex h-11 w-full min-w-0 rounded-2xl border px-3.5 text-base bg-[#F6F1E6] text-[#1F4D2E] transition-[color,box-shadow,border-color,background-color] duration-500 ease-out outline-none shadow-[0_4px_16px_rgba(31,77,46,0.08)] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[#2F6B3F] focus-visible:ring-[3px] focus-visible:ring-[#A3B18A]/45 focus-visible:bg-[#F6F1E6]",
        "aria-invalid:ring-red-200 aria-invalid:border-red-500",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
