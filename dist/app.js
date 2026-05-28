import { pythonSource } from './js/bundle.js';

const worker = new Worker('worker.js');
const triggerBtn = document.getElementById('triggerBtn');
const statusLog = document.getElementById('statusLog');
const progressBar = document.getElementById('progressBar');
const exportPanel = document.getElementById('exportPanel');
const canvas = document.getElementById('mainLoomCanvas');
const ctx = canvas.getContext('2d');

let loadedImage = null;
let finalLinesCache = [];
let finalPinsCache = [];

worker.onmessage = (e) => {
    const { type, message, payload } = e.data;
    
    if (type === 'STATUS') {
        if (message === 'READY') {
            statusLog.textContent = "Python + OpenCV Environment Ready!";
            triggerBtn.textContent = "Run String Art Generation Engine";
            triggerBtn.disabled = false;
        }
        if (message === 'FINISHED') {
            statusLog.textContent = "🎉 Processing Complete! Assets generated.";
            triggerBtn.disabled = false;
            
            // Expose the download panels
            exportPanel.style.display = "block";
            generateFileDownloads();
        }
    }
    
if (type === 'RENDER_FRAME') {
        finalLinesCache = payload.lines;
        finalPinsCache = payload.pins;

        const pct = Math.floor((payload.currentLine / payload.totalLines) * 100);
        progressBar.value = pct;
        statusLog.textContent = `Processing: Line ${payload.currentLine} / ${payload.totalLines} (${pct}%)`;
        
        // Create an ImageData object using the exact pixel buffer calculated by Python
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        imgData.data.set(payload.pixels);
        
        // Paint your exact Python matrix representation onto the UI Canvas
        ctx.putImageData(imgData, 0, 0);
    }
};

// Handle file loading locally via standard interface inputs
document.getElementById('imageLoader').addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Fill full resolution target coordinates
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            loadedImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
            statusLog.textContent = "Image loaded successfully! Ready to process.";
            exportPanel.style.display = "none"; // Hide panel on new image load
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

triggerBtn.addEventListener('click', () => {
    if (!loadedImage) {
        alert("Please select and load an input image source file first.");
        return;
    }
    
    triggerBtn.disabled = true;
    exportPanel.style.display = "none";
    progressBar.value = 0;
    
    const config = {
        radius: 500, 
        pins: parseInt(document.getElementById('numPins').value),
        lines: parseInt(document.getElementById('numLines').value),
        weight: parseFloat(document.getElementById('lineWeight').value),
        width: 3,
        minLoop: 3,
        w: canvas.width,
        h: canvas.height
    };
    
    worker.postMessage({
        type: 'EXECUTE_ENGINE',
        payload: {
            pythonSourceCode: pythonSource,
            pixelData: loadedImage.data,
            config: config
        }
    });
});

// Compilation function running completely client-side when pipeline triggers finishing conditions
function generateFileDownloads() {
    // 1. Hook up raw clean PNG raster formats out of the active rendering context
    const pngLink = document.getElementById('downloadPng');
    pngLink.href = canvas.toDataURL('image/png');
    pngLink.download = 'string_art_output.png';

    // 2. Generate vector SVG string paths matching original file export structures
    const svgLink = document.getElementById('downloadSvg');
    
    let svgContent = `<?xml version="1.0" standalone="no"?>\n`;
    svgContent += `<svg width="${canvas.width}" height="${canvas.height}" version="1.1" xmlns="http://www.w3.org/2000/svg">\n`;
    svgContent += `  <rect width="100%" height="100%" fill="white"/>\n`;
    
    if (finalLinesCache.length > 0) {
        let pathData = `M ${finalPinsCache[finalLinesCache[0][0]][0]} ${finalPinsCache[finalLinesCache[0][0]][1]} `;
        for (let line of finalLinesCache) {
            const nextPin = finalPinsCache[line[1]];
            pathData += `L ${nextPin[0]} ${nextPin[1]} `;
        }
        svgContent += `  <path d="${pathData}" stroke="black" stroke-width="0.7" fill="none" opacity="0.6" />\n`;
    }
    
    svgContent += `</svg>`;

    // Blob serialization configuration structures
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    svgLink.href = URL.createObjectURL(blob);
    svgLink.download = 'string_art_output.svg';
}