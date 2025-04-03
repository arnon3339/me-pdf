import { PdfDocumentObject } from "@embedpdf/models";

export const LOAD_DOCUMENT = 'LOAD_DOCUMENT';
export const SET_DOCUMENT = 'SET_DOCUMENT';
export const SET_DOCUMENT_ERROR = 'SET_DOCUMENT_ERROR';

// Action Type Interfaces
export interface LoadDocumentAction {
  type: typeof LOAD_DOCUMENT;
}

export interface SetDocumentAction {
  type: typeof SET_DOCUMENT;
  payload: PdfDocumentObject;
}

export interface SetDocumentErrorAction {
  type: typeof SET_DOCUMENT_ERROR;
  payload: string;
}

export type DocumentAction =
  | LoadDocumentAction
  | SetDocumentAction
  | SetDocumentErrorAction;

// Core actions
export type CoreAction = DocumentAction;

export const loadDocument = (): CoreAction => ({ type: LOAD_DOCUMENT });
export const setDocument = (document: PdfDocumentObject): CoreAction => ({ type: SET_DOCUMENT, payload: document });
export const setDocumentError = (error: string): CoreAction => ({ type: SET_DOCUMENT_ERROR, payload: error });