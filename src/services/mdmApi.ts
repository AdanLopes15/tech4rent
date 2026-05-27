import { DashboardSummary, DeviceCommand, DeviceCommandType, DeviceLocation } from "@/types/mdm";

const BASE_URL = import.meta.env.VITE_MDM_API_URL || "https://circle-stoop-stray.ngrok-free.dev";
const API_KEY = import.meta.env.VITE_MDM_API_KEY || "tech4rent-dev-key";

const getHeaders = () => ({
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
  "ngrok-skip-browser-warning": "true",
});

export const mdmApi = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await fetch(`${BASE_URL}/dashboard/summary`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Erro ao buscar resumo do dashboard");
    return response.json();
  },

  async sendDeviceCommand(
    deviceId: string, 
    command: DeviceCommandType, 
    payload?: any
  ): Promise<DeviceCommand> {
    const response = await fetch(`${BASE_URL}/devices/${deviceId}/commands`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ command, payload }),
    });
    if (!response.ok) throw new Error("Erro ao enviar comando para o dispositivo");
    return response.json();
  },

  async getDeviceCommands(deviceId: string): Promise<DeviceCommand[]> {
    const response = await fetch(`${BASE_URL}/devices/${deviceId}/commands`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Erro ao buscar histórico de comandos");
    return response.json();
  },

  async getDeviceLocations(deviceId: string): Promise<DeviceLocation[]> {
    const response = await fetch(`${BASE_URL}/devices/${deviceId}/locations`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Erro ao buscar histórico de localização");
    return response.json();
  },
};
