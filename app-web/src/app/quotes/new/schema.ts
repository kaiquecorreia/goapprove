import { z } from 'zod';

export const quoteLineSchema = z.object({
  itemCode: z.string().trim().min(1, 'Informe o código do item'),
  quantity: z.number({ invalid_type_error: 'Informe a quantidade' }).gt(0, 'Deve ser maior que 0'),
  expectedDate: z.string().min(1, 'Informe a data'),
});

export const quoteRequestSchema = z
  .object({
    quoteCode: z.string().trim().min(1, 'Informe o código da cotação'),
    warehouse: z.string().min(1, 'Selecione o armazém'),
    company: z.string().min(1, 'Selecione a empresa'),
    receiptDate: z.string().min(1, 'Informe a data de recebimento'),
    expectedResponseDate: z.string().min(1, 'Informe a data da resposta esperada'),
    lines: z.array(quoteLineSchema).min(1, 'Adicione ao menos uma linha'),
  })
  .refine(
    (data) =>
      !data.receiptDate ||
      !data.expectedResponseDate ||
      data.expectedResponseDate >= data.receiptDate,
    {
      path: ['expectedResponseDate'],
      message: 'Deve ser igual ou posterior à data de recebimento',
    },
  );

export type QuoteLineFormData = z.infer<typeof quoteLineSchema>;
export type QuoteRequestFormData = z.infer<typeof quoteRequestSchema>;
