import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles-auth.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const requiredRoles: string[] = this.reflector.getAllAndOverride(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      // Если для доступа к роуту не требуются никакие роли - то разрешаем доступ
      if (!requiredRoles) {
        return true;
      }

      const req = context.switchToHttp().getRequest();
      const authHeader = req.headers.authorization;
      const [bearer, token] = authHeader.split(' ');

      if (bearer !== 'Bearer' || !token) {
        throw new UnauthorizedException({ message: 'Invalid token' });
      }

      const user = this.jwtService.verify(token);
      req.user = user;

      return user.roles.some((role) => requiredRoles.includes(role.value));
    } catch (e) {
      throw new ForbiddenException({ message: 'Not enough roles' });
    }
  }
}
