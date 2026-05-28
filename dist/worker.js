importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js");

let pyodide;

async function initWasmWorker() {
    pyodide = await loadPyodide();
    await pyodide.loadPackage(["numpy", "opencv-python"]);
    self.postMessage({ type: 'STATUS', message: 'READY' });
}

self.onmessage = async (e) => {
    const { type, payload } = e.data;
    
    if (type === 'EXECUTE_ENGINE') {
        pyodide.runPython(payload.pythonSourceCode);
        pyodide.globals.set("js_pixel_array", payload.pixelData);
        
        pyodide.runPython(`
            raw_canvas_buffer = js_pixel_array.to_py()

            engine = StringArtEngine(
                img_radius=int(${payload.config.radius}),
                num_pins=int(${payload.config.pins}),
                num_lines=int(${payload.config.lines}),
                line_weight=float(${payload.config.weight}),
                line_width=int(${payload.config.width}),
                min_loop=int(${payload.config.minLoop})
            )
            
            generator_iterable = engine.run_stepwise(raw_canvas_buffer, ${payload.config.w}, ${payload.config.h})
        `);
        
        const iterator = pyodide.globals.get("generator_iterable");
        
        while (true) {
            const step = iterator.next();
            
            // 1. Guard check immediately before handling properties
            if (step.done) {
                break;
            }
            
            const stateProxy = step.value;
            
            // 2. Extract the pixel buffer directly from Python proxy space BEFORE any conversion
            const rawBufferProxy = stateProxy.get("pixel_buffer");
            
            // 3. Read directly from the WebAssembly memory heap allocations
            const pyBuffer = rawBufferProxy.getBuffer();
            const wasmMemoryView = new Uint8ClampedArray(
                pyBuffer.data.buffer, 
                pyBuffer.data.byteOffset, 
                pyBuffer.data.length
            );
            
            // 4. MEMORY FIX: Extract a clean copy out of the protected WebAssembly memory block.
            // This safely bypasses the 'cannot transfer WebAssembly ArrayBuffer' exception.
            const jsArray = wasmMemoryView.slice(); 
            
            // 5. Convert the remaining structural dictionary variables to a native JS object
            const state = stateProxy.toJs({ dict_convert: Object.fromEntries });
            const currentLine = state.current_line;
            const totalLines = state.total_lines;
            const linesArray = state.lines_array;
            const pinCoordinates = state.pin_coordinates;
            
            // 6. Post data safely back to app.js
            self.postMessage({
                type: 'RENDER_FRAME',
                payload: {
                    currentLine: currentLine,
                    totalLines: totalLines,
                    pixels: jsArray, 
                    lines: linesArray,
                    pins: pinCoordinates
                }
            }); 
            
            // 7. GARBAGE COLLECTION: Instantly drop the WASM handles to maintain a completely flat RAM footprint
            pyBuffer.release();
            
            if (rawBufferProxy && typeof rawBufferProxy.destroy === 'function') {
                rawBufferProxy.destroy();
            }
            if (stateProxy && typeof stateProxy.destroy === 'function') {
                stateProxy.destroy();
            }
        }
        
        // Clean up the main iterator reference once calculations conclude
        if (iterator && typeof iterator.destroy === 'function') {
            iterator.destroy();
        }
        
        self.postMessage({ type: 'STATUS', message: 'FINISHED' });
    }
};

initWasmWorker();