// Complex parsing test
// Test 1: XY2D with nested object and line breaks
input.add('pos1', {
    type: 'xy2d',
    default: {
        x: 25,
        y: 75
    }
});

// Test 2: XY2D with single line nested object
input.add('pos2', { type: 'xy2d', default: { x: 10, y: 90 } });

// Test 3: Standard controls to ensure no regression
input.add('slider', { type: 'slider', min: 0, max: 100, default: 50 });

const trace = {
    x: [1, 2, 3],
    y: [10, 20, 30],
    type: 'scatter'
};

return {
    data: [trace],
    layout: {
        title: `Pos1: ${inputs.pos1.x},${inputs.pos1.y} | Pos2: ${inputs.pos2.x},${inputs.pos2.y}`,
        annotations: [
            { x: inputs.pos1.x, y: inputs.pos1.y, text: 'Pos1' },
            { x: inputs.pos2.x, y: inputs.pos2.y, text: 'Pos2' }
        ]
    }
};
