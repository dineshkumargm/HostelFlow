
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '@/services/api';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: statsAPI.getDashboard,
  });
};
