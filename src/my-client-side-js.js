import { signInWithRedirect } from 'aws-amplify/auth';

await signInWithRedirect({
  provider: {
    custom: 'MicrosoftEntraID'
  }
});