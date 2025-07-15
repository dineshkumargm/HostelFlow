
import { useQuery } from '@tanstack/react-query';
import { servicesAPI } from '@/services/api';

export const useServices = () => {
  return useQuery({
    queryKey: ['services'],
    queryFn: servicesAPI.getAll,
  });
};
