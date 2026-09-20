import { useEffect, useState } from 'react';
export function useLoad<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  dependencies: unknown[],
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    loader(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((e: Error) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // Callers explicitly declare request dependencies, matching React's effect contract.
  }, [...dependencies, version]);
  return {
    data,
    setData,
    error,
    loading,
    reload: () => setVersion((v) => v + 1),
  };
}
