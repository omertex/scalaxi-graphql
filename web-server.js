const { introspectSchema, makeRemoteExecutableSchema, ApolloServer, gql } = require("apollo-server");
const { mergeSchemas } = require('graphql-tools');
const { setContext } = require('apollo-link-context');
const { HttpLink } = require('apollo-link-http');
const fetch = require('node-fetch');

let server;

let hasuraRemoteSchema;
let usersRemoteSchema;

async function initialize() {
  const typeDefs =  gql`
    extend type goals {
      created_by: User!
      delegated_to: User
      reviewer: User
      verifier: User
    }
    extend type User {
      fullName: String
    }
    `;

  const resolvers = {
    User: {
      fullName: {
        fragment: `fragment UserFragment on User { firstName, lastName }`,
        resolve (parent, args, context, info) {
          return `${parent.firstName} ${parent.lastName}`
        }
      }
    },
    goals: {
      created_by: {
        fragment: `fragment goalsFragment on goals { created_by_id }`,
        resolve (parent, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: usersRemoteSchema,
            operation: 'query',
            fieldName: 'user',
            args: {
              id: +parent.created_by_id,
            },
            context,
            info,
          })
        }
      },
      delegated_to: {
        fragment: `fragment goalsFragment on goals { delegated_to_id }`,
        resolve (parent, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: usersRemoteSchema,
            operation: 'query',
            fieldName: 'user',
            args: {
              id: parent.delegated_to_id ? +parent.delegated_to_id : 0,
            },
            context,
            info,
          })
        }
      },
      reviewer: {
        fragment: `fragment goalsFragment on goals { reviewer_id }`,
        resolve (parent, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: usersRemoteSchema,
            operation: 'query',
            fieldName: 'user',
            args: {
              id: parent.reviewer_id ? +parent.reviewer_id : 0,
            },
            context,
            info,
          })
        }
      },
      verifier: {
        fragment: `fragment goalsFragment on goals { verifier_id }`,
        resolve (parent, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: usersRemoteSchema,
            operation: 'query',
            fieldName: 'user',
            args: {
              id: parent.verifier_id ? +parent.verifier_id : 0,
            },
            context,
            info,
          })
        }
      }
    },
  };

  const hasuraHttp = new HttpLink({ uri: 'https://scalaxi-hasura.herokuapp.com/v1/graphql', fetch });
  const hasuraLink = setContext((request, previousContext) => {
    return { headers:
      (request.operationName === "IntrospectionQuery") ?
      { 'x-hasura-admin-secret': 'Scalaxi1' } :
      {'Authorization': previousContext.graphqlContext.authKey }
    };
  }).concat(hasuraHttp);

  const usersHttp = new HttpLink({ uri: 'https://scalaxi-users.herokuapp.com/graphql', fetch });
  const usersLink = setContext((request, previousContext) => {
    if (previousContext.graphqlContext && previousContext.graphqlContext.authKey) {
      return { headers: {'Authorization': previousContext.graphqlContext.authKey } };
    }
  }).concat(usersHttp);

  const hasuraSchema = await introspectSchema(hasuraLink);
  hasuraRemoteSchema = makeRemoteExecutableSchema({ schema: hasuraSchema, link: hasuraLink });

  const usersSchema = await introspectSchema(usersLink);
  usersRemoteSchema = makeRemoteExecutableSchema({ schema: usersSchema, link: usersLink });

  const resultSchema = mergeSchemas({ schemas:[hasuraRemoteSchema, usersRemoteSchema, typeDefs], resolvers });

  server = new ApolloServer({ schema: resultSchema, context: ({ req }) => {
    return { authKey:  req.headers.authorization };
  }});

  // The `listen` method launches a web server.
  server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });
}

function close() {
  return new Promise((resolve, reject) => {
    server.stop((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

module.exports = {
  initialize, close
}