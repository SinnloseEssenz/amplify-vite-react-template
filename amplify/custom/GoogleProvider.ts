import * as url from "node:url";
import { CDKContextKey } from "@aws-amplify/platform-core";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { secret } from "@aws-amplify/backend";

export type BackendSecret = ReturnType<typeof secret>;

export type GoogleProviderProps = {
  /**
   * Cognito User Pool to attach to
   */
  userPool: cognito.IUserPool;
  /**
   * Cognito User Pool client to use
   */
  userPoolClient: cognito.IUserPoolClient;
  /**
   * Google OAuth Client ID
   */
  clientId: BackendSecret;
  /**
   * Google OAuth Client Secret
   */
  clientSecret: BackendSecret;
};

export class GoogleProvider extends Construct {
  public api: apigateway.RestApi;
  public apiUrl: string;
  public provider: cognito.UserPoolIdentityProviderOidc;
  private backendIdentifier = {
    name: this.node.tryGetContext(CDKContextKey.BACKEND_NAME),
    namespace: this.node.tryGetContext(CDKContextKey.BACKEND_NAMESPACE),
    type: this.node.tryGetContext(CDKContextKey.DEPLOYMENT_TYPE),
  };

  constructor(scope: Construct, id: string, props: GoogleProviderProps) {
    super(scope, id);

    // Lambda functions
    const userLambda = new lambda.NodejsFunction(this, "UserLambda", {
      entry: url.fileURLToPath(new URL("./api/google-user.ts", import.meta.url)),
      runtime: Runtime.NODEJS_18_X,
    });

    const tokenLambda = new lambda.NodejsFunction(this, "TokenLambda", {
      entry: url.fileURLToPath(new URL("./api/google-token.ts", import.meta.url)),
      runtime: Runtime.NODEJS_18_X,
    });

    const privateLambda = new lambda.NodejsFunction(this, "PrivateLambda", {
      entry: url.fileURLToPath(new URL("./api/google-private.ts", import.meta.url)),
      runtime: Runtime.NODEJS_18_X,
    });

    // Setup API Gateway
    const apiGoogleGateway = new apigateway.RestApi(this, "APIGateway", {
      restApiName: "Google API Gateway",
      description: "This is for Google API Login",
      deployOptions: {
        stageName: "prod",
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["*"],
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Setup Resource Routes
    const userResource = apiGoogleGateway.root.addResource("user");
    const userIntegration = new apigateway.LambdaIntegration(userLambda);
    userResource.addMethod("GET", userIntegration);

    const tokenResource = apiGoogleGateway.root.addResource("token");
    const tokenIntegration = new apigateway.LambdaIntegration(tokenLambda);
    tokenResource.addMethod("POST", tokenIntegration);

    const userPoolAuthorizer = new apigateway.CfnAuthorizer(
      this,
      "UserPoolAuthorizerGoogle",
      {
        name: "UserPoolAuthorizer",
        restApiId: apiGoogleGateway.restApiId,
        type: "COGNITO_USER_POOLS",
        providerArns: [props.userPool.userPoolArn],
        identitySource: "method.request.header.Authorization",
      }
    );

    // Protected Private route
    const privateResource = apiGoogleGateway.root.addResource("private");
    const privateIntegration = new apigateway.LambdaIntegration(privateLambda);
    privateResource.addMethod("GET", privateIntegration, {
      authorizer: { authorizerId: userPoolAuthorizer.ref },
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Setup Google Identity Provider
    const googleIdentityProvider = new cognito.UserPoolIdentityProviderOidc(
      this,
      "GoogleProvider",
      {
        clientId: props.clientId
          .resolve(this, this.backendIdentifier)
          .unsafeUnwrap(),
        clientSecret: props.clientSecret
          .resolve(this, this.backendIdentifier)
          .unsafeUnwrap(),
        userPool: props.userPool,
        issuerUrl: "https://accounts.google.com",
        attributeRequestMethod: cognito.OidcAttributeRequestMethod.GET,
        name: "Google",
        endpoints: {
          authorization: "https://accounts.google.com/o/oauth2/v2/auth",
          jwksUri: apiGoogleGateway.url + "token",
          token: apiGoogleGateway.url + "token",
          userInfo: apiGoogleGateway.url + "user",
        },
        attributeMapping: {
          email: cognito.ProviderAttribute.other("email"),
          preferredUsername: cognito.ProviderAttribute.other("name"),
          profilePicture: cognito.ProviderAttribute.other("picture"),
        },
        scopes: ["openid", "email", "profile"],
      }
    );

    // Add the new identity provider to the user pool client
    const userPoolClient = props.userPoolClient.node
      .defaultChild as cognito.CfnUserPoolClient;
    userPoolClient.supportedIdentityProviders = [
      ...(userPoolClient.supportedIdentityProviders || []),
      googleIdentityProvider.providerName,
    ];

    this.api = apiGoogleGateway;
    this.apiUrl = apiGoogleGateway.url;
    this.provider = googleIdentityProvider;
  }
}
