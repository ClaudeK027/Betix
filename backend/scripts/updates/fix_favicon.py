import requests
import os

url = "https://pklyygllmbfbdmfmozxq.supabase.co/storage/v1/object/public/logos/betix_logo2.png"
save_path = r"d:\Kaizen D\AI_Dev\BETIX\frontend\src\app\icon.png"
delete_path = r"d:\Kaizen D\AI_Dev\BETIX\frontend\src\app\favicon.ico"

print(f"Downloading logo from {url}...")
try:
    response = requests.get(url)
    response.raise_for_status()
    with open(save_path, 'wb') as f:
        f.write(response.content)
    print(f"Successfully saved to {save_path}")
except Exception as e:
    print(f"Error downloading: {e}")
    exit(1)

if os.path.exists(delete_path):
    print(f"Removing old favicon at {delete_path}")
    os.remove(delete_path)
else:
    print("Old favicon not found.")
