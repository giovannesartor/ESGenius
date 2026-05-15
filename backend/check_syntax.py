import ast
import os

def check_syntax(directory):
    errors = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        ast.parse(f.read(), filename=path)
                except Exception as e:
                    errors.append((path, str(e)))
    return errors

if __name__ == "__main__":
    all_errors = []
    if os.path.exists('app'):
        all_errors.extend(check_syntax('app'))
    if os.path.exists('alembic'):
        all_errors.extend(check_syntax('alembic'))
    
    if not all_errors:
        print("all clean")
    else:
        for path, err in all_errors:
            print(f"{path}: {err}")
