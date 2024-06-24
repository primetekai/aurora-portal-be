import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import {
  GOOGLE_APP_CLIENT_ID,
  GOOGLE_APP_CLIENT_SECRET,
  GOOGLE_APP_REDIRECT_LOGIN,
} from 'src/config';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private _: AuthService) {
    super({
      clientID: GOOGLE_APP_CLIENT_ID,
      clientSecret: GOOGLE_APP_CLIENT_SECRET,
      callbackURL: GOOGLE_APP_REDIRECT_LOGIN,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    const user = {
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      picture: photos?.[0]?.value,
    };

    const payload = {
      user,
      accessToken,
    };

    done(null, payload);
  }
}
