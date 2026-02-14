# Push to a new "Pallet" repo on GitHub

Your local repo is initialized and the initial commit is done. Follow these steps to create **Pallet** on GitHub and upload.

## 1. Create the repo on GitHub

1. Open **https://github.com/new**
2. Set **Repository name** to: `Pallet`
3. Choose **Public** (or Private)
4. **Do not** add a README, .gitignore, or license (you already have them)
5. Click **Create repository**

## 2. Add the remote and push

GitHub will show you "push an existing repository from the command line". Use your **GitHub username** in the URL below.

**If your GitHub username is `YourUsername`, run:**

```powershell
cd c:\Code\PalletMS
git remote add origin https://github.com/YourUsername/Pallet.git
git branch -M main
git push -u origin main
```

**Replace `YourUsername`** with your actual GitHub username (e.g. `Rithesh`).

If GitHub uses SSH for you:

```powershell
git remote add origin git@github.com:YourUsername/Pallet.git
git branch -M main
git push -u origin main
```

When prompted, sign in with your GitHub account (or use a Personal Access Token if you have 2FA).

---

Done. Your code will be at: **https://github.com/YourUsername/Pallet**
