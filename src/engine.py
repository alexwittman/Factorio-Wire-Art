import cv2
import numpy as np

linePixelsCache = {}


def linePixels(pin0, pin1):
    key = tuple(sorted((pin0, pin1)))
    if key in linePixelsCache:
        return linePixelsCache[key]

    length = int(np.hypot(pin1[0] - pin0[0], pin1[1] - pin0[1]))
    if length == 0:
        return np.array([]), np.array([])
    x = np.linspace(pin0[0], pin1[0], length)
    y = np.linspace(pin0[1], pin1[1], length)

    linePixelsCache[key] = (x.astype(int)-1, y.astype(int)-1)
    return linePixelsCache[key]


class StringArtEngine:
    def __init__(self, img_radius=500, num_pins=200, num_lines=1000, line_weight=0.05, line_width=3, min_loop=3):
        self.imgRadius = img_radius
        self.numPins = num_pins
        self.numLines = num_lines
        self.lineWeight = line_weight
        # cv2.GaussianBlur expects an odd kernel size (e.g., 3, 5, 7)
        self.lineWidth = line_width if line_width % 2 != 0 else line_width + 1
        self.minLoop = min_loop
        self.initPin = 0

    def pinCoords(self, width, height):
        radius_x = width // 2 - 2
        radius_y = height // 2 - 2
        x0 = width // 2
        y0 = height // 2

        alpha = np.linspace(0, 2 * np.pi, self.numPins + 1)
        coords = []
        for angle in alpha[0:-1]:
            x = int(x0 + radius_x * np.cos(angle))
            y = int(y0 + radius_y * np.sin(angle))
            coords.append((x, y))
        return coords

    def run_stepwise(self, raw_rgba_pixels, width, height):
        """Generator that runs the calculation loop and yields metrics step-by-step."""
        img = np.array(raw_rgba_pixels, dtype=np.uint8).reshape(
            (height, width, 4))
        img_gray = cv2.cvtColor(img, cv2.COLOR_RGBA2GRAY)

        img_inverted = 255 - img_gray

        mask = np.zeros((height, width), dtype=np.uint8)
        cv2.circle(mask, (width // 2, height // 2),
                   min(width, height) // 2 - 2, 255, -1)
        img_inverted[mask == 0] = 0
        imgMasked = img_inverted.astype(np.float32) / 255.0

        coords = self.pinCoords(width, height)
        h, w = imgMasked.shape[0:2]

        imgResult = 0.95 * np.ones((h, w), dtype=np.float32)
        modification_mask = np.zeros_like(imgResult)

        lines = []
        previousPins = []
        oldPin = self.initPin
        lineMask = np.zeros((h, w), dtype=np.float32)

        # ------------------------------------------------------------------
        # STABLE WORKER MEMORY CONFIGURATIONS:
        # Pre-allocate all transformation layouts up front to ensure zero loop memory reallocation spikes
        # ------------------------------------------------------------------
        scaled_buffer = np.zeros((h, w), dtype=np.float32)
        display_mat = np.zeros((h, w), dtype=np.uint8)
        rgba_render = np.zeros((h, w, 4), dtype=np.uint8)
        # ------------------------------------------------------------------

        for line_idx in range(self.numLines):
            bestLine = 0
            bestPin = oldPin
            oldCoord = coords[oldPin]

            for index in range(1, self.numPins):
                pin = (oldPin + index) % self.numPins
                coord = coords[pin]
                xLine, yLine = linePixels(oldCoord, coord)
                if len(xLine) == 0:
                    continue

                valid = (xLine >= 0) & (xLine < w) & (yLine >= 0) & (yLine < h)
                if not np.any(valid):
                    continue
                xl, yl = xLine[valid], yLine[valid]

                lineSum = np.sum(imgMasked[yl, xl])
                if (lineSum > bestLine) and not (pin in previousPins):
                    bestLine = lineSum
                    bestPin = pin

            if len(previousPins) >= self.minLoop:
                previousPins.pop(0)
            previousPins.append(bestPin)

            lineMask.fill(0)
            cv2.line(lineMask, oldCoord,
                     coords[bestPin], self.lineWeight, self.lineWidth)
            imgMasked = np.subtract(imgMasked, lineMask)

            lines.append((oldPin, bestPin))

            if bestPin == oldPin:
                break

            xLineResult, yLineResult = linePixels(
                coords[oldPin], coords[bestPin])
            valid_res = (xLineResult >= 0) & (xLineResult < w) & (
                yLineResult >= 0) & (yLineResult < h)
            xl_res, yl_res = xLineResult[valid_res], yLineResult[valid_res]

            imgResult[yl_res, xl_res] -= 0.2

            modification_mask[yl_res, xl_res] = 1
            blurred = cv2.GaussianBlur(
                imgResult, (self.lineWidth, self.lineWidth), 0)
            imgResult[modification_mask == 1] = blurred[modification_mask == 1]
            modification_mask.fill(0)

            oldPin = bestPin

            # ------------------------------------------------------------------
            # ZERO-ALLOCATION MATRIX TRANSFORMATIONS:
            # ------------------------------------------------------------------
            np.multiply(imgResult, 255.0, out=scaled_buffer)
            np.clip(scaled_buffer, 0, 255, out=scaled_buffer)

            # Use out= param or direct assignment to pre-allocated arrays
            display_mat = scaled_buffer.astype(np.uint8, copy=False)
            cv2.cvtColor(display_mat, cv2.COLOR_GRAY2RGBA, dst=rgba_render)

            # CRITICAL PERFORMANCE FIX:
            # .reshape(-1) exposes a flat view of the same chunk of memory.
            # No new byte buffer allocations are initialized here!
            flat_view = rgba_render.reshape(-1)
            # ------------------------------------------------------------------

            yield {
                "current_line": line_idx + 1,
                "total_lines": self.numLines,
                "pixel_buffer": flat_view,
                "lines_array": lines,
                "pin_coordinates": coords
            }
