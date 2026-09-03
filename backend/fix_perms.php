<?php
$users = DB::table('users')->where('role', 'faculty')->get();
foreach($users as $user) {
    $perms = json_decode($user->permissions, true);
    $perms[] = 'project.client_requirements.view';
    $perms[] = 'project.client_requirements.create';
    $perms[] = 'project.client_requirements.update';
    $perms = array_values(array_unique($perms));
    DB::table('users')->where('id', $user->id)->update(['permissions' => json_encode($perms)]);
}
echo "done\n";
