import type { EUserRole } from '@/config/navigation';

export type OCStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'no_rule' | 'error';

export type LNStatus = 'received' | 'synced' | 'pending_send' | 'failed' | 'not_applicable';

export type ApprovalMode = 'ANY' | 'ALL' | 'SEQUENTIAL';

export type CompanyEnvironment = 'DEVELOPMENT' | 'HOMOLOGATION' | 'PRODUCTION';

export interface Company {
  companyId: string;
  externalIntegrationCode: string;
  name: string;
  cnpj?: string;
  status: boolean;
  externalIntegrationUrlBase?: string;
  environment: CompanyEnvironment;
  notes?: string;
}

export interface UserCompanyLink {
  companyId: string;
  isDefault: boolean;
}

export interface UserSubstituteLink {
  substituteId: string;
  priority: number;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  externalIntegrationUser: string | null;
  role: EUserRole;
  active: boolean;
  approvalLimit: number | null;
  companies: UserCompanyLink[];
  substitutes: UserSubstituteLink[];
}

export interface Supplier {
  id: string;
  name: string;
}

export interface OCItem {
  code: string;
  description: string;
  qty: number;
  unitPrice: number;
  category: string;
}

export interface ApprovalLevel {
  level: number;
  mode: ApprovalMode;
  approvers: string[];
  sla?: number;
  status: 'locked' | 'pending' | 'approved' | 'rejected' | 'skipped';
}

export interface TimelineEvent {
  at: string;
  label: string;
  type: 'info' | 'success' | 'warning' | 'error';
  detail?: string;
}

export interface OcComment {
  id: string;
  author: string;
  at: string;
  text: string;
}

export interface OcTableRow {
  id: string;
  number: string;
  company: string;
  supplier: string;
  requester: string;
  total: number;
  status: OCStatus;
}

export interface PendingPurchaseOrder extends OcTableRow {
  currentLevel: number | null;
  totalLevels: number;
  costCenter: string | null;
  erpCreatedAt: string;
}

export interface PendingPurchaseOrdersPage {
  items: PendingPurchaseOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  company: string;
  supplier: string;
  requester: string;
  buyer: string;
  total: number;
  project: string;
  costCenter: string;
  category: string;
  status: OCStatus;
  lnStatus: LNStatus;
  currentLevel: number;
  totalLevels: number;
  receivedAt: string;
  slaHours: number;
  items: OCItem[];
  workflow: ApprovalLevel[];
  timeline: TimelineEvent[];
  appliedRule?: string;
  comments: OcComment[];
}

export interface PurchaseOrderDetail {
  id: string;
  number: string;
  company: string;
  supplier: string;
  requester: string;
  buyer: string;
  total: number;
  project: string;
  costCenter: string;
  status: OCStatus;
  lnStatus: LNStatus;
  receivedAt: string;
  items: OCItem[];
  workflow: ApprovalLevel[];
  timeline: TimelineEvent[];
  appliedRule?: string;
}

export type RuleConditionSourceType = 'PO_HEADER' | 'PO_LINE' | 'PO_ADDITIONAL';

export type RuleOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'LESS_THAN_OR_EQUAL'
  | 'BETWEEN'
  | 'CONTAINS'
  | 'IN_LIST'
  | 'NOT_IN_LIST'
  | 'EXISTS'
  | 'NOT_EXISTS';

export interface RuleCriterion {
  sourceType: RuleConditionSourceType;
  field: string;
  operator: RuleOperator;
  value?: string;
  valueTo?: string;
  valueList?: string[];
}

export interface RuleLevelApprover {
  userId: string;
  name: string;
}

export interface RuleLevel {
  level: number;
  mode: ApprovalMode;
  approvers: RuleLevelApprover[];
}

export type ConflictStrategy = 'HIGHEST_PRIORITY' | 'MOST_RESTRICTIVE' | 'FIRST_MATCH';

export interface Rule {
  id: string;
  code: string;
  name: string;
  description?: string;
  companyId: string;
  priority: number;
  validFrom: string;
  validTo?: string;
  criteria: RuleCriterion[];
  levels: RuleLevel[];
  conflictStrategy: ConflictStrategy;
  status: 'Ativa' | 'Inativa';
}

export interface AuditEvent {
  id: string;
  at: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  ip: string;
  userAgent: string;
  correlationId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface MonthlyStat {
  month: string;
  aprovadas: number;
  rejeitadas: number;
  semRegra: number;
}

export interface CompanyDistributionEntry {
  name: string;
  value: number;
}
