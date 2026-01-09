import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Clock, Loader2, ChevronRight } from 'lucide-react';
import api from '../lib/api';

interface BlueprintBuildQueueEntry {
  id: number;
  quantity: number;
  constructionStartedAt: string;
  blueprint: {
    id: number;
    name: string;
    shipClass: string;
    totalBuildTime: number;
  };
}

interface ShipBuildQueueEntry {
  id: number;
  quantity: number;
  constructionStartedAt: string;
  shipType: {
    id: number;
    name: string;
    shipClass: string;
    buildTime: number;
  };
}

interface OrbitalDockActionProps {
  planetId: number;
  buildingName: string;
  isActive: boolean;
  onClose?: () => void;
}

export default function OrbitalDockAction({
  planetId,
  buildingName,
  isActive,
  onClose,
}: OrbitalDockActionProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [buildQueue, setBuildQueue] = useState<(BlueprintBuildQueueEntry | ShipBuildQueueEntry)[]>([]);
  const [, setTick] = useState(0);

  // Check if this building is an Orbital Dock
  const isOrbitalDock = ['Orbitales Raumdock', 'Raumschiffwerft', 'Shipyard'].includes(buildingName);

  useEffect(() => {
    if (isOrbitalDock && isActive) {
      loadBuildQueue();
    } else {
      setLoading(false);
    }
  }, [planetId, isOrbitalDock, isActive]);

  // Update progress every second
  useEffect(() => {
    if (buildQueue.length > 0) {
      const interval = setInterval(() => {
        setTick(t => t + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [buildQueue.length]);

  const loadBuildQueue = async () => {
    try {
      // Try to load blueprint build queue first
      const blueprintResponse = await api.get(`/blueprints/build-queue/${planetId}`).catch(() => null);

      // Also load legacy ship build queue
      const shipyardResponse = await api.get(`/shipyard/${planetId}`).catch(() => null);

      const queue: (BlueprintBuildQueueEntry | ShipBuildQueueEntry)[] = [];

      if (blueprintResponse?.data?.buildQueue) {
        queue.push(...blueprintResponse.data.buildQueue);
      }

      if (shipyardResponse?.data?.buildQueue) {
        queue.push(...shipyardResponse.data.buildQueue);
      }

      setBuildQueue(queue);
    } catch (error) {
      console.error('Failed to load build queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const openBlueprintEditor = () => {
    if (onClose) onClose();
    navigate(`/planet/${planetId}/blueprints`);
  };

  if (!isOrbitalDock) {
    return null;
  }

  if (!isActive) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-400">
          <Clock size={20} />
          <span>Raumdock wird gebaut...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const isBusy = buildQueue.length > 0;

  // Calculate progress for current build
  const getCurrentBuildProgress = () => {
    if (buildQueue.length === 0) return null;

    const currentBuild = buildQueue[0];
    const startTime = new Date(currentBuild.constructionStartedAt).getTime();

    // Get build time based on queue type
    let buildTimeMinutes: number;
    let itemName: string;
    let quantity: number;

    if ('blueprint' in currentBuild) {
      buildTimeMinutes = currentBuild.blueprint.totalBuildTime;
      itemName = currentBuild.blueprint.name;
      quantity = currentBuild.quantity;
    } else {
      buildTimeMinutes = currentBuild.shipType.buildTime;
      itemName = currentBuild.shipType.name;
      quantity = currentBuild.quantity;
    }

    const totalBuildTime = buildTimeMinutes * 60 * 1000;
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, totalBuildTime - elapsed);
    const progress = Math.min(100, (elapsed / totalBuildTime) * 100);
    const remainingMinutes = Math.ceil(remaining / 60000);
    const remainingSeconds = Math.ceil((remaining % 60000) / 1000);

    return {
      itemName,
      quantity,
      progress,
      remainingMinutes,
      remainingSeconds,
    };
  };

  const buildProgress = getCurrentBuildProgress();

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className={`flex items-center gap-3 p-3 rounded-lg ${
        isBusy
          ? 'bg-yellow-900/20 border border-yellow-600'
          : 'bg-cyan-900/20 border border-cyan-600'
      }`}>
        <div className={`p-2 rounded-full ${isBusy ? 'bg-yellow-500/20' : 'bg-cyan-500/20'}`}>
          {isBusy ? (
            <Loader2 size={24} className="text-yellow-400 animate-spin" />
          ) : (
            <Rocket size={24} className="text-cyan-400" />
          )}
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${isBusy ? 'text-yellow-400' : 'text-cyan-400'}`}>
            {isBusy ? 'Schiffsbau aktiv' : 'Bereit'}
          </p>
          <p className="text-gray-400 text-sm">
            {isBusy
              ? `${buildQueue.length} Auftrag${buildQueue.length > 1 ? 'e' : ''} in Warteschlange`
              : 'Keine aktiven Bauauftraege'
            }
          </p>
        </div>
      </div>

      {/* Current Build Progress */}
      {buildProgress && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">
              {buildProgress.quantity}x {buildProgress.itemName}
            </span>
            <span className="text-yellow-400 text-sm font-mono">
              {buildProgress.remainingMinutes > 0
                ? `${buildProgress.remainingMinutes}m ${buildProgress.remainingSeconds}s`
                : `${buildProgress.remainingSeconds}s`
              }
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${buildProgress.progress}%` }}
            />
          </div>
          <p className="text-gray-400 text-xs mt-1">
            {Math.round(buildProgress.progress)}% abgeschlossen
          </p>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={openBlueprintEditor}
        className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
      >
        <Rocket size={20} />
        Blueprint-Editor oeffnen
        <ChevronRight size={18} />
      </button>

      {/* Additional Queue Items */}
      {buildQueue.length > 1 && (
        <div className="border-t border-gray-700 pt-3">
          <p className="text-gray-400 text-xs mb-2">Weitere Auftraege:</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {buildQueue.slice(1).map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm bg-gray-800/30 rounded p-2">
                <span className="text-gray-300">
                  {'blueprint' in item
                    ? `${item.quantity}x ${item.blueprint.name}`
                    : `${item.quantity}x ${item.shipType.name}`
                  }
                </span>
                <span className="text-gray-500">Wartend</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
