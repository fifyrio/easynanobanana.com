'use client';

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

// New Replicate-based background removal that uploads to R2
export const removeImageBackground = async (imageFile: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('/api/remove-background', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Background removal failed');
  }

  const result = await response.json();
  return result.imageUrl;
};

// Convert image URL to canvas and create a File object for API
export const urlToFile = async (url: string, filename: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

// Create background-replaced image by compositing processed image with solid background
export const replaceImageBackground = async (
  imageFile: File, 
  backgroundColor: string
): Promise<string> => {
  // First remove background using Replicate
  const processedImageUrl = await removeImageBackground(imageFile);
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve(processedImageUrl);
      return;
    }

    const processedImg = new Image();
    processedImg.crossOrigin = 'anonymous';
    
    processedImg.onload = () => {
      canvas.width = processedImg.width;
      canvas.height = processedImg.height;
      
      // Fill background color
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the processed image on top
      ctx.drawImage(processedImg, 0, 0);
      
      resolve(canvas.toDataURL('image/png'));
    };
    
    processedImg.onerror = () => {
      reject(new Error('Failed to load processed image'));
    };
    
    processedImg.src = processedImageUrl;
  });
};