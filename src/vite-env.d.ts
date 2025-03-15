/// <reference types="vite/client" />

import { signInWithRedirect } from 'aws-amplify/auth';

// Sign in with Google
await signInWithRedirect({ provider: 'Google' });
