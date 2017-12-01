const axios = require('axios');
const _ = require('lodash');
const request = require('request')
const jsonfile = require('jsonfile');

// User to search against
const twitterUser = 'jamez14';

const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;
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
    `https://api.twitter.com/1.1/followers/list.json?cursor=${cursor ? cursor : -1}&screen_name=${twitterUser}&skip_status=true&include_user_entities=false&count=200`;

  return axios
    .get(followersApiUrl, {
      headers: { Authorization: `Bearer ${oauthHeader}` },
    })
    .then((response) => {
      if (response.status === 200) {
        const nextCursor = response.data.next_cursor;
        const users = response.data.users;

        const usersArr= _.map(users, (user) => {
          return {
            handle: user.screen_name,
            followers_count: user.followers_count
          };
        });

        followers = followers.concat(usersArr);

        if (nextCursor !== 0) {
          getUserFollowers(nextCursor);
        } else {
          const followersSorted = _.sortBy(followers, f => f.followers_count);
          jsonfile.writeFile('output.json', followersSorted, function (err) {
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
