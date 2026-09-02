# Rlabz ERP: Backend Modular Workflow Guide

Welcome to the backend team! This project uses Laravel 9 with a **Modular Architecture** (via `nwidart/laravel-modules`). This keeps our huge ERP system organized by splitting it into 10 separate mini-applications (Modules).

## 📁 The Folder Structure

Forget the standard `app/Http/Controllers` directory. You will spend 99% of your time inside the `Modules/` folder. 

Inside `backend/Modules/`, you will see folders like `Auth`, `Finance`, `Student`, etc. Each module contains its own MVC structure:

```
Modules/
└── YourModuleName/
    ├── Http/
    │   └── Controllers/       <-- Put your API Controllers here
    ├── Models/                <-- We have already built these! They hold database logic.
    ├── Database/
    │   └── Migrations/        <-- We have already built these! They create the database tables.
    └── Routes/                <-- Put your API route definitions here (e.g. api.php)
```

## 🚀 How to Work on Your Module

When you are assigned a module (for example, `Finance`), you own everything inside `Modules/Finance/`. 

### Step 1: Start the Server (The Right Way)
Do NOT use `php -S localhost:8000`. Laravel routes must go through the `public/` directory. Instead, open your terminal in the `backend/` folder and run:
```bash
php artisan serve
```
*(This starts the server properly on `http://localhost:8000`)*

### Step 2: Define an API Route
Create a file named `api.php` inside `Modules/Finance/Routes/` if it doesn't exist.
Add your endpoint. The `laravel-modules` package automatically prefixes your routes with your module's name.

```php
// Modules/Finance/Routes/api.php
use Illuminate\Support\Facades\Route;
use Modules\Finance\Http\Controllers\PaymentController;

Route::get('/payments', [PaymentController::class, 'index']);
// This endpoint will be accessible at: http://localhost:8000/api/finance/payments
```

### Step 3: Build the Controller
Place your logic inside `Modules/Finance/Http/Controllers/PaymentController.php`.
Use the Models we already built (e.g. `Modules\Finance\Models\StudentPayment`) to interact with the database.

```php
namespace Modules\Finance\Http\Controllers;

use Illuminate\Routing\Controller;
use Modules\Finance\Models\StudentPayment;

class PaymentController extends Controller
{
    public function index() {
        return response()->json(StudentPayment::all());
    }
}
```

### Step 4: Cross-Module Communication
If you are working in `Finance` but need to fetch a `User` from the `Auth` module, you can safely import their Model!
`use Modules\Auth\Models\User;`

## ⚠️ Important Rules for Collaboration
1. **Never edit another team member's module without asking.** The whole point of this architecture is isolation.
2. **Do not modify the existing Migrations.** If you need to add a column to an existing table, create a *new* migration file using `php artisan make:migration add_column_to_table_name`.
3. **If you need a new Module**, scaffold it safely using: `php artisan module:make ModuleName`
