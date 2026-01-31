import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Rocket, Trash2, Edit, Copy } from 'lucide-react';
import { BlueprintEditor } from '../components/shipyard';
import { blueprintApi } from '../lib/blueprintApi';
import {
  Blueprint,
  SHIP_CLASS_NAMES,
  SHIP_CLASS_COLORS,
} from '../types/blueprint';

export default function BlueprintEditorPage() {
  const navigate = useNavigate();
  const { planetId } = useParams();
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState<Blueprint | null>(null);

  useEffect(() => {
    loadBlueprints();
  }, []);

  const loadBlueprints = async () => {
    try {
      const data = await blueprintApi.getBlueprints();
      setBlueprints(data);
    } catch (error) {
      console.error('Failed to load blueprints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (_blueprint: Blueprint) => {
    setShowEditor(false);
    setEditingBlueprint(null);
    loadBlueprints();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Blueprint wirklich loeschen?')) return;
    try {
      await blueprintApi.deleteBlueprint(id);
      loadBlueprints();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Fehler beim Loeschen');
    }
  };

  const handleEdit = (blueprint: Blueprint) => {
    setEditingBlueprint(blueprint);
    setShowEditor(true);
  };

  const handleCopy = (blueprint: Blueprint) => {
    // Create a copy with modified name - pass as partial for editing
    const copiedBlueprint = {
      ...blueprint,
      name: `${blueprint.name} (Kopie)`,
      // Remove timestamps and IDs - the editor will treat this as new blueprint
    } as any; // Cast to any since we're modifying the structure for editing

    // Clear the ID to indicate this is a new blueprint
    delete copiedBlueprint.id;
    delete copiedBlueprint.playerId;
    delete copiedBlueprint.createdAt;
    delete copiedBlueprint.updatedAt;

    setEditingBlueprint(copiedBlueprint);
    setShowEditor(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-sm">
          <button
            onClick={() => {
              setShowEditor(false);
              setEditingBlueprint(null);
            }}
            className="flex items-center gap-3 text-cyan-400/70 hover:text-cyan-300 transition-all font-mono"
          >
            <div className="p-1 bg-cyan-900/40 border border-cyan-500/40 rounded">
              <ArrowLeft size={16} />
            </div>
            <span className="tracking-wider">ZURÜCK ZUR ÜBERSICHT</span>
          </button>
        </div>
        <BlueprintEditor
          initialBlueprint={editingBlueprint}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false);
            setEditingBlueprint(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Imperial Command Blueprint Header */}
      <div className="bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/30 rounded-lg p-6 backdrop-blur-sm">
        <button
          onClick={() => navigate(planetId ? `/planet/${planetId}` : '/')}
          className="flex items-center gap-3 text-cyan-400/70 hover:text-cyan-300 transition-all font-mono mb-4"
        >
          <div className="p-1 bg-cyan-900/40 border border-cyan-500/40 rounded">
            <ArrowLeft size={16} />
          </div>
          <span className="tracking-wider">ZURÜCK</span>
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-cyan-900/40 border border-cyan-500/40 rounded">
              <Rocket className="text-cyan-300" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-cyan-100 font-mono tracking-wider">SCHIFFS-BLUEPRINTS</h1>
              <p className="text-cyan-400/70 font-mono text-sm">ERSTELLE UND VERWALTE DEINE INDIVIDUELLEN SCHIFFSENTWÜRFE</p>
            </div>
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="bg-gradient-to-r from-cyan-900/40 to-cyan-800/30 border border-cyan-500/30 text-cyan-100 px-6 py-3 rounded hover:from-cyan-800/50 hover:to-cyan-700/40 transition-all flex items-center gap-2 font-mono"
          >
            <Plus size={18} />
            <span className="tracking-wider">NEUER BLUEPRINT</span>
          </button>
        </div>
      </div>

      {/* Imperial Command Blueprint List */}
      {blueprints.length === 0 ? (
        <div className="bg-gradient-to-r from-slate-950/40 to-cyan-950/20 border border-dashed border-cyan-500/30 rounded p-12 text-center backdrop-blur-sm">
          <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-full w-fit mx-auto mb-6">
            <Rocket className="w-16 h-16 text-cyan-400/60" />
          </div>
          <p className="text-cyan-200 text-lg font-mono tracking-wider">KEINE BLUEPRINTS VORHANDEN</p>
          <p className="text-cyan-400/60 text-sm font-mono mt-2">
            ERSTELLE DEINEN ERSTEN SCHIFFSENTWURF
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blueprints.map((bp) => (
            <div
              key={bp.id}
              className={`bg-gradient-to-br ${
                SHIP_CLASS_COLORS[bp.shipClass]
              } border border-cyan-500/30 rounded backdrop-blur-sm p-5 transition-all hover:border-cyan-400/50 hover:scale-[1.02]`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-lg">{bp.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {SHIP_CLASS_NAMES[bp.shipClass]}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(bp)}
                    className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleCopy(bp)}
                    className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                    title="Kopieren"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(bp.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Loeschen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="bg-black/20 rounded p-2">
                  <span className="text-gray-500">Huelle</span>
                  <p className="text-white font-mono">{bp.stats.hullPoints}</p>
                </div>
                <div className="bg-black/20 rounded p-2">
                  <span className="text-gray-500">Kampfstaerke</span>
                  <p className="text-red-400 font-mono">
                    {bp.stats.combatRating === 'SEHR_HOCH' ? 'Sehr Hoch' :
                     bp.stats.combatRating === 'HOCH' ? 'Hoch' :
                     bp.stats.combatRating === 'MITTEL' ? 'Mittel' : 'Niedrig'}
                  </p>
                </div>
                <div className="bg-black/20 rounded p-2">
                  <span className="text-gray-500">Speed</span>
                  <p className="text-cyan-400 font-mono">{bp.stats.speed}</p>
                </div>
                <div className="bg-black/20 rounded p-2">
                  <span className="text-gray-500">Sensoren</span>
                  <p className="text-yellow-400 font-mono">{bp.stats.sensorRange}</p>
                </div>
              </div>

              {/* Costs Summary */}
              <div className="text-xs text-gray-400 border-t border-gray-700/50 pt-3">
                <div className="flex justify-between">
                  <span>Kosten:</span>
                  <span className="text-yellow-400">
                    {bp.costs.credits.toLocaleString()} Credits
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bauzeit:</span>
                  <span className="text-blue-400">{bp.costs.buildTimeMinutes}m</span>
                </div>
              </div>

              {/* Module Count */}
              <div className="mt-3 text-xs text-gray-500">
                {bp.modules.length} Module konfiguriert
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
