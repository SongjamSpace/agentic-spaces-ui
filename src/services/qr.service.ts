
import QRCodeStyling from 'qr-code-styling';
import { storage } from './firebase.service';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface QROptions {
  width?: number;
  height?: number;
}

/**
 * Generates a stylized QR code image with a logo in the center.
 * @param data The data to encode in the QR code (e.g. URL).
 * @param logoUrl The URL/path to the logo image to overlay.
 * @param options Optional width and height.
 * @returns A Promise that resolves to a Blob of the generated image.
 */
export async function generateQRWithLogo(data: string, logoUrl: string, options: QROptions = {}): Promise<Blob> {
  const width = options.width || 1024;
  const height = options.height || 1024;

  // Config based on the "liquid/extra-rounded" preference
  const qrCode = new QRCodeStyling({
    width: width, 
    height: height,
    data: data,
    margin: 0,
    image: logoUrl,
    dotsOptions: {
      color: "#000000",
      type: "extra-rounded" // Trying 'extra-rounded' to match the curvy look
    },
    backgroundOptions: {
      color: "#ffffff",
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 10,
      imageSize: 0.4
    },
    cornersSquareOptions: {
      type: "extra-rounded",
      color: "#000000"
    },
    cornersDotOptions: {
      type: "dot",
      color: "#000000"
    }
  });

  // Get raw blob
  const blink = await qrCode.getRawData('png');
  if (!blink) {
    throw new Error('Failed to generate QR blob');
  }
  return blink;
}

/**
 * Uploads a blob to Firebase Storage.
 * @param blob The image blob to upload.
 * @param path The storage path (e.g. 'spaces-qr/username').
 * @returns The download URL of the uploaded file.
 */
export async function uploadQRToFirebase(blob: Blob, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'image/png' });
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}
