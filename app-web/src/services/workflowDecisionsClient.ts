export type DecisionType = 'APPROVED' | 'REJECTED';

export interface PostDecisionInput {
  decision: DecisionType;
  comment?: string;
}

export async function postDecision(
  purchaseOrderId: string,
  input: PostDecisionInput,
): Promise<void> {
  const response = await fetch(`/api/ocs/${purchaseOrderId}/decisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    const message = Array.isArray(data?.message) ? data.message.join('; ') : data?.message;
    throw new Error(message ?? 'Falha ao registrar a decisão');
  }
}
