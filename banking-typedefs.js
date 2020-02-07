/* eslint-disable no-irregular-whitespace */
const { gql } = require('apollo-server');

const typeDefs = gql`
  # Enums
  enum CategoryType {
    income
    expense
  }

  # Utility and Reusable Types
  type Address {
    street: String
    city: String
    state: String
    zip: String
  }

  # Data Types
  type Category {
    id: ID!
    version: Int
    active: Boolean
    categoryName: String!
    categoryType: CategoryType
    payees: [Payee]
  }

  type Person {
    id: ID!
    version: Int
    active: Boolean
    firstName: String!
    lastName: String!
    gender: String
    dateOfBirth: String
    address: Address
  }

  type Payee {
    id: ID!
    version: String
    active: Boolean
    payeeName: String!
    address: Address
    categoryId: String
    image: String
    motto: String
    category: Category
  }

  type Transaction {
    id: ID!
    version: Boolean
    deleted: Boolean
    payeeId: ID
    personId: ID
    categoryId: ID
    accountId: String
    txType: String
    txDate: String
    amount: Float
  }

  # Input types
  input PersonInput {
    firstName: String!
    lastName: String!
    gender: String
    dateOfBirth: String
    address: AddressInput
  }

  input PayeeSearchCriteria {
    payeeName: String
    categoryId: ID
    active: Boolean
    address: AddressInput
  }

  input PayeeInput {
    payeeName: String!
    address: AddressInput
    categoryId: ID
    image: String
    motto: String
  }

  input CategoryInput {
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

  # Reserved types
  type Query {
    getPeople: [Person]
    getPersonById(id: ID!): Person
    getPayees(sortField: String = ""): [Payee]
    getPayeeById(id: ID!): Payee
    getPayeesByState(state: String!): [Payee]
    searchPayees(criteria: PayeeSearchCriteria): [Payee]
    getCategories: [Category]
    getCategoryById(id: String!): Category
  }

  type Mutation {
    addCategory(category: CategoryInput): Category
    addCategoryArgs(categoryName: String!, categoryType: CategoryType = expense): Category
    addPayee(payee: PayeeInput): Payee
    addPerson(person: PersonInput): Person
  }
`;

module.exports = { typeDefs };
