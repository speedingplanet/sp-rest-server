const data = require('./data/banking-data.json');
const { gql, ApolloServer } = require('apollo-server');
const lodash = require('lodash');
const fs = require('fs-extra');

const saveFile = './data/banking-data.json';

const typeDefs = gql`
  type Address {
    street: String
    city: String
    state: String
    zip: String
  }

  enum CategoryType {
    income
    expense
  }

  type Category {
    id: String
    version: Int
    active: Boolean
    categoryName: String
    categoryType: CategoryType
    payees: [Payee]
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

  input PersonInput {
    firstName: String!
    lastName: String!
    gender: String
    dateOfBirth: String
    address: AddressInput
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
    category: Category
  }

  input PayeeInput {
    payeeName: String!
    address: AddressInput
    categoryId: String
    image: String
    motto: String
  }

  input CategoryInput {
    id: String
    version: Int
    active: Boolean
    categoryName: String!
    categoryType: CategoryType
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
    getCategories: [Category]
    getCategoryById(id: String!): Category
  }

  type Mutation {
    addPayee(payee: PayeeInput): Payee
    addCategory(
      categoryName: String!
      categoryType: CategoryType = expense
    ): Category
    addCategoryInput(category: CategoryInput): Category
    addPerson(person: PersonInput): Person
  }
`;

const { people, payees, categories } = data;

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
};

const ids = {};

function getNextId(key, collection = []) {
  if (!ids[key]) {
    const localIds = collection.map(item => Number(item.id));
    localIds.sort((a, b) => a - b);
    ids[key] = localIds[localIds.length - 1];
    if ([NaN, undefined, null].includes(ids[key])) ids[key] = 0;
  }
  return ++ids[key] + '';
}

const saveAlwaysPlugin = {
  requestDidStart() {
    return {
      willSendResponse(request) {
        if (request.operation.operation === 'mutation') {
          // console.log(request);
          // console.log('last person', lodash.last(people));
          console.log('willSendResponse');
          persist();
        }
      },
    };
  },
};

function persist() {
  console.log('persist');
  fs.writeJson(saveFile, data, {spaces: 2})
    .then(() => {
      console.log('Successfully persisted banking data');
    })
    .catch(error => {
      console.error('ERROR: could not persist file: ', error);
    });
}

const resolvers = {
  Mutation: {
    addPayee: (parent, { payee }) => {
      const defaultPayee = {
        active: true,
        version: 1,
      };

      const newPayee = { ...defaultPayee, ...payee };
      newPayee.id = getNextId('payee', payees) + '';
      payees.push(newPayee);
      return newPayee;
    },
    addPerson: (parent, { person }) => {
      console.log('addPerson');
      const defaultPerson = {
        active: true,
        version: 1,
      };

      const newPerson = { ...defaultPerson, ...person };
      newPerson.id = getNextId('person', people) + '';
      people.push(newPerson);
      return newPerson;
    },
    addCategoryInput: (parent, { category }) => {
      const defaultCategory = {
        active: true,
        version: 1,
        categoryType: 'expense',
      };

      const newCategory = { ...defaultCategory, ...category };
      newCategory.id = getNextId('category', categories);

      categories.push(newCategory);
      return newCategory;
    },
    addCategory: (parent, { categoryName, categoryType }) => {
      const category = {
        categoryName,
        categoryType,
        active: true,
        version: 1,
        id: getNextId('category', categories),
      };
      categories.push(category);
      return category;
    },
  },
  Category: {
    payees: category => {
      return payees.filter(payee => payee.categoryId === category.id);
    },
  },
  Payee: {
    category: (payee, args, context, info) => {
      // return categories.find(category => category.id === payee.categoryId);
      return resolvers.Query.getCategoryById(
        payee,
        { id: payee.categoryId },
        context,
        info,
      );
    },
  },
  Query: {
    getCategoryById: (_, { id }) => {
      // const id = args.id;
      return categories.find(cat => cat.id === id);
    },
    getCategories: () => {
      return categories;
    },
    searchPayees: (_, args) => {
      return lodash.filter(payees, payee =>
        lodash.isMatchWith(payee, args.criteria, customizer),
      );
    },
    getPeople: () => people,
    getPayees: (_, args) => {
      if (args.sortField === '') return payees;

      const sortedPayees = lodash.sortBy(payees, [args.sortField]);
      return sortedPayees;
    },
    getPersonById: (_, args) => {
      const found = people.find(person => {
        return person.id == args.id;
      });
      return found;
    },
    getPayeesByState: (_, { state }) => {
      const results = payees.filter(
        payee => payee.address && payee.address.state === state,
      );
      return results;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [saveAlwaysPlugin],
});

server.listen().then(config => {
  console.log('GraphQL started at ', config.url);
});
