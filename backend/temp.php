<?php
try { 
    dump(Modules\Project\Models\Project::whereHas('faculty', function($sub){ 
        $sub->where('users.id', 1); 
    })->get()->toArray()); 
} catch (\Exception $e) { 
    dump($e->getMessage()); 
}
