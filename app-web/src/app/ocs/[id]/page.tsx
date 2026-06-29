'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { StatusBadge } from '@/components/domain/StatusBadge';
import { LNBadge } from '@/components/domain/LNBadge';
import { OcItemsTable } from '@/components/domain/OcItemsTable';
import { ApprovalWorkflowPanel } from '@/components/domain/ApprovalWorkflowPanel';
import { OcTimeline } from '@/components/domain/OcTimeline';
import { OcCommentsSection } from '@/components/domain/OcCommentsSection';
import { OcPayloadViewer } from '@/components/domain/OcPayloadViewer';
import { AppliedRuleCard } from '@/components/domain/AppliedRuleCard';
import { getPurchaseOrderById } from '@/services/purchaseOrders';
import { feedback } from '@/services/feedback';
import { formatCurrency } from '@/lib/format/currency';
import styles from './styles.module.scss';

export default function OcDetailPage() {
  const params = useParams<{ id: string }>();
  const order = getPurchaseOrderById(params.id);

  if (!order) {
    return (
      <div className={styles.notFound}>
        <p>Ordem de compra não encontrada.</p>
        <Link href="/ocs/pending">
          <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>
            Voltar para OCs Pendentes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href="/ocs/pending" className={styles.backLink}>
        <ArrowLeft size={14} /> Voltar
      </Link>

      <PageHeader
        title={order.number}
        description={`${order.company} · ${order.supplier}`}
        actions={
          order.status === 'pending' ? (
            <>
              <Button
                variant="outline"
                leftIcon={<X size={16} />}
                onClick={() => feedback.error(`OC ${order.number} rejeitada.`)}
              >
                Rejeitar
              </Button>
              <Button
                leftIcon={<Check size={16} />}
                onClick={() => feedback.success(`OC ${order.number} aprovada.`)}
              >
                Aprovar
              </Button>
            </>
          ) : undefined
        }
      />

      <div className={styles.badgeRow}>
        <StatusBadge status={order.status} />
        <LNBadge status={order.lnStatus} />
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <Tabs defaultValue="resumo">
            <TabsList>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="itens">Itens</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
              <TabsTrigger value="payload">Payload LN</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo">
              <Card>
                <CardContent className={styles.summaryGrid}>
                  <div>
                    <span className={styles.summaryLabel}>Valor total</span>
                    <span className={styles.summaryValue}>{formatCurrency(order.total)}</span>
                  </div>
                  <div>
                    <span className={styles.summaryLabel}>Solicitante</span>
                    <span className={styles.summaryValue}>{order.requester}</span>
                  </div>
                  <div>
                    <span className={styles.summaryLabel}>Comprador</span>
                    <span className={styles.summaryValue}>{order.buyer}</span>
                  </div>
                  <div>
                    <span className={styles.summaryLabel}>Projeto</span>
                    <span className={styles.summaryValue}>{order.project}</span>
                  </div>
                  <div>
                    <span className={styles.summaryLabel}>Centro de custo</span>
                    <span className={styles.summaryValue}>{order.costCenter}</span>
                  </div>
                  <div>
                    <span className={styles.summaryLabel}>Categoria</span>
                    <span className={styles.summaryValue}>{order.category}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className={styles.commentsCard}>
                <CardHeader>
                  <CardTitle>Comentários</CardTitle>
                </CardHeader>
                <CardContent>
                  <OcCommentsSection comments={order.comments} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="itens">
              <Card>
                <CardContent>
                  <OcItemsTable items={order.items} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflow">
              <Card>
                <CardContent>
                  <ApprovalWorkflowPanel levels={order.workflow} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payload">
              <Card>
                <CardContent>
                  <OcPayloadViewer order={order} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className={styles.sidebar}>
          <AppliedRuleCard ruleName={order.appliedRule} />

          <Card>
            <CardHeader>
              <CardTitle>Linha do tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <OcTimeline events={order.timeline} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
