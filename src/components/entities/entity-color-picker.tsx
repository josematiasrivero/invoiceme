'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function EntityColorPicker({ defaultValue = '#1D4ED8' }: { defaultValue?: string }) {
  const [color, setColor] = useState(defaultValue);

  return (
    <div className="space-y-2">
      <Label htmlFor="primary_color">Brand Color</Label>
      <p className="text-xs text-muted-foreground">Used as accent color in generated invoices</p>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-16 cursor-pointer rounded border"
          aria-label="Pick color"
        />
        <Input
          id="primary_color"
          name="primary_color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          pattern="^#[0-9A-Fa-f]{6}$"
          className="w-32 font-mono"
          required
        />
        <div
          className="h-10 flex-1 rounded border"
          style={{ backgroundColor: color }}
          title="Color preview"
        />
      </div>
    </div>
  );
}
