# Data Visualizer - Interactive Plotly Tool

A powerful, real-time data visualization application built with Vue 3, featuring code-driven interactive controls, smooth animations, and a comprehensive Monaco-based code editor.

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [Interactive Controls](#interactive-controls)
- [Code Editor](#code-editor)
- [Performance & Optimization](#performance--optimization)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Features

### 🎯 Core Features
- **Real-time Code Execution**: Write JavaScript code and see results instantly
- **Interactive Controls**: Define sliders, color pickers, and other inputs directly in code
- **Smooth Animations**: 300ms linear interpolation for fluid chart transitions
- **CSV Support**: Upload, view, and edit CSV data in an integrated grid
- **Monaco Editor**: Full IntelliSense, autocomplete, and syntax highlighting
- **Resizable Panels**: Drag-to-resize split-pane layout
- **Live Edit Mode**: Auto-execute code on every change (throttled to 100ms)

### 📊 Visualization
- **Plotly.js Integration**: Full access to Plotly's extensive chart library
- **View Preservation**: Zoom and pan states are maintained during live updates
- **Efficient Rendering**: Uses `Plotly.react` for optimized chart updates

### 🎨 User Experience
- **Dark Theme**: Professional VS Code-inspired interface
- **Responsive Layout**: Three-panel design (Editor/Data/Controls | Chart | Docs)
- **Keyboard Shortcuts**: `Ctrl+Enter` to run code

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### First Steps

1. **Start the server**: Run `npm run dev`
2. **Open the app**: Navigate to `http://localhost:5173`
3. **Explore the default example**: The app loads with a sample CSV and visualization
4. **Switch tabs**: Use Code/Data/Controls tabs to navigate

### Basic Workflow

```javascript
// 1. Define interactive controls
input.add('multiplier', { type: 'slider', min: 0.1, max: 5, step: 0.1, default: 1 });
input.add('chartColor', { type: 'color', default: '#007acc' });

// 2. Access your data and inputs
const trace = {
  x: data.map(row => row.category),
  y: data.map(row => row.value * inputs.multiplier),
  type: 'bar',
  marker: { color: inputs.chartColor }
};

// 3. Return Plotly configuration
return {
  data: [trace],
  layout: {
    title: 'My Chart',
    xaxis: { title: 'X Axis' },
    yaxis: { title: 'Y Axis' }
  }
};
```

## Core Concepts

### Data Flow

```
CSV Upload/Default → Raw Data → Code Execution → Plotly Chart
                         ↑              ↑
                    input.add()    inputs object
```

1. **Data Loading**: CSV data is parsed into an array of objects
2. **Input Parsing**: `input.add()` calls are extracted from code
3. **Control Generation**: UI controls are rendered based on parsed inputs
4. **Code Execution**: User code runs with `data`, `inputs`, and `Plotly`
5. **Chart Rendering**: Results are passed to Plotly for visualization

### Available Variables

When writing visualization code, you have access to:

| Variable | Type | Description |
|----------|------|-------------|
| `data` | `Array<Object>` | Parsed CSV data as array of row objects |
| `inputs` | `Object` | Values from all defined controls |
| `input` | `Object` | Object with `add()` method for defining controls |
| `Plotly` | `Object` | Full Plotly.js library |

## Interactive Controls

### Defining Controls

Controls are defined using the `input.add()` method:

```javascript
input.add(name, config);
```

**Parameters:**
- `name` (string): Variable name to access the value via `inputs.name`
- `config` (object): Configuration object with type and parameters

### Control Types

#### Slider
```javascript
input.add('opacity', { 
  type: 'slider', 
  min: 0, 
  max: 1, 
  step: 0.1, 
  default: 0.8 
});
// Access: inputs.opacity
```

#### Number
```javascript
input.add('count', { 
  type: 'number', 
  default: 10 
});
// Access: inputs.count
```

#### Checkbox
```javascript
input.add('showGrid', { 
  type: 'checkbox', 
  default: true 
});
// Access: inputs.showGrid (boolean)
```

#### Text
```javascript
input.add('chartTitle', { 
  type: 'text', 
  default: 'My Chart' 
});
// Access: inputs.chartTitle
```

#### Color
```javascript
input.add('lineColor', { 
  type: 'color', 
  default: '#ff6b6b' 
});
// Access: inputs.lineColor (hex string)
```

#### XY Coordinate
```javascript
input.add('position', { 
  type: 'xy', 
  default: { x: 0, y: 0 } 
});
// Access: inputs.position.x, inputs.position.y
```

#### Button (Trigger)
```javascript
input.add('refreshTrigger', { 
  type: 'button', 
  default: 0 
});
// Access: inputs.refreshTrigger (increments on each click)
```

#### Dropdown (Select)
```javascript
input.add('chartType', { 
  type: 'dropdown', 
  options: ['bar', 'line', 'scatter', 'pie'],
  default: 'bar' 
});
// Access: inputs.chartType (selected value)
```

#### XY 2D (Draggable Pad)
```javascript
input.add('position2d', { 
  type: 'xy2d', 
  minX: 0,
  maxX: 100,
  minY: -50,
  maxY: 50,
  default: { x: 50, y: 0 } 
});
// Access: inputs.position2d.x, inputs.position2d.y
// Interactive pad with draggable handle
// Can also use min/max for same bounds on both axes
```

#### Knob (Rotary Dial)
```javascript
input.add('volume', { 
  type: 'knob', 
  min: 0,
  max: 100,
  step: 1,
  default: 50 
});
// Access: inputs.volume
// Drag vertically to adjust value
```

#### Check (Styled Checkbox)
```javascript
input.add('enableFeature', { 
  type: 'check', 
  default: false 
});
// Access: inputs.enableFeature (boolean)
// Visual alternative to standard checkbox
```

## Code Editor

### Features

- **Syntax Highlighting**: JavaScript with Monaco themes
- **IntelliSense**: Full autocomplete for:
  - Plotly API
  - `data` array structure (auto-detected from CSV)
  - `inputs` object (based on defined controls)
  - `input.add()` method with parameter hints
- **Error Detection**: Real-time syntax and type checking
- **Keyboard Shortcuts**:
  - `Ctrl+Enter`: Execute code
  - Standard Monaco shortcuts (multi-cursor, find/replace, etc.)

### Code Structure

Your code should:
1. Define controls at the top using `input.add()`
2. Process data and create traces
3. Return an object with `data` and `layout` properties

```javascript
// Define controls
input.add('...', { ... });

// Process data
const processedData = data.map(row => ({ ... }));

// Create traces
const trace1 = { ... };
const trace2 = { ... };

// Return Plotly config
return {
  data: [trace1, trace2],
  layout: { ... }
};
```

## Performance & Optimization

### Throttling & Debouncing

- **Code Execution**: Throttled to 100ms intervals during live editing
- **Type Generation**: Debounced by 500ms to reduce editor lag
- **Chart Updates**: Uses `Plotly.react` for efficient DOM updates

### Smooth Transitions

Enable the "Smooth" checkbox for interpolated animations:

```javascript
// Automatic when Smooth is enabled
layout.transition = {
  duration: 300,      // 300ms animation
  easing: 'linear'    // Linear interpolation
};
layout.uirevision = 'true';  // Preserve zoom/pan
```

### Best Practices

1. **Limit Data Size**: Large datasets (>10k rows) may cause lag
2. **Optimize Calculations**: Pre-process data outside of loops
3. **Use Throttling**: Keep "Live Edit" enabled for instant feedback
4. **Disable Smooth for Debug**: Turn off smooth mode when debugging

## Architecture

### Project Structure

```
src/
├── App.vue                 # Main application, layout, state management
├── components/
│   ├── CodeEditor.vue     # Monaco editor with autocomplete
│   ├── ChartPanel.vue     # Plotly chart renderer
│   ├── DataGrid.vue       # AG Grid CSV editor
│   └── DocPanel.vue       # Plotly documentation iframe
└── main.ts                # App entry point

public/
└── example.csv            # Default dataset
```

### Component Responsibilities

**App.vue**
- State management (data, inputs, chart config)
- Code parsing and execution
- Input control rendering
- Throttling and performance optimization

**CodeEditor.vue**
- Monaco editor initialization
- Type definition injection
- Autocomplete configuration
- Resize handling

**ChartPanel.vue**
- Plotly chart rendering
- Chart resize observation
- Efficient updates via `Plotly.react`

**DataGrid.vue**
- CSV data display and editing
- AG Grid integration

## API Reference

### `input.add(name, config)`

Define an interactive control.

**Parameters:**
- `name: string` - Variable name for accessing the value
- `config: InputConfig` - Configuration object

**InputConfig Interface:**
```typescript
interface InputConfig {
  type: 'slider' | 'number' | 'checkbox' | 'text' | 'color' | 'xy' | 'button' | 'dropdown' | 'xy2d' | 'knob' | 'check';
  min?: number;       // For slider/number/knob, or uniform bounds for xy2d
  max?: number;       // For slider/number/knob, or uniform bounds for xy2d
  minX?: number;      // For xy2d - X axis minimum
  maxX?: number;      // For xy2d - X axis maximum
  minY?: number;      // For xy2d - Y axis minimum
  maxY?: number;      // For xy2d - Y axis maximum
  step?: number;      // For slider/number/knob
  options?: string[]; // For dropdown
  default?: any;      // Default value (type-specific)
}
```

### Code Return Value

Your code must return an object with this structure:

```typescript
interface PlotlyConfig {
  data: Array<PlotlyTrace>;  // Array of Plotly trace objects
  layout?: PlotlyLayout;     // Optional layout configuration
}
```

## Examples

### Basic Bar Chart with Controls

```javascript
input.add('multiplier', { type: 'slider', min: 0.5, max: 2, step: 0.1, default: 1 });
input.add('barColor', { type: 'color', default: '#3498db' });

const trace = {
  x: data.map(row => row.category),
  y: data.map(row => row.value * inputs.multiplier),
  type: 'bar',
  marker: { color: inputs.barColor }
};

return {
  data: [trace],
  layout: {
    title: 'Sales by Category',
    xaxis: { title: 'Category' },
    yaxis: { title: 'Value' }
  }
};
```

### Multi-Trace Line Chart

```javascript
input.add('showActual', { type: 'checkbox', default: true });
input.add('showPredicted', { type: 'checkbox', default: true });
input.add('smoothing', { type: 'slider', min: 0, max: 1, step: 0.1, default: 0 });

const traces = [];

if (inputs.showActual) {
  traces.push({
    x: data.map(row => row.date),
    y: data.map(row => row.actual),
    name: 'Actual',
    type: 'scatter',
    mode: 'lines+markers'
  });
}

if (inputs.showPredicted) {
  traces.push({
    x: data.map(row => row.date),
    y: data.map(row => row.predicted),
    name: 'Predicted',
    type: 'scatter',
    mode: 'lines',
    line: { dash: 'dash' }
  });
}

return {
  data: traces,
  layout: {
    title: 'Time Series Analysis',
    xaxis: { title: 'Date' },
    yaxis: { title: 'Value' }
  }
};
```

### Scatter Plot with Dynamic Sizing

```javascript
input.add('sizeFactor', { type: 'slider', min: 1, max: 50, step: 1, default: 10 });
input.add('colorBy', { type: 'text', default: 'category' });

const trace = {
  x: data.map(row => row.x),
  y: data.map(row => row.y),
  text: data.map(row => row.label),
  mode: 'markers',
  type: 'scatter',
  marker: {
    size: data.map(row => row.size * inputs.sizeFactor),
    color: data.map(row => row[inputs.colorBy]),
    colorscale: 'Viridis',
    showscale: true
  }
};

return {
  data: [trace],
  layout: {
    title: 'Interactive Scatter Plot',
    hovermode: 'closest'
  }
};
```

## Troubleshooting

### Common Issues

**Chart not displaying**
- Check console for errors
- Ensure code returns `{ data, layout }` object
- Verify `data` variable has content
- Check that Plotly trace objects are valid

**Input controls not appearing**
- Verify `input.add()` syntax is correct
- Check Controls tab is selected
- Look for parsing errors in console
- Ensure quotes around names are consistent

**Code execution errors**
- Check for syntax errors in code editor
- Verify all referenced input names are defined
- Ensure data columns exist in your CSV
- Use `console.log()` for debugging

**Performance issues**
- Reduce data size or pre-filter
- Disable "Live Edit" during heavy computation
- Turn off "Smooth" for faster updates
- Check for infinite loops or heavy calculations

### Debug Mode

Enable debug logging:
```javascript
console.log('Data:', data);
console.log('Inputs:', inputs);
console.log('Data length:', data.length);
```

### Getting Help

1. Check browser console for detailed error messages
2. Review the Plotly documentation (right panel)
3. Verify CSV data format is correct
4. Test with the default example first

## Technology Stack

- **Vue 3**: Reactive UI framework
- **Vite**: Build tool and dev server
- **TypeScript**: Type-safe development
- **Plotly.js**: Charting library
- **Monaco Editor**: Code editor (VS Code core)
- **AG Grid**: Data grid component
- **PapaParse**: CSV parsing

## License & Credits

Built with modern web technologies for fast, interactive data visualization.
