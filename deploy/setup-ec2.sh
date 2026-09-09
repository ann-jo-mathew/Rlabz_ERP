#!/usr/bin/env bash
# ==============================================================================
# RLABZ ERP - Automated AWS EC2 (Ubuntu 22.04 LTS) Setup Script
# Free Tier (t2.micro / t3.micro) Turnkey Deployment
# ==============================================================================
set -e

echo "========================================================="
echo "  Starting Rlabz ERP AWS EC2 Automated Deployment"
echo "========================================================="

# 1. CONFIGURE 2GB SWAP SPACE (Crucial for 1GB RAM t2.micro)
echo "--> Step 1/8: Checking & Configuring 2GB Swap Space..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    sudo sysctl vm.swappiness=10
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    echo "  [✓] 2GB Swap configured successfully."
else
    echo "  [✓] Swapfile already exists. Skipping."
fi

# 2. UPDATE & INSTALL PREREQUISITES
echo "--> Step 2/8: Installing System Packages & PHP..."
sudo apt-get update -y
sudo apt-get install -y software-properties-common curl wget git unzip nginx mysql-server

# Add Ondrej PPA for clean PHP 8.1/8.2 packages if needed
sudo add-apt-repository -y ppa:ondrej/php
sudo apt-get update -y

PHP_VER="8.2"
sudo apt-get install -y \
    php${PHP_VER}-fpm \
    php${PHP_VER}-mysql \
    php${PHP_VER}-mbstring \
    php${PHP_VER}-xml \
    php${PHP_VER}-bcmath \
    php${PHP_VER}-curl \
    php${PHP_VER}-zip \
    php${PHP_VER}-intl \
    php${PHP_VER}-gd \
    php${PHP_VER}-cli

sudo update-alternatives --set php /usr/bin/php${PHP_VER} || true

# Install Composer
if ! command -v composer &> /dev/null; then
    echo "  Installing Composer..."
    curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php
    sudo php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer
fi

# Install Node.js (Node 20 LTS for Vite build)
if ! command -v node &> /dev/null; then
    echo "  Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. CONFIGURE MYSQL DATABASE
echo "--> Step 3/8: Configuring MySQL Server..."
sudo systemctl start mysql
sudo systemctl enable mysql

DB_NAME="rlabz_erp"
DB_USER="rlabz_user"
DB_PASS="RlabzSecure2026!Db"

sudo mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
sudo mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
echo "  [✓] MySQL database '${DB_NAME}' and user '${DB_USER}' created."

# 4. DEPLOY PROJECT TO /var/www/rlabz
echo "--> Step 4/8: Setting up project in /var/www/rlabz..."
PROJECT_DIR="/var/www/rlabz"

# If current directory is the repo, copy or move it
if [ "$PWD" != "$PROJECT_DIR" ]; then
    sudo mkdir -p /var/www/rlabz
    echo "  Syncing files to $PROJECT_DIR..."
    sudo rsync -av --exclude 'node_modules' --exclude 'backend/vendor' "$PWD/" "$PROJECT_DIR/"
fi

cd "$PROJECT_DIR"

# 5. CONFIGURE LARAVEL BACKEND
echo "--> Step 5/8: Building & Configuring Laravel Backend..."
cd "$PROJECT_DIR/backend"

# Configure .env
if [ ! -f .env ]; then
    cp .env.example .env 2>/dev/null || true
fi

cat <<EOF | sudo tee .env > /dev/null
APP_NAME="Rlabz ERP"
APP_ENV=production
APP_KEY=base64:TqXxeC2varofVmnVfBJyvoGzsZ3lWJ5hK6CiTHyH8ug=
APP_DEBUG=true
APP_URL=http://localhost

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${DB_NAME}
DB_USERNAME=${DB_USER}
DB_PASSWORD=${DB_PASS}

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120
EOF

# Install backend dependencies
echo "  Installing Composer packages..."
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Generate key if needed & create storage link
php artisan key:generate --force
php artisan storage:link || true

# Run Migrations & Full Demo Seeder
echo "  Running database migrations and seeders..."
php artisan migrate --force
php artisan db:seed --class=FullDatabaseDemoSeeder --force

# Optimize Laravel cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
sudo chown -R www-data:www-data "$PROJECT_DIR/backend/storage" "$PROJECT_DIR/backend/bootstrap/cache"
sudo chmod -R 775 "$PROJECT_DIR/backend/storage" "$PROJECT_DIR/backend/bootstrap/cache"

# 6. BUILD FRONTEND
echo "--> Step 6/8: Building Frontend (Vite)..."
cd "$PROJECT_DIR/frontend"
npm install --silent
npm run build
echo "  [✓] Frontend built into /var/www/rlabz/frontend/dist"

# 7. CONFIGURE NGINX
echo "--> Step 7/8: Configuring Nginx Server..."
SOCK_FILE=$(find /var/run/php/ -name "php*-fpm.sock" | head -n 1)
if [ -z "$SOCK_FILE" ]; then
    SOCK_FILE="/var/run/php/php${PHP_VER}-fpm.sock"
fi

# Apply the sock path into nginx conf
sudo cp "$PROJECT_DIR/deploy/nginx-rlabz.conf" /etc/nginx/sites-available/rlabz
sudo sed -i "s|unix:/var/run/php/php8.1-fpm.sock;|unix:${SOCK_FILE};|g" /etc/nginx/sites-available/rlabz

# Enable site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/rlabz /etc/nginx/sites-enabled/rlabz

# Test & Restart services
sudo nginx -t
sudo systemctl restart php*-fpm 2>/dev/null || sudo systemctl restart php${PHP_VER}-fpm
sudo systemctl restart nginx

# 8. COMPLETE
echo "========================================================="
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || curl -s https://ifconfig.me || echo "your-ec2-ip")
echo "  [✓] DEPLOYMENT COMPLETE!"
echo "  Access your live ERP Demo at:"
echo "  http://${PUBLIC_IP}"
echo ""
echo "  Demo Credentials:"
echo "  - Director    : director@rajagiri.edu   / director123"
echo "  - Coordinator : coordinator@rajagiri.edu/ password123"
echo "  - Finance     : finance@rajagiri.edu    / finance123"
echo "  - Faculty     : faculty@rajagiri.edu    / faculty123"
echo "  - Student     : nova@rajagiri.edu       / student123"
echo "========================================================="
