/**
 * Convert image file/blob to base64 string for API upload
 * @param file - File or Blob to convert
 * @returns Promise<string> Base64 encoded string
 */
export const convertImageToBase64 = async (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/...;base64, prefix if present
      const base64String = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64String);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compress image before sending to API
 * @param file - Image file to compress
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @param quality - Image quality (0-1), default 0.8
 * @returns Promise<Blob> Compressed image blob
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Get a data URL preview of an image file
 * @param file - Image file
 * @returns Promise<string> Data URL for preview
 */
export const getImagePreview = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};
