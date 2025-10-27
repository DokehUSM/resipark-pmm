import { Box, Paper, Typography } from "@mui/material";
import HlsPlayer from "../components/HlsPlayer";

type CameraCard = {
  title: string;
  source: string | null;
  autoPlay?: boolean;
};

const cameras: CameraCard[] = [
  {
    title: "Camara de entrada",
    source: "/videos/entrada_vehiculo.mp4",
    autoPlay: false,
  },
  {
    title: "Camara de salida",
    source: null,
  },
];

function renderFeed(src: string | null, autoPlay = true) {
  if (!src) {
    return <Typography>No hay stream disponible</Typography>;
  }

  const normalized = src.toLowerCase();
  if (normalized.endsWith(".mp4")) {
    return (
      <video
        src={src}
        controls
        autoPlay={autoPlay}
        muted
        loop
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
      />
    );
  }

  return <HlsPlayer src={src} />;
}

export default function CamerasPanel() {
  return (
    <Box
      sx={{
        flexBasis: "55%",
        maxWidth: "55%",
        height: "200%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {cameras.map(({ title, source, autoPlay }) => (
        <Paper key={title} className="flex flex-1 flex-col overflow-hidden">
          <Box className="flex items-center justify-between border-b border-gray-200 p-4">
            <Typography variant="subtitle1" className="font-semibold">
              {title}
            </Typography>
          </Box>
          <Box className="flex flex-1 items-center justify-center bg-gray-200 text-gray-500">
            <Box className="flex flex-1 items-center justify-center">
              {renderFeed(source, autoPlay)}
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
