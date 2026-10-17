import QRCode from 'qrcode';

export async function generateQrCodeDataUrl(url: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#111827', // Crisp dark slate
        light: '#ffffff', // Crisp white background
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('Failed to generate QR code data URL:', error);
    throw error;
  }
}
