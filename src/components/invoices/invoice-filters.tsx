'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { Entity } from '@/types';

interface Props {
  entities: Entity[];
  originId?: string;
  destinationId?: string;
}

const ALL_VALUE = '__all__';

export function InvoiceFilters({ entities, originId, destinationId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ALL_VALUE) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  }

  function clearFilters() {
    router.push('/');
  }

  const hasFilters = !!originId || !!destinationId;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={originId ?? ALL_VALUE}
        onValueChange={(v) => updateFilter('origin_id', v)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by origin..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All origins</SelectItem>
          {entities.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border"
                  style={{ backgroundColor: e.primary_color }}
                />
                {e.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={destinationId ?? ALL_VALUE}
        onValueChange={(v) => updateFilter('destination_id', v)}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by destination..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All destinations</SelectItem>
          {entities.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full border"
                  style={{ backgroundColor: e.primary_color }}
                />
                {e.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-3 w-3" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
