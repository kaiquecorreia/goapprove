'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { OcTable } from '@/components/domain/OcTable';
import { getPurchaseOrders } from '@/services/purchaseOrders';
import type { OCStatus } from '@/lib/mock/types';
import styles from './styles.module.scss';

const STATUS_TABS: { value: OCStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovada' },
  { value: 'rejected', label: 'Rejeitada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'no_rule', label: 'Sem regra' },
  { value: 'error', label: 'Erro' },
];

export default function HistoricoPage() {
  const orders = getPurchaseOrders();
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const haystack = `${order.number} ${order.supplier} ${order.requester}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      const matchesDate = !date || order.receivedAt.startsWith(date);
      return matchesSearch && matchesDate;
    });
  }, [orders, search, date]);

  return (
    <div className={styles.page}>
      <PageHeader title="Histórico" description="Histórico completo de OCs processadas." />

      <Card>
        <CardContent className={styles.filtersContent}>
          <Input
            leftIcon={<Search size={16} />}
            placeholder="Buscar por OC, fornecedor ou solicitante..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            wrapperClassName={styles.search}
          />
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            wrapperClassName={styles.date}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {STATUS_TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardContent>
                <OcTable
                  orders={
                    tab.value === 'all'
                      ? filteredOrders
                      : filteredOrders.filter((order) => order.status === tab.value)
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
