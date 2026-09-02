# Rlabz ERP: Local Database Setup Guide

When you pull this repository to your local PC for the first time, you need to set up your local MySQL database so that all the modules can run properly.

Follow these steps exactly to get your database constructed.

## Step 1: Create the `.env` file
Your `.env` file is ignored by Git to protect secrets. You must create one on your machine.
1. In the `backend/` folder, find the `.env.example` file.
2. Duplicate it and rename the copy to `.env`.
3. Open `.env` and look for the Database block. Update it to match your local MySQL server (like XAMPP, WAMP, or MAMP):

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rlabz_erp      <-- Important!
DB_USERNAME=root           <-- Usually 'root' for XAMPP
DB_PASSWORD=               <-- Usually blank for XAMPP
```

## Step 2: Create the Database
Laravel will not create the database container for you. 
1. Open phpMyAdmin (usually `http://localhost/phpmyadmin`) or your favorite SQL GUI (like DBeaver or MySQL Workbench).
2. Create a new, blank database named exactly **`rlabz_erp`**.

## Step 3: Run the Migrations
We have 34 different database tables configured across our 10 modules. You do NOT have to create them manually!

1. Open your terminal/command prompt.
2. Ensure you are inside the `backend/` directory.
3. Run the following command:
```bash
php artisan migrate
```

*What happens?* 
Laravel will scan every single module, read the migration files we created (which are strictly ordered by date to satisfy foreign-key requirements), and automatically construct the entire database architecture for you.

## Step 4: Verify
If the command was successful, you can look at phpMyAdmin again, click on `rlabz_erp`, and you will see all the tables (`users`, `projects`, `student_payments`, `github_repositories`, etc.) perfectly created and linked!

---
**Common Errors:**
- **"Access denied for user"**: Your `DB_USERNAME` or `DB_PASSWORD` in the `.env` file is wrong.
- **"Unknown database 'rlabz_erp'"**: You forgot Step 2. You must create the empty database in MySQL first.
- **"Class not found"**: Run `composer dump-autoload` to refresh Laravel's file maps.
