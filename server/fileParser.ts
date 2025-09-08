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
    // Dynamic import with error handling for App Engine compatibility
    const pdfParse = (await import('pdf-parse')).default;
    
    // Configure pdf-parse options for App Engine compatibility
    const options = {
      max: 0, // Parse all pages
    };
    
    const pdfData = await pdfParse(buffer, options);
    return {
      content: pdfData.text.trim() || '[PDF contains no extractable text]'
    };
  } catch (error) {
    // Handle specific ENOENT errors for test files
    if (error instanceof Error && error.message.includes('ENOENT') && error.message.includes('test/data')) {
      console.warn('PDF-parse test file access issue (App Engine compatibility), falling back to basic text extraction');
      try {
        // Fallback: Try again with minimal configuration
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer, { max: 1 }); // Only parse first page as fallback
        return {
          content: pdfData.text.trim() || '[PDF parsing succeeded but no text extracted]',
          error: 'Partial parsing due to environment limitations'
        };
      } catch (fallbackError) {
        return {
          content: `[PDF file detected but text extraction failed due to App Engine limitations]
File size: ${(buffer.length / 1024).toFixed(1)} KB
This is a known limitation with PDF parsing in serverless environments.`,
          error: 'PDF parsing not supported in this environment'
        };
      }
    }
    
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