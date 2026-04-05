// ==========================================
// Field formatting helpers
// ==========================================

// Formats a CPF as 000.000.000-00.
const formatCPF = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (digits.length !== 11) return value;
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  };
  
  // Formats a CEP as 00000-000.
  const formatCEP = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (digits.length !== 8) return value;
    return digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  };
  
  // ==========================================
  // Response normalization
  // ==========================================
  
  // Formats every returned row from PostgreSQL for the webhook response.
  return $input.all().map((item) => {
    const lead = item.json;
  
    return {
      json: {
        ...lead,
        cpf: formatCPF(lead.cpf),
        cep: formatCEP(lead.cep),
      },
    };
  });