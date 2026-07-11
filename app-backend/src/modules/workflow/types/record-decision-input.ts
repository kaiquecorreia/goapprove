import { DecisionType } from '@prisma/client';

export interface RecordDecisionInput {
  purchaseOrderId: string;
  actingUserId: string;
  decision: DecisionType;
  comment?: string;
  onBehalfOfUserId?: string;
}
