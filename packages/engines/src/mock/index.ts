import {
  PdfDocumentObject,
  PdfEngine,
  PdfPageObject,
  PdfAnnotationSubtype,
  PdfLinkAnnoObject,
  Rotation,
  swap,
  PdfZoomMode,
  PdfActionType,
  PdfAnnotationObject,
  PdfBookmarkObject,
  PdfTextRectObject,
  SearchTarget,
  SearchResult,
  PdfAttachmentObject,
  PdfSignatureObject,
  Rect,
  PdfRenderOptions,
  PdfFile,
  PdfAnnotationObjectStatus,
  PdfWidgetAnnoObject,
  FormFieldValue,
  PdfTaskHelper,
  PdfPageFlattenFlag,
  PdfPageFlattenResult,
  PdfFileLoader,
  SearchAllPagesResult,
  MatchFlag,
  Task,
  Logger,
  NoopLogger,
  PdfAnnotationTransformation,
  PdfEngineError,
  PdfMetadataObject,
  PdfErrorCode,
  PdfErrorReason,
  PdfBookmarksObject,
  PdfUrlOptions,
  PdfFileUrl,
  PdfGlyphObject,
  PdfPageGeometry,
} from '@embedpdf/models';

/**
 * Create mock of pdf engine
 * @param partialEngine - partial configuration of engine
 * @returns - mock of pdf engine
 *
 * @public
 */
export function createMockPdfEngine(partialEngine?: Partial<PdfEngine>): PdfEngine {
  const engine: PdfEngine = {
    openDocumentUrl: jest.fn((file: PdfFileUrl, options?: PdfUrlOptions) => {
      return PdfTaskHelper.create();
    }),
    openDocumentFromBuffer: jest.fn((file: PdfFile, password: string) => {
      return PdfTaskHelper.create();
    }),
    openDocumentFromLoader: jest.fn((file: PdfFileLoader, password: string) => {
      return PdfTaskHelper.create();
    }),
    getMetadata: () => {
      return PdfTaskHelper.resolve({
        title: 'title',
        author: 'author',
        subject: 'subject',
        keywords: 'keywords',
        producer: 'producer',
        creator: 'creator',
        creationDate: 'creationDate',
        modificationDate: 'modificationDate',
      });
    },
    getDocPermissions: (doc: PdfDocumentObject) => {
      return PdfTaskHelper.resolve(0xffffffff);
    },
    getDocUserPermissions: (doc: PdfDocumentObject) => {
      return PdfTaskHelper.resolve(0xffffffff);
    },
    getSignatures: (doc: PdfDocumentObject) => {
      const signatures: PdfSignatureObject[] = [];
      return PdfTaskHelper.resolve(signatures);
    },
    getBookmarks: (doc: PdfDocumentObject) => {
      const bookmarks: PdfBookmarkObject[] = [];
      bookmarks.push(
        {
          title: 'Page 1',
          target: {
            type: 'destination',
            destination: {
              pageIndex: 1,
              zoom: {
                mode: PdfZoomMode.FitPage,
              },
              view: [],
            },
          },
        },
        {
          title: 'Page 2',
          target: {
            type: 'destination',
            destination: {
              pageIndex: 2,
              zoom: {
                mode: PdfZoomMode.FitPage,
              },
              view: [],
            },
          },
          children: [
            {
              title: 'Page 3',
              target: {
                type: 'destination',
                destination: {
                  pageIndex: 3,
                  zoom: {
                    mode: PdfZoomMode.FitPage,
                  },
                  view: [],
                },
              },
            },
          ],
        },
      );
      return PdfTaskHelper.resolve({
        bookmarks,
      });
    },
    renderPage: jest.fn(
      (
        doc: PdfDocumentObject,
        page: PdfPageObject,
        scaleFactor: number,
        rotation: Rotation,
        dpr: number,
        options: PdfRenderOptions,
      ) => {
        const pageSize = rotation % 2 === 0 ? page.size : swap(page.size);
        const imageSize = {
          width: Math.ceil(pageSize.width * scaleFactor),
          height: Math.ceil(pageSize.height * scaleFactor),
        };
        const pixelCount = imageSize.width * imageSize.height;
        const array = new Uint8ClampedArray(pixelCount * 4);
        const rgbValue = page.index % 255;
        const alphaValue = 255;
        for (let i = 0; i < pixelCount; i++) {
          for (let j = 0; j < 3; j++) {
            const index = i * 4 + j;
            array[index] = rgbValue;
          }
          array[i * 4 + 3] = alphaValue;
        }

        const ab = array.buffer;
        const realBuffer = ab instanceof ArrayBuffer ? ab : new Uint8Array(array).buffer;
        const blob = new Blob([realBuffer], { type: 'application/octet-stream' });
        return PdfTaskHelper.resolve(blob);
      },
    ),
    renderPageRect: jest.fn(
      (
        doc: PdfDocumentObject,
        page: PdfPageObject,
        scaleFactor: number,
        rotation: Rotation,
        dpr: number,
        rect: Rect,
        options: PdfRenderOptions,
      ) => {
        const pageSize = rotation % 2 === 0 ? page.size : swap(page.size);
        const imageSize = {
          width: Math.ceil(pageSize.width * scaleFactor),
          height: Math.ceil(pageSize.height * scaleFactor),
        };
        const pixelCount = imageSize.width * imageSize.height;
        const array = new Uint8ClampedArray(pixelCount * 4);
        const rgbValue = page.index % 255;
        const alphaValue = 255;
        for (let i = 0; i < pixelCount; i++) {
          for (let j = 0; j < 3; j++) {
            const index = i * 4 + j;
            array[index] = rgbValue;
          }
          array[i * 4 + 3] = alphaValue;
        }

        const ab = array.buffer;
        const realBuffer = ab instanceof ArrayBuffer ? ab : new Uint8Array(array).buffer;
        const blob = new Blob([realBuffer], { type: 'application/octet-stream' });
        return PdfTaskHelper.resolve(blob);
      },
    ),
    renderThumbnail: jest.fn((doc: PdfDocumentObject, page: PdfPageObject) => {
      const thumbnailWidth = page.size.width / 4;
      const thumbnailHeight = page.size.height / 4;
      const pixelCount = thumbnailWidth * thumbnailHeight;
      const array = new Uint8ClampedArray(pixelCount * 4);
      const rgbValue = page.index % 255;
      const alphaValue = 255;
      for (let i = 0; i < pixelCount; i++) {
        for (let j = 0; j < 3; j++) {
          const index = i * 4 + j;
          array[index] = rgbValue;
        }
        array[i * 4 + 3] = alphaValue;
      }

      const ab = array.buffer;
      const realBuffer = ab instanceof ArrayBuffer ? ab : new Uint8Array(array).buffer;
      const blob = new Blob([realBuffer], { type: 'image/png' });

      return PdfTaskHelper.resolve(blob);
    }),
    getAllAnnotations: jest.fn((doc: PdfDocumentObject) => {
      return PdfTaskHelper.resolve({});
    }),
    getPageAnnotations: jest.fn(
      (doc: PdfDocumentObject, page: PdfPageObject, scaleFactor: number, rotation: Rotation) => {
        const link: PdfLinkAnnoObject = {
          status: PdfAnnotationObjectStatus.Committed,
          pageIndex: page.index,
          id: page.index + 1,
          type: PdfAnnotationSubtype.LINK,
          target: {
            type: 'action',
            action: {
              type: PdfActionType.URI,
              uri: 'https://localhost',
            },
          },
          text: 'localhost',
          rect: {
            origin: {
              x: 0,
              y: 0,
            },
            size: {
              width: 100,
              height: 100,
            },
          },
          appearances: {
            normal: '',
            rollover: '',
            down: '',
          },
        };
        const annotations: PdfAnnotationObject[] = [];
        annotations.push(link);
        return PdfTaskHelper.resolve(annotations);
      },
    ),
    createPageAnnotation: jest.fn(() => {
      return PdfTaskHelper.resolve(true);
    }),
    transformPageAnnotation: () => {
      return PdfTaskHelper.resolve(true);
    },
    removePageAnnotation: jest.fn(() => {
      return PdfTaskHelper.resolve(true);
    }),
    getPageTextRects: jest.fn(
      (doc: PdfDocumentObject, page: PdfPageObject, scaleFactor: number, rotation: Rotation) => {
        const textRects: PdfTextRectObject[] = [
          {
            content: 'pdf text',
            font: {
              family: 'sans-serif',
              size: 12,
            },
            rect: {
              origin: {
                x: 0,
                y: 0,
              },
              size: {
                width: 100,
                height: 100,
              },
            },
          },
        ];
        return PdfTaskHelper.resolve(textRects);
      },
    ),
    closeDocument: (pdf: PdfDocumentObject) => {
      return PdfTaskHelper.resolve(true);
    },
    saveAsCopy: (pdf: PdfDocumentObject) => {
      return PdfTaskHelper.resolve(new ArrayBuffer(0));
    },
    flattenPage: (pdf: PdfDocumentObject, page: PdfPageObject, flag: PdfPageFlattenFlag) => {
      return PdfTaskHelper.resolve<PdfPageFlattenResult>(PdfPageFlattenResult.Success);
    },
    extractPages: (pdf: PdfDocumentObject, pageIndexes: number[]) => {
      return PdfTaskHelper.resolve(new ArrayBuffer(0));
    },
    extractText: (pdf: PdfDocumentObject, pageIndexes: number[]) => {
      return PdfTaskHelper.resolve('');
    },
    getPageGlyphs: (doc: PdfDocumentObject, page: PdfPageObject) => {
      return PdfTaskHelper.resolve([] as PdfGlyphObject[]);
    },
    getPageGeometry: (doc: PdfDocumentObject, page: PdfPageObject) => {
      return PdfTaskHelper.resolve({
        runs: [],
      } as PdfPageGeometry);
    },
    merge: (files: PdfFile[]) => {
      return PdfTaskHelper.resolve({
        id: 'id',
        content: new ArrayBuffer(0),
      });
    },
    mergePages: (mergeConfigs: Array<{ docId: string; pageIndices: number[] }>) => {
      return PdfTaskHelper.resolve({
        id: 'id',
        content: new ArrayBuffer(0),
      });
    },
    searchAllPages: (doc: PdfDocumentObject, keyword: string, flags?: MatchFlag[]) => {
      // Create a mock search result
      const mockResult: SearchResult = {
        pageIndex: 0,
        charIndex: 0,
        charCount: keyword.length,
        rects: [
          {
            origin: {
              x: 0,
              y: 0,
            },
            size: {
              width: 50,
              height: 20,
            },
          },
        ],
        context: {
          before: '',
          match: '',
          after: '',
          truncatedLeft: false,
          truncatedRight: false,
        },
      };

      // Return a mock SearchAllPagesResult with a single result
      return PdfTaskHelper.resolve<SearchAllPagesResult>({
        results: [mockResult],
        total: 1,
      });
    },
    getAttachments: (doc: PdfDocumentObject) => {
      return PdfTaskHelper.resolve([] as PdfAttachmentObject[]);
    },
    readAttachmentContent: (doc: PdfDocumentObject, attachment: PdfAttachmentObject) => {
      return PdfTaskHelper.resolve(new ArrayBuffer(0));
    },
    setFormFieldValue: (
      doc: PdfDocumentObject,
      page: PdfPageObject,
      annotation: PdfWidgetAnnoObject,
      text: FormFieldValue,
    ) => {
      return PdfTaskHelper.resolve(true);
    },
    ...partialEngine,
  };

  return engine;
}
/**
 * Create mock of pdf document
 * @param doc - partial configuration of document
 * @returns mock of pdf document
 *
 * @public
 */
export function createMockPdfDocument(doc?: Partial<PdfDocumentObject>): PdfDocumentObject {
  const pageCount = 10;
  const pageWidth = 100;
  const pageHeight = 200;
  const pages = [];
  for (let i = 0; i < pageCount; i++) {
    pages.push({
      index: i,
      size: {
        width: pageWidth,
        height: pageHeight,
      },
    });
  }

  return {
    id: 'id',
    pageCount: pageCount,
    pages: pages,
    ...doc,
  };
}

/**
 * Create mock of pdf file
 * @param file - partial configuration of file
 * @returns mock of pdf file
 *
 * @public
 */
export function createMockPdfFile(file?: Partial<PdfFile>): PdfFile {
  return {
    id: 'id',
    content: new ArrayBuffer(0),
  };
}
