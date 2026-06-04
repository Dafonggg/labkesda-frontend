import { useQuery } from '@tanstack/react-query';
import { lookupByQrToken, getTimeline } from '@/services/tracking.service';

/**
 * Lookup sample tracking data by QR token (public).
 */
export const useQrLookup = (token: string | undefined) => {
  return useQuery({
    queryKey: ['tracking-lookup', token],
    queryFn: () => lookupByQrToken(token!),
    enabled: !!token && token.length >= 8,
    retry: false,
  });
};

/**
 * Get full tracking timeline by registrasi ID (authenticated).
 */
export const useTimeline = (registrasiId: string | undefined) => {
  return useQuery({
    queryKey: ['tracking-timeline', registrasiId],
    queryFn: () => getTimeline(registrasiId!),
    enabled: !!registrasiId,
  });
};
