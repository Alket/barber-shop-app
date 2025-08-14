import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import fs from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

// Normalize string (trim and collapse spaces)
const normalize = (s: string | undefined | null): string => (s ?? '').toString().trim()

// Parse local date string into canonical YYYY-MM-DD
const toYmd = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const parseDateLocal = (raw: string): string | null => {
  const s = normalize(raw)
  if (!s) return null
  // Try YYYY-MM-DD
  const iso = /^\d{4}-\d{1,2}-\d{1,2}$/
  if (iso.test(s)) {
    const [y, m, d] = s.split('-').map((v) => parseInt(v, 10))
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return toYmd(new Date(y, m - 1, d))
  }
  // Try DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY, or MDY variants with same separators
  const anySep = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/
  const mAny = s.match(anySep)
  if (mAny) {
    let a = parseInt(mAny[1], 10)
    let b = parseInt(mAny[2], 10)
    let y = parseInt(mAny[3], 10)
    if (y < 100) y += 2000
    // Disambiguation:
    // If first > 12 => DMY
    // Else if second > 12 => MDY
    // Else default to DMY (common outside US)
    let d: number, m: number
    if (a > 12) { d = a; m = b }
    else if (b > 12) { m = a; d = b }
    else { d = a; m = b }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return toYmd(new Date(y, m - 1, d))
  }
  return null
}

const normalizeTime = (raw: string): string | null => {
  let s = normalize(raw)
  if (!s) return null
  // If already like 6:30 PM, return uppercased AM/PM
  const ampm = /(am|pm)$/i
  if (ampm.test(s)) {
    const [hhmm, suffix] = s.split(/\s+/)
    const [h, m = '00'] = hhmm.split(':')
    const hour = parseInt(h, 10)
    const minute = parseInt(m, 10)
    if (isNaN(hour) || isNaN(minute)) return null
    const suffixUp = suffix.toUpperCase() as 'AM' | 'PM'
    const hour12 = hour % 12 === 0 ? 12 : hour % 12
    return `${hour12}:${String(minute).padStart(2, '0')} ${suffixUp}`
  }
  // Handle 24h like 18:30 or 18.30
  const hhmm24 = /^(\d{1,2})[:\.](\d{2})$/
  const m24 = s.match(hhmm24)
  if (m24) {
    let h = parseInt(m24[1], 10)
    const minute = parseInt(m24[2], 10)
    const suffixUp = h >= 12 ? 'PM' : 'AM'
    if (h === 0) h = 12
    if (h > 12) h = h - 12
    return `${h}:${String(minute).padStart(2, '0')} ${suffixUp}`
  }
  // Handle just hour like 9 or 9 AM
  const onlyHour = /^(\d{1,2})$/
  const mH = s.match(onlyHour)
  if (mH) {
    const h = parseInt(mH[1], 10)
    const suffixUp = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 === 0 ? 12 : h % 12
    return `${hour12}:00 ${suffixUp}`
  }
  return s
}

const splitCsvLine = (line: string): string[] => {
  // simple CSV split, handles quoted values
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'; i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('barbershop')

    // Try to read CSV from request body as JSON { csv: string }
    let csvText = ''
    try {
      const body = await req.json().catch(() => null)
      if (body && typeof body.csv === 'string') csvText = body.csv
    } catch {}

    // If not provided, read Oraret.csv from project root
    if (!csvText) {
      const filePath = path.join(process.cwd(), 'Oraret.csv')
      csvText = await fs.readFile(filePath, 'utf8')
    }

    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length === 0) {
      return NextResponse.json({ error: 'CSV is empty' }, { status: 400 })
    }

    // Header
    const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase())
    const idxName = header.findIndex((h) => ['emri', 'name'].includes(h))
    const idxDate = header.findIndex((h) => ['dita', 'date'].includes(h))
    const idxTime = header.findIndex((h) => ['ora', 'time'].includes(h))

    if (idxName === -1 || idxDate === -1 || idxTime === -1) {
      return NextResponse.json({ error: 'CSV must include headers for Emri/Name, Dita/Date, Ora/Time' }, { status: 400 })
    }

    let created = 0
    let skipped = 0
    const errors: Array<{ line: number; reason: string }> = []

    // Preload clients into a map by lowercase name
    const existingClients = await db.collection('clients').find({}).toArray()
    const nameToClient = new Map<string, any>()
    for (const c of existingClients) {
      nameToClient.set(String(c.name || '').toLowerCase(), c)
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = splitCsvLine(lines[i])
      const name = normalize(cols[idxName])
      const dateYmd = parseDateLocal(normalize(cols[idxDate]))
      const timeNorm = normalizeTime(normalize(cols[idxTime]))

      if (!name) { skipped++; errors.push({ line: i + 1, reason: 'Missing name' }); continue }
      if (!dateYmd) { skipped++; errors.push({ line: i + 1, reason: 'Invalid date' }); continue }
      if (!timeNorm) { skipped++; errors.push({ line: i + 1, reason: 'Invalid time' }); continue }

      // Upsert client by name (case-insensitive)
      let clientDoc = nameToClient.get(name.toLowerCase())
      if (!clientDoc) {
        const newClient = {
          name,
          phone: '',
          notes: 'Imported from CSV',
          totalAppointments: 1,
          lastVisit: dateYmd,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        const insertRes = await db.collection('clients').insertOne(newClient as any)
        clientDoc = { _id: insertRes.insertedId, ...newClient }
        nameToClient.set(name.toLowerCase(), clientDoc)
      } else {
        // update stats
        const newTotal = (clientDoc.totalAppointments || 0) + 1
        const newLast = !clientDoc.lastVisit || clientDoc.lastVisit < dateYmd ? dateYmd : clientDoc.lastVisit
        await db.collection('clients').updateOne(
          { _id: clientDoc._id },
          { $set: { totalAppointments: newTotal, lastVisit: newLast, updatedAt: new Date() } }
        )
        clientDoc.totalAppointments = newTotal
        clientDoc.lastVisit = newLast
      }

      // Check reservation conflict (same date & time)
      const conflict = await db.collection('reservations').findOne({ date: dateYmd, time: timeNorm })
      if (conflict) { skipped++; continue }

      await db.collection('reservations').insertOne({
        clientId: String(clientDoc._id),
        clientName: clientDoc.name,
        clientPhone: clientDoc.phone || '',
        service: 'Imported',
        time: timeNorm,
        date: dateYmd,
        notes: 'Imported from CSV',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      created++
    }

    return NextResponse.json({ success: true, created, skipped, errors })
  } catch (error) {
    console.error('Error importing CSV:', error)
    return NextResponse.json({ error: 'Failed to import CSV' }, { status: 500 })
  }
}
