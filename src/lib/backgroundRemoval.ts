'use client';

// Simplified canvas-based background removal using manual processing
export const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const downloadImage = (dataUrl: string, filename: string = 'removed-background.png') => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Simple background removal using edge detection and color analysis
export const removeImageBackground = async (imageElement: HTMLImageElement): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve(imageElement.src);
      return;
    }

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    
    // Draw original image
    ctx.drawImage(imageElement, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple background removal algorithm
    // This is a basic implementation - for production use MediaPipe or REMBG
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Simple background detection (adjust thresholds as needed)
      const isBackground = (
        (r > 240 && g > 240 && b > 240) || // White background
        (r < 50 && g < 50 && b < 50) ||   // Dark background
        (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) // Uniform colors
      );
      
      if (isBackground) {
        data[i + 3] = 0; // Make transparent
      }
    }
    
    // Put processed data back
    ctx.putImageData(imageData, 0, 0);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');
    resolve(dataUrl);
  });
};

export const replaceImageBackground = async (
  imageElement: HTMLImageElement, 
  backgroundColor: string
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve(imageElement.src);
      return;
    }

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    
    // Fill background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw the processed image (with background removed) on top
    removeImageBackground(imageElement).then(processedDataUrl => {
      const processedImg = new Image();
      processedImg.onload = () => {
        ctx.drawImage(processedImg, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      processedImg.src = processedDataUrl;
    });
  });
};