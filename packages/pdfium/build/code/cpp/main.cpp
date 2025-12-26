#include "fpdfview.h"
#include "fpdf_formfill.h"
#include "fpdf_annot.h"
#include "fpdf_edit.h"
#include <emscripten.h>
#include "filewriter.h"
#include "string.h"
#include <cstdio>

#ifdef __cplusplus
extern "C"
{
#endif

    EMSCRIPTEN_KEEPALIVE void PDFiumExt_Init();

    EMSCRIPTEN_KEEPALIVE void *PDFiumExt_OpenFileWriter();
    EMSCRIPTEN_KEEPALIVE int PDFiumExt_GetFileWriterSize(void *writer);
    EMSCRIPTEN_KEEPALIVE int PDFiumExt_GetFileWriterData(void *writer, void *buffer, int size);
    EMSCRIPTEN_KEEPALIVE void PDFiumExt_CloseFileWriter(void *writer);

    EMSCRIPTEN_KEEPALIVE void *PDFiumExt_OpenFormFillInfo();
    EMSCRIPTEN_KEEPALIVE void PDFiumExt_CloseFormFillInfo(void *form_fill_info);
    EMSCRIPTEN_KEEPALIVE void *PDFiumExt_InitFormFillEnvironment(void *document, void *form_fill_info);
    EMSCRIPTEN_KEEPALIVE void PDFiumExt_ExitFormFillEnvironment(void *form_handle);

    EMSCRIPTEN_KEEPALIVE int PDFiumExt_SaveAsCopy(void *document, void *writer);

    EMSCRIPTEN_KEEPALIVE bool EPDFAnnot_SetDefaultAppearanceWithFont(
        void* annot, void* font, float font_size,
        unsigned int R, unsigned int G, unsigned int B);

#ifdef __cplusplus
}
#endif

void PDFiumExt_Init()
{
    FPDF_LIBRARY_CONFIG config;
    config.version = 3;
    config.m_pUserFontPaths = nullptr;
    config.m_pIsolate = nullptr;
    config.m_v8EmbedderSlot = 0;
    config.m_pPlatform = nullptr;

    FPDF_InitLibraryWithConfig(&config);
}

void *PDFiumExt_OpenFileWriter()
{
    return new PDFiumExtFileWriter();
}

int PDFiumExt_GetFileWriterSize(void *writer)
{
    return static_cast<PDFiumExtFileWriter *>(writer)->data.length();
}

int PDFiumExt_GetFileWriterData(void *writer, void *buffer, int size)
{
    memcpy(static_cast<char *>(buffer), static_cast<PDFiumExtFileWriter *>(writer)->data.c_str(), size);
    return size;
}

void PDFiumExt_CloseFileWriter(void *writer)
{
    delete static_cast<PDFiumExtFileWriter *>(writer);
}

int PDFiumExt_SaveAsCopy(void *document, void *writer)
{
    PDFiumExtFileWriter *fileWriter = static_cast<PDFiumExtFileWriter *>(writer);
    return FPDF_SaveAsCopy(static_cast<FPDF_DOCUMENT>(document), static_cast<FPDF_FILEWRITE *>(fileWriter), 0);
}

void *PDFiumExt_OpenFormFillInfo()
{
    FPDF_FORMFILLINFO *form_fill_info = new FPDF_FORMFILLINFO();
    memset(form_fill_info, 0, sizeof(FPDF_FORMFILLINFO));
    form_fill_info->version = 1;
    form_fill_info->Release = nullptr;
    form_fill_info->m_pJsPlatform = nullptr;

    return form_fill_info;
}

void PDFiumExt_CloseFormFillInfo(void *form_fill_info)
{
    delete static_cast<FPDF_FORMFILLINFO *>(form_fill_info);
}

void *PDFiumExt_InitFormFillEnvironment(void *document, void *form_fill_info)
{
    return FPDFDOC_InitFormFillEnvironment(static_cast<FPDF_DOCUMENT>(document), static_cast<FPDF_FORMFILLINFO *>(form_fill_info));
}

void PDFiumExt_ExitFormFillEnvironment(void *form_handle)
{
    FPDFDOC_ExitFormFillEnvironment(static_cast<FPDF_FORMHANDLE>(form_handle));
}

/**
 * Set the default appearance (font, size, color) for a FreeText annotation
 * using a custom font loaded via FPDFText_LoadFont.
 * 
 * @param annot     - Annotation handle from FPDFPage_CreateAnnot or FPDFPage_GetAnnot
 * @param font      - Font handle from FPDFText_LoadFont or FPDFText_LoadStandardFont
 * @param font_size - Font size in points
 * @param R,G,B     - Font color components (0-255)
 * @returns true on success, false on failure
 */
EMSCRIPTEN_KEEPALIVE bool EPDFAnnot_SetDefaultAppearanceWithFont(
    void* annot,
    void* font,
    float font_size,
    unsigned int R,
    unsigned int G,
    unsigned int B)
{
    FPDF_ANNOTATION annotation = static_cast<FPDF_ANNOTATION>(annot);
    FPDF_FONT pdfFont = static_cast<FPDF_FONT>(font);
    
    if (!annotation || !pdfFont) {
        return false;
    }
    
    // Get font name from the font handle
    char fontName[256];
    unsigned long fontNameLen = FPDFFont_GetBaseFontName(pdfFont, fontName, sizeof(fontName));
    
    if (fontNameLen == 0) {
        // Fallback: try to get family name
        fontNameLen = FPDFFont_GetFamilyName(pdfFont, fontName, sizeof(fontName));
    }
    
    if (fontNameLen == 0) {
        return false;
    }
    
    // Build the DA string: "/FontName fontSize Tf r g b rg"
    // Colors need to be normalized from 0-255 to 0.0-1.0
    float r = R / 255.0f;
    float g = G / 255.0f;
    float b = B / 255.0f;
    
    char daString[512];
    snprintf(daString, sizeof(daString), "/%s %.1f Tf %.3f %.3f %.3f rg", 
             fontName, font_size, r, g, b);
    
    // Set the DA string on the annotation
    // We need to convert to wide string for FPDFAnnot_SetStringValue
    size_t len = strlen(daString);
    
    // Create a simple wide string buffer
    wchar_t wideDA[512];
    for (size_t i = 0; i <= len; i++) {
        wideDA[i] = static_cast<wchar_t>(daString[i]);
    }
    
    return FPDFAnnot_SetStringValue(annotation, "DA", reinterpret_cast<FPDF_WIDESTRING>(wideDA));
}
