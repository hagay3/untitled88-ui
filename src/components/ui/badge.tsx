import type * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "active" | "inactive" | "default" | "black";
}

function Badge({className = "", variant = "active", ...props}: BadgeProps) {
    const baseClasses =
        "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold";
    const variantClasses = () => {
        if (variant === "active") {
            return "bg-green-100 text-green-700"
        } else if (variant === "inactive") {
            return "bg-red-100 text-red-700";
        } else if (variant === "default") {
            return "bg-blue-100 text-blue-700";
        } else if (variant === "black") {
            return "text-gray-700";
        } else {
            return "bg-white-100 text-black-700";
        }
    }

    return (
        <div
            className={`${baseClasses} ${variantClasses()} ${className}`}
            {...props}
        />
    );
}

export {Badge};

