import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/users.model';

type RequestWithAuthToken = Request & {
  headers: {
    authorization?: string;
    cookie?: string;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(dto: CreateUserDto) {
    const user = await this.validateUser(dto);

    return this.generateToken(user);
  }

  async registration(dto: CreateUserDto) {
    const isUserExists = await this.usersService.getUserByEmail(dto.email);

    if (isUserExists) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      ...dto,
      password: hashedPassword,
    });

    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = { email: user.email, id: user.id };

    return {
      token: this.jwtService.sign(payload),
    };
  }

  private async validateUser(dto: CreateUserDto) {
    const user = await this.usersService.getUserByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException({ message: 'Invalid email' });
    }

    const isPasswordEquals = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordEquals) {
      throw new UnauthorizedException({ message: 'Invalid password' });
    }

    return user;
  }

  async getUserFromAuthHeader(authHeader: string): Promise<User> {
    try {
      const token = authHeader.split(' ')[1];
      const { id, ...rest } = this.jwtService.verify(token);
      const user = await this.usersService.getById(+id);

      return user;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }

  getUserFromRequest(req: RequestWithAuthToken) {
    try {
      let authToken = null;
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        const authCookie = this.getCookie('Authorization', req.headers.cookie);

        if (!authCookie) {
          throw new UnauthorizedException({ message: 'Invalid auth token' });
        }

        authToken = authCookie;
      } else {
        const [bearer, token] = authHeader.split(' ');

        if (bearer !== 'Bearer' || !token) {
          throw new UnauthorizedException({ message: 'Invalid token' });
        }

        authToken = token;
      }

      return this.jwtService.verify(authToken);
    } catch (e) {
      throw new UnauthorizedException({ message: 'Unauthorized' });
    }
  }

  getCookie(name: string, cookie: string): string {
    const matches = cookie.match(
      new RegExp(
        '(?:^|; )' +
          name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
          '=([^;]*)',
      ),
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }
}
