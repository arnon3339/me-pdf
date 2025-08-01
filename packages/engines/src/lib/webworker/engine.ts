import {
  FormFieldValue,
  PdfAnnotationTransformation,
  PdfAttachmentObject,
  PdfEngineError,
  PdfFile,
  PdfMetadataObject,
  PdfSignatureObject,
  PdfTextRectObject,
  PdfWidgetAnnoObject,
  SearchResult,
  SearchTarget,
  Task,
  Logger,
  NoopLogger,
  PdfAnnotationObject,
  PdfBookmarksObject,
  PdfDocumentObject,
  PdfEngine,
  PdfPageObject,
  Rect,
  Rotation,
  PdfRenderOptions,
  PdfErrorCode,
  PdfErrorReason,
  PdfPageFlattenFlag,
  PdfPageFlattenResult,
  PdfFileLoader,
  SearchAllPagesResult,
  MatchFlag,
  PdfUrlOptions,
  PdfFileUrl,
  PdfGlyphObject,
  PdfPageGeometry,
  ImageConversionTypes,
  PdfAnnotationObjectBase,
  PdfAlphaColor,
  PageTextSlice,
  WebAlphaColor,
  AppearanceMode,
} from '@embedpdf/models';
import { ExecuteRequest, Response } from './runner';

const LOG_SOURCE = 'WebWorkerEngine';
const LOG_CATEGORY = 'Engine';

/**
 * Task that executed by webworker
 */
export class WorkerTask<R> extends Task<R, PdfErrorReason> {
  /**
   * Create a task that bind to web worker with specified message id
   * @param worker - web worker instance
   * @param messageId - id of message
   *
   * @public
   */
  constructor(
    public worker: Worker,
    private messageId: string,
  ) {
    super();
  }

  /**
   * {@inheritDoc @embedpdf/models!Task.abort}
   *
   * @override
   */
  abort(e: PdfErrorReason) {
    super.abort(e);

    this.worker.postMessage({
      type: 'AbortRequest',
      data: {
        messageId: this.messageId,
      },
    });
  }
}

/**
 * PDF engine that runs within webworker
 */
export class WebWorkerEngine implements PdfEngine {
  static readyTaskId = '0';
  /**
   * Task that represent the state of preparation
   */
  readyTask: WorkerTask<boolean>;
  /**
   * All the tasks that is executing
   */
  tasks: Map<string, WorkerTask<any>> = new Map();

  /**
   * Create an instance of WebWorkerEngine, it will create a worker with
   * specified url.
   * @param worker - webworker instance, this worker needs to contains the running instance of {@link EngineRunner}
   * @param logger - logger instance
   *
   * @public
   */
  constructor(
    private worker: Worker,
    private logger: Logger = new NoopLogger(),
  ) {
    this.worker.addEventListener('message', this.handle);

    this.readyTask = new WorkerTask<boolean>(this.worker, WebWorkerEngine.readyTaskId);
    this.tasks.set(WebWorkerEngine.readyTaskId, this.readyTask);
  }

  /**
   * Handle event from web worker. There are 2 kinds of event
   * 1. ReadyResponse: web worker is ready
   * 2. ExecuteResponse: result of execution
   * @param evt - message event from web worker
   * @returns
   *
   * @private
   */
  handle = (evt: MessageEvent<any>) => {
    this.logger.debug(
      LOG_SOURCE,
      LOG_CATEGORY,
      'webworker engine start handling message: ',
      evt.data,
    );
    try {
      const response = evt.data as Response;
      const task = this.tasks.get(response.id);
      if (!task) {
        return;
      }

      switch (response.type) {
        case 'ReadyResponse':
          this.readyTask.resolve(true);
          break;
        case 'ExecuteResponse':
          {
            switch (response.data.type) {
              case 'result':
                task.resolve(response.data.value);
                break;
              case 'error':
                task.reject(response.data.value.reason);
                break;
            }
            this.tasks.delete(response.id);
          }
          break;
      }
    } catch (e) {
      this.logger.error(LOG_SOURCE, LOG_CATEGORY, 'webworker met error when handling message: ', e);
    }
  };

  /**
   * Generate a unique message id
   * @returns message id
   *
   * @private
   */
  generateRequestId(id: string) {
    return `${id}.${Date.now()}.${Math.random()}`;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.initialize}
   *
   * @public
   */
  initialize() {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'initialize');
    const requestId = this.generateRequestId('General');
    const task = new WorkerTask<boolean>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'initialize',
        args: [],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.destroy}
   *
   * @public
   */
  destroy() {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'destroy');
    const requestId = this.generateRequestId('General');
    const task = new WorkerTask<boolean>(this.worker, requestId);

    const finish = () => {
      this.worker.removeEventListener('message', this.handle);
      this.worker.terminate();
    };

    task.wait(finish, finish);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'destroy',
        args: [],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.openDocumentUrl}
   *
   * @public
   */
  openDocumentUrl(file: PdfFileUrl, options?: PdfUrlOptions) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'openDocumentUrl', file.url, options);
    const requestId = this.generateRequestId(file.id);
    const task = new WorkerTask<PdfDocumentObject>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'openDocumentUrl',
        args: [file, options],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.openDocument}
   *
   * @public
   */
  openDocumentFromBuffer(file: PdfFile, password: string) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'openDocumentFromBuffer', file, password);
    const requestId = this.generateRequestId(file.id);
    const task = new WorkerTask<PdfDocumentObject>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'openDocumentFromBuffer',
        args: [file, password],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.openDocumentFromLoader}
   *
   * @public
   */
  openDocumentFromLoader(file: PdfFileLoader, password: string) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'openDocumentFromLoader', file, password);
    const requestId = this.generateRequestId(file.id);
    const task = new WorkerTask<PdfDocumentObject>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'openDocumentFromLoader',
        args: [file, password],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.getMetadata}
   *
   * @public
   */
  getMetadata(doc: PdfDocumentObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'getMetadata', doc);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<PdfMetadataObject>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'getMetadata',
        args: [doc],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.getDocPermissions}
   *
   * @public
   */
  getDocPermissions(doc: PdfDocumentObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'getDocPermissions', doc);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<number>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'getDocPermissions',
        args: [doc],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.getDocUserPermissions}
   *
   * @public
   */
  getDocUserPermissions(doc: PdfDocumentObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'getDocUserPermissions', doc);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<number>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'getDocUserPermissions',
        args: [doc],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.getBookmarks}
   *
   * @public
   */
  getBookmarks(doc: PdfDocumentObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'getBookmarks', doc);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<PdfBookmarksObject>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'getBookmarks',
        args: [doc],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.getSignatures}
   *
   * @public
   */
  getSignatures(doc: PdfDocumentObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'getSignatures', doc);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<PdfSignatureObject[]>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'getSignatures',
        args: [doc],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.renderPage}
   *
   * @public
   */
  renderPage(
    doc: PdfDocumentObject,
    page: PdfPageObject,
    scaleFactor: number,
    rotation: Rotation,
    dpr: number,
    options: PdfRenderOptions,
    imageType: ImageConversionTypes = 'image/webp',
  ) {
    this.logger.debug(
      LOG_SOURCE,
      LOG_CATEGORY,
      'renderPage',
      doc,
      page,
      scaleFactor,
      rotation,
      dpr,
      options,
    );
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<Blob>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'renderPage',
        args: [doc, page, scaleFactor, rotation, dpr, options, imageType],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.renderPageRect}
   *
   * @public
   */
  renderPageRect(
    doc: PdfDocumentObject,
    page: PdfPageObject,
    scaleFactor: number,
    rotation: Rotation,
    dpr: number,
    rect: Rect,
    options: PdfRenderOptions,
    imageType: ImageConversionTypes = 'image/webp',
  ) {
    this.logger.debug(
      LOG_SOURCE,
      LOG_CATEGORY,
      'renderPageRect',
      doc,
      page,
      scaleFactor,
      rotation,
      dpr,
      rect,
      options,
    );
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<Blob>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'renderPageRect',
        args: [doc, page, scaleFactor, rotation, dpr, rect, options, imageType],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.renderAnnotation}
   *
   * @public
   */
  renderAnnotation(
    doc: PdfDocumentObject,
    page: PdfPageObject,
    annotation: PdfAnnotationObject,
    scaleFactor: number,
    rotation: Rotation,
    dpr: number,
    mode: AppearanceMode,
    imageType: ImageConversionTypes,
  ) {
    this.logger.debug(
      LOG_SOURCE,
      LOG_CATEGORY,
      'renderAnnotation',
      doc,
      page,
      annotation,
      scaleFactor,
      rotation,
      dpr,
      mode,
      imageType,
    );
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<Blob>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'renderAnnotation',
        args: [doc, page, annotation, scaleFactor, rotation, dpr, mode, imageType],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.getAllAnnotations}
   *
   * @public
   */
  getAllAnnotations(doc: PdfDocumentObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'getAllAnnotations', doc);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<Record<number, PdfAnnotationObject[]>>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'getAllAnnotations',
        args: [doc],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.getPageAnnotations}
   *
   * @public
   */
  getPageAnnotations(doc: PdfDocumentObject, page: PdfPageObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'getPageAnnotations', doc, page);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<PdfAnnotationObject[]>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'getPageAnnotations',
        args: [doc, page],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.createPageAnnotation}
   *
   * @public
   */
  createPageAnnotation(
    doc: PdfDocumentObject,
    page: PdfPageObject,
    annotation: PdfAnnotationObject,
  ) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'createPageAnnotations', doc, page, annotation);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<number>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'createPageAnnotation',
        args: [doc, page, annotation],
      },
    };
    this.proxy(task, request);

    return task;
  }

  updatePageAnnotation(
    doc: PdfDocumentObject,
    page: PdfPageObject,
    annotation: PdfAnnotationObject,
  ) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'updatePageAnnotation', doc, page, annotation);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<boolean>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'updatePageAnnotation',
        args: [doc, page, annotation],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.removePageAnnotation}
   *
   * @public
   */
  removePageAnnotation(
    doc: PdfDocumentObject,
    page: PdfPageObject,
    annotation: PdfAnnotationObject,
  ) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'removePageAnnotations', doc, page, annotation);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<boolean>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'removePageAnnotation',
        args: [doc, page, annotation],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.getPageTextRects}
   *
   * @public
   */
  getPageTextRects(
    doc: PdfDocumentObject,
    page: PdfPageObject,
    scaleFactor: number,
    rotation: Rotation,
  ) {
    this.logger.debug(
      LOG_SOURCE,
      LOG_CATEGORY,
      'getPageTextRects',
      doc,
      page,
      scaleFactor,
      rotation,
    );
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<PdfTextRectObject[]>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'getPageTextRects',
        args: [doc, page, scaleFactor, rotation],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.renderThumbnail}
   *
   * @public
   */
  renderThumbnail(
    doc: PdfDocumentObject,
    page: PdfPageObject,
    scaleFactor: number,
    rotation: Rotation,
    dpr: number,
  ) {
    this.logger.debug(
      LOG_SOURCE,
      LOG_CATEGORY,
      'renderThumbnail',
      doc,
      page,
      scaleFactor,
      rotation,
      dpr,
    );
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<Blob>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'renderThumbnail',
        args: [doc, page, scaleFactor, rotation, dpr],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.searchAllPages}
   *
   * @public
   */
  searchAllPages(doc: PdfDocumentObject, keyword: string, flags: MatchFlag[] = []) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'searchAllPages 123', doc, keyword, flags);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<SearchAllPagesResult>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'searchAllPages',
        args: [doc, keyword, flags],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.saveAsCopy}
   *
   * @public
   */
  saveAsCopy(doc: PdfDocumentObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'saveAsCopy', doc);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<ArrayBuffer>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'saveAsCopy',
        args: [doc],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.getAttachments}
   *
   * @public
   */
  getAttachments(doc: PdfDocumentObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'getAttachments', doc);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<PdfAttachmentObject[]>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'getAttachments',
        args: [doc],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.readAttachmentContent}
   *
   * @public
   */
  readAttachmentContent(doc: PdfDocumentObject, attachment: PdfAttachmentObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'readAttachmentContent', doc, attachment);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<ArrayBuffer>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'readAttachmentContent',
        args: [doc, attachment],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.setFormFieldValue}
   *
   * @public
   */
  setFormFieldValue(
    doc: PdfDocumentObject,
    page: PdfPageObject,
    annotation: PdfWidgetAnnoObject,
    value: FormFieldValue,
  ) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'setFormFieldValue', doc, annotation, value);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<boolean>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'setFormFieldValue',
        args: [doc, page, annotation, value],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.flattenPage}
   *
   * @public
   */
  flattenPage(doc: PdfDocumentObject, page: PdfPageObject, flag: PdfPageFlattenFlag) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'flattenPage', doc, page, flag);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<PdfPageFlattenResult>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'flattenPage',
        args: [doc, page, flag],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.extractPages}
   *
   * @public
   */
  extractPages(doc: PdfDocumentObject, pageIndexes: number[]) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'extractPages', doc);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<ArrayBuffer>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'extractPages',
        args: [doc, pageIndexes],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.extractText}
   *
   * @public
   */
  extractText(doc: PdfDocumentObject, pageIndexes: number[]) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'extractText', doc);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<string>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'extractText',
        args: [doc, pageIndexes],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.getTextSlices}
   *
   * @public
   */
  getTextSlices(doc: PdfDocumentObject, slices: PageTextSlice[]) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'getTextSlices', doc, slices);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<string[]>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'getTextSlices',
        args: [doc, slices],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.getPageGlyphs}
   *
   * @public
   */
  getPageGlyphs(doc: PdfDocumentObject, page: PdfPageObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'getPageGlyphs', doc, page);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<PdfGlyphObject[]>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'getPageGlyphs',
        args: [doc, page],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.getPageGeometry}
   *
   * @public
   */
  getPageGeometry(doc: PdfDocumentObject, page: PdfPageObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'getPageGeometry', doc, page);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<PdfPageGeometry>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'getPageGeometry',
        args: [doc, page],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.merge}
   *
   * @public
   */
  merge(files: PdfFile[]) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'merge', files);
    const fileIds = files.map((file) => file.id).join('.');
    const requestId = this.generateRequestId(fileIds);
    const task = new WorkerTask<PdfFile>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'merge',
        args: [files],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.mergePages}
   *
   * @public
   */
  mergePages(mergeConfigs: Array<{ docId: string; pageIndices: number[] }>) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'mergePages', mergeConfigs);
    const requestId = this.generateRequestId(mergeConfigs.map((config) => config.docId).join('.'));
    const task = new WorkerTask<PdfFile>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'mergePages',
        args: [mergeConfigs],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * {@inheritDoc @embedpdf/models!PdfEngine.closeDocument}
   *
   * @public
   */
  closeDocument(doc: PdfDocumentObject) {
    this.logger.debug(LOG_SOURCE, LOG_CATEGORY, 'closeDocument', doc);
    const requestId = this.generateRequestId(doc.id);
    const task = new WorkerTask<boolean>(this.worker, requestId);

    const request: ExecuteRequest = {
      id: requestId,
      type: 'ExecuteRequest',
      data: {
        name: 'closeDocument',
        args: [doc],
      },
    };
    this.proxy(task, request);

    return task;
  }

  /**
   * Send the request to webworker inside and register the task
   * @param task - task that waiting for the response
   * @param request - request that needs send to web worker
   * @param transferables - transferables that need to transfer to webworker
   * @returns
   *
   * @internal
   */
  proxy<R>(task: WorkerTask<R>, request: ExecuteRequest, transferables: any[] = []) {
    this.logger.debug(
      LOG_SOURCE,
      LOG_CATEGORY,
      'send request to worker',
      task,
      request,
      transferables,
    );
    this.logger.perf(LOG_SOURCE, LOG_CATEGORY, `${request.data.name}`, 'Begin', request.id);
    this.readyTask.wait(
      () => {
        this.worker.postMessage(request, transferables);
        task.wait(
          () => {
            this.logger.perf(LOG_SOURCE, LOG_CATEGORY, `${request.data.name}`, 'End', request.id);
          },
          () => {
            this.logger.perf(LOG_SOURCE, LOG_CATEGORY, `${request.data.name}`, 'End', request.id);
          },
        );
        this.tasks.set(request.id, task);
      },
      () => {
        this.logger.perf(LOG_SOURCE, LOG_CATEGORY, `${request.data.name}`, 'End', request.id);
        task.reject({
          code: PdfErrorCode.Initialization,
          message: 'worker initialization failed',
        });
      },
    );
  }
}
