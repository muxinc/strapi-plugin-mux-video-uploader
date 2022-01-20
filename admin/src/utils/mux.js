const generateStreamUrl = (playbackId) => `https://stream.mux.com/${playbackId}.m3u8`;

const generateImageUrl = (playbackId) => playbackId ? `https://image.mux.com/${playbackId}/thumbnail.png` : undefined;

module.exports = {
  generateStreamUrl,
  generateImageUrl
};
