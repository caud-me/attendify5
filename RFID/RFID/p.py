import serial
import json
import time
import os

# Configure the serial port
SERIAL_PORT = 'COM7'  # Adjust as needed
BAUD_RATE = 9600

def initialize_serial():
    try:
        return serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    except serial.SerialException as e:
        print(f"Error: Unable to open serial port {SERIAL_PORT} - {e}")
        exit(1)

ser = initialize_serial()

# Define the JSON file for logging
JSON_FILE = 'data/data.json'

def load_json():
    if os.path.exists(JSON_FILE):
        try:
            with open(JSON_FILE, 'r') as file:
                data = json.load(file)
                return data if isinstance(data, dict) else {}
        except (json.JSONDecodeError, FileNotFoundError):
            print("File corrupted. Reinitializing.")
            return {}
    else:
        with open(JSON_FILE, 'w') as file:
            json.dump({}, file)
        return {}

# Initialize with empty logs
rfid_logs = {}

def save_json(data):
    """Save the given data to the JSON file."""
    try:
        with open(JSON_FILE, 'w') as file:
            json.dump(data, file, indent=4)
            print("JSON file successfully updated!")
    except Exception as e:
        print(f"Error: Unable to save JSON file - {e}")

# Scan control variables
SCAN_INTERVAL = 5  # seconds
last_scan_time = 0
last_uid = ""

print("RFID Attendance System is running...")

while True:
    try:
        # Read and process UID
        uid = ser.readline().decode('utf-8').strip()
        if not uid:
            continue
        
        print(f"Raw Data from Serial: '{uid}'")
        current_time = time.time()

        # Avoid duplicate scans within the scan interval
        if uid == last_uid and (current_time - last_scan_time < SCAN_INTERVAL):
            print("Duplicate scan detected. Ignoring...")
            continue

        # Reload JSON data before processing
        rfid_logs = load_json()
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(current_time))

        # Update the entry
        if uid in rfid_logs:
            if rfid_logs[uid]["status"] == "In":
                rfid_logs[uid]["timeOut"] = timestamp
                rfid_logs[uid]["status"] = "Out"
            else:
                rfid_logs[uid]["timeIn"] = timestamp
                rfid_logs[uid]["status"] = "In"
        else:
            rfid_logs[uid] = {
                "timeIn": timestamp,
                "status": "In"
            }

        print(f"Data to save: {rfid_logs}")
        # Save the updated logs
        save_json(rfid_logs)
        last_scan_time = current_time
        last_uid = uid

        time.sleep(0.1)
    
    except serial.SerialException:
        print("Serial connection lost. Reconnecting...")
        ser = initialize_serial()
    except KeyboardInterrupt:
        print("Exiting program...")
        exit()
    except Exception as e:
        print(f"Unexpected error: {e}")