'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { OcPayloadViewer } from '@/components/domain/OcPayloadViewer';
import { AppliedRuleCard } from '@/components/domain/AppliedRuleCard';
import { RejectReasonDialog } from '@/components/domain/RejectReasonDialog';
import { getPurchaseOrderDetail } from '@/services/purchaseOrderDetailClient';
import { postDecision } from '@/services/workflowDecisionsClient';
import { feedback } from '@/services/feedback';
import { formatCurrency } from '@/lib/format/currency';
import type { PurchaseOrderDetail } from '@/lib/mock/types';
import styles from './styles.module.scss';

export default function OcDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<PurchaseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPurchaseOrderDetail(params.id);
      setOrder(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar a OC');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleApprove = async () => {
    if (!order) return;

    try {
      await postDecision(order.id, { decision: 'APPROVED' });
      feedback.success(`OC ${order.number} aprovada.`);
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : `Erro ao aprovar OC ${order.number}.`);
    } finally {
      fetchOrder();
    }
  };

  const handleConfirmReject = async (comment: string) => {
    if (!order) return;

    try {
      await postDecision(order.id, { decision: 'REJECTED', comment });
      feedback.success(`OC ${order.number} rejeitada.`);
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : `Erro ao rejeitar OC ${order.number}.`);
      throw err;
    } finally {
      fetchOrder();
    }
  };

  if (loading) {
    return <p className={styles.stateMessage}>Carregando OC…</p>;
  }

  if (error || !order) {
    return (
      <div className={styles.notFound}>
        <p>{error ?? 'Ordem de compra não encontrada.'}</p>
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
                onClick={() => setRejectOpen(true)}
              >
                Rejeitar
              </Button>
              <Button leftIcon={<Check size={16} />} onClick={handleApprove}>
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

      <RejectReasonDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        orderNumber={order.number}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
}
