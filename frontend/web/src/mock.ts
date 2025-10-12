import type { ParkingSpot, HistoryRow, PlateRow } from './types'

export const mockSpots: ParkingSpot[] = [
  { id: '1', code: 'A06', since: '3:15', status: 'available' },
  { id: '2', code: 'A07', since: '3:15', status: 'occupied' },
  { id: '3', code: 'A08', since: '3:15', status: 'reserved' },
  { id: '4', code: 'A09', since: '3:15', status: 'available' },
  { id: '5', code: 'A10', since: '3:15', status: 'available' },
  { id: '6', code: 'A11', since: '3:15', status: 'available' },
  { id: '7', code: 'A12', since: '3:15', status: 'available' },
  { id: '8', code: 'A13', since: '3:15', status: 'occupiedReserved' },
  { id: '9', code: 'A13', since: '3:15', status: 'reserved' },
  { id: '10', code: 'A15', since: '3:15', status: 'available' },
  { id: '11', code: 'A16', since: '3:15', status: 'available' },
  { id: '12', code: 'A17', since: '3:15', status: 'available' },
]

export const mockHistory: HistoryRow[] = Array.from({ length: 12 }).map((_, i) => ({
  id: String(i + 1),
  patente: `ABCD-${100 + i}`,
  tipo: i % 2 ? 'Visita' : 'Residente',
  entrada: '08:30',
  salida: '12:10',
}))

export const mockPlates: PlateRow[] = [
  { id: '1', depto: '1108', patente: 'F9JHRR-UV5666' },
]
