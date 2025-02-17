import json

# Sample data to write into the JSON file
data = {"greeting": "hi"}

# Writing initial data to the JSON file
with open("example.json", "w") as file:
    json.dump(data, file)

# Reading and modifying the JSON data
with open("example.json", "r") as file:
    content = json.load(file)

# Editing the greeting
content["greeting"] = "hello"

# Writing the updated data back to the file
with open("example.json", "w") as file:
    json.dump(content, file)

print("JSON file updated with a new greeting!")
