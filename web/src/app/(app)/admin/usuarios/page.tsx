import type { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';
import { NewUserDialog } from '@/components/admin/new-user-dialog';
import { UserRowActions } from '@/components/admin/user-row-actions';
import { requireProfile } from '@/lib/current-profile';
import { readFailure } from '@/lib/data';
import { ROLE_LABEL, isRole, type Role } from '@/lib/profile';
import { ROLE_LIMIT, type ActiveCounts } from '@/lib/user-rules';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Usuarios · CRM-123' };

export default async function UsuariosPage() {
  const me = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, is_active, must_change_password')
    .order('role', { ascending: true })
    .order('full_name', { ascending: true })
    .order('id');
  if (error) return readFailure('usuarios', error);

  const users = (data ?? []).flatMap((row) => (isRole(row.role) ? [{ ...row, role: row.role as Role }] : []));
  const counts: ActiveCounts = { vendedor: 0, supervisor: 0 };
  for (const user of users) if (user.is_active) counts[user.role] += 1;

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="tag">
          Vendedores activos <b>{counts.vendedor} de {ROLE_LIMIT.vendedor}</b>
        </span>
        <span className="tag">
          Supervisores activos <b>{counts.supervisor} de {ROLE_LIMIT.supervisor}</b>
        </span>
        <span className="ml-auto">
          <NewUserDialog counts={counts} />
        </span>
      </div>

      <div className="panel">
        <table className="tbl">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Contraseña</th>
              <th>
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <span className="font-semibold">{user.full_name}</span>
                </td>
                <td>{user.email}</td>
                <td>{ROLE_LABEL[user.role]}</td>
                <td>{user.is_active ? <span className="tag won">Activo</span> : <span className="tag">Desactivado</span>}</td>
                <td>
                  {user.must_change_password ? (
                    <span className="tag warn">
                      <AlertTriangle className="i" size={12} aria-hidden="true" />
                      Cambio de contraseña pendiente
                    </span>
                  ) : (
                    <span className="text-ink-2">—</span>
                  )}
                </td>
                <td>
                  <UserRowActions
                    user={{ id: user.id, name: user.full_name, role: user.role, isActive: user.is_active }}
                    counts={counts}
                    isSelf={user.id === me.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
