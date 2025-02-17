import json

JSON_FILE = 'data/data.json'

def clear_logs():
    try:
        with open(JSON_FILE, 'w') as file:
            json.dump({}, file)
        print("All logs cleared successfully!")
    except Exception as e:
        print(f"Error clearing logs: {e}")

if __name__ == "__main__":
    clear_logs()