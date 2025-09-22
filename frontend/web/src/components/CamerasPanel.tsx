import { Box, Paper, Typography } from "@mui/material";

export default function CamerasPanel() {
  return (
    <Box
      sx={{
        flexBasis: "55%",
        maxWidth: "55%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Paper className="flex flex-1 flex-col overflow-hidden">
        <Box className="flex items-center justify-between border-b border-gray-200 p-4">
          <Typography variant="subtitle1" className="font-semibold">
            Cámara de entrada
          </Typography>
        </Box>
        <Box className="flex flex-1 items-center justify-center bg-gray-200 text-gray-500">
          {/* Aquí va el stream real */}
          <Typography>Stream cámara de entrada</Typography>
        </Box>
      </Paper>

      <Paper className="flex flex-1 flex-col overflow-hidden">
        <Box className="flex items-center justify-between border-b border-gray-200 p-4">
          <Typography variant="subtitle1" className="font-semibold">
            Cámara de salida
          </Typography>
        </Box>
        <Box className="flex flex-1 items-center justify-center bg-gray-200 text-gray-500">
          {/* Aquí va el stream real */}
          <Typography>Stream cámara de salida</Typography>
        </Box>
      </Paper>
    </Box>
  );
}
