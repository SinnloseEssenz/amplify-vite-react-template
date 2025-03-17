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
          email: 'email'
        }
      },
      callbackUrls: [
        'https://6f512b82687c5296cd51.auth.eu-north-1.amazoncognito.com/oauth2/idpresponse',
        'https://auth.journalcoach.org/oauth2/idpresponse',
        'https://journalcoach.org/',
        'https://www.journalcoach.org/',
        'http://localhost:5173/'
      ],
      logoutUrls: [
        'https://journalcoach.org/',
        'https://www.journalcoach.org/',
        'http://localhost:5173/'
      ],
    }
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    }
  }
});