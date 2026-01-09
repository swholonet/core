import api from './api';
import {
  Blueprint,
  ModuleType,
  ShipClassConfig,
  CreateBlueprintInput,
  CalculateResponse,
  BlueprintModuleInput,
  ShipClass,
} from '../types/blueprint';

// =====================================================
// Blueprint API Service
// =====================================================

export const blueprintApi = {
  // Alle Blueprints des Spielers abrufen
  async getBlueprints(): Promise<Blueprint[]> {
    const response = await api.get('/blueprints');
    return response.data.blueprints;
  },

  // Einzelnen Blueprint abrufen
  async getBlueprint(id: number): Promise<Blueprint> {
    const response = await api.get(`/blueprints/${id}`);
    return response.data.blueprint;
  },

  // Neuen Blueprint erstellen
  async createBlueprint(data: CreateBlueprintInput): Promise<Blueprint> {
    const response = await api.post('/blueprints', data);
    return response.data.blueprint;
  },

  // Blueprint aktualisieren
  async updateBlueprint(
    id: number,
    data: Partial<CreateBlueprintInput>
  ): Promise<Blueprint> {
    const response = await api.put(`/blueprints/${id}`, data);
    return response.data.blueprint;
  },

  // Blueprint loeschen
  async deleteBlueprint(id: number): Promise<void> {
    await api.delete(`/blueprints/${id}`);
  },

  // Schiff aus Blueprint bauen
  async buildShip(
    blueprintId: number,
    planetId: number,
    quantity: number = 1
  ): Promise<{ message: string; queueEntry: any }> {
    const response = await api.post(`/blueprints/${blueprintId}/build`, {
      planetId,
      quantity,
    });
    return response.data;
  },

  // Verfuegbare Module abrufen
  async getAvailableModules(): Promise<ModuleType[]> {
    const response = await api.get('/blueprints/modules/available');
    return response.data.modules;
  },

  // Schiffsklassen-Konfiguration abrufen
  async getShipClasses(): Promise<ShipClassConfig[]> {
    const response = await api.get('/blueprints/ship-classes');
    return response.data.shipClasses;
  },

  // Live-Berechnung (ohne zu speichern)
  async calculateBlueprint(
    shipClass: ShipClass,
    modules: BlueprintModuleInput[]
  ): Promise<CalculateResponse> {
    const response = await api.post('/blueprints/0/calculate', {
      shipClass,
      modules,
    });
    return response.data;
  },
};

export default blueprintApi;
