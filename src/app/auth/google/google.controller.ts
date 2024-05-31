import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import {
  GOOGLE_APP_CLIENT_ID,
  GOOGLE_APP_CLIENT_SECRET,
  GOOGLE_APP_REDIRECT_LOGIN,
} from 'src/config';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private authService: AuthService) {
    super({
      clientID: GOOGLE_APP_CLIENT_ID,
      clientSecret: GOOGLE_APP_CLIENT_SECRET,
      callbackURL: GOOGLE_APP_REDIRECT_LOGIN,
      passReqToCallback: true,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { email, name, picture } = profile._json;
    const user = {
      email,
      name,
      picture,
    };
    done(null, user);
  }
}
