export const RULE_SOURCE_TYPES = [
  { label: 'Cabeçalho da OC', value: 'PO_HEADER' },
  { label: 'Item da OC', value: 'PO_LINE' },
  { label: 'Campo adicional (LN)', value: 'PO_ADDITIONAL' },
];

// Example field names per source, shown as placeholder help text next to the
// free-text field input (the exact set of LN fields is open-ended via
// additionalFields, so this stays a text input rather than a fixed select).
export const RULE_FIELD_EXAMPLES: Record<string, string> = {
  PO_HEADER: 'ex: totalAmount, supplierCode, costCenter, department, projectCode',
  PO_LINE: 'ex: itemCode, category, costCenter, lineAmount',
  PO_ADDITIONAL: 'ex: urgency, purchaseGroup',
};

export const RULE_OPERATORS = [
  { label: 'Igual a', value: 'EQUALS' },
  { label: 'Diferente de', value: 'NOT_EQUALS' },
  { label: 'Maior que', value: 'GREATER_THAN' },
  { label: 'Maior ou igual a', value: 'GREATER_THAN_OR_EQUAL' },
  { label: 'Menor que', value: 'LESS_THAN' },
  { label: 'Menor ou igual a', value: 'LESS_THAN_OR_EQUAL' },
  { label: 'Entre', value: 'BETWEEN' },
  { label: 'Contém', value: 'CONTAINS' },
  { label: 'Está em lista', value: 'IN_LIST' },
  { label: 'Não está em lista', value: 'NOT_IN_LIST' },
  { label: 'Existe', value: 'EXISTS' },
  { label: 'Não existe', value: 'NOT_EXISTS' },
];

export const CONFLICT_STRATEGIES = [
  { label: 'Maior prioridade', value: 'HIGHEST_PRIORITY' },
  { label: 'Mais restritiva', value: 'MOST_RESTRICTIVE' },
  { label: 'Primeira encontrada', value: 'FIRST_MATCH' },
];

export const APPROVAL_MODE_OPTIONS = [
  { label: 'Qualquer aprovador (ANY)', value: 'ANY' },
  { label: 'Todos os aprovadores (ALL)', value: 'ALL' },
  { label: 'Sequencial (SEQUENTIAL)', value: 'SEQUENTIAL' },
];
