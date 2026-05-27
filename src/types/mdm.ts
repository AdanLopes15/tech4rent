export type DeviceStatus = 'online' | 'offline';

export type DeviceCommandType = 
  | 'RING' 
  | 'SHOW_MESSAGE' 
  | 'LOCK' 
  | 'UNLOCK' 
  | 'KIOSK_ON' 
  | 'KIOSK_OFF';

export interface Device {
  id: string;
  patrimonio: string;
  nome: string;
  cliente: string;
  contrato: string;
  modelo: string;
  serial: string;
  imei: string;
  status: DeviceStatus;
  isBlocked: boolean;
  isKioskMode: boolean;
  qrToken: string;
  lastLatitude: number | null;
  lastLongitude: number | null;
  lastAccuracy: number | null;
  lastBattery: number | null;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  blockedDevices: number;
  kioskDevices: number;
  devicesWithLocation: number;
  devices: Device[];
}

export interface DeviceCommand {
  id: string;
  deviceId: string;
  command: DeviceCommandType;
  payload: any;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  error: string | null;
  createdAt: string;
  executedAt: string | null;
}

export interface DeviceLocation {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  battery: number;
  isCharging: boolean;
  capturedAt: string;
}
