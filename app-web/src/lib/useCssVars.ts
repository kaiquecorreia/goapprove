'use client';

import { useEffect, useState } from 'react';

function readVars(names: string[]): Record<string, string> {
  const computed = getComputedStyle(document.documentElement);
  return names.reduce<Record<string, string>>((acc, name) => {
    acc[name] = computed.getPropertyValue(name).trim();
    return acc;
  }, {});
}

export function useCssVars(names: string[]): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(readVars(names));

    const observer = new MutationObserver(() => setValues(readVars(names)));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names.join(',')]);

  return values;
}
