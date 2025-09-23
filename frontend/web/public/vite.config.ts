export default {
  server: {
    proxy: {
      '/hls': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
}
