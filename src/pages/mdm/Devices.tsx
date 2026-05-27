import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { mdmApi } from '@/services/mdmApi';

export default function Devices() {
  const { data } = useQuery({
    queryKey: ['mdmSummary'],
    queryFn: () => mdmApi.getDashboardSummary(),
  });
  
  return <div className="p-6">Dispositivos: {data?.devices.length || 0}</div>;
}
