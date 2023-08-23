const express = require('express');
const axios = require('axios');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

const config = {
  client: {
    id: process.env.CLIENT_ID,
    secret: process.env.CLIENT_SECRET,
    redirect_url: process.env.REDIRECT_URL
  },
  auth: {
    tokenHost: process.env.AUTHGEAR_ENDPOINT,
    tokenPath: '/oauth2/token',
    authorizePath: '/oauth2/authorize'
  },
};

app.get("/", async (req, res) => {

  if (req.query.code != null) {
    const data = {
      client_id: config.client.id,
      client_secret: config.client.secret,
      code: req.query.code,
      grant_type: 'authorization_code',
      response_type: 'code',
      redirect_uri: config.client.redirect_url,
      scope: "openid"
    };

    try {
      const getToken = await axios.post(`${config.auth.tokenHost}${config.auth.tokenPath}`, data, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      const accessToken = getToken.data.access_token;

      //Now use access token to get user info.
      const getUserInfo = await axios.get(`${config.auth.tokenHost}/oauth2/userinfo`, { headers: { "Authorization": "Bearer " + accessToken } });
      const userInfo = getUserInfo.data;
      res.send(`
        <div style="max-width: 650px; margin: 16px auto; background-color: #EDEDED; padding: 16px;">
          <p>Welcome ${userInfo.email}</p>
          <p>This demo app shows you how to add user authentication to your Express app using Authgear</p>
          <div>
            <pre>${JSON.stringify(userInfo, null, 2)}</pre>
          </div>
            <p>Checkout <a href="https://docs.authgear.com">docs.authgear.com</a> to learn more about adding Authgear to your apps.</p>
          
        </div>
    `);
    } catch (error) {
      res.send("An error occoured! Login could not complete. Error data: " + error);
    }
  }

  else {
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

app.get("/login", (req, res) => {
  res.redirect(`${config.auth.tokenHost}${config.auth.authorizePath}/?client_id=${config.client.id}&redirect_uri=${config.client.redirect_url}&response_type=code&scope=openid`);
});

app.listen(port, () => {
  console.log(`server started on port ${port}!`);
});

