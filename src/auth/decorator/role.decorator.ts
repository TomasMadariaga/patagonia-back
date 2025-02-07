import { SetMetadata } from '@nestjs/common';
import { Role } from '../../user/enum/role.enum';

// Clave que usará el reflector para obtener los roles
export const ROLES_KEY = 'roles';

// Decorador que asigna los roles necesarios a un controlador o método
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
