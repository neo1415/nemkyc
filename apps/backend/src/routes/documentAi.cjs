'use strict';

module.exports = function register(app, ctx) {
  const {
    verificationRateLimiter,
  } = ctx;

// The Gemini proxy that used to live here was removed: verification runs on Document AI only.

// ============= DOCUMENT AI API ENDPOINT =============
app.post('/api/document-ai/process', verificationRateLimiter, async (req, res) => {
  console.log('📄 [DOCUMENT AI] Endpoint hit! Method:', req.method, 'Path:', req.path);
  console.log('📄 [DOCUMENT AI] Body keys:', Object.keys(req.body || {}));
  
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { document, documentType } = req.body;
    
    if (!document || !document.content || !document.mimeType) {
      console.error('❌ Invalid request: document missing or incomplete');
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'The request must include document.content and document.mimeType.'
      });
    }

    if (!documentType || !['individual', 'cac', 'naicom'].includes(documentType)) {
      console.error('❌ Invalid request: documentType must be "individual" or "cac"');
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'documentType must be "individual", "cac", or "naicom".'
      });
    }

    // Import Document AI client
    const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
    
    // Resolve credentials before constructing the Google client. This prevents
    // background authentication promises from becoming unhandled rejections.
    const { resolveGoogleCredentialsPath } = require('../../server-utils/googleCredentials.cjs');
    const googleCredentialsPath = resolveGoogleCredentialsPath();

    // Initialize client with credentials
    const client = new DocumentProcessorServiceClient({
      keyFilename: googleCredentialsPath
    });

    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'nem-salvage';
    const location = process.env.DOCUMENT_AI_LOCATION || 'us';
    const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID || '5c39926b56cbb9f0';

    // Construct processor name
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    console.log('📄 Processing document with Document AI:', {
      processor: name,
      documentType,
      mimeType: document.mimeType,
      contentLength: document.content.length
    });

    // Process document
    const [result] = await client.processDocument({
      name,
      rawDocument: {
        content: Buffer.from(document.content, 'base64'),
        mimeType: document.mimeType,
      },
    });

    const { document: processedDoc } = result;

    if (!processedDoc || !processedDoc.text) {
      console.error('❌ Document AI returned no text');
      return res.status(500).json({
        success: false,
        error: 'No text extracted',
        message: 'Document AI could not extract text from the document.',
        confidence: 0
      });
    }

    console.log('📄 Document AI extracted text:', processedDoc.text.substring(0, 200) + '...');

    // Extract structured data based on document type
    let extractedData = {};
    let confidence = 0;

    if (documentType === 'individual') {
      // Extract individual document data (NIN, ID card, etc.)
      extractedData = extractIndividualData(processedDoc);
      confidence = calculateConfidence(processedDoc);
    } else if (documentType === 'cac') {
      // Extract CAC document data
      extractedData = extractCACData(processedDoc);
      confidence = calculateConfidence(processedDoc);
    } else if (documentType === 'naicom') {
      const { extractNAICOMCompanyName } = require('../../server-utils/naicomDocumentExtractor.cjs');
      extractedData = { companyName: extractNAICOMCompanyName(processedDoc.text) };
      confidence = extractedData.companyName ? calculateConfidence(processedDoc) : 0;
    }

    console.log('✅ Document AI processing successful:', {
      documentType,
      confidence,
      extractedFields: Object.keys(extractedData)
    });

    res.json({
      success: true,
      extractedData,
      confidence,
      error: undefined
    });

  } catch (error) {
    const errorCode = error.code || error.status || 'DOCUMENT_PROCESSING_ERROR';
    const isCapacityError = errorCode === 8 || errorCode === 429 ||
      /quota|resource_exhausted|rate limit/i.test(error.message || '');
    const isConfigurationError = [3, 5, 7, 16, 401, 403, 404].includes(errorCode) ||
      /credential|permission|processor.*not found|unauthenticated/i.test(error.message || '');
    const statusCode = isCapacityError ? 429 : (isConfigurationError ? 503 : 500);
    const customerMessage = isCapacityError
      ? 'Document verification is temporarily busy. Please wait a few minutes and try again.'
      : isConfigurationError
        ? 'Document verification is temporarily unavailable. Please try again later or contact support.'
        : 'We could not read this document. Please upload a clear PDF, JPG, or PNG and try again.';

    console.error('Document AI endpoint error:', { code: errorCode, message: error.message });
    res.status(statusCode).json({
      success: false,
      error: 'Document processing failed',
      message: customerMessage,
      code: String(errorCode),
      confidence: 0
    });
  }
});

/**
 * Extract individual document data from Document AI result
 * Optimized for Nigerian NIN documents with labeled fields
 */
function extractIndividualData(document) {
  const text = document.text || '';
  const entities = document.entities || [];
  
  console.log('Document AI individual extraction:', { textLength: text.length, entityCount: entities.length });
  
  const data = {
    fullName: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    nin: '',
    gender: '',
    documentType: '',
    documentNumber: ''
  };

  // Extract from entities (if processor is trained)
  entities.forEach(entity => {
    const type = entity.type || '';
    const value = entity.mentionText || '';
    
    if (type.toLowerCase().includes('name') || type.toLowerCase().includes('person')) {
      data.fullName = value;
    } else if (type.toLowerCase().includes('date') || type.toLowerCase().includes('birth')) {
      data.dateOfBirth = value;
    } else if (type.toLowerCase().includes('nin') || type.toLowerCase().includes('national')) {
      data.nin = value;
    } else if (type.toLowerCase().includes('gender') || type.toLowerCase().includes('sex')) {
      data.gender = value;
    }
  });

  // Fallback: Extract from raw text using patterns optimized for Nigerian NIN documents
  
  // Extract NIN (11 digits) - prioritize this as it's most reliable
  if (!data.nin) {
    const ninMatch = text.match(/\b(\d{11})\b/);
    if (ninMatch) {
      data.nin = ninMatch[1];
      console.log('Document AI extracted an NIN field');
    }
  }

  // Extract Surname (Last Name) - Nigerian NIN format has labeled field
  const surnameMatch = text.match(/Surname[:\s]+([A-Z]+)/i);
  if (surnameMatch) {
    data.lastName = surnameMatch[1].trim();
    console.log('📄 [EXTRACT] Found surname (lastName):', data.lastName);
  }

  // Extract First Name - Nigerian NIN format has labeled field
  const firstNameMatch = text.match(/First\s+Name[:\s]+([A-Z]+)/i);
  if (firstNameMatch) {
    data.firstName = firstNameMatch[1].trim();
    console.log('📄 [EXTRACT] Found first name:', data.firstName);
  }

  // Extract Middle Name - Nigerian NIN format has labeled field
  const middleNameMatch = text.match(/Middle\s+Name[:\s]+([A-Z]+)/i);
  if (middleNameMatch) {
    data.middleName = middleNameMatch[1].trim();
    console.log('📄 [EXTRACT] Found middle name:', data.middleName);
  }

  // Build full name from parts
  if (data.lastName || data.firstName || data.middleName) {
    data.fullName = [data.lastName, data.firstName, data.middleName].filter(n => n).join(' ');
    console.log('📄 [EXTRACT] Built full name:', data.fullName);
  }

  // Fallback: If no labeled fields found, try to extract full name as before
  if (!data.fullName) {
    const nameMatch = text.match(/\b([A-Z]{2,}(?:\s+[A-Z]{2,}){1,3})\b/);
    if (nameMatch) {
      const fullName = nameMatch[1].trim();
      data.fullName = fullName;
      console.log('📄 [EXTRACT] Found full name (fallback):', fullName);
      
      // Parse into first and last name (Nigerian format: SURNAME FIRSTNAME MIDDLENAME)
      const nameParts = fullName.split(/\s+/).filter(part => part.length > 0);
      
      if (nameParts.length >= 3) {
        data.lastName = nameParts[0];
        data.firstName = nameParts[1];
        data.middleName = nameParts[2];
        console.log('📄 [EXTRACT] Parsed - First:', data.firstName, 'Middle:', data.middleName, 'Last:', data.lastName);
      } else if (nameParts.length === 2) {
        data.lastName = nameParts[0];
        data.firstName = nameParts[1];
        console.log('📄 [EXTRACT] Parsed - First:', data.firstName, 'Last:', data.lastName);
      } else if (nameParts.length === 1) {
        data.lastName = nameParts[0];
      }
    }
  }

  // Extract date of birth
  if (!data.dateOfBirth) {
    // Pattern 1: DD/MM/YYYY or DD-MM-YYYY
    let dobMatch = text.match(/(?:Date\s+of\s+Birth|DOB|Birth\s+Date)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
    
    // Pattern 2: Just find any date pattern
    if (!dobMatch) {
      dobMatch = text.match(/\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/);
    }
    
    if (dobMatch) {
      data.dateOfBirth = dobMatch[1];
      console.log('📄 [EXTRACT] Found DOB:', data.dateOfBirth);
    }
  }

  // Extract gender
  if (!data.gender) {
    // Look for gender/sex field
    const genderMatch = text.match(/(?:Gender|Sex)[:\s]*(Male|Female|M|F)\b/i);
    if (genderMatch) {
      let gender = genderMatch[1].toUpperCase();
      // Normalize to full words
      if (gender === 'M') gender = 'MALE';
      if (gender === 'F') gender = 'FEMALE';
      data.gender = gender;
      console.log('📄 [EXTRACT] Found gender:', data.gender);
    }
  }

  // Detect document type from text
  if (text.toLowerCase().includes('national identification') || 
      text.toLowerCase().includes('national identity') ||
      text.toLowerCase().includes('nimc')) {
    data.documentType = 'NIN';
  } else if (text.toLowerCase().includes('driver')) {
    data.documentType = 'Drivers License';
  } else if (text.toLowerCase().includes('passport')) {
    data.documentType = 'Passport';
  }

  console.log('📄 [EXTRACT] Final extracted data:', {
    fullName: data.fullName,
    firstName: data.firstName,
    middleName: data.middleName,
    lastName: data.lastName,
    nin: data.nin ? data.nin.substring(0, 4) + '*******' : 'not found',
    dateOfBirth: data.dateOfBirth,
    gender: data.gender
  });

  return data;
}

/**
 * Extract CAC document data from Document AI result
 * Optimized for Nigerian CAC certificates with labeled fields
 */
function extractCACData(document) {
  const text = document.text || '';
  const entities = document.entities || [];
  const {
    extractCACCompanyName,
    extractCACRegistrationNumber,
    extractCACRegistrationDate
  } = require('../../server-utils/cacDocumentExtractor.cjs');
  
  console.log('📄 [EXTRACT CAC] Raw text from Document AI:', text.substring(0, 500));
  
  const data = {
    companyName: '',
    rcNumber: '',
    registrationDate: '',
    address: '',
    companyType: '',
    companyStatus: ''
  };

  // Extract from entities
  entities.forEach(entity => {
    const type = entity.type || '';
    const value = entity.mentionText || '';
    
    if (type.toLowerCase().includes('company') || type.toLowerCase().includes('organization')) {
      data.companyName = value;
    } else if (type.toLowerCase().includes('rc') || type.toLowerCase().includes('registration')) {
      data.rcNumber = value;
    } else if (type.toLowerCase().includes('date')) {
      data.registrationDate = value;
    } else if (type.toLowerCase().includes('address')) {
      data.address = value;
    }
  });

  // Fallback: Extract from raw text with labeled fields
  
  // Extract Company Name
  if (!data.companyName) {
    data.companyName = extractCACCompanyName(text);

    if (data.companyName) {
      console.log('ðŸ“„ [EXTRACT CAC] Found company name:', data.companyName);
    }

    // Pattern 1: After "This is to certify that" phrase (Nigerian CAC format)
    let nameMatch = data.companyName ? null : text.match(/This\s+is\s+to\s+certify\s+that\s*\n\s*([A-Z][A-Z\s&.,'()-]+(?:LIMITED|LTD|PLC|INC|COMPANY))/i);
    
    if (!data.companyName && !nameMatch) {
      // Pattern 2: Labeled field "Company Name:" or similar
      nameMatch = text.match(/(?:Company\s+Name|Name\s+of\s+Company|Business\s+Name)[:\s]+([A-Z][^\n]+)/i);
    }
    
    if (!data.companyName && !nameMatch) {
      // Pattern 3: Find company name near the top (usually first capitalized line with LIMITED/PLC/LTD)
      nameMatch = text.match(/^([A-Z][A-Z\s&.,'()-]+(?:LIMITED|LTD|PLC|INC|COMPANY))/im);
    }
    
    if (!data.companyName && nameMatch) {
      data.companyName = nameMatch[1].trim();
      console.log('📄 [EXTRACT CAC] Found company name:', data.companyName);
    }
  }

  // Extract RC Number
  if (!data.rcNumber) {
    data.rcNumber = extractCACRegistrationNumber(text);
    if (data.rcNumber) {
      console.log('ðŸ“„ [EXTRACT CAC] Found RC number:', data.rcNumber);
    }

    // RC number format: RC followed by digits, or just digits
    let rcMatch = data.rcNumber ? null : text.match(/RC[:\s-]*(\d+)/i);
    if (!data.rcNumber && rcMatch) {
      data.rcNumber = 'RC' + rcMatch[1];
      console.log('📄 [EXTRACT CAC] Found RC number:', data.rcNumber);
    } else if (!data.rcNumber) {
      // Try to find standalone number that might be RC number (6-7 digits)
      rcMatch = text.match(/\b(\d{6,7})\b/);
      if (rcMatch) {
        data.rcNumber = 'RC' + rcMatch[1];
        console.log('📄 [EXTRACT CAC] Found RC number (inferred):', data.rcNumber);
      }
    }
  }

  // Extract Registration/Incorporation Date
  if (!data.registrationDate) {
    data.registrationDate = extractCACRegistrationDate(text);
    if (data.registrationDate) {
      console.log('ðŸ“„ [EXTRACT CAC] Found registration date:', data.registrationDate);
    }

    // Pattern 1: "originally registered on the 1st day of April 1970" (Nigerian CAC format)
    let dateMatch = data.registrationDate ? null : text.match(/originally\s+registered\s+on\s+the\s+(\d{1,2})(?:st|nd|rd|th)?\s+day\s+of\s+(\w+)\s+(\d{4})/i);
    
    if (!data.registrationDate && dateMatch) {
      // Convert "1st day of April 1970" to "01/04/1970" format
      const day = dateMatch[1].padStart(2, '0');
      const monthName = dateMatch[2];
      const year = dateMatch[3];
      
      const monthMap = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
      };
      
      const month = monthMap[monthName.toLowerCase()] || '01';
      data.registrationDate = `${day}/${month}/${year}`;
      console.log('📄 [EXTRACT CAC] Found registration date (Nigerian format):', data.registrationDate);
    } else if (!data.registrationDate) {
      // Pattern 2: Labeled field "Date of Incorporation:" or similar
      dateMatch = text.match(/(?:Registration\s+Date|Date\s+of\s+Registration|Incorporation\s+Date|Date\s+of\s+Incorporation)[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i);
      
      if (!dateMatch) {
        // Pattern 3: ISO format date (YYYY-MM-DD)
        dateMatch = text.match(/\b(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})\b/);
      }
      
      if (!dateMatch) {
        // Pattern 4: Any date pattern (DD/MM/YYYY or DD-MM-YYYY)
        dateMatch = text.match(/\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\b/);
      }
      
      if (dateMatch) {
        data.registrationDate = dateMatch[1];
        console.log('📄 [EXTRACT CAC] Found registration date:', data.registrationDate);
      }
    }
  }

  // Extract Address
  if (!data.address) {
    const addressMatch = text.match(/(?:Address|Registered\s+Office|Office\s+Address)[:\s]+([^\n]+)/i);
    if (addressMatch) {
      data.address = addressMatch[1].trim();
      console.log('📄 [EXTRACT CAC] Found address:', data.address);
    }
  }

  // Extract company type
  if (text.toLowerCase().includes('public company') || text.toLowerCase().includes('plc')) {
    data.companyType = 'Public Limited Company';
  } else if (text.toLowerCase().includes('limited')) {
    data.companyType = 'Limited Liability Company';
  }

  // Extract status
  if (text.toLowerCase().includes('active')) {
    data.companyStatus = 'Active';
  } else if (text.toLowerCase().includes('inactive')) {
    data.companyStatus = 'Inactive';
  }

  console.log('📄 [EXTRACT CAC] Final extracted data:', {
    companyName: data.companyName,
    rcNumber: data.rcNumber,
    registrationDate: data.registrationDate,
    address: data.address ? data.address.substring(0, 50) + '...' : 'not found'
  });

  return data;
}

/**
 * Calculate confidence score from Document AI result
 */
function calculateConfidence(document) {
  if (!document.entities || document.entities.length === 0) {
    // If no entities, base confidence on text length
    const textLength = (document.text || '').length;
    if (textLength > 500) return 75;
    if (textLength > 200) return 60;
    return 50;
  }

  // Calculate average confidence from entities
  const confidences = document.entities
    .map(entity => entity.confidence || 0.5)
    .filter(conf => conf > 0);

  if (confidences.length === 0) return 50;

  const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  return Math.round(avgConfidence * 100);
}

// ============= END DOCUMENT AI API ENDPOINT =============
};
