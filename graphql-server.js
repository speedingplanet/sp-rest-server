const { ApolloServer } = require('apollo-server');
const { typeDefs } = require('./banking-typedefs');
const { resolvers } = require('./banking-resolvers');

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.listen().then(config => {
  console.log('🚀 Apollo/GraphQL Server started at ', config.url);
});
