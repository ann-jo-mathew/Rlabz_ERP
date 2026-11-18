<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call([
            AdminUserSeeder::class,
            DevUserSeeder::class,
            // RLabZProjectsSeeder handles all 16 real projects, students,
            // faculty, finance, modules, tasks and work logs.
            // The old demo seeders (ProjectSeeder, FullDatabaseDemoSeeder,
            // ProjectDummyFinanceAndTaskSeeder) are intentionally excluded.
            RLabZProjectsSeeder::class,
            DesignModuleSeeder::class,
        ]);
    }
}
