import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import {
  FACEBOOK_APP_CLIENT_ID,
  FACEBOOK_APP_CLIENT_SECRET,
  FACEBOOK_APP_REDIRECT_LOGIN,
} from 'src/config';
import { Strategy, VerifyCallback } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private authService: AuthService) {
    super({
      clientID: FACEBOOK_APP_CLIENT_ID,
      clientSecret: FACEBOOK_APP_CLIENT_SECRET,
      callbackURL: FACEBOOK_APP_REDIRECT_LOGIN,
      passReqToCallback: true,
      profileFields: ['id', 'emails', 'name'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      profile,
    };
    const payload = {
      user,
      accessToken,
    };

    console.log('hack_call_fb', profile);

    done(null, payload);
  }
}
