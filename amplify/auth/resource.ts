import { defineAuth, secret } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('arn:aws:secretsmanager:eu-north-1:061039799078:secret:GOOGLE_CLIENT_ID'),
        clientSecret: secret('arn:aws:secretsmanager:eu-north-1:061039799078:secret:GOOGLE_CLIENT_SECRET'),
        scopes: ['profile', 'email', 'openid'],
        attributeMapping: {
          email: 'email'
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
    }
  },
});