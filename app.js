const express = require('express');
const axios = require("axios");
const session = require("express-session");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "your_strong_secret_key", // Replace with a strong, randomly generated secret
    cookie: {},
  })
);

const refreshAccessTokenIfExpired = async (refreshToken, expiresAt, req) => {
  const currentTime = (new Date(Date.now()).getTime());
  if (expiresAt<currentTime) {
      const tokenUrl = new URL("/oauth2/token", process.env.AUTHGEAR_ENDPOINT);
      const data = {
          client_id: process.env.AUTHGEAR_CLIENT_ID,
          client_secret: process.env.AUTHGEAR_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: refreshToken
        };

        try {
          const getToken = await axios.post(tokenUrl, data, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });
      
          const accessToken = getToken.data.access_token;
          const expiresAt = new Date(Date.now()).getTime() + getToken.data.expires_in * 1000;
      
          req.session.access_token = accessToken;
          req.session.expire_at = expiresAt;
          return accessToken;
        } catch (error) {
          throw new Error('Failed to refresh access token: ' + error);
        }
  } else {
      return req.session.access_token;
  }
};

app.get("/", async (req, res) => {
  if (req.session.access_token != null) {
    const accessToken = await refreshAccessTokenIfExpired(req.session.refresh_token, req.session.expire_at, req);
    //Now use access token to get user info.
    try {
          const userInfoUrl = new URL(
              "/oauth2/userinfo",
              process.env.AUTHGEAR_ENDPOINT
            );
            const getUserInfo = await axios.get(userInfoUrl, {
              headers: { Authorization: "Bearer " + accessToken },
            });
            const userInfo = getUserInfo.data;
            res.send(`
                <div style="max-width: 650px; margin: 16px auto; background-color: #EDEDED; padding: 16px;">
                  <p>Welcome ${userInfo.email}</p>
                  <p>User Info:</p>
                  <div>
                    <pre>${JSON.stringify(userInfo, null, 2)}</pre>
                  </div>
                    <p> 
                        <a href="/logout">Logout</a>
                    </p>
                </div>
            `);
      }
      catch (error) {
          res.send("Unable to get User Info: " + error);
      }
    } else {
      res.send(`
              <div style="max-width: 650px; margin: 16px auto; background-color: #EDEDED; padding: 16px;">
                <p>Hi there!</p>
                <p>This demo app shows you how to add user authentication to your Express app using Authgear</p>
                  <p>Checkout <a href="https://docs.authgear.com">docs.authgear.com</a> to learn more about adding Authgear to your apps.</p>
                <a href="/login">Login</a>
              </div>
            `);
    }
  });

app.get("/login", async(req, res) => {
  const scopes = "openid offline_access";
  const authorizedUrl = new URL("/oauth2/authorize", process.env.AUTHGEAR_ENDPOINT);
  authorizedUrl.searchParams.set('client_id', process.env.AUTHGEAR_CLIENT_ID);
  authorizedUrl.searchParams.set('redirect_uri', process.env.AUTHGEAR_REDIRECT_URL);
  authorizedUrl.searchParams.set('response_type', 'code');
  authorizedUrl.searchParams.set('scope', scopes);
  res.redirect(authorizedUrl);
});

app.get("/auth-redirect", async(req, res) => {
  if (req.query.code != null) {
    const data = {
      client_id: process.env.AUTHGEAR_CLIENT_ID,
      client_secret: process.env.AUTHGEAR_CLIENT_SECRET,
      code: req.query.code,
      grant_type: 'authorization_code',
      response_type: 'code',
      redirect_uri: process.env.AUTHGEAR_REDIRECT_URL
    };

    try {
      const tokenUrl = new URL("/oauth2/token", process.env.AUTHGEAR_ENDPOINT);
      const getToken = await axios.post(tokenUrl, data, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      const accessToken = getToken.data.access_token;

      req.session.access_token = accessToken;
      req.session.expire_at = new Date(Date.now()).getTime() + getToken.data.expires_in * 1000;
      req.session.refresh_token = getToken.data.refresh_token;
      res.redirect("/");

    } catch (error) {
      res.send("An error occurred! Login could not complete. Error data: " + error);
    }
  } else {
    res.send("No Authorization code in URL");
  }
});

app.get("/logout", async (req, res) => {
  const accessToken = req.session.access_token;
  const endSessionUrl = new URL(
    "/oauth2/end_session",
    process.env.AUTHGEAR_ENDPOINT
  );
  endSessionUrl.searchParams.set("post_logout_redirect_uri", "http://localhost:3000");
  
  // Remove access token, and refresh token from express-session
  req.session.destroy();
  
  res.set("Authorization", "Bearer " + accessToken);
  res.redirect(endSessionUrl);
});

app.listen(port, () => {
    console.log(`server started on port ${port}!`);
});