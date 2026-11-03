import subprocess
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(CURRENT_DIR)

print("=" * 60)
print("     BD RAIL ASSISTANT - GITHUB PUSH WIZARD")
print("=" * 60)

# Check existing remote origin
existing_origin = ""
try:
    p = subprocess.run(["git", "remote", "get-url", "origin"], capture_output=True, text=True, check=False)
    if p.returncode == 0:
        existing_origin = p.stdout.strip()
except Exception:
    pass

if existing_origin:
    print(f"\nFound configured remote: {existing_origin}")
    user_input = input("Press [Enter] to push to this repo, or type a new URL: ").strip()
    repo_url = user_input if user_input else existing_origin
else:
    print("\nEnter your GitHub Repository URL:")
    print("Example: https://github.com/username/bd-rail-live.git\n")
    repo_url = input("GitHub Repo URL: ").strip()

# Strip any accidental quotes or parentheses
repo_url = repo_url.strip('"\'() ')

if not repo_url:
    print("[ERROR] No repository URL provided!")
    input("\nPress Enter to exit...")
    sys.exit(1)

print(f"\nTarget Repository: {repo_url}")
print("\n[1/4] Staging files...")
subprocess.run(["git", "add", "."], check=False)

print("[2/4] Committing changes...")
subprocess.run(["git", "commit", "-m", "Deploy BD Rail Assistant with 24/7 Keep-Alive Workflow"], check=False)

print("[3/4] Configuring remote origin...")
subprocess.run(["git", "branch", "-M", "main"], check=False)
if repo_url != existing_origin:
    subprocess.run(["git", "remote", "remove", "origin"], capture_output=True, check=False)
    subprocess.run(["git", "remote", "add", "origin", repo_url], check=False)

print(f"[4/4] Pushing to {repo_url}...")
push_res = subprocess.run(["git", "push", "-u", "origin", "main"])

if push_res.returncode == 0:
    print("\n" + "=" * 60)
    print("SUCCESS! All project files pushed to GitHub successfully.")
    print("Now go to render.com and connect this repository as Web Service!")
    print("=" * 60)
else:
    print("\n[Notice] Push failed. If this is a private repo, ensure you are logged into GitHub in your browser or git credentials.")

input("\nPress Enter to exit...")

