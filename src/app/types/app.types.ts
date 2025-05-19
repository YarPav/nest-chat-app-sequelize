import { User } from '../../users/users.model';

export type RequestWithUser = Request & { user: User };
