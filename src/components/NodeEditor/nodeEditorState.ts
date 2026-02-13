import { reactive, computed, ref } from 'vue';

export interface Position {
    x: number;
    y: number;
}

export interface ControlItem {
    id: string; // matches input ID (node ID or input name)
    type: 'node' | 'code';
}

export interface ControlTile {
    id: string;
    label: string;
    position: Position; // Grid position (row, col) or pixel? Lets use pixel for free drag, or grid index. 
    // The prompt says "grid view" but also "fully rearrangable". 
    // Let's stick to a list of tiles that can be reordered, but maybe "position" is just order index?
    // Actually, "grid view with tiles" usually implies 2D layout. 
    // Let's use a flexible layout like a dashboard. 
    // For simplicity first: A list of tiles.
    layout: 'vertical' | 'horizontal' | 'grid2x2';
    items: ControlItem[];
    width?: number;
    height?: number;
}

export interface NodePort {
    id: string;
    name: string;
    type: string;
}

export interface NodeDefinition {
    id: string;
    type: string;
    label: string;
    position: Position;
    data: Record<string, any>;
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    collapsed?: boolean;
}

export interface Connection {
    id: string;
    sourceNodeId: string;
    sourcePort: string;
    targetNodeId: string;
    targetPort: string;
}

export interface NodeEditorState {
    nodes: NodeDefinition[];
    connections: Connection[];
    zoom: number;
    pan: Position;
    selection: string[];
    dragState: {
        isDragging: boolean;
        nodeId: string | null;
        startMouse: Position;
        startNode: Position;
    };
    connectionState: {
        isConnecting: boolean;
        sourceNodeId: string | null;
        sourcePort: string | null;
        startX: number;
        startY: number;
        endX: number;
        endY: number;
    };
    controlLayout: ControlTile[];
    isLive: boolean;
    showDocPanel: boolean;
}

const state = reactive<NodeEditorState>({
    nodes: [],
    connections: [],
    zoom: 1,
    pan: { x: 0, y: 0 },
    selection: [],
    dragState: {
        isDragging: false,
        nodeId: null,
        startMouse: { x: 0, y: 0 },
        startNode: { x: 0, y: 0 }
    },
    connectionState: {
        isConnecting: false,
        sourceNodeId: null,
        sourcePort: null,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
    },
    controlLayout: [],
    isLive: true,
    showDocPanel: false
});

// --- Actions ---

export function addNode(node: NodeDefinition) {
    if (state.nodes.some(n => n.id === node.id)) return;
    state.nodes.push(node);
    triggerGraphUpdate();
}

export function clearGraph() {
    state.nodes = [];
    state.connections = [];
    state.selection = [];
    state.controlLayout = [];
    for (const key in nodeValues) delete nodeValues[key];
    syncExecutionState(); // Sync clears
    triggerGraphUpdate();
}

export function removeNode(nodeId: string) {
    state.nodes = state.nodes.filter((n) => n.id !== nodeId);
    state.connections = state.connections.filter(
        (c) => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
    );
    if (state.selection.includes(nodeId)) {
        state.selection = state.selection.filter((id) => id !== nodeId);
    }
    triggerGraphUpdate();
}

export function updateNodePosition(id: string, position: Position) {
    const node = state.nodes.find((n) => n.id === id);
    if (node) {
        node.position = position;
    }
}

export function duplicateNode(nodeId: string) {
    const original = state.nodes.find(n => n.id === nodeId);
    if (!original) return null;

    const newNode: NodeDefinition = JSON.parse(JSON.stringify(original));
    newNode.id = generateId();
    newNode.position.x += 20;
    newNode.position.y += 20;

    // Reset output values in the new node's data if they are stored there 
    // (though evaluation usually handles this)

    state.nodes.push(newNode);
    state.selection = [newNode.id];
    triggerGraphUpdate();
    return newNode.id;
}

export const NODE_CATEGORIES = [
    {
        label: 'Transforms',
        color: '#00D2FF', // Teal (Dark Turquoise)
        nodeTypes: ['math', 'range', 'switch', 'logic', 'compare', 'filter', 'isolateColumn', 'if']
    },
    {
        label: 'Inputs',
        color: '#d7d7d7ff', // Light Grey
        nodeTypes: ['csvInput', 'input', 'constant', 'number', 'color', 'chartEvent', 'link']
    },
    {
        label: 'Outputs',
        color: '#00ff88', // Green
        nodeTypes: ['display']
    },
    {
        label: 'Ploting', // Note: user spelled it 'ploting' in request, but let's use 'Plotting' unless they strictly want that
        color: '#CC33FF', // Purple
        nodeTypes: ['trace', 'joiner', 'plotly', 'config', 'subplot', 'layoutNode', 'styling']
    }
];

export function getNodeColor(type: string) {
    const category = NODE_CATEGORIES.find(c => c.nodeTypes.includes(type));
    return category ? category.color : '#444';
}

export function addConnection(connection: Connection) {
    const exists = state.connections.some(
        (c) =>
            c.sourceNodeId === connection.sourceNodeId &&
            c.sourcePort === connection.sourcePort &&
            c.targetNodeId === connection.targetNodeId &&
            c.targetPort === connection.targetPort
    );

    if (!exists) {
        state.connections.push(connection);
        triggerGraphUpdate();
    }
}

export function removeConnection(connectionId: string) {
    state.connections = state.connections.filter((c) => c.id !== connectionId);
    triggerGraphUpdate();
}

export function removeConnectionsToInput(nodeId: string, inputName: string) {
    state.connections = state.connections.filter(
        (c) => !(c.targetNodeId === nodeId && c.targetPort === inputName)
    );
    triggerGraphUpdate();
}

export function setZoom(zoom: number) {
    state.zoom = Math.max(0.1, Math.min(zoom, 5));
}

export function setPan(pan: Position) {
    state.pan = pan;
}

export function clearSelection() {
    state.selection = [];
}

export function selectNode(nodeId: string, additive = false) {
    if (additive) {
        if (!state.selection.includes(nodeId)) {
            state.selection.push(nodeId);
        }
    } else {
        state.selection = [nodeId];
    }
}

// --- Dragging Logic ---

export function startNodeDrag(nodeId: string, mouseX: number, mouseY: number) {
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) return;

    state.dragState = {
        isDragging: true,
        nodeId,
        startMouse: { x: mouseX, y: mouseY },
        startNode: { ...node.position }
    };
    selectNode(nodeId);
}

export function updateNodeDrag(mouseX: number, mouseY: number) {
    if (!state.dragState.isDragging || !state.dragState.nodeId) return;

    const dx = (mouseX - state.dragState.startMouse.x) / state.zoom;
    const dy = (mouseY - state.dragState.startMouse.y) / state.zoom;

    updateNodePosition(state.dragState.nodeId, {
        x: state.dragState.startNode.x + dx,
        y: state.dragState.startNode.y + dy
    });
}

export function endNodeDrag() {
    state.dragState.isDragging = false;
    state.dragState.nodeId = null;
}

// --- Connection Logic ---

export function startConnection(nodeId: string, port: string, x: number, y: number) {
    state.connectionState = {
        isConnecting: true,
        sourceNodeId: nodeId,
        sourcePort: port,
        startX: x,
        startY: y,
        endX: x,
        endY: y
    };
}

export function updateConnectionPreview(x: number, y: number) {
    if (state.connectionState.isConnecting) {
        state.connectionState.endX = x;
        state.connectionState.endY = y;
    }
}

export function endConnection() {
    state.connectionState.isConnecting = false;
}

export function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// --- Node Registry ---

export const NODE_TYPES: Record<string, any> = {};

export function registerNodeType(type: string, component: any) {
    NODE_TYPES[type] = component;
}

// --- Socket Position Registry ---

const socketPositions = reactive<Record<string, { x: number; y: number }>>({});

export function registerSocketPosition(nodeId: string, port: string, type: 'input' | 'output', x: number, y: number) {
    const key = `${nodeId}-${type}-${port}`;
    socketPositions[key] = { x, y };
}

export function getSocketPosition(nodeId: string, port: string, type: 'input' | 'output'): { x: number; y: number } | null {
    const key = `${nodeId}-${type}-${port}`;
    return socketPositions[key] || null;
}

// --- Graph Evaluation ---

const nodeValues = reactive<Record<string, Record<string, any>>>({});

export const getNodeValues = computed(() => nodeValues);

export function getConnectionValue(connectionId: string) {
    // For UI feedback, we can look at state.connections, but for values we look at nodeValues
    const conn = state.connections.find(c => c.id === connectionId);
    if (!conn) return null;
    const values = nodeValues[conn.sourceNodeId];
    return values ? values[conn.sourcePort] : null;
}

// --- Execution State (Snapshot) ---
let executionNodes: NodeDefinition[] = [];
let executionConnections: Connection[] = []; // renamed to avoid conflict with imported interface if any, but local var is fine

function syncExecutionState() {
    executionNodes = [...state.nodes];
    executionConnections = [...state.connections];
}

const graphVersion = ref(0);
export const layoutVersion = ref(0);

let updateFrameId: number | null = null;
let pendingEvaluate = false;

export function triggerGraphUpdate(forceEvaluate: boolean = false) {
    if (forceEvaluate) pendingEvaluate = true;

    if (updateFrameId !== null) return;
    updateFrameId = requestAnimationFrame(() => {
        graphVersion.value++;

        // If Live, we always sync structure before eval
        if (state.isLive) {
            syncExecutionState();
        }

        if (state.isLive || pendingEvaluate) {
            evaluateGraph();
        }
        pendingEvaluate = false;
        updateFrameId = null;
    });
}

export function forceEvaluation() {
    syncExecutionState();
    evaluateGraph();
    graphVersion.value++; // Ensure UI updates
}

export function setIsLive(live: boolean) {
    state.isLive = live;
    if (live) {
        syncExecutionState();
        triggerGraphUpdate();
    }
}

export function triggerLayoutUpdate() {
    layoutVersion.value++;
}

function getInputValue(nodeId: string, inputName: string): any {
    // Use executionConnections for consistency during evaluation
    const conn = executionConnections.find(c => c.targetNodeId === nodeId && c.targetPort === inputName);
    if (!conn) return null;

    const sourceValues = nodeValues[conn.sourceNodeId];
    if (sourceValues && sourceValues[conn.sourcePort] !== undefined) {
        return sourceValues[conn.sourcePort];
    }
    return null;
}

function evaluateNode(node: NodeDefinition) {
    if (node.type === 'number') {
        const val = node.data.value ?? 0;
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];
        if (values) values['output'] = val;
    }
    else if (node.type === 'math') {
        const a = getInputValue(node.id, 'a') ?? 0;
        const b = getInputValue(node.id, 'b') ?? 0;
        let result: any = 0;

        const op = node.data.operation;

        const calculateOp = (valA: number, valB: number, operation: string) => {
            switch (operation) {
                case 'add': return valA + valB;
                case 'sub': return valA - valB;
                case 'mul': return valA * valB;
                case 'div': return valB !== 0 ? valA / valB : 0;
                case 'pow': return Math.pow(valA, valB);
                case 'mod': return valA % valB;
                case 'min': return Math.min(valA, valB);
                case 'max': return Math.max(valA, valB);
                case 'abs': return Math.abs(valA);
                case 'sign': return Math.sign(valA);
                case 'ceil': return Math.ceil(valA);
                case 'floor': return Math.floor(valA);
                case 'round': return Math.round(valA);
                case 'trunc': return Math.trunc(valA);
                case 'sqrt': return Math.sqrt(valA);
                case 'cbrt': return Math.cbrt(valA);
                case 'exp': return Math.exp(valA);
                case 'expm1': return Math.expm1(valA);
                case 'log': return (valB === 0) ? Math.log(valA) : Math.log(valA) / Math.log(valB);
                case 'log10': return Math.log10(valA);
                case 'log2': return Math.log2(valA);
                case 'log1p': return Math.log1p(valA);
                case 'sin': return Math.sin(valA);
                case 'cos': return Math.cos(valA);
                case 'tan': return Math.tan(valA);
                case 'asin': return Math.asin(valA);
                case 'acos': return Math.acos(valA);
                case 'atan': return Math.atan(valA);
                case 'atan2': return Math.atan2(valA, valB);
                case 'sinh': return Math.sinh(valA);
                case 'cosh': return Math.cosh(valA);
                case 'tanh': return Math.tanh(valA);
                case 'asinh': return Math.asinh(valA);
                case 'acosh': return Math.acosh(valA);
                case 'atanh': return Math.atanh(valA);
                case 'hypot': return Math.hypot(valA, valB);
                case 'random': return Math.random(); // ignores inputs
                case 'imul': return Math.imul(valA, valB);
                case 'fround': return Math.fround(valA);
                case 'clz32': return Math.clz32(valA);
                default: return 0;
            }
        };

        const isArrayA = Array.isArray(a);
        const isArrayB = Array.isArray(b);

        if (isArrayA && isArrayB) {
            // Element-wise if same length, otherwise broadcasting rules could be complex. 
            // Stick to min length or error? Let's use min length for safety.
            const len = Math.min(a.length, b.length);
            result = [];
            for (let i = 0; i < len; i++) {
                result.push(calculateOp(a[i], b[i], op));
            }
        } else if (isArrayA) {
            // Broadcast B to A
            result = a.map((val: number) => calculateOp(val, b, op));
        } else if (isArrayB) {
            // Broadcast A to B
            result = b.map((val: number) => calculateOp(a, val, op));
        } else {
            // Scalar
            result = calculateOp(a, b, op);
        }

        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];
        if (values) values['result'] = result;
    }
    else if (node.type === 'range') {
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];

        const a = getInputValue(node.id, 'size') ?? node.data.a ?? 10;
        const b = getInputValue(node.id, 'step') ?? node.data.b ?? 1;
        const c = getInputValue(node.id, 'start') ?? node.data.c ?? 0;

        const size = Math.max(0, Math.floor(Number(a)));
        const step = Number(b);
        const start = Number(c);

        const result = Array.from({ length: size }, (_, i) => start + i * step);

        if (values) {
            values['output'] = result;
        }
    }
    else if (node.type === 'link') {
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];
        if (values) {
            // Output the raw or parsed content fetched by the component
            values['output'] = node.data.fetchedContent ?? null;
            // Also expose the status and URL for debugging
            values['status'] = node.data.status || 'idle';
            values['url'] = getInputValue(node.id, 'url') ?? node.data.manualUrl;
        }
    }
    else if (node.type === 'display') {
        const val = getInputValue(node.id, 'value');
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];
        if (values) values['value'] = val;
    }
    else if (node.type === 'input') {
        // Input node creates its own value based on configuration
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];
        if (values) {
            // Use currentValue if set, otherwise defaultValue
            values['value'] = node.data.currentValue ?? node.data.defaultValue ?? null;
        }
    }
    else if (node.type === 'chartEvent') {
        // Chart event outputs are managed by the component via provide/inject
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];
        if (values) {
            values['x'] = node.data.x ?? null;
            values['y'] = node.data.y ?? null;
            values['pointIndex'] = node.data.pointIndex ?? null;
            values['curveNumber'] = node.data.curveNumber ?? null;
        }
    }
    else if (node.type === 'constant') {
        // Constant node parses value based on data type
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];
        if (values) {
            const rawValue = node.data.value || '';
            let parsedValue: any = rawValue;

            if (node.data.dataType === 'integer') {
                parsedValue = parseInt(rawValue, 10);
                if (isNaN(parsedValue)) parsedValue = 0;
            } else if (node.data.dataType === 'json') {
                try {
                    parsedValue = JSON.parse(rawValue);
                } catch {
                    parsedValue = null;
                }
            }
            // else string - keep as is

            values['output'] = parsedValue;
        }
    }
    else if (node.type === 'color') {
        // Color node outputs color in various formats
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];

        if (values) {
            // Get input format to determine what kind of input to expect
            const inputFormat = node.data.inputFormat || 'rgb';
            const outputFormat = node.data.outputFormat || 'rgb';

            // Check for single input (for formats like hex or rgb string)
            const singleInput = getInputValue(node.id, 'input');

            let r = node.data.r ?? 255;
            let g = node.data.g ?? 0;
            let b = node.data.b ?? 0;
            let alpha = node.data.alpha ?? 1;

            // If there's a single input, parse it based on input format
            if (singleInput !== null) {
                if (inputFormat === 'hex' && typeof singleInput === 'string') {
                    // Parse hex string
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(singleInput);
                    if (result && result[1] && result[2] && result[3]) {
                        r = parseInt(result[1], 16);
                        g = parseInt(result[2], 16);
                        b = parseInt(result[3], 16);
                    }
                } else if ((inputFormat === 'rgb' || inputFormat === 'rgba') && typeof singleInput === 'string') {
                    // Parse rgb(r, g, b) or rgba(r, g, b, a) string
                    const match = singleInput.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
                    if (match && match[1] && match[2] && match[3]) {
                        r = parseInt(match[1], 10);
                        g = parseInt(match[2], 10);
                        b = parseInt(match[3], 10);
                        if (match[4]) alpha = parseFloat(match[4]);
                    }
                }
                node.data.inputValue = singleInput;
            } else {
                // Check for component inputs (r, g, b, alpha)
                const inputR = getInputValue(node.id, 'r');
                const inputG = getInputValue(node.id, 'g');
                const inputB = getInputValue(node.id, 'b');
                const inputAlpha = getInputValue(node.id, 'alpha');

                if (inputR !== null || inputG !== null || inputB !== null) {
                    r = inputR !== null ? inputR : r;
                    g = inputG !== null ? inputG : g;
                    b = inputB !== null ? inputB : b;
                    alpha = inputAlpha !== null ? inputAlpha : alpha;

                    // Store for UI sync
                    if (inputR !== null) node.data.inputR = inputR;
                    if (inputG !== null) node.data.inputG = inputG;
                    if (inputB !== null) node.data.inputB = inputB;
                    if (inputAlpha !== null) node.data.inputAlpha = inputAlpha;
                }
            }

            // Helper functions
            const rgbToHex = (r: number, g: number, b: number) => {
                const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
                return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
            };

            const rgbToHsv = (r: number, g: number, b: number) => {
                r /= 255; g /= 255; b /= 255;
                const max = Math.max(r, g, b), min = Math.min(r, g, b);
                const diff = max - min;
                let h = 0;
                const s = max === 0 ? 0 : (diff / max) * 100;
                const v = max * 100;
                if (diff !== 0) {
                    if (max === r) h = ((g - b) / diff + (g < b ? 6 : 0)) * 60;
                    else if (max === g) h = ((b - r) / diff + 2) * 60;
                    else h = ((r - g) / diff + 4) * 60;
                }
                return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
            };

            // Output all formats
            values['rgb'] = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
            values['rgba'] = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
            values['hex'] = rgbToHex(r, g, b);
            values['r'] = Math.round(r);
            values['g'] = Math.round(g);
            values['b'] = Math.round(b);
            values['alpha'] = alpha;

            const hsv = rgbToHsv(r, g, b);
            values['h'] = hsv.h;
            values['s'] = hsv.s;
            values['v'] = hsv.v;
            values['hsv'] = `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;

            // Set main output based on output format
            if (outputFormat === 'hex') {
                values['output'] = values['hex'];
            } else if (outputFormat === 'rgba') {
                values['output'] = values['rgba'];
            } else if (outputFormat === 'hsv') {
                values['output'] = values['hsv'];
            } else {
                values['output'] = values['rgb'];
            }
        }
    }
    else if (node.type === 'csvInput') {
        // CSV input node outputs data and dimensions
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];
        if (values) {
            values['data'] = node.data.csvData ?? null;
            values['width'] = node.data.width ?? 0;
            values['height'] = node.data.height ?? 0;
            values['fileName'] = node.data.fileName ?? '';
        }
    }
    else if (node.type === 'isolateColumn') {
        // Isolate column node extracts a specific column from CSV data
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];

        // Get the CSV data input
        const csvData = getInputValue(node.id, 'csvData');
        const columnIndex = node.data.columnIndex ?? 0;

        if (values) {
            if (csvData && Array.isArray(csvData) && csvData.length > 0) {
                // Extract column name from first row
                const columnName = csvData[0] && csvData[0][columnIndex] !== undefined
                    ? csvData[0][columnIndex]
                    : '';

                // Extract data values from all rows except the first
                const columnData: any[] = [];
                for (let i = 1; i < csvData.length; i++) {
                    if (csvData[i] && csvData[i][columnIndex] !== undefined) {
                        columnData.push(csvData[i][columnIndex]);
                    }
                }

                values['name'] = columnName;
                values['data'] = columnData;
            } else {
                values['name'] = null;
                values['data'] = null;
            }
        }
    }
    else if (node.type === 'switch') {
        // Switch node selects input based on index
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];

        const indexInput = getInputValue(node.id, 'index');
        let index = parseInt(indexInput, 10);

        if (isNaN(index) || index < 0) {
            index = 0; // Default to 0 if invalid
        }

        const inputKey = `input${index}`;
        const val = getInputValue(node.id, inputKey);

        if (values) {
            values['output'] = val;
            // Also store active index for UI feedback if needed
            node.data.activeIndex = index;
        }
    }
    else if (node.type === 'config') {
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];

        const config: any = {};

        // Helper to set nested property
        const setNested = (obj: any, path: string, value: any) => {
            const keys = path.split('.');
            let current = obj;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i]!;
                if (!current[key]) current[key] = {};
                current = current[key];
            }
            const lastKey = keys[keys.length - 1]!;
            current[lastKey] = value;
        };

        if (node.data.isManual) {
            // Manual Mode: use manualConfig
            const manual = node.data.manualConfig || {};
            // Map flat manual keys to nested config structure
            if (manual.line_color) setNested(config, 'line.color', manual.line_color);
            if (manual.line_width) setNested(config, 'line.width', manual.line_width);
            if (manual.line_dash) setNested(config, 'line.dash', manual.line_dash);
            if (manual.line_shape) setNested(config, 'line.shape', manual.line_shape);

            if (manual.marker_color) setNested(config, 'marker.color', manual.marker_color);
            if (manual.marker_size) setNested(config, 'marker.size', manual.marker_size);
            if (manual.marker_symbol) setNested(config, 'marker.symbol', manual.marker_symbol);
            if (manual.marker_opacity) setNested(config, 'marker.opacity', manual.marker_opacity);

            if (manual.fill && manual.fill !== 'none') config.fill = manual.fill;
            if (manual.fillcolor) config.fillcolor = manual.fillcolor;

            if (manual.mode) config.mode = manual.mode;
            if (manual.name) config.name = manual.name;
            if (manual.visible !== undefined) config.visible = manual.visible;
            if (manual.showlegend !== undefined) config.showlegend = manual.showlegend;
            if (manual.opacity !== undefined) config.opacity = manual.opacity;

            if (manual.textposition) config.textposition = manual.textposition;
            if (manual.textfont_size) setNested(config, 'textfont.size', manual.textfont_size);
            if (manual.textfont_color) setNested(config, 'textfont.color', manual.textfont_color);

            // Error bars
            if (manual.error_x_value) setNested(config, 'error_x.value', manual.error_x_value);
            if (manual.error_x_color) setNested(config, 'error_x.color', manual.error_x_color);
            if (manual.error_y_value) setNested(config, 'error_y.value', manual.error_y_value);
            if (manual.error_y_color) setNested(config, 'error_y.color', manual.error_y_color);

            // Hover and legend
            if (manual.hovertemplate) config.hovertemplate = manual.hovertemplate;
            if (manual.hoverinfo) config.hoverinfo = manual.hoverinfo;
            if (manual.legendgroup) config.legendgroup = manual.legendgroup;

            // Axes
            if (manual.xaxis) config.xaxis = manual.xaxis;
            if (manual.yaxis) config.yaxis = manual.yaxis;

        } else {
            // Ports Mode: read inputs
            const ports = [
                'line.color', 'line.width', 'line.dash', 'line.shape',
                'marker.color', 'marker.size', 'marker.symbol', 'marker.opacity',
                'fill', 'fillcolor',
                'mode', 'name', 'visible', 'opacity', 'showlegend',
                'textposition', 'textfont.size', 'textfont.color',
                'error_x.value', 'error_x.color', 'error_y.value', 'error_y.color',
                'hovertemplate', 'hoverinfo', 'legendgroup',
                'xaxis', 'yaxis'
            ];

            for (const port of ports) {
                const val = getInputValue(node.id, port);
                if (val !== null && val !== undefined) {
                    setNested(config, port, val);
                }
            }
        }

        if (values) {
            values['config'] = config;
        }
    }
    else if (node.type === 'trace') {
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];

        const type = node.data.type || 'scatter';

        // Base trace from inputs
        const trace: any = {
            type: type,
            mode: node.data.mode || 'lines+markers',
            name: node.data.name || undefined,
        };

        // Merge Config Input
        const configInput = getInputValue(node.id, 'config');
        if (configInput) {
            // naive deep merge or just assign? Plotly handles extra keys fine usually.
            // But we need to be careful not to overwrite data arrays if config has them (unlikely from ConfigNode)
            // Let's do a shallow merge of top level keys, and maybe one level deep for marker/line?
            // Actually, Lodash merge would be best but we might not have it.
            // Let's implement a simple deep merge or just copy properties.
            const mergeFn = (target: any, source: any) => {
                for (const key in source) {
                    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
                        mergeFn(target[key], source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            };
            mergeFn(trace, configInput);
        }

        // Dynamic Input Handling
        if (type === 'pie') {
            const labels = getInputValue(node.id, 'labels');
            const vals = getInputValue(node.id, 'values');
            const text = getInputValue(node.id, 'text');
            const markerColors = getInputValue(node.id, 'marker.colors');

            if (labels) trace.labels = labels;
            if (vals) trace.values = vals;
            if (text) trace.text = text;
            if (markerColors) {
                if (!trace.marker) trace.marker = {};
                trace.marker.colors = markerColors;
            }
            delete trace.mode;
        } else if (type === 'heatmap') {
            const z = getInputValue(node.id, 'z');
            const x = getInputValue(node.id, 'x');
            const y = getInputValue(node.id, 'y');
            const text = getInputValue(node.id, 'text');

            if (z) trace.z = z;
            if (x) trace.x = x;
            if (y) trace.y = y;
            if (text) trace.text = text;
            delete trace.mode;
        } else if (type === 'surface') {
            const x = getInputValue(node.id, 'x');
            const y = getInputValue(node.id, 'y');
            const z = getInputValue(node.id, 'z');
            const surfacecolor = getInputValue(node.id, 'surfacecolor');

            if (x) trace.x = x;
            if (y) trace.y = y;
            if (z) trace.z = z;
            if (surfacecolor) trace.surfacecolor = surfacecolor;
            delete trace.mode;
        } else if (type === 'mesh3d') {
            const x = getInputValue(node.id, 'x');
            const y = getInputValue(node.id, 'y');
            const z = getInputValue(node.id, 'z');
            const i = getInputValue(node.id, 'i');
            const j = getInputValue(node.id, 'j');
            const k = getInputValue(node.id, 'k');
            const intensity = getInputValue(node.id, 'intensity');
            const text = getInputValue(node.id, 'text');
            const facecolor = getInputValue(node.id, 'facecolor');

            if (x) trace.x = x;
            if (y) trace.y = y;
            if (z) trace.z = z;
            if (i) trace.i = i;
            if (j) trace.j = j;
            if (k) trace.k = k;
            if (intensity) trace.intensity = intensity;
            if (text) trace.text = text;
            if (facecolor) trace.facecolor = facecolor;
            delete trace.mode;
        } else if (type === 'scattergeo') {
            const lon = getInputValue(node.id, 'lon');
            const lat = getInputValue(node.id, 'lat');
            const locations = getInputValue(node.id, 'locations');
            const text = getInputValue(node.id, 'text');
            const markerColor = getInputValue(node.id, 'marker.color');
            const markerSize = getInputValue(node.id, 'marker.size');

            if (lon) trace.lon = lon;
            if (lat) trace.lat = lat;
            if (locations) trace.locations = locations;
            if (text) trace.text = text;

            if (markerColor || markerSize) {
                if (!trace.marker) trace.marker = {};
                if (markerColor) trace.marker.color = markerColor;
                if (markerSize) trace.marker.size = markerSize;
            }
            // mode is relevant for scattergeo (lines/markers) so we don't necessarily delete it,
            // but the default 'lines+markers' is usually fine.
            // If the user wants to change it, they can use the UI mode selector or config.
        } else if (type === 'choropleth') {
            const locations = getInputValue(node.id, 'locations');
            const z = getInputValue(node.id, 'z');
            const text = getInputValue(node.id, 'text');

            if (locations) trace.locations = locations;
            if (z) trace.z = z;
            if (text) trace.text = text;
            delete trace.mode;
        } else if (type === 'scattermapbox') {
            const lon = getInputValue(node.id, 'lon');
            const lat = getInputValue(node.id, 'lat');
            const text = getInputValue(node.id, 'text');
            const markerColor = getInputValue(node.id, 'marker.color');
            const markerSize = getInputValue(node.id, 'marker.size');

            if (lon) trace.lon = lon;
            if (lat) trace.lat = lat;
            if (text) trace.text = text;

            if (markerColor || markerSize) {
                if (!trace.marker) trace.marker = {};
                if (markerColor) trace.marker.color = markerColor;
                if (markerSize) trace.marker.size = markerSize;
            }
            // scattermapbox also uses mode
        } else if (type === 'densitymapbox') {
            const lon = getInputValue(node.id, 'lon');
            const lat = getInputValue(node.id, 'lat');
            const z = getInputValue(node.id, 'z');
            const radius = getInputValue(node.id, 'radius');

            if (lon) trace.lon = lon;
            if (lat) trace.lat = lat;
            if (z) trace.z = z;
            if (radius) trace.radius = radius;
            delete trace.mode;
        } else if (type === 'strip') {
            const x = getInputValue(node.id, 'x');
            const y = getInputValue(node.id, 'y');
            const text = getInputValue(node.id, 'text');
            const jitter = getInputValue(node.id, 'jitter');

            if (x) trace.x = x;
            if (y) trace.y = y;
            if (text) trace.text = text;
            if (jitter) trace.jitter = jitter;

            // Strip plot is officially 'box' with boxpoints='all', jitter, and pointpos=0 in some contexts, 
            // OR it can be a scatter with mode='markers' and jitter?
            // Plotly interprets 'box' with boxpoints='all' and jitter as a strip plot.
            // But let's check if Plotly has a dedicated 'strip' type? 
            // Actually, Plotly.js usually does strip plots via Box traces with particular settings
            // OR Scatter traces with jitter (which scatter doesn't natively support easy jitter without manual calc).
            // The standard way is type: 'box', boxpoints: 'all', jitter: 0.3, pointpos: 0.

            // However, the user asked for "strip plot". 
            // If we use type='box', we need to override the type in the trace object IF the user selected 'strip'.
            trace.type = 'box';
            trace.boxpoints = 'all';
            trace.jitter = jitter ?? 0.3;
            trace.pointpos = 0;
            // distinct from regular box plot
            trace.fillcolor = 'rgba(255,255,255,0)';
            trace.line = { color: 'rgba(255,255,255,0)' }; // Hide the box itself

            // Wait, if we hide the box, we just get points. 
            // If the user requested 'strip', they probably want just the points resembling a strip plot.

        } else if (type === 'violin') {
            const x = getInputValue(node.id, 'x');
            const y = getInputValue(node.id, 'y');
            const text = getInputValue(node.id, 'text');
            const side = getInputValue(node.id, 'side');
            const box = getInputValue(node.id, 'box');
            const meanline = getInputValue(node.id, 'meanline');
            const markerColor = getInputValue(node.id, 'marker.color');

            if (x) trace.x = x;
            if (y) trace.y = y;
            if (text) trace.text = text;
            if (markerColor) {
                if (!trace.marker) trace.marker = {};
                trace.marker.color = markerColor;
            }

            if (side) trace.side = side;
            if (box) trace.box = { visible: !!box };
            if (meanline) trace.meanline = { visible: !!meanline };

            // Violin usually doesn't need mode
            delete trace.mode;

        } else if (type === 'sunburst') {
            const labels = getInputValue(node.id, 'labels');
            const parents = getInputValue(node.id, 'parents');
            const values = getInputValue(node.id, 'values');
            const text = getInputValue(node.id, 'text');
            const markerColors = getInputValue(node.id, 'marker.colors');

            if (labels) trace.labels = labels;
            if (parents) trace.parents = parents;
            if (values) trace.values = values;
            if (text) trace.text = text;

            if (markerColors) {
                if (!trace.marker) trace.marker = {};
                trace.marker.colors = markerColors;
            }
            delete trace.mode;

        } else {
            // Standard X/Y (scatter, bar, box, histogram)
            const x = getInputValue(node.id, 'x');
            const y = getInputValue(node.id, 'y');
            const text = getInputValue(node.id, 'text');

            if (x) trace.x = x;
            if (y) trace.y = y;
            if (text) trace.text = text;

            // Marker inputs
            const markerColor = getInputValue(node.id, 'marker.color');
            const markerSize = getInputValue(node.id, 'marker.size');

            if (markerColor || markerSize) {
                if (!trace.marker) trace.marker = {};
                if (markerColor) trace.marker.color = markerColor;
                if (markerSize) trace.marker.size = markerSize;
            }

            if (type === 'bar') {
                const base = getInputValue(node.id, 'base');
                if (base) trace.base = base;
            }

            if (type === 'scatter3d') {
                const z = getInputValue(node.id, 'z');
                if (z) trace.z = z;
            }
        }


        // Apply config override LAST to ensure it takes precedence
        if (node.data.config) {
            try {
                const config = JSON.parse(node.data.config);
                Object.assign(trace, config);
            } catch (e) {
                console.warn('Invalid JSON config in TraceNode', e);
            }
        }

        if (values) {
            values['trace'] = trace;
        }
    }
    else if (node.type === 'joiner') {
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];

        const inputs = [];
        // Iterate over all connected inputs
        // We can just iterate over the keys of inputs
        const inputKeys = Object.keys(node.inputs).filter(k => k.startsWith('input'));

        // Sort keys to maintain order
        inputKeys.sort((a, b) => {
            const numA = parseInt(a.replace('input', ''));
            const numB = parseInt(b.replace('input', ''));
            return numA - numB;
        });

        for (const key of inputKeys) {
            const val = getInputValue(node.id, key);
            if (val) {
                inputs.push(val);
            }
        }

        if (values) {
            values['list'] = inputs.flat(); // Flatten in case inputs are arrays themselves
        }
    }
    else if (node.type === 'plotly') {
        // Plotly node is mostly a consumer, but it produces events
        // Events are handled by the component updating node.data, 
        // which then triggers update.
        // But we should expose those events in nodeValues for downstream nodes

        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];

        if (values) {
            // Read from node.data which is updated by the component
            values['selectedPoint'] = node.data.selectedPoint ?? null;
            values['hoverPoint'] = node.data.hoverPoint ?? null;

            // Pass through inputs for debugging or chaining? 
            // Maybe not necessary, but good to have data available
            values['data'] = getInputValue(node.id, 'data');

            try {
                const layoutInput = getInputValue(node.id, 'layout');
                if (layoutInput) {
                    values['layout'] = typeof layoutInput === 'string' ? JSON.parse(layoutInput) : layoutInput;
                } else {
                    values['layout'] = null;
                }
            } catch {
                values['layout'] = null;
            }
        }
    }
    else if (node.type === 'compare') {
        const a = getInputValue(node.id, 'a');
        const b = getInputValue(node.id, 'b');
        const op = node.data.operation || '>';
        let result: any = false;

        const compareOp = (valA: any, valB: any, operation: string) => {
            // Basic type coercion for comparison might be needed if strings vs numbers
            // But let's assume JS loose typing or strict? JS loose is usually what users expect in low-code (e.g. "5" == 5)
            switch (operation) {
                case '>': return valA > valB;
                case '<': return valA < valB;
                case '>=': return valA >= valB;
                case '<=': return valA <= valB;
                case '==': return valA == valB;
                case '!=': return valA != valB;
                default: return false;
            }
        };

        const isArrayA = Array.isArray(a);
        const isArrayB = Array.isArray(b);

        if (isArrayA && isArrayB) {
            const len = Math.min(a.length, b.length);
            result = [];
            for (let i = 0; i < len; i++) {
                result.push(compareOp(a[i], b[i], op) ? 1 : 0); // Return 1/0 for readiness with math/logic
            }
        } else if (isArrayA) {
            result = a.map((val: any) => compareOp(val, b, op) ? 1 : 0);
        } else if (isArrayB) {
            result = b.map((val: any) => compareOp(a, val, op) ? 1 : 0);
        } else {
            result = compareOp(a, b, op) ? 1 : 0;
        }

        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];
        if (values) values['result'] = result;
    }
    else if (node.type === 'logic') {
        const op = node.data.operation || 'AND';
        let result: any = false;

        const logicOp = (valA: any, valB: any, operation: string) => {
            const boolA = !!valA;
            const boolB = !!valB;
            switch (operation) {
                case 'AND': return boolA && boolB;
                case 'OR': return boolA || boolB;
                case 'XOR': return boolA !== boolB;
                case 'NOT': return !boolA; // For NOT, we only use 'a' (or 'input')
                default: return false;
            }
        };

        let a: any, b: any;
        if (op === 'NOT') {
            a = getInputValue(node.id, 'input') ?? getInputValue(node.id, 'a');
            // b is unused
        } else {
            a = getInputValue(node.id, 'a');
            b = getInputValue(node.id, 'b');
        }

        const isArrayA = Array.isArray(a);
        const isArrayB = Array.isArray(b);

        if (op === 'NOT') {
            if (isArrayA) {
                result = a.map((val: any) => logicOp(val, null, op) ? 1 : 0);
            } else {
                result = logicOp(a, null, op) ? 1 : 0;
            }
        } else {
            // Binary ops
            if (isArrayA && isArrayB) {
                const len = Math.min(a.length, b.length);
                result = [];
                for (let i = 0; i < len; i++) {
                    result.push(logicOp(a[i], b[i], op) ? 1 : 0);
                }
            } else if (isArrayA) {
                result = a.map((val: any) => logicOp(val, b, op) ? 1 : 0);
            } else if (isArrayB) {
                result = b.map((val: any) => logicOp(a, val, op) ? 1 : 0);
            } else {
                result = logicOp(a, b, op) ? 1 : 0;
            }
        }

        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];
        if (values) values['result'] = result;
    }
    else if (node.type === 'if') {
        const condition = getInputValue(node.id, 'condition');
        const trueValue = getInputValue(node.id, 'trueValue');
        const falseValue = getInputValue(node.id, 'falseValue');

        // Simple switch logic
        const isTrue = !!condition;

        // Update node data for UI reflection
        node.data.lastCondition = isTrue;

        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];
        if (values) {
            values['output'] = isTrue ? trueValue : falseValue;
        }
    }
    else if (node.type === 'filter') {
        const data = getInputValue(node.id, 'data');
        const mask = getInputValue(node.id, 'mask');
        let filtered: any = null;

        if (Array.isArray(data) && Array.isArray(mask)) {
            // Filter data where mask[i] is truthy
            filtered = [];
            const len = Math.min(data.length, mask.length);
            for (let i = 0; i < len; i++) {
                if (mask[i]) {
                    filtered.push(data[i]);
                }
            }
        } else {
            // If not arrays, return null or pass through?
            // If data is array and mask is scalar true? 
            if (Array.isArray(data) && mask) {
                // Pass all
                filtered = data;
            } else {
                filtered = null;
            }
        }

        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];
        if (values) {
            values['filtered'] = filtered;
        }
    }
    else if (node.type === 'subplot') {
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];

        const rows = node.data.rows || 1;
        const cols = node.data.cols || 1;
        const horizontalSpacing = node.data.horizontalSpacing ?? 0.1;
        const verticalSpacing = node.data.verticalSpacing ?? 0.1;
        const subplotTypes = node.data.subplotTypes || [];

        // Generate subplot layout configuration
        const layout: any = {
            grid: {
                rows: rows,
                columns: cols,
                pattern: 'independent',
                roworder: 'top to bottom'
            }
        };

        // Add spacing if specified
        if (horizontalSpacing > 0) {
            layout.grid.xgap = horizontalSpacing;
        }
        if (verticalSpacing > 0) {
            layout.grid.ygap = verticalSpacing;
        }

        // Configure individual subplot axes based on types
        // For XY plots, we need xaxis, xaxis2, etc. and yaxis, yaxis2, etc.
        // For 3D, we need scene, scene2, etc.
        // For polar, we need polar, polar2, etc.

        const total = rows * cols;
        for (let i = 0; i < total; i++) {
            const type = subplotTypes[i] || 'xy';
            const suffix = i === 0 ? '' : (i + 1).toString();

            if (type === 'xy') {
                // Standard XY subplot - axes are auto-created by Plotly with grid
                // We can add custom config here if needed
                layout[`xaxis${suffix}`] = { anchor: `y${suffix}` };
                layout[`yaxis${suffix}`] = { anchor: `x${suffix}` };
            } else if (type === 'scene') {
                // 3D subplot
                layout[`scene${suffix}`] = {
                    domain: {} // Plotly will auto-calculate with grid
                };
            } else if (type === 'polar') {
                // Polar subplot
                layout[`polar${suffix}`] = {
                    domain: {}
                };
            } else if (type === 'ternary') {
                // Ternary subplot
                layout[`ternary${suffix}`] = {
                    domain: {}
                };
            } else if (type === 'mapbox') {
                // Mapbox subplot
                layout[`mapbox${suffix}`] = {
                    domain: {}
                };
            } else if (type === 'geo') {
                // Geo subplot
                layout[`geo${suffix}`] = {
                    domain: {}
                };
            }
        }

        if (values) {
            values['layout'] = layout;
        }
    }
    else if (node.type === 'styling') {
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];

        const inputTrace = getInputValue(node.id, 'trace');
        // Store for UI inspection in StylingNode.vue
        if (values) values['_input_trace'] = inputTrace;

        if (!inputTrace) {
            if (values) values['trace'] = null;
            return;
        }

        const styling = node.data.styling || {};
        const selectedIndex = node.data.selectedTraceIndex ?? -1; // -1 means All

        const applyStyling = (trace: any) => {
            if (!trace || typeof trace !== 'object') return trace;
            const newTrace = JSON.parse(JSON.stringify(trace));

            // Helper to set nested property
            const setNested = (obj: any, path: string, value: any) => {
                const keys = path.split('.');
                let current = obj;
                for (let i = 0; i < keys.length - 1; i++) {
                    const key = keys[i]!;
                    if (!current[key]) current[key] = {};
                    current = current[key];
                }
                const lastKey = keys[keys.length - 1]!;
                current[lastKey] = value;
            };

            // Map flat styling keys to Plotly paths
            const mapping: Record<string, string> = {
                marker_color: 'marker.color',
                marker_size: 'marker.size',
                marker_symbol: 'marker.symbol',
                marker_opacity: 'marker.opacity',
                marker_line_color: 'marker.line.color',
                marker_line_width: 'marker.line.width',
                line_color: 'line.color',
                line_width: 'line.width',
                line_dash: 'line.dash',
                line_shape: 'line.shape',
                fill: 'fill',
                fillcolor: 'fillcolor',
                textposition: 'textposition',
                textfont_size: 'textfont.size',
                textfont_color: 'textfont.color',
                textfont_family: 'textfont.family',
                name: 'name',
                showlegend: 'showlegend',
                visible: 'visible',
                opacity: 'opacity',
                // New
                colorscale: 'colorscale',
                showscale: 'showscale',
                reversescale: 'reversescale',
                hole: 'hole'
            };

            for (const [key, path] of Object.entries(mapping)) {
                if (styling[key] !== undefined && styling[key] !== '' && styling[key] !== null) {
                    // For checkboxes or numbers, 0 is valid
                    setNested(newTrace, path, styling[key]);
                }
            }

            // Handle marker colors JSON array
            if (styling.marker_colors_json) {
                try {
                    const colors = JSON.parse(styling.marker_colors_json);
                    if (Array.isArray(colors)) {
                        setNested(newTrace, 'marker.colors', colors);
                    }
                } catch (e) {
                    // Ignore invalid JSON
                }
            }

            return newTrace;
        };

        let result: any;
        if (Array.isArray(inputTrace)) {
            if (selectedIndex >= 0 && selectedIndex < inputTrace.length) {
                // Style only specific trace, pass others as is
                result = inputTrace.map((t, idx) => idx === selectedIndex ? applyStyling(t) : t);
            } else {
                // Style all
                result = inputTrace.map(t => applyStyling(t));
            }
        } else {
            result = applyStyling(inputTrace);
        }

        if (values) {
            values['trace'] = result;
        }
    }
    else if (node.type === 'layoutNode') {
        if (!nodeValues[node.id]) nodeValues[node.id] = {};
        const values = nodeValues[node.id];

        const data = node.data.layoutConfig || {};
        const layout: any = {};

        // Helper to set nested property
        const setNested = (obj: any, path: string, value: any) => {
            if (value === undefined || value === null || value === '') return;
            const keys = path.split('.');
            let current = obj;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i]!;
                if (!current[key]) current[key] = {};
                current = current[key];
            }
            const lastKey = keys[keys.length - 1]!;
            current[lastKey] = value;
        };

        // Title
        if (data.title_text) {
            setNested(layout, 'title.text', data.title_text);
            setNested(layout, 'title.font.size', data.title_font_size);
            setNested(layout, 'title.font.color', data.title_font_color);
            setNested(layout, 'title.font.family', data.title_font_family);
            setNested(layout, 'title.x', data.title_x);
            setNested(layout, 'title.y', data.title_y);
        }

        // Global Font
        setNested(layout, 'font.family', data.font_family);
        setNested(layout, 'font.size', data.font_size);
        setNested(layout, 'font.color', data.font_color);

        // Background & Margin
        setNested(layout, 'paper_bgcolor', data.paper_bgcolor);
        setNested(layout, 'plot_bgcolor', data.plot_bgcolor);
        if (data.margin_t !== undefined) setNested(layout, 'margin.t', data.margin_t);
        if (data.margin_b !== undefined) setNested(layout, 'margin.b', data.margin_b);
        if (data.margin_l !== undefined) setNested(layout, 'margin.l', data.margin_l);
        if (data.margin_r !== undefined) setNested(layout, 'margin.r', data.margin_r);

        // Grid
        if (data.use_grid) {
            layout.grid = {
                rows: data.grid_rows || 1,
                columns: data.grid_cols || 1,
                pattern: data.grid_pattern || 'independent',
                roworder: data.grid_roworder || 'top to bottom'
            };
            if (data.grid_xgap) layout.grid.xgap = data.grid_xgap;
            if (data.grid_ygap) layout.grid.ygap = data.grid_ygap;
        }

        // Legend
        if (data.showlegend !== undefined) layout.showlegend = data.showlegend;
        setNested(layout, 'legend.orientation', data.legend_orientation);
        setNested(layout, 'legend.x', data.legend_x);
        setNested(layout, 'legend.y', data.legend_y);
        setNested(layout, 'legend.xanchor', data.legend_xanchor);
        setNested(layout, 'legend.yanchor', data.legend_yanchor);
        setNested(layout, 'legend.bgcolor', data.legend_bgcolor);
        setNested(layout, 'legend.bordercolor', data.legend_bordercolor);
        setNested(layout, 'legend.borderwidth', data.legend_borderwidth);

        // Axes (Multi-axis/Subplots support)
        // We'll look for axis config in data.axes which is an array
        if (data.axes && Array.isArray(data.axes)) {
            data.axes.forEach((axis: any) => {
                const prefix = axis.type === 'x' ? 'xaxis' : 'yaxis';
                const id = axis.id || ''; // empty string for xaxis, '2' for xaxis2
                const key = `${prefix}${id}`;

                const axisConfig: any = {};
                if (axis.title) axisConfig.title = { text: axis.title };
                if (axis.range_min !== undefined && axis.range_max !== undefined) {
                    axisConfig.range = [axis.range_min, axis.range_max];
                    axisConfig.autorange = false;
                } else {
                    axisConfig.autorange = true;
                }

                if (axis.showgrid !== undefined) axisConfig.showgrid = axis.showgrid;
                if (axis.gridcolor) axisConfig.gridcolor = axis.gridcolor;
                if (axis.zeroline !== undefined) axisConfig.zeroline = axis.zeroline;
                if (axis.type_mode) axisConfig.type = axis.type_mode;

                if (axis.overlaying) axisConfig.overlaying = axis.overlaying;
                if (axis.side) axisConfig.side = axis.side;
                if (axis.anchor) axisConfig.anchor = axis.anchor;
                if (axis.position) axisConfig.position = axis.position;

                if (axis.domain_start !== undefined && axis.domain_end !== undefined) {
                    axisConfig.domain = [axis.domain_start, axis.domain_end];
                }

                layout[key] = axisConfig;
            });
        }

        // Subplot specific regions (scene, polar, etc.)
        if (data.subplots && Array.isArray(data.subplots)) {
            data.subplots.forEach((sub: any) => {
                const key = `${sub.type}${sub.id || ''}`;
                const config: any = {};
                if (sub.domain_start_x !== undefined && sub.domain_end_x !== undefined) {
                    config.domain = config.domain || {};
                    config.domain.x = [sub.domain_start_x, sub.domain_end_x];
                }
                if (sub.domain_start_y !== undefined && sub.domain_end_y !== undefined) {
                    config.domain = config.domain || {};
                    config.domain.y = [sub.domain_start_y, sub.domain_end_y];
                }
                layout[key] = config;
            });
        }

        // Merged Traces Support (automatic axis assignment if needed?)
        // The user said "takes in merged traces and outputs a layout".
        // We output both the layout and the modified traces.
        const inputTraces = getInputValue(node.id, 'traces');
        if (inputTraces && Array.isArray(inputTraces)) {
            const mappings = data.traceMappings || {};
            const modifiedTraces = inputTraces.map((trace: any, index: number) => {
                const newTrace = { ...trace };
                const mapping = mappings[index];
                if (mapping) {
                    if (mapping.xaxis) newTrace.xaxis = mapping.xaxis === 'x' ? 'x' : `x${mapping.xaxis}`;
                    if (mapping.yaxis) newTrace.yaxis = mapping.yaxis === 'y' ? 'y' : `y${mapping.yaxis}`;
                    if (mapping.scene) newTrace.scene = mapping.scene === 'scene' ? 'scene' : `scene${mapping.scene}`;
                    if (mapping.polar) newTrace.polar = mapping.polar === 'polar' ? 'polar' : `polar${mapping.polar}`;
                    if (mapping.mapbox) newTrace.mapbox = mapping.mapbox === 'mapbox' ? 'mapbox' : `mapbox${mapping.mapbox}`;
                    if (mapping.geo) newTrace.geo = mapping.geo === 'geo' ? 'geo' : `geo${mapping.geo}`;
                    if (mapping.ternary) newTrace.ternary = mapping.ternary === 'ternary' ? 'ternary' : `ternary${mapping.ternary}`;
                }
                return newTrace;
            });
            if (values) {
                values['traces'] = modifiedTraces;
            }
        }

        if (values) {
            values['layout'] = layout;
        }
    }
}

export function evaluateGraph() {
    const visited = new Set<string>();
    const processing = new Set<string>();

    function process(nodeId: string) {
        if (processing.has(nodeId)) return;
        if (visited.has(nodeId)) return;

        processing.add(nodeId);

        // Use executionConnections
        const inputConns = executionConnections.filter(c => c.targetNodeId === nodeId);
        for (const conn of inputConns) {
            process(conn.sourceNodeId);
        }

        // Use executionNodes to find the node definition
        const node = executionNodes.find(n => n.id === nodeId);
        if (node) {
            evaluateNode(node);
        }

        processing.delete(nodeId);
        visited.add(nodeId);
    }

    // Use executionNodes
    for (const node of executionNodes) {
        process(node.id);
    }
}

export function serializeGraph(includeData: boolean = true) {
    const data = {
        version: 1,
        nodes: state.nodes,
        connections: state.connections,
        zoom: state.zoom,
        pan: state.pan,
        controlLayout: state.controlLayout
    };

    if (!includeData) {
        // Clone nodes to avoid mutating state
        // @ts-ignore
        data.nodes = state.nodes.map(n => {
            const newNode = JSON.parse(JSON.stringify(n));
            if (newNode.type === 'csvInput') {
                newNode.data.csvData = null; // Clear bulky CSV data
                newNode.data.arrayData = null;
            }
            return newNode;
        });
    }

    return JSON.stringify(data, null, 2);
}

export function loadGraph(jsonState: string) {
    try {
        const data = JSON.parse(jsonState);

        // Basic validation
        if (!Array.isArray(data.nodes) || !Array.isArray(data.connections)) {
            console.error("Invalid graph data format");
            return;
        }

        clearGraph();

        // Restore state
        // We use JSON parse/stringify to break references to the input object
        state.nodes = JSON.parse(JSON.stringify(data.nodes));
        state.connections = JSON.parse(JSON.stringify(data.connections));

        if (data.zoom) state.zoom = data.zoom;
        if (data.pan) state.pan = data.pan;

        if (data.controlLayout) {
            state.controlLayout = JSON.parse(JSON.stringify(data.controlLayout));
        }

        // Trigger updates
        syncExecutionState(); // Ensure loaded graph is executable immediately
        triggerGraphUpdate();
        triggerLayoutUpdate();

    } catch (e) {
        console.error("Failed to load graph", e);
    }
}

export const nodeEditorState = state;


