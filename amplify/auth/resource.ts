import { defineAuth, secret } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['profile', 'email', 'openid'],
        attributeMapping: {
          email: 'email',
          givenName: 'name',
          profilePicture: 'picture'
        }
      },
      callbackUrls: [
        'http://localhost:5173/',
        'https://journalcoach.org/',
        'https://www.journalcoach.org/'
      ],
      logoutUrls: [
        'http://localhost:5173/',
        'https://journalcoach.org/',
        'https://www.journalcoach.org/'
      ],
    }
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    givenName: {
      required: false,
      mutable: true,
    },
    profilePicture: {
      required: false,
      mutable: true,
    }
  },
});