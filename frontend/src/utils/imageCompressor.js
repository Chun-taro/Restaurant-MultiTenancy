/**
 * Utility for client-side image compression and universal format conversion.
 * Converts iPhone HEIC/HEIF, large camera photos, PNG, WebP, and JPG files
 * into optimized, universal standard JPEG data URLs before upload.
 */

export async function compressAndConvertImage(file, options = {}) {
  const {
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.82,
    fallbackExt = 'jpg'
  } = options;

  if (!file) {
    throw new Error('No file provided for compression');
  }

  // Preserve vector SVGs without rasterization
  if (file.type === 'image/svg+xml') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        dataUrl: reader.result,
        fileName: file.name,
        contentType: 'image/svg+xml',
        size: file.size
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    // Standard fallback function if canvas fails
    const fallbackToRawBase64 = () => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          dataUrl: reader.result,
          fileName: file.name,
          contentType: file.type || 'image/jpeg',
          size: file.size
        });
      };
      reader.onerror = () => {
        resolve({
          dataUrl: null,
          fileName: file.name,
          contentType: file.type || 'image/jpeg',
          size: 0
        });
      };
      reader.readAsDataURL(file);
    };

    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          URL.revokeObjectURL(objectUrl);

          let { width, height } = img;

          // Compute scaled dimensions maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Off-screen canvas for high-quality downsampling
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            fallbackToRawBase64();
            return;
          }

          // Fill white background in case of transparent PNG/HEIC
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Draw and smooth image
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Export as standard JPEG (supported on all browsers, devices & operating systems)
          const dataUrl = canvas.toDataURL('image/jpeg', quality);

          // Clean original filename and ensure standard .jpg extension
          const originalBase = file.name.replace(/\.[^/.]+$/, '');
          const cleanName = `${originalBase.replace(/[^a-zA-Z0-9_-]/g, '_')}.${fallbackExt}`;

          resolve({
            dataUrl,
            fileName: cleanName,
            contentType: 'image/jpeg',
            width,
            height,
            size: Math.round((dataUrl.length * 3) / 4)
          });
        } catch (canvasErr) {
          console.warn('[ImageCompressor] Canvas export fallback:', canvasErr);
          fallbackToRawBase64();
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        fallbackToRawBase64();
      };

      img.src = objectUrl;
    } catch (err) {
      console.warn('[ImageCompressor] ObjectURL fallback:', err);
      fallbackToRawBase64();
    }
  });
}
