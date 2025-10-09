"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

export function Avatar({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            className={cn("h-10 w-10 rounded-full object-cover", className)}
            {...props}
        />
    )
}
