# User Guide: How to Create Graphs in Nodeplot

Welcome to Nodeplot! This guide will teach you how to turn your data into beautiful graphs, step-by-step. You don't need to be a programmer to do this.

## Table of Contents
1.  [Getting Started](#getting-started)
2.  [The Basics](#the-basics)
3.  [Tutorial: Creating Your First Graph](#tutorial-creating-your-first-graph)
4.  [Controls & Shortcuts](#controls--shortcuts)

---

## Getting Started

1.  Make sure the application is running (you should see the Nodeplot interface in your web browser).
2.  You will see three main tabs at the top:
    *   **Csv Data**: Where you load your data files.
    *   **Controls**: Where you can adjust settings you create.
    *   **Node Editor**: Where the magic happens! This is where you build your graph.

---

## The Basics

Nodeplot works by connecting "Nodes" together. Think of a Node as a small machine that does one specific job.
*   **Input Node**: Brings data in (like a CSV file).
*   **Processor Node**: Changes the data (like picking a specific column or doing math).
*   **Output Node**: Shows the result (like a Chart).

You connect these machines with wires to create a "Pipeline". Data flows from left to right.

---

## Tutorial: Creating Your First Graph

Let's make a simple line chart from a CSV file.

### Step 1: Load Your Data
1.  Click the **Csv Data** tab.
2.  Click **"Load CSV"** (or similar button) to try loading a sample file, or drop your own `.csv` file into the area if generic file dropping is supported (or just use the default sample data if available).
3.  You should see your data appear in a table.

### Step 2: Add Nodes
1.  Switch to the **Node Editor** tab.
2.  You will see a large grid (the Canvas).
3.  **To Add a Node**:
    *   **Right-click** anywhere on the background.
    *   OR press `Shift + A` on your keyboard.
    *   OR click the `+ Add Node` button in the bottom right corner.
4.  A menu will appear.

### Step 3: Build the Chain
We need 4 specific nodes to make a chart. Add them one by one:

1.  **Add a CSV Input Node**:
    *   Open the Add Node menu -> Select `CSV Input`.
    *   This node grabs the data you loaded in Step 1.

2.  **Add an Isolate Column Node** (We need two of these: one for X axis, one for Y axis):
    *   Open Add Node menu -> Select `Isolate Column`.
    *   Do it again to add a second one.
    *   *Tip: You can select a node and press `Shift + D` to duplicate it!*

3.  **Add a Trace Node**:
    *   Open Add Node menu -> Select `Trace`.
    *   This defines what the line looks like (color, style, etc.).

4.  **Add a Plotly Chart Node**:
    *   Open Add Node menu -> Select `Plotly Chart`.
    *   This is the final screen that shows the graph.

### Step 4: Connect the Dots
Now we connect them with wires. To connect, click and drag from a colored dot (port) on the right side of a node to a dot on the left side of another node.

1.  **Connect Data Source**:
    *   Drag from `CSV Input` (Output: *data*) -> to **Both** `Isolate Column` nodes (Input: *csvData*).
    *   Now both column pickers have access to your file.

2.  **Select Your Columns**:
    *   Look at the first `Isolate Column` node. Use the dropdown or number box to pick which column is your **X-axis** (e.g., "Time" or "Date").
    *   Look at the second `Isolate Column` node. Pick the column for your **Y-axis** (e.g., "Value" or "Price").

3.  **Feed the Trace**:
    *   Connect the first `Isolate Column` (Output: *data*) -> to `Trace` (Input: *x*). *Note: If you don't see 'x', look for the generic input or check usage.*
    *   Connect the second `Isolate Column` (Output: *data*) -> to `Trace` (Input: *y*).
    *   *Wait, let's double check the Trace node inputs.* (Usually it takes X and Y).

4.  **Show the Chart**:
    *   Connect `Trace` (Output: *trace*) -> to `Plotly Chart` (Input: *data*).

**Boom!** You should see a graph appear on the `Plotly Chart` node.

---

## Controls & Shortcuts

### Navigation
*   **Pan (Move around)**: Hold **Middle Mouse Button** and drag, OR hold **Alt + Left Click** and drag.
*   **Zoom**: Use your **Mouse Wheel**.

### Editing
*   **Add Node**: `Shift + A` or Right-Click.
*   **Delete Node**: Select node and press `Delete` or `Backspace`.
*   **Duplicate**: Select node and press `Shift + D`.
*   **Search**: Use the search bar in the Add Node menu to find what you need quickly.

### Tips
*   **Live Update**: The graph updates instantly as you change connections or column selections.
*   **Multiple Traces**: Want two lines? Add another `Trace` node and connect it to the same `Plotly Chart` node! (The Chart node might look like it only takes one input, but you can use a `Joiner` or `List` node if needed, or drag multiple traces if supported).

---

## Managing Your Projects

Nodeplot automatically saves your work to your browser's local storage.

### Opening the Project Manager
Click the **Folder Icon** or "Manage Projects" button in the top left corner of the screen.

### Features
*   **Load Examples**: The easiest way to learn! Select an example like "Scatter Plot" or "Bar Chart" from the dropdown to see how it's done.
*   **Create New**: Start fresh.
*   **Import/Export**: You can save your graph as a `.json` file to share with others or back it up.
*   **Clone**: Make a copy of a project to experiment without breaking the original.
