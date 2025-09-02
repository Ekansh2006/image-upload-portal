// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'your-cloud-name'; // Replace with your Cloudinary cloud name
const CLOUDINARY_UPLOAD_PRESET = 'your-upload-preset'; // Replace with your unsigned upload preset
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  created_at: string;
}

export const uploadImageToCloudinary = async (
  imageUri: string, 
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    console.log('Starting Cloudinary upload for:', fileName);
    
    // Create FormData for the upload
    const formData = new FormData();
    
    if (imageUri.startsWith('data:')) {
      // Handle base64 data URLs (from web drag & drop)
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('file', blob, fileName);
    } else {
      // Handle file URIs (from mobile image picker)
      const fileExtension = fileName.split('.').pop() || 'jpg';
      const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
      
      formData.append('file', {
        uri: imageUri,
        type: mimeType,
        name: fileName,
      } as any);
    }
    
    // Add upload preset and other parameters
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'uploads'); // Optional: organize uploads in folders
    formData.append('public_id', `${Date.now()}_${fileName.split('.')[0]}`); // Unique public ID
    
    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result: CloudinaryResponse = await response.json();
    console.log('Cloudinary upload successful:', result.secure_url);
    
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to generate optimized image URLs
export const getOptimizedImageUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
  } = {}
): string => {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options;
  
  let transformations = [];
  
  if (width || height) {
    const dimensions = [];
    if (width) dimensions.push(`w_${width}`);
    if (height) dimensions.push(`h_${height}`);
    transformations.push(dimensions.join(','));
  }
  
  if (crop && (width || height)) {
    transformations.push(`c_${crop}`);
  }
  
  if (quality) {
    transformations.push(`q_${quality}`);
  }
  
  if (format) {
    transformations.push(`f_${format}`);
  }
  
  const transformationString = transformations.length > 0 ? transformations.join(',') + '/' : '';
  
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}${publicId}`;
};

// Helper function to extract public ID from Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string => {
  const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  return matches ? matches[1] : '';
};

export { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET };