const data = require('./data/banking-data.json');
const lodash = require('lodash');
const fs = require('fs-extra');

const saveAlwaysPlugin = {
  requestDidStart() {
    return {
      willSendResponse(request) {
        if (request.operation.operation === 'mutation') {
          console.log('willSendResponse');
          persist();
        }
      },
    };
  },
};

function persist(data, file = './data/banking-data.json') {
  fs.writeJson(file, data, { spaces: 2 })
    .then(() => {
      console.log('Successfully persisted banking data');
    })
    .catch(error => {
      console.error('ERROR: could not persist file: ', error);
    });
}

const { people, payees, categories } = data;

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

function buildCustomizer(partialMatchFields = []) {
  const customizer = (objValue, srcValue, key) => {
    if (typeof objValue === 'object') {
      return lodash.isMatchWith(objValue, srcValue, customizer);
    }
    if (partialMatchFields.includes(key)) {
      return objValue.toUpperCase().includes(srcValue.toUpperCase());
    } else {
      return lodash.isMatch(objValue, srcValue);
    }
  };

  return customizer;
}

function buildGetById(collection, idField = 'id') {
  return (_, { id }) => collection.find(item => item.id === id);
}

function buildGetAll(collection) {
  return (_, { sortField = '' }) => {
    return lodash.sortBy(collection, sortField);
  };
}

function buildAdd(collection, item, defaults) {
  return (_, args) => {
    const newItem = { ...defaults, ...args[item] };
    newItem.id = getNextId(item, collection);
    collection.push(newItem);
    persist(data);
    return newItem;
  };
}

const defaultCategory = {
  active: true,
  version: 1,
  categoryType: 'expense',
};

const defaultPayee = {
  active: true,
  version: 1,
};

const defaultPerson = {
  active: true,
  version: 1,
};

const resolvers = {
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
  Mutation: {
    addCategory: buildAdd(categories, 'category', defaultCategory),
    addCategoryArgs: (parent, { categoryName, categoryType }) => {
      const category = {
        categoryName,
        categoryType,
        active: true,
        version: 1,
        id: getNextId('category', categories),
      };
      categories.push(category);
      persist(data);
      return category;
    },
    addPayee: buildAdd(payees, 'payee', defaultPayee),
    addPerson: buildAdd(people, 'person', defaultPerson),
  },
  Query: {
    getCategories: buildGetAll(categories),
    getCategoryById: buildGetById(categories),
    getPayees: buildGetAll(payees),
    getPayeesByState: (_, { state }) => {
      const results = payees.filter(
        payee => payee.address && payee.address.state === state,
      );
      return results;
    },
    getPayeeById: buildGetById(payees),
    searchPayees: (_, args) => {
      return lodash.filter(payees, payee =>
        lodash.isMatchWith(
          payee,
          args.criteria,
          buildCustomizer(['payeeName', 'street', 'city']),
        ),
      );
    },
    getPeople: buildGetAll(people),
    getPersonById: buildGetById(people),
  },
};

module.exports = {
  resolvers,
  saveAlwaysPlugin,
  utilities: {
    buildCustomizer,
    getNextId,
    persist,
  },
};
