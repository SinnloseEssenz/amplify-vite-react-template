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
          preferredUsername: 'name',
          profilePicture: 'picture'
        }
      },
      callbackUrls: [
        'http://localhost:5173/',
        'http://localhost:5173/'
      ],
      logoutUrls: ['http://localhost:5173/', 'http://localhost:5173/'],
    }
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    preferredUsername: {
      required: false,
      mutable: true,
    },
    profilePicture: {
      required: false,
      mutable: true,
    },
  },
});