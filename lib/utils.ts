import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ISO hafta hesaplayıcı: YYYY-Www
export function computeISOWeek(dateInput?: Date): string {
  const d = dateInput ? new Date(dateInput) : new Date()
  d.setHours(0,0,0,0)
  // Perşembe hilesi (ISO haftası bulunur)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(),0,4)
  const weekNo = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6)%7)) / 7)
  return `${d.getFullYear()}-W${String(weekNo).padStart(2,'0')}`
}

export function getMondayOfISOWeek(isoWeek: string): Date | null {
  const m = /(\d{4})-W(\d{2})/.exec(isoWeek)
  if (!m) return null
  const year = parseInt(m[1],10)
  const week = parseInt(m[2],10)
  const simple = new Date(Date.UTC(year,0,1 + (week - 1) * 7))
  const dow = simple.getUTCDay() || 7
  if (dow !== 1) simple.setUTCDate(simple.getUTCDate() - (dow - 1))
  return new Date(simple)
}
