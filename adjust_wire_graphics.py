import argparse
import os
from PIL import Image

# Mapping common color names to RGB tuples
COLOR_MAP = {
    "cyan": (0, 255, 255),
    "magenta": (255, 0, 255),
    "yellow": (255, 255, 0),
    "red": (255, 0, 0),
    "green": (0, 255, 0),
    "blue": (0, 0, 255),
    "white": (255, 255, 255),
}


def apply_tint(image_path, output_folder, color_name, opacity):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    rgb_color = COLOR_MAP.get(color_name.lower())
    if rgb_color is None:
        raise ValueError(
            f"Unknown color '{color_name}'. Valid colors: {', '.join(COLOR_MAP.keys())}"
        )

    # Load image
    img = Image.open(image_path).convert("RGBA")
    _, _, _, alpha = img.split()

    # Create fully tinted image
    tinted_rgb = Image.new("RGB", img.size, rgb_color)

    # Apply opacity to the alpha channel
    alpha = alpha.point(lambda a: int(a * opacity))

    # Recombine RGB + Alpha
    final_img = Image.merge("RGBA", (*tinted_rgb.split(), alpha))

    base_name = os.path.basename(image_path)
    name_part = os.path.splitext(base_name)[0]

    output_path = os.path.join(
        output_folder,
        f"{name_part}_{color_name}_{opacity}.png"
    )

    final_img.save(output_path)
    print(f"Saved: {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Create a solid-color version of an image while preserving transparency."
    )

    parser.add_argument(
        "image_path",
        help="Path to the source image"
    )

    parser.add_argument(
        "output_folder",
        help="Folder to save the result"
    )

    parser.add_argument(
        "color",
        help="Color name (cyan, magenta, yellow, red, green, blue, white)"
    )

    parser.add_argument(
        "opacity",
        type=float,
        help="Final opacity (0.0 to 1.0)"
    )

    args = parser.parse_args()

    apply_tint(
        args.image_path,
        args.output_folder,
        args.color,
        max(0.0, min(1.0, args.opacity)),
    )
