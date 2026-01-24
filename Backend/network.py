import socket
import requests

# Test basic internet connectivity
try:
    response = requests.get("https://www.google.com", timeout=5)
    print("✅ Internet connection working")
except:
    print("❌ No internet connection")

# Test DNS resolution for Neon
hostname = "ep-holy-haze-ahsnfqci-pooler.c-3.us-east-1.aws.neon.tech"
try:
    ip = socket.gethostbyname(hostname)
    print(f"✅ DNS resolution successful: {hostname} -> {ip}")
except socket.gaierror as e:
    print(f"❌ DNS resolution failed: {e}")

# Test with different DNS
import subprocess
try:
    result = subprocess.run(['nslookup', hostname, '8.8.8.8'], 
                          capture_output=True, text=True, timeout=10)
    print(f"Google DNS result: {result.stdout}")
except:
    print("❌ nslookup failed")