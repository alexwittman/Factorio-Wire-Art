import os
import json


def compile_python_to_static_asset():
    print("📦 Packing Python source engine configurations...")

    source_path = os.path.join('src', 'engine.py')
    target_dir = os.path.join('dist', 'js')
    target_file = os.path.join(target_dir, 'bundle.js')

    if not os.path.exists(source_path):
        print(f"Error: Could not locate source module path: {source_path}")
        return

    with open(source_path, 'r', encoding='utf-8') as f:
        raw_code = f.read()

    os.makedirs(target_dir, exist_ok=True)

    # Bundle raw code into a JavaScript module string
    js_content = f"// Automatically generated code wrapper payload. Do not alter manually.\n"
    js_content += f"export const pythonSource = {json.dumps(raw_code)};"

    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"✅ Success! Wrapped python modules written down to: {target_file}")


if __name__ == "__main__":
    compile_python_to_static_asset()
