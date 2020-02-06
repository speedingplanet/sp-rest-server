const data = require('./data/banking-data.json');
const { gql, ApolloServer } = require('apollo-server');
const lodash = require('lodash');

const typeDefs = gql`
  type Address {
    street: String
    city: String
    state: String
    zip: String
  }

  type Person {
    firstName: String
    lastName: String
    gender: String
    dateOfBirth: String
    id: String
    version: Int
    address: Address
    active: Boolean
  }

  type Payee {
    id: String
    version: String
    payeeName: String
    address: Address
    categoryId: String
    image: String
    motto: String
    active: Boolean
  }

  input AddressInput {
    street: String
    city: String
    state: String
    zip: String
  }

  input PayeeSearchCriteria {
    payeeName: String
    categoryId: String
    active: Boolean
    address: AddressInput
  }

  type Query {
    getPeople: [Person]
    getPayees(sortField: String = ""): [Payee]
    getPersonById(id: String!): Person
    getPayeesByState(state: String!): [Payee]
    searchPayees(criteria: PayeeSearchCriteria): [Payee]
  }
`;

const { people, payees } = data;

const partialKeys = ['payeeName', 'street', 'city'];

const customizer = (objValue, srcValue, key) => {
  if (typeof objValue === 'object') {
    return lodash.isMatchWith(objValue, srcValue, customizer);
  }
  if (partialKeys.includes(key)) {
    return objValue.toUpperCase().includes(srcValue.toUpperCase());
  } else {
    return lodash.isMatch(objValue, srcValue);
  }
}

const resolvers = {
  Query: {
    searchPayees: (context, args) => {
      return lodash.filter(payees, (payee) => lodash.isMatchWith(payee, args.criteria, customizer));
    },
    getPeople: () => people,
    getPayees: (context, args) => {
      if (args.sortField === '') return payees;

      const sortedPayees = lodash.sortBy(payees, [args.sortField]);
      return sortedPayees;
    },
    getPersonById: (parent, args) => {
      const found = people.find(person => person.id === args.id);
      return found;
    },
    getPayeesByState: (parent, { state }) => {
      const results = payees.filter(
        payee => payee.address && payee.address.state === state,
      );
      return results;
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(config => {
  console.log('GraphQL started at ', config.url);
});
