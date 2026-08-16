import { useEffect, useState, useRef } from 'react';
import { liveQuery } from 'dexie';

export function useLiveQuery<T>(
  querier: () => Promise<T> | T,
  deps: any[] = [],
  defaultResult?: T
): T | undefined {
  const [result, setResult] = useState<T | undefined>(defaultResult);
  const querierRef = useRef(querier);
  querierRef.current = querier;

  useEffect(() => {
    let isMounted = true;
    const observable = liveQuery(() => querierRef.current());
    const subscription = observable.subscribe({
      next: (val: T) => {
        if (isMounted) {
          setResult(val);
        }
      },
      error: (err: any) => {
        console.error('Dexie liveQuery error:', err);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return result;
}
