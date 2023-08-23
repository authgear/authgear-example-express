# An Example App For Adding User Authentication to Express with Authgear as the Identity Provider.

## What is Authgear?
Authgear is a secure authentication and user management platform. It uses OpenID Connect (OIDC) and OAuth 2.0 to identify who a user is and grant authorization to protected resources.

This example app uses Express JavaScript to create a simple web app that allows users to log in to their accounts and displays user info.

## How to Run the Project
Before you run this project on your local machine, sign up for a free Authgear account, create an Authgear app, and add the configuration to the app.js in the Express project.

For a more detailed step-by-step guild on how to use Authgear with Express, check out this post:
[https://docs.authgear.com/get-started/regular-web-app](https://docs.authgear.com/get-started/regular-web-app)

### Fill in the enviroment variables

Create `.env` file according to `.env_template` and fill in the configuration with info obtained from the Authgear Portal.

### Install dependency

```
yarn
```

### Start the server

```
yarn start
```