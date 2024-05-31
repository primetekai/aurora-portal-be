import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  FACEBOOK_APP_CLIENT_ID,
  FACEBOOK_APP_CLIENT_SECRET,
  FACEBOOK_APP_REDIRECT_LOGIN,
} from 'src/config';
import { Profile, Strategy } from 'passport-facebook';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private _: AuthService) {
    super({
      clientID: FACEBOOK_APP_CLIENT_ID,
      clientSecret: FACEBOOK_APP_CLIENT_SECRET,
      callbackURL: FACEBOOK_APP_REDIRECT_LOGIN,
      profileFields: ['name', 'emails'],
      scope: 'email',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void,
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
