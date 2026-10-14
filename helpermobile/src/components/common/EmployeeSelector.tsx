/**
 * EmployeeSelector Component
 *
 * Firma sahiplerinin teklif gönderirken opsiyonel eleman seçimi yapmasını sağlar.
 * Başlıklı kart + FkSelect. "Ben yapacağım" seçeneği dışarıya null olarak verilir.
 */
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Employee } from '../../api/types';
import { JobSection } from '../job';
import { FkInfoBanner } from '../fk';
import FkSelect from '../fk-select/FkSelect';
import type { FkSelectOption } from '../fk-select/types';

interface EmployeeSelectorProps {
  employees: Employee[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  loading?: boolean;
}

// 0 = "Ben yapacağım" (dışarıya null olarak verilir)
const SELF_ID = 0;

export default function EmployeeSelector({ employees, selectedId, onSelect, loading = false }: EmployeeSelectorProps) {
  const options = useMemo<FkSelectOption<number>[]>(
    () => [
      { value: SELF_ID, label: 'Ben yapacağım', description: 'İşi kendiniz yapacaksınız' },
      ...employees.map((e) => {
        const meta = [
          e.phone_number || null,
          e.is_available === undefined ? null : e.is_available ? 'Müsait' : 'İşte',
          e.user_is_online === undefined ? null : e.user_is_online ? 'Çevrimiçi' : 'Çevrimdışı',
        ]
          .filter(Boolean)
          .join(' · ');
        return { value: e.id, label: `${e.first_name} ${e.last_name}`, description: meta || undefined };
      }),
    ],
    [employees]
  );

  return (
    <JobSection title="Eleman Seçin (Opsiyonel)" icon="account-group-outline">
      {loading ? (
        <FkInfoBanner type="neutral" icon="timer-sand" message="Elemanlar yükleniyor..." />
      ) : (
        <FkSelect<number>
          value={selectedId === null ? SELF_ID : selectedId}
          onChange={(id) => onSelect(id === SELF_ID ? null : id)}
          options={options}
          modalTitle="Eleman Seçin"
          containerStyle={styles.select}
        />
      )}
    </JobSection>
  );
}

const styles = StyleSheet.create({
  select: {
    marginBottom: 0,
  },
});
