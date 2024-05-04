import { Secret, SignOptions } from 'jsonwebtoken';

export interface IJwtConfigInterface {
  secretOrKey: Secret;
  signOptions: SignOptions;
}
