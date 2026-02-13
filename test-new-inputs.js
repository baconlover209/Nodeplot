// Test parsing for dropdown and XY inputs

// Test 1: Dropdown with string array
input.add('chartType', { type: 'dropdown', options: ['bar', 'line', 'scatter'], default: 'bar' });

// Test 2: XY2D with object default
input.add('position', { type: 'xy2d', min: 0, max: 100, default: { x: 50, y: 50 } });

// Test 3: Knob
input.add('volume', { type: 'knob', min: 0, max: 100, step: 5, default: 50 });

// Test 4: Check
input.add('enabled', { type: 'check', default: true });

const trace = {
    x: data.map(row => row.category),
    y: data.map(row => row.value),
    type: inputs.chartType || 'bar',
    marker: {
        color: '#007acc',
        opacity: inputs.volume / 100
    }
};

return {
    data: [trace],
    layout: {
        title: inputs.enabled ? 'Chart Enabled' : 'Chart Disabled',
        xaxis: { title: 'Category' },
        yaxis: { title: 'Value' },
        annotations: [{
            x: inputs.position.x,
            y: inputs.position.y,
            text: 'Point',
            showarrow: true
        }]
    }
};
