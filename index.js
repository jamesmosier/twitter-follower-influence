const axios = require('axios');
const _ = require('lodash');
const request = require('request')
const jsonfile = require('jsonfile');

const consumer_key = 'YOUR_CONSUMER_KEY';
const consumer_secret = 'YOU_CONSUMER_SECRET';
const encode_secret = new Buffer(`${consumer_key}:${consumer_secret}`).toString(
  'base64'
);

let oauthHeader = null;

const options = {
  url: 'https://api.twitter.com/oauth2/token',
  headers: {
    Authorization: 'Basic ' + encode_secret,
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  },
  body: 'grant_type=client_credentials',
};

request.post(options, (error, response, body) => {
  const resp = JSON.parse(body);
  oauthHeader = resp.access_token;

  getUserFollowers();
});

let followers = [];

function getUserFollowers(cursor) {
  const followersApiUrl =
    `https://api.twitter.com/1.1/followers/list.json?cursor=${cursor ? cursor : -1}&screen_name=jamez14&skip_status=true&include_user_entities=false&count=200`;

  return axios
    .get(followersApiUrl, {
      headers: { Authorization: `Bearer ${oauthHeader}` },
    })
    .then((response) => {
      if (response.status === 200) {
        const nextCursor = response.data.next_cursor;
        const users = response.data.users;

        const output = _.sortBy(users, u => u.followers_count);

        const usersArr= _.map(output, (user) => {
          return {
            handle: user.screen_name,
            follower_count: user.followers_count
          };
        });

        followers = followers.concat(usersArr);

        if (nextCursor !== 0) {
          getUserFollowers(nextCursor);
        } else {
          jsonfile.writeFile('output.json', followers, function (err) {
            if (err) {
              console.error(err);
            }
          })
        }
      } else {
        console.error(`Request was not sucessful, received a status code of: ${response.status}`)
      }
    })
    .catch((e) => {
      console.error('Error getting user followers', e);
    });
}
