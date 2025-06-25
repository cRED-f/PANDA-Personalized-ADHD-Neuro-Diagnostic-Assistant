import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-[10000] overflow-hidden rounded-lg border border-white/30 bg-gray-900/98 backdrop-blur-xl px-4 py-2.5 text-sm text-white shadow-2xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 font-medium relative ring-1 ring-white/20",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

interface WithTooltipProps {
  delayDuration?: number;
  side?: "top" | "right" | "bottom" | "left";
  display: React.ReactNode;
  trigger: React.ReactNode;
}

export const WithTooltip: React.FC<WithTooltipProps> = ({
  delayDuration = 200,
  side = "top",
  display,
  trigger,
}) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        {" "}
        <TooltipTrigger asChild>
          <div className="relative z-0">{trigger}</div>
        </TooltipTrigger>{" "}
        <TooltipPrimitive.Portal>
          <TooltipContent side={side} className="z-[10001]">
            {display}
          </TooltipContent>
        </TooltipPrimitive.Portal>
      </Tooltip>
    </TooltipProvider>
  );
};

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
