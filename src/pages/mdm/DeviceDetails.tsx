import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { mdmApi } from '@/services/mdmApi';

export default function DeviceDetails() {
  const { id } = useParams();
  return <div className="p-6">Detalhes do dispositivo: {id}</div>;
}
