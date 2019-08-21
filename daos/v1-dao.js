/* eslint-disable no-fallthrough */

import axios from 'axios';
import * as _ from 'lodash';
import { stringify } from 'query-string';

// Internals

// Return true if found, false, if not, null if error
function checkPersonExists(person) {
  return axios
    .get(`${baseUrl}/${person.id}`)
    .then(() => true)
    .catch(err => {
      if (err.response) {
        return err.response === 404 ? false : null;
      } else {
        return null;
      }
    });
}

function handleError(error) {
  let message;
  if (error.response) {
    console.error(
      `Server error: ${error.response.status} [${error.response.statusText}]`,
    );
    if (error.response.status >= 500) {
      message = 'Server error';
    } else {
      switch (error.response.status) {
        case 404:
          message = 'Resource not found';
          break;
        case 401:
        case 403:
        case 405:
        case 407:
        case 423:
          message = 'Access / Authorization issues';
        case 400:
        case 406:
        case 409:
        case 410:
        case 411:
        case 412:
        case 413:
        case 414:
        case 415:
        case 416:
        case 417:
        case 422:
          message = 'Data format issues';
          break;
        default:
          message = 'Unspecified client-side issue';
      }
    }
  } else {
    console.error('Unknown error, no server response.');
  }

  return rejectPromise(message);
}

function rejectPromise(message, rest) {
  return Promise.reject({ message, ...rest });
}

// TODO: Pick this up from environment?
const baseUrl = 'http://localhost:8000/api/v1/banking/people';

// Standard methods
const addPerson = person => {
  if (_.has(person, 'id')) {
    return rejectPromise(
      'A Person with an id should not be added, but updated.',
    );
  }

  // Assume good faith otherwise. If the users abused this, or were confused,
  // we could put in more checks before adding this person
  return axios
    .post(`${baseUrl}`, person)
    .then(response => response.data)
    .catch(handleError);
};

const removePerson = async person => {
  const personExists = await checkPersonExists(person);
  if (_.isNull(personExists)) {
    return rejectPromise(`Could not determine if person #${person.id} exists.`);
  }

  if (!personExists) {
    return rejectPromise(`Person #${person.id} does not exist!`);
  }

  return axios
    .patch(`${baseUrl}/${person.id}`, { ...person, active: false })
    .then(response => response.data)
    .catch(handleError);
};

const updatePerson = async (person, upsert = false) => {
  const personExists = await checkPersonExists(person);
  if (_.isNull(personExists)) {
    return rejectPromise(`Could not determine if person #${person.id} exists.`);
  }

  if (!personExists && !upsert) {
    return rejectPromise(`Person #${person.id} does not exist!`);
  }

  if (!personExists && upsert) {
    console.warn(
      `Person #${person.id} did not exist. Wiping ID and inserting.`,
    );
    delete person.id;
    return addPerson(person);
  }

  return axios
    .patch(`${baseUrl}/${person.id}`, person)
    .then(response => response.data)
    .catch(handleError);
};

const defaultQueryOptions = {
  withTransactions: false,
};

const queryPeople = (criteria = {}, options = {}) => {
  let criteriaQuery = '';
  options = { ...defaultQueryOptions, ...options };
  if (options.withTransactions) {
    criteria['_embed'] = 'transactions';
  }

  if (!_.isEmpty(criteria)) {
    criteriaQuery = stringify(criteria);
  }

  return axios
    .get(`${baseUrl}?${criteriaQuery}`)
    .then(response => response.data)
    .catch(handleError);
};

// Convenience methods
const getById = id => {
  if (!id || !_.isNumber(id)) {
    return rejectPromise('Cannot search for a missing or bad id');
  }

  return axios
    .get(`${baseUrl}/${id}`)
    .then(response => response.data)
    .catch(handleError);
};

const dao = {
  addPerson,
  removePerson,
  updatePerson,
  queryPeople,
  getById,
};

export default dao;
