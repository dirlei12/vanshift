import { doc, getDoc, getDocs, collection, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

export const todayISO = () => {
  const d = new Date()
  const off = d.getTimezoneOffset() * 60000
  return new Date(d - off).toISOString().slice(0, 10)
}

export async function fetchSchedule(date) {
  const snap = await getDoc(doc(db, 'schedules', date))
  return snap.exists() ? snap.data() : null
}

export async function fetchAllSchedules() {
  const snap = await getDocs(collection(db, 'schedules'))
  return snap.docs
    .map((d) => d.data())
    .filter((s) => s.date && Array.isArray(s.rows))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export async function saveSchedule(date, rows) {
  await setDoc(doc(db, 'schedules', date), { date, rows, updatedAt: serverTimestamp() })
}

export async function deleteSchedule(date) {
  await deleteDoc(doc(db, 'schedules', date))
}

/* Announcements API */
export async function fetchAnnouncement() {
  try {
    const snap = await getDoc(doc(db, 'announcements', 'active'))
    return snap.exists() ? snap.data() : null
  } catch {
    return null
  }
}

export async function saveAnnouncement({ message, level = 'warning', active = true }) {
  await setDoc(doc(db, 'announcements', 'active'), {
    message,
    level, // 'info' | 'warning' | 'urgent'
    active,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteAnnouncement() {
  await deleteDoc(doc(db, 'announcements', 'active'))
}

const isOffRow = (r) => /^(off|folga|day off)$/i.test(r.vehicle) || /^(off|folga)$/i.test(r.route) || !r.route

/**
 * Build a driver's history from all stored schedules.
 * Each shift gets `timesBefore` (how many earlier days on the same route) and `isNew`.
 */
export function computeStats(schedules, driver) {
  const name = driver.trim().toLowerCase()
  const shifts = schedules
    .map((s) => ({ date: s.date, row: s.rows.find((r) => r.driver.toLowerCase() === name) }))
    .filter((x) => x.row && !isOffRow(x.row))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((x) => ({ date: x.date, ...x.row }))

  const seen = {}
  for (const s of shifts) {
    s.timesBefore = seen[s.route] || 0
    s.isNew = s.timesBefore === 0
    seen[s.route] = s.timesBefore + 1
  }

  const routes = Object.entries(seen)
    .map(([route, count]) => ({
      route,
      count,
      last: [...shifts].reverse().find((s) => s.route === route).date,
    }))
    .sort((a, b) => b.count - a.count || a.route.localeCompare(b.route))

  const vans = [...new Set(shifts.map((s) => s.vehicle).filter(Boolean))]
  return { shifts, routes, vans, totalDays: shifts.length, daysScanned: schedules.length }
}
