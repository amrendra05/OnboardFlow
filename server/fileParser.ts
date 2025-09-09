import mammoth from 'mammoth';
import xlsx from 'xlsx';

export interface FileParseResult {
  content: string;
  error?: string;
}

export async function extractTextFromFile(fileBuffer: Buffer, mimeType: string, fileName: string): Promise<FileParseResult> {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return await extractPDFText(fileBuffer);
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await extractDocText(fileBuffer);
      
      case 'text/plain':
      case 'text/csv':
        return {
          content: fileBuffer.toString('utf-8')
        };
      
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return await extractExcelText(fileBuffer);
      
      default:
        return {
          content: `File: ${fileName}\nType: ${mimeType}\nSize: ${(fileBuffer.length / 1024).toFixed(1)} KB\n\n[File content could not be extracted - unsupported format]`,
          error: `Unsupported file type: ${mimeType}`
        };
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return {
      content: `File: ${fileName}\nType: ${mimeType}\nSize: ${(fileBuffer.length / 1024).toFixed(1)} KB\n\n[Error extracting file content: ${error instanceof Error ? error.message : 'Unknown error'}]`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function extractPDFText(buffer: Buffer): Promise<FileParseResult> {
  try {
    // Dynamic import to avoid the test file issue
    const pdfParse = (await import('pdf-parse')).default;
    const pdfData = await pdfParse(buffer);
    return {
      content: pdfData.text.trim() || '[PDF contains no extractable text]'
    };
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractDocText(buffer: Buffer): Promise<FileParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      content: result.value.trim() || '[Document contains no extractable text]'
    };
  } catch (error) {
    throw new Error(`DOC/DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractExcelText(buffer: Buffer): Promise<FileParseResult> {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    let allText = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const sheetText = xlsx.utils.sheet_to_txt(sheet);
      if (sheetText.trim()) {
        allText += `=== Sheet: ${sheetName} ===\n${sheetText}\n\n`;
      }
    });
    
    return {
      content: allText.trim() || '[Spreadsheet contains no extractable text]'
    };
  } catch (error) {
    throw new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}