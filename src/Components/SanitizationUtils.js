import validator from 'validator';
import createDOMPurify from 'dompurify';
import yup from 'yup';

const DOMPurify = createDOMPurify(window);

// Custom Yup methods for sanitization
// yup.addMethod(yup.string, 'safe', function () {
//   return this.test('test-name', 'Must be a safe string', value => {
//     const sanitized = DOMPurify.sanitize(value);
//     return sanitized === value;
//   });
// });


// yup.addMethod(yup.string, 'email', function () {
//   return this.test('test-name', 'Must be a valid email', value => {
//     const sanitized = validator.normalizeEmail(value);
//     return sanitized === value;
//   });
// });

export const sanitizeString = (value) => {
  return DOMPurify.sanitize(value); // Sanitize strings to remove any potentially harmful HTML or script tags
};

// export const sanitizePhoneNumber = (value) => {
//     if (validator.isMobilePhone(value, 'any')) {
//       return value.replace(/\D/g, ''); // Remove non-numeric characters
//     }
//     return '';
//   };
  
  export const sanitizeEmail = (value) => {
    if (validator.isEmail(value)) {
      return validator.normalizeEmail(value); // Normalize and sanitize email addresses
    }
    return '';
  };  

//   export const sanitizeDate = (value) => {
//     if (validator.isDate(value)) {
//       return new Date(value).toISOString(); // Convert date to ISO format
//     }
//     return '';
//   };
  
//   export const sanitizeURL = (value) => {
//     if (validator.isURL(value)) {
//       return value.trim(); // Trim leading and trailing spaces
//     }
//     return '';
//   };
  
//   export const sanitizeNumber = (value) => {
//     if (validator.isNumeric(value)) {
//       return value;
//     }
//     return '';
//   };
  

