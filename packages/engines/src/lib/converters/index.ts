/**
 * Function type for converting ImageData to Blob
 * In browser: uses OffscreenCanvas
 * In Node.js: can use Sharp or other image processing libraries
 */
export type ImageDataConverter<T = Blob> = (imageData: ImageData) => Promise<T>;

export type ImageConversionTypes = 'image/webp' | 'image/png' | 'image/jpeg';
/**
 * Browser implementation using OffscreenCanvas
 * This is the default implementation used in browser environments
 */
export const browserImageDataToBlobConverter: ImageDataConverter = (
  imageData: ImageData,
): Promise<Blob> => {
  // Check if we're in a browser environment
  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error(
      'OffscreenCanvas is not available in this environment. ' +
        'This converter is intended for browser use only. ' +
        'Please use createNodeImageDataToBlobConverter() or createNodeCanvasImageDataToBlobConverter() for Node.js.',
    );
  }

  const off = new OffscreenCanvas(imageData.width, imageData.height);
  off.getContext('2d')!.putImageData(imageData, 0, 0);
  return off.convertToBlob({ type: 'image/webp' });
};

/**
 * Create a browser implementation with custom image type
 */
export function createBrowserImageDataToBlobConverter(
  imageType: ImageConversionTypes = 'image/webp',
): ImageDataConverter {
  return (imageData: ImageData): Promise<Blob> => {
    // Check if we're in a browser environment
    if (typeof OffscreenCanvas === 'undefined') {
      throw new Error(
        'OffscreenCanvas is not available in this environment. ' +
          'This converter is intended for browser use only. ' +
          'Please use createNodeImageDataToBlobConverter() or createNodeCanvasImageDataToBlobConverter() for Node.js.',
      );
    }

    const off = new OffscreenCanvas(imageData.width, imageData.height);
    off.getContext('2d')!.putImageData(imageData, 0, 0);
    return off.convertToBlob({ type: imageType });
  };
}

/**
 * Node.js implementation using Sharp
 * This requires the 'sharp' package to be installed
 *
 * @example
 * ```typescript
 * import sharp from 'sharp';
 * import { createNodeImageDataToBufferConverter } from '@embedpdf/engines/pdfium/image-converters';
 *
 * const converter = createNodeImageDataToBufferConverter(sharp);
 * const engine = new PdfiumEngine(pdfiumModule, logger, converter);
 * ```
 */
export function createNodeImageDataToBufferConverter(
  sharp: any, // Using 'any' to avoid requiring sharp as a dependency
  imageType: ImageConversionTypes = 'image/webp',
): ImageDataConverter<Buffer> {
  return async (imageData: ImageData): Promise<Buffer> => {
    const { width, height, data } = imageData;

    // Convert ImageData to Sharp format
    // ImageData uses RGBA format, Sharp expects the same
    let sharpInstance = sharp(Buffer.from(data), {
      raw: {
        width,
        height,
        channels: 4, // RGBA
      },
    });

    // Apply the appropriate format conversion based on imageType
    let buffer: Buffer;
    switch (imageType) {
      case 'image/webp':
        buffer = await sharpInstance.webp().toBuffer();
        break;
      case 'image/png':
        buffer = await sharpInstance.png().toBuffer();
        break;
      case 'image/jpeg':
        // JPEG doesn't support transparency, so we need to composite onto a white background
        buffer = await sharpInstance
          .flatten({ background: { r: 255, g: 255, b: 255 } }) // Remove alpha channel with white background
          .jpeg()
          .toBuffer();
        break;
      default:
        throw new Error(`Unsupported image type: ${imageType}`);
    }

    return buffer;
  };
}

/**
 * Alternative Node.js implementation using canvas (node-canvas)
 * This requires the 'canvas' package to be installed
 *
 * @example
 * ```typescript
 * import { createCanvas } from 'canvas';
 * import { createNodeCanvasImageDataToBlobConverter } from '@embedpdf/engines/pdfium/image-converters';
 *
 * const converter = createNodeCanvasImageDataToBlobConverter(createCanvas, 'image/png');
 * const engine = new PdfiumEngine(pdfiumModule, logger, converter);
 * ```
 */
export function createNodeCanvasImageDataToBlobConverter(
  createCanvas: any, // Using 'any' to avoid requiring canvas as a dependency
  imageType: ImageConversionTypes = 'image/webp',
): ImageDataConverter<Buffer> {
  return async (imageData: ImageData): Promise<Buffer> => {
    const { width, height } = imageData;

    // Create a canvas and put the image data
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);

    // Convert to buffer and create blob based on the requested type
    let buffer: Buffer;
    switch (imageType) {
      case 'image/webp':
        buffer = canvas.toBuffer('image/webp');
        break;
      case 'image/png':
        buffer = canvas.toBuffer('image/png');
        break;
      case 'image/jpeg':
        buffer = canvas.toBuffer('image/jpeg');
        break;
      default:
        throw new Error(`Unsupported image type: ${imageType}`);
    }

    return buffer;
  };
}

/**
 * Generic Node.js implementation that works with any image processing library
 * that can handle raw RGBA data
 *
 * @example
 * ```typescript
 * const converter = createCustomImageDataToBlobConverter(async (imageData) => {
 *   // Your custom image processing logic here
 *   // Return a Buffer that will be wrapped in a Blob
 *   return processImageWithYourLibrary(imageData);
 * });
 * ```
 */
export function createCustomImageDataToBlobConverter(
  processor: (imageData: ImageData) => Promise<Buffer>,
  imageType: ImageConversionTypes = 'image/webp',
): ImageDataConverter {
  return async (imageData: ImageData): Promise<Blob> => {
    const buffer = await processor(imageData);
    return new Blob([buffer], { type: imageType });
  };
}

/**
 * Create a custom converter that returns a Buffer
 * @param processor - function to process the image data
 * @param imageType - image type
 * @returns ImageDataToBlobConverter<Buffer>
 */
export function createCustomImageDataToBufferConverter(
  processor: (imageData: ImageData) => Promise<Buffer>,
): ImageDataConverter<Buffer> {
  return async (imageData: ImageData): Promise<Buffer> => {
    return await processor(imageData);
  };
}
