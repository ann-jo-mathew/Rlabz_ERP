# AWS EC2 Free Tier Deployment Guide for Rlabz ERP

This guide provides step-by-step instructions to deploy **Rlabz ERP** (Laravel 9 + MySQL + Vue 3/Vite Frontend) onto an **AWS EC2 Free Tier** instance (`t2.micro` / `t3.micro`).

> [!NOTE]
> The AWS Free Tier provides **750 hours per month** of `t2.micro` or `t3.micro` instances for **12 consecutive months** (enough to run this demo 24/7 for an entire year at $0.00 cost).

---

## Phase 1: Launch your EC2 Instance (AWS Console)

1. Log into your [AWS Management Console](https://console.aws.amazon.com/).
2. In the top search bar, type **EC2** and click on the EC2 service.
3. Click the orange **"Launch Instance"** button.
4. Configure the instance settings as follows:
   - **Name**: `Rlabz-ERP-Demo`
   - **Application and OS Images (AMI)**: Select **Ubuntu**
     - Look for the green badge that says **"Free tier eligible"**.
     - Choose either:
       - **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type** (Default Free Tier)
       - OR **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**
     - ⚠️ **Important**: Do NOT select **"Ubuntu Pro"** (Ubuntu Pro includes commercial support licenses and is NOT free tier). Make sure it says **Ubuntu Server**.
   - **Instance Type**: Select **`t2.micro`** (1 vCPU, 1 GiB Memory, _Free tier eligible_) or **`t3.micro`** (depending on region).
   - **Key pair (login)**:
     - Click **"Create new key pair"**.
     - Name it `rlabz-key`.
     - Key pair type: `RSA`.
     - Private key file format: `.pem` (for OpenSSH / Git Bash / PowerShell).
     - Click **Create key pair** and save the downloaded `.pem` file safely.
   - **Network Settings**:
     - Check **Allow SSH traffic from** -> `Anywhere (0.0.0.0/0)` (or `My IP` for enhanced security).
     - Check **Allow HTTP traffic from the internet** (Port 80) -> **Crucial for web visitors!**
   - **Configure Storage**:
     - Change from `8 GiB` to **`30 GiB`** (AWS Free Tier gives you up to 30 GiB of EBS storage for free).
5. Click **"Launch Instance"**.
6. Wait 30–60 seconds until the Instance State shows **"Running"**.

---

## Phase 2: Connect to your EC2 Instance via SSH

1. In the EC2 console, click on your instance and copy the **Public IPv4 address** (e.g. `13.233.150.80`).
2. Open **PowerShell**, **Command Prompt**, or **Git Bash** on your PC and navigate to where you saved your `.pem` key:
   ```bash
   cd C:\Users\alber\Downloads
   ```
3. Set permissions (if using Linux/macOS/Git Bash):
   ```bash
   chmod 400 rlabz-key.pem
   ```
4. Connect via SSH:
   ```bash
   ssh -i "rlabz-key.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
   ```
   _(Type `yes` when prompted to continue connecting)._

---

## Phase 3: Run the Turnkey Deployment Script

Once logged into your EC2 terminal, run these commands:

```bash
# 1. Clone the repository
git clone https://github.com/ann-jo-mathew/Rlabz_ERP.git /tmp/rlabz_repo

# 2. Enter the directory and make the setup script executable
cd /tmp/rlabz_repo
chmod +x deploy/setup-ec2.sh

# 3. Run the automated installer
./deploy/setup-ec2.sh
```

### What the installer automatically handles for you:

1. **2GB Swap Space**: Prevents out-of-memory crashes on the 1GB RAM `t2.micro` instance.
2. **Nginx & PHP-FPM**: Installs PHP 8.1 and all required Laravel modules.
3. **MySQL Server**: Creates the database `rlabz_erp` and user.
4. **Composer & Node.js**: Installs PHP dependencies and builds the Vite frontend.
5. **Database Migration & Seeder**: Executes all module migrations and seeds the database with the full demo data.
6. **Nginx Configuration**: Configures reverse proxy so `/api` passes to Laravel and all other paths serve the frontend SPA.

---

## Phase 4: Access Your Live ERP Demo!

Open your browser and navigate to:

```
http://<YOUR-EC2-PUBLIC-IP>
```

You will see the **RLABZ ERP** login screen!

### Quick Demo Logins:

| Role               | Email                      | Password      | Allowed Access                                            |
| :----------------- | :------------------------- | :------------ | :-------------------------------------------------------- |
| **Director**       | `director@rajagiri.edu`    | `director123` | Director Dashboard, Client proposals, Financial oversight |
| **Coordinator**    | `coordinator@rajagiri.edu` | `password123` | Project allocation, Student assignment, Modules & Tasks   |
| **Finance Head**   | `finance@rajagiri.edu`     | `finance123`  | Budget allocations, Invoices, Student stipends            |
| **Faculty**        | `faculty@rajagiri.edu`     | `faculty123`  | Sprints, Task verifications, Meetings                     |
| **Student (Nova)** | `nova@rajagiri.edu`        | `student123`  | Work logs, Progress reports, GitHub links                 |

---

## Useful Maintenance Commands

- **View Laravel Logs**:
  ```bash
  tail -f /var/www/rlabz/backend/storage/logs/laravel.log
  ```
- **View Nginx Access & Error Logs**:
  ```bash
  sudo tail -f /var/log/nginx/error.log
  ```
- **Restart Services**:
  ```bash
  sudo systemctl restart nginx
  sudo systemctl restart php8.1-fpm
  sudo systemctl restart mysql
  ```
- **Re-run Migrations & Seeders (if needed)**:
  ```bash
  cd /var/www/rlabz/backend
  php artisan migrate:fresh --force
  php artisan db:seed --class=FullDatabaseDemoSeeder --force
  ```
