export type SpotStatus = 'available' | 'occupied' | 'reserved'
export interface ParkingSpot { id: string; code: string; since?: string; status: SpotStatus }
export interface HistoryRow { id: string; patente: string; tipo: 'Visita' | 'Residente'; entrada: string; salida: string }
export interface PlateRow { id: string; depto: string; patente: string }
