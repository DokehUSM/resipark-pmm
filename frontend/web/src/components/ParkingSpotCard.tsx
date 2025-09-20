import type { ParkingSpot } from '../types'
import { Paper, Typography } from '@mui/material'
import clsx from 'clsx'

export default function ParkingSpotCard({ spot }: { spot: ParkingSpot }) {
  const color =
    spot.status === 'available' ? 'bg-green-100 border-green-300' :
    spot.status === 'reserved'  ? 'bg-yellow-100 border-yellow-300' :
                                  'bg-red-100 border-red-300'
  return (
    <Paper elevation={0} className={clsx('border rounded-lg p-3 w-full text-center select-none', color)}>
      <Typography className="font-medium">{spot.code}</Typography>
      <Typography className="text-sm text-gray-600">Desde: {spot.since}</Typography>
    </Paper>
  )
}
