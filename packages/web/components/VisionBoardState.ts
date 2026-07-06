import { BoardNode, BoardNodeType, BoardState, Objective, STORAGE_KEY } from './VisionBoardTypes';

// Persisted state as read back from localStorage — entries may be partial or
// malformed (older versions, manual edits); loadState normalizes them below.
interface StoredBoardState {
  nodes?: Array<Partial<BoardNode> | null>;
  objectives?: Array<Partial<Objective> | null>;
  camera?: BoardState['camera'];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function loadState(uid?: string | null): BoardState {
  const empty = { nodes: [], objectives: [], camera: { x: 0, y: 0, zoom: 1 } };
  if (typeof window === 'undefined' || !uid) return empty;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredBoardState;
      // Filter out malformed nodes and ensure required fields
      parsed.nodes = (parsed.nodes || [])
        .filter(
          (n): n is Partial<BoardNode> & { id: string; type: BoardNodeType } =>
            !!(n && n.id && n.type)
        )
        .map((n) => ({
          ...n,
          type: n.type || 'note',
          data: n.data || {},
          w: n.w || 200,
          h: n.h || 120,
          x: n.x ?? 0,
          y: n.y ?? 0,
          createdAt: n.createdAt || Date.now(),
        }));
      parsed.objectives = (parsed.objectives || []).filter(
        (o): o is Partial<Objective> & { id: string } => !!(o && o.id)
      );
      parsed.camera = parsed.camera || { x: 0, y: 0, zoom: 1 };
      // Normalization above guarantees the BoardState shape
      return parsed as BoardState;
    }
  } catch {}
  return { nodes: [], objectives: [], camera: { x: 0, y: 0, zoom: 1 } };
}

let saveTimer: NodeJS.Timeout | null = null;
export function saveState(state: BoardState, uid?: string | null) {
  if (typeof window === 'undefined' || !uid) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}-${uid}`, JSON.stringify(state));
    } catch {}
  }, 500);
}

export function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
