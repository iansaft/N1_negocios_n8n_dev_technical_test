// ==========================================
// Validation and normalization helpers
// ==========================================
const validators = {
    // Validates whether the value is a string containing a reasonable email format.
    isEmail: (value) =>
      typeof value === 'string' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
  
    // Validates whether the value contains exactly 8 numeric digits after normalization.
    isCEP: (value) => {
      if (typeof value !== 'string') return false;
      const digits = value.replace(/\D/g, '');
      return /^\d{8}$/.test(digits);
    },
  
    // Validates a CPF using digit verification rules after removing all non-digit characters.
    isCPF: (value) => {
      if (typeof value !== 'string') return false;
  
      const clean = value.replace(/\D/g, '');
  
      // CPF must contain exactly 11 digits.
      if (clean.length !== 11) return false;
  
      // Reject repeated digit sequences such as 11111111111.
      if (/^(\d)\1{10}$/.test(clean)) return false;
  
      const digits = clean.split('').map(Number);
  
      // Computes weighted sum for CPF check digits.
      const calc = (values, factor) =>
        values.reduce((sum, digit, index) => sum + digit * (factor - index), 0);
  
      // First verification digit.
      const remainder1 = calc(digits.slice(0, 9), 10) % 11;
      const digit1 = remainder1 < 2 ? 0 : 11 - remainder1;
  
      // Second verification digit.
      const remainder2 = calc(digits.slice(0, 10), 11) % 11;
      const digit2 = remainder2 < 2 ? 0 : 11 - remainder2;
  
      return digit1 === digits[9] && digit2 === digits[10];
    },
  };
  
  // ==========================================
  // Input extraction and basic payload validation
  // ==========================================
  
  // Reads the first incoming item body from n8n.
  const input = $input.first()?.json?.body;
  
  // Ensures the webhook payload body is a valid JSON object.
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return [
      {
        json: {
          success: false,
          errorCode: 'INVALID_BODY',
          errors: {
            body: 'Request body must be a valid JSON object.',
          },
          data: null,
        },
      },
    ];
  }
  
  const errors = {};
  
  // ==========================================
  // Field normalization
  // ==========================================
  
  // Normalizes the name by trimming surrounding whitespace.
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  
  // Normalizes the email by trimming whitespace and converting to lowercase.
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  
  // Normalizes CPF by removing every non-digit character.
  const cpf = String(input.cpf ?? '').replace(/\D/g, '');
  
  // Normalizes CEP by removing every non-digit character.
  const cep = String(input.cep ?? '').replace(/\D/g, '');
  
  // ==========================================
  // Field validation: name
  // ==========================================
  
  // Validates that the name is present after trimming.
  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length < 2) {
    // Validates minimum name length.
    errors.name = 'Name must contain at least 2 characters.';
  } else if (name.length > 255) {
    // Validates maximum name length.
    errors.name = 'Name must not exceed 255 characters.';
  } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(name)) {
    // Validates allowed human-name characters.
    errors.name = 'Name contains invalid characters.';
  } else if (/\s{2,}/.test(name)) {
    // Rejects consecutive internal whitespace.
    errors.name = 'Name must not contain repeated spaces.';
  }
  
  // ==========================================
  // Field validation: email
  // ==========================================
  
  // Validates that the email is present.
  if (!email) {
    errors.email = 'Email is required.';
  } else if (email.length > 255) {
    // Validates maximum email length.
    errors.email = 'Email must not exceed 255 characters.';
  } else if (!validators.isEmail(email)) {
    // Validates email format.
    errors.email = 'Invalid email address.';
  }
  
  // ==========================================
  // Field validation: CPF
  // ==========================================
  
  // Validates that the CPF is present.
  if (!cpf) {
    errors.cpf = 'CPF is required.';
  } else if (cpf.length !== 11) {
    // Validates exact CPF digit length after normalization.
    errors.cpf = 'CPF must contain exactly 11 digits.';
  } else if (!validators.isCPF(cpf)) {
    // Validates CPF verification digits.
    errors.cpf = 'Invalid CPF.';
  }
  
  // ==========================================
  // Field validation: CEP
  // ==========================================
  
  // Validates that the CEP is present.
  if (!cep) {
    errors.cep = 'CEP is required.';
  } else if (cep.length !== 8) {
    // Validates exact CEP digit length after normalization.
    errors.cep = 'CEP must contain exactly 8 digits.';
  } else if (!validators.isCEP(cep)) {
    // Validates CEP numeric format after normalization.
    errors.cep = 'Invalid CEP.';
  }
  
  // ==========================================
  // Standardized response
  // ==========================================
  
  const isValid = Object.keys(errors).length === 0;
  
  return [
    {
      json: {
        success: isValid,
        status: isValid ? "VALID_LEAD_DATA" : "INVALID_LEAD_DATA",
        errorCode: isValid ? null : 'VALIDATION_ERROR',
        errors: isValid ? null : errors,
        data: isValid
          ? {
              // Returns normalized values only when the payload is valid.
              name,
              email,
              cpf,
              cep,
            }
          : null,
      },
    },
  ];