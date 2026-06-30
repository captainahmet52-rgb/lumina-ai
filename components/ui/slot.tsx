import * as React from "react";

/**
 * Minimal `asChild` Slot (Radix-compatible subset) so we avoid an extra
 * dependency. Merges the Slot's props/className onto its single child element.
 */
export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (!React.isValidElement(children)) {
      return null;
    }

    const child = children as React.ReactElement<Record<string, unknown>>;
    const childProps = child.props;

    return React.cloneElement(child, {
      ...props,
      ...childProps,
      className: [
        (props as { className?: string }).className,
        (childProps as { className?: string }).className,
      ]
        .filter(Boolean)
        .join(" "),
      ref,
    } as Record<string, unknown>);
  },
);
Slot.displayName = "Slot";
