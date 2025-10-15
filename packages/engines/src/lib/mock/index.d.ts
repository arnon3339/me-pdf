import { PdfDocumentObject, PdfEngine, PdfFile } from '@embedpdf/models';
/**
 * Create mock of pdf engine
 * @param partialEngine - partial configuration of engine
 * @returns - mock of pdf engine
 *
 * @public
 */
export declare function createMockPdfEngine(partialEngine?: Partial<PdfEngine>): PdfEngine;
/**
 * Create mock of pdf document
 * @param doc - partial configuration of document
 * @returns mock of pdf document
 *
 * @public
 */
export declare function createMockPdfDocument(doc?: Partial<PdfDocumentObject>): PdfDocumentObject;
/**
 * Create mock of pdf file
 * @param file - partial configuration of file
 * @returns mock of pdf file
 *
 * @public
 */
export declare function createMockPdfFile(file?: Partial<PdfFile>): PdfFile;
