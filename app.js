const express = require('express');
const axios = require('axios');

const app = express();

const config = {
  client: {
    id: "",
    secret: "",
    redirect_url: "http://localhost:3000",
    state: "rand_string_123"
  },
  auth: {
    tokenHost: 'https://your-project.authgearapps.com',
    tokenPath: '/oauth2/token',
    authorizePath: '/oauth2/authorize',
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
      scope: "openid",
      state: config.client.state
    };

    try {
      const getToken = await axios.post(`${config.auth.tokenHost}${config.auth.tokenPath}`, data, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      const accessToken = getToken.data.access_token;
      console.log(accessToken);

      //Now use access token to get user info.
      const getUserInfo = await axios.get(`${config.auth.tokenHost}/oauth2/userinfo`, { headers: { "Authorization": "Bearer " + accessToken } });
      const userInfo = getUserInfo.data;
      res.send(`
        <div style="max-width: 650px; margin: 16px auto; background-color: #EDEDED; padding: 16px;">
          <p>Welcome ${userInfo.email}</p>
          <p>This demo app shows you how to add user authentication to your Express app using Authgear</p>
            <p>Checkout <a href="https://docs.authgear.com">docs.authgear.com</a> to learn more about adding Authgear to your apps.</p>
          
        </div>
    `);
    } catch (error) {
      console.log(error);
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
  res.redirect(`${config.auth.tokenHost}${config.auth.authorizePath}/?client_id=${config.client.id}&redirect_uri=${config.client.redirect_url}&state=${config.client.state}&response_type=code&scope=openid`);
});

app.listen(3000, () => {
  console.log("server started!");
});

