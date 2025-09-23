import { useEffect, useRef } from "react";
import Hls from "hls.js";
const hls = new Hls({
  enableWorker: true,
  lowLatencyMode: true,
  liveDurationInfinity: true,
  backBufferLength: 60,
  // reintentos razonables
  manifestLoadingMaxRetry: 8,
  manifestLoadingRetryDelay: 1000,
  fragLoadingMaxRetry: 8,
  fragLoadingRetryDelay: 1000,
});

// Reconexión si algo fatal ocurre
hls.on(Hls.Events.ERROR, (_e, data) => {
  if (data.fatal) {
    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
    else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
    else hls.destroy();
  }
});

type Props = {
  src: string;            // URL .m3u8 (ej: "/hls/cam_entrada/index.m3u8")
  autoPlay?: boolean;     // por defecto true
  muted?: boolean;        // por defecto true (autoplay seguro)
};

export default function HlsPlayer({ src, autoPlay = true, muted = true }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Safari tiene HLS nativo
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        liveDurationInfinity: true,
        backBufferLength: 30,
      });
      hls.loadSource(src);
      hls.attachMedia(video);

      // Manejo simple de errores/reconexión
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else hls.destroy();
        }
      });

      return () => hls.destroy();
    } else {
      console.error("HLS no soportado en este navegador");
    }
  }, [src]);

  // intento de autoplay (algunos navegadores exigen interacción si no está muted)
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !autoPlay) return;
    v.play().catch(() => {/* el usuario deberá hacer click si no permite autoplay */});
  }, [autoPlay]);

  return (
    <video
      ref={videoRef}
      controls
      muted={muted}
      playsInline
      autoPlay={autoPlay}
      // Ajusta estilos a tu tarjeta
      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
    />
  );
}
