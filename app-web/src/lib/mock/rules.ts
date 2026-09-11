export const RULE_SOURCE_TYPES = [
  { label: 'Cabeçalho da OC', value: 'PO_HEADER' },
  { label: 'Item da OC', value: 'PO_LINE' },
  { label: 'Campo adicional (LN)', value: 'PO_ADDITIONAL' },
];

// Field options per source, mirroring the PurchaseOrder / PurchaseOrderLine
// columns in app-backend/prisma/schema.prisma. The `value` must match the
// Prisma client property name exactly, since the rule engine resolves
// conditions by direct property access (see resolveHeaderField/resolveLineField
// in rule-condition-evaluator.service.ts).
export const RULE_FIELDS_BY_SOURCE: Record<
  'PO_HEADER' | 'PO_LINE',
  { label: string; value: string }[]
> = {
  PO_HEADER: [
    { label: 'Sistema de origem', value: 'sourceSystem' },
    { label: 'Tipo de evento', value: 'eventType' },
    { label: 'Versão do schema', value: 'schemaVersion' },
    { label: 'Enviado em', value: 'sentAt' },
    { label: 'Número da OC', value: 'orderNumber' },
    { label: 'Revisão', value: 'revision' },
    { label: 'Tipo de pedido', value: 'orderType' },
    { label: 'Status (LN)', value: 'statusLn' },
    { label: 'Criado no ERP em', value: 'erpCreatedAt' },
    { label: 'Código do comprador', value: 'buyerCode' },
    { label: 'Nome do comprador', value: 'buyerName' },
    { label: 'Código do solicitante', value: 'requesterCode' },
    { label: 'Nome do solicitante', value: 'requesterName' },
    { label: 'Código do fornecedor', value: 'supplierCode' },
    { label: 'Nome do fornecedor', value: 'supplierName' },
    { label: 'Moeda', value: 'currency' },
    { label: 'Valor total', value: 'totalAmount' },
    { label: 'Condição de pagamento', value: 'paymentTerms' },
    { label: 'Centro de custo', value: 'costCenter' },
    { label: 'Departamento', value: 'department' },
    { label: 'Código do projeto', value: 'projectCode' },
    { label: 'Armazém', value: 'warehouse' },
    { label: 'Status', value: 'status' },
  ],
  PO_LINE: [
    { label: 'Número da linha', value: 'lineNumber' },
    { label: 'Código do item', value: 'itemCode' },
    { label: 'Descrição do item', value: 'itemDescription' },
    { label: 'Quantidade', value: 'quantity' },
    { label: 'Unidade de medida', value: 'unitOfMeasure' },
    { label: 'Preço unitário', value: 'unitPrice' },
    { label: 'Valor da linha', value: 'lineAmount' },
    { label: 'Centro de custo', value: 'costCenter' },
    { label: 'Categoria', value: 'category' },
    { label: 'Data de entrega', value: 'deliveryDate' },
  ],
};

// PO_ADDITIONAL maps to the free-form `additionalFields` JSON column, whose
// keys are defined by the LN integration and aren't fixed on the backend, so
// it stays a text input rather than a select.
export const RULE_FIELD_EXAMPLES: Record<string, string> = {
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

export const RULE_TYPE_OPTIONS = [
  { label: 'Aprovação manual', value: 'STANDARD' },
  { label: 'Auto-aprovação', value: 'AUTO_APPROVE' },
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
