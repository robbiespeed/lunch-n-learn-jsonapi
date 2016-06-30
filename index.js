const fortune = require('fortune');
const jsonApiSerializer = require('fortune-json-api');
const nedbAdapter = require('fortune-nedb');
const http = require('http');

const models = {
  user: {
    name: { type: String },

    // Following and followers are inversely related (many-to-many).
    following: { link: 'user', inverse: 'followers', isArray: true },
    followers: { link: 'user', inverse: 'following', isArray: true }, 

    // Many-to-one relationship of user posts to post author.
    posts: { link: 'post', inverse: 'author', isArray: true }
  },
  post: {
    message: { type: String },
    date: { type: Date },
    
    // One-to-many relationship of post author to user posts.
    author: { link: 'user', inverse: 'posts' }
  }
};

const transforms = {
  post: [
    (context, record, update) => {
      const method = context.request.method;

      if (method === 'create') {
        record.date = new Date();
        return record;
      }

      return update || null;
    },
    (context, record) => {
      record.date = record.date && record.date.toLocaleString();
      return record;
    }
  ]
};

const store = fortune(models, {
  adapter: [ nedbAdapter, { dbPath: 'data/example' } ],
  transforms
});

const listener = fortune.net.http(store, {
  serializers: [
    [ jsonApiSerializer ]
  ]
});

const server = http.createServer(listener);

store.connect().then(() => server.listen(1337));
