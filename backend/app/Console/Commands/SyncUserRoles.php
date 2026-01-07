<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Administrador;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class SyncUserRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:sync-roles';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza los roles de spatie basándose en el campo tipo de cada usuario';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Sincronizando roles de usuarios...');
        $this->newLine();

        $users = User::all();
        $synced = 0;
        $skipped = 0;

        foreach ($users as $user) {
            $currentRoles = $user->getRoleNames()->toArray();

            if (!empty($currentRoles)) {
                $this->line("- {$user->nombre} ({$user->email}) -> Ya tiene roles: " . implode(', ', $currentRoles));
                $skipped++;
                continue;
            }

            // Determinar rol a asignar basado en el tipo
            $roleToAssign = null;

            switch ($user->tipo) {
                case 'administrador':
                    // Verificar si es super admin
                    $admin = Administrador::where('usuario_id', $user->usuario_id)->first();
                    if ($admin && $admin->nivel === 'super') {
                        $roleToAssign = 'super_admin';
                    } else {
                        $roleToAssign = 'administrador';
                    }
                    break;
                case 'empleado':
                    $roleToAssign = 'empleado';
                    break;
                case 'proveedor':
                    $roleToAssign = 'proveedor';
                    break;
            }

            if ($roleToAssign) {
                $role = Role::where('name', $roleToAssign)->first();
                if ($role) {
                    $user->assignRole($role);
                    $this->info("✓ {$user->nombre} ({$user->email}) -> Rol asignado: {$roleToAssign}");
                    $synced++;
                } else {
                    $this->error("✗ {$user->nombre} ({$user->email}) -> Rol '{$roleToAssign}' no existe");
                }
            } else {
                $this->warn("? {$user->nombre} ({$user->email}) -> Tipo desconocido: {$user->tipo}");
            }
        }

        $this->newLine();
        $this->info("Sincronización completada: {$synced} asignados, {$skipped} omitidos");

        return Command::SUCCESS;
    }
}
