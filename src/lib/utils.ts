import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Filters AI message content to remove notes, reminders, and formatting before saving to database
 */
export function filterAIMessageForDatabase(content: string): string {
  return content
    .replace(/\(.*?\)/g, "")
    .replace(/\*\*/g, "")
    .replace(/---[\s\S]*?\*\*Reminder\*\*[\s\S]*$/gm, "")
    .replace(/\*\*Reminder\*\*[\s\S]*$/gm, "")
    .replace(/\*\(.*?\)\*[\s\S]*$/gm, "")
    .replace(/---[\s\S]*$/gm, "")
    .trim();
}

/**
 * Filters AI message content specifically for calculation analysis by removing conversation tracking info
 */
export function filterAIMessageForCalculation(content: string): string {
  return content
    .replace(/```[\s\S]*?CONVERSATION STAGE:[\s\S]*?```/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/\*\*/g, "")
    .replace(/---[\s\S]*?\*\*Reminder\*\*[\s\S]*$/gm, "")
    .replace(/\*\*Reminder\*\*[\s\S]*$/gm, "")
    .replace(/\*\(.*?\)\*[\s\S]*$/gm, "")
    .replace(/---[\s\S]*$/gm, "")
    .trim();
}
