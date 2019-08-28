/* eslint-disable no-fallthrough */

import axios from 'axios';
import * as _ from 'lodash';
import { stringify } from 'query-string';

// Internals

const CancelToken = axios.CancelToken;

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
  let message,
    isCancel = false;
  if (axios.isCancel(error)) {
    message = 'Canceled request';
    isCancel = true;
  } else if (error.response) {
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
    message = 'Unknown error, no server response.';
  }

  return rejectPromise(message, { isCancel });
}

function rejectPromise(message, rest) {
  return Promise.reject({ message, ...rest });
}

function addCancel(options) {
  if (options.cancelToken) {
    return {
      cancelToken: new CancelToken(cancel => options.cancelToken({ cancel })),
    };
  }
}

const defaultAxiosOptions = {};

function getAxiosOptions(options) {
  return {
    ...defaultAxiosOptions,
    ...options,
    ...addCancel(options),
  };
}

// TODO: Pick this up from environment?
const baseUrl = 'http://localhost:8000/api/v1/banking/people';

const defaultQueryOptions = {
  withTransactions: false,
};

const defaultUpdateOptions = { upsert: false };

// Standard methods
const addPerson = (person, options = {}) => {
  if (_.has(person, 'id')) {
    return rejectPromise(
      'A Person with an id should not be added, but updated.',
    );
  }

  let axiosOptions = getAxiosOptions(options);

  // Assume good faith otherwise. If the users abused this, or were confused,
  // we could put in more checks before adding this person
  return axios
    .post(`${baseUrl}`, person, axiosOptions)
    .then(response => response.data)
    .catch(handleError);
};

const removePerson = async (person, options = {}) => {
  const personExists = await checkPersonExists(person);
  if (_.isNull(personExists)) {
    return rejectPromise(`Could not determine if person #${person.id} exists.`);
  }

  if (!personExists) {
    return rejectPromise(`Person #${person.id} does not exist!`);
  }
  let axiosOptions = getAxiosOptions(options);

  return axios
    .patch(
      `${baseUrl}/${person.id}`,
      { ...person, active: false },
      axiosOptions,
    )
    .then(response => response.data)
    .catch(handleError);
};

const updatePerson = async (person, options) => {
  let axiosOptions = getAxiosOptions(options);
  options = { ...defaultUpdateOptions, ...options };
  const personExists = await checkPersonExists(person);
  if (_.isNull(personExists)) {
    return rejectPromise(`Could not determine if person #${person.id} exists.`);
  }

  if (!personExists && !options.upsert) {
    return rejectPromise(`Person #${person.id} does not exist!`);
  }

  if (!personExists && options.upsert) {
    console.warn(
      `Person #${person.id} did not exist. Wiping ID and inserting.`,
    );
    delete person.id;
    return addPerson(person);
  }

  return axios
    .patch(`${baseUrl}/${person.id}`, person, axiosOptions)
    .then(response => response.data)
    .catch(handleError);
};

const queryPeople = (criteria = {}, options = {}) => {
  let criteriaQuery = '',
    axiosOptions = getAxiosOptions(options);

  criteria = { ...defaultQueryOptions, ...criteria };

  // Users can pass arbitrary options on the queryString via the options.params property
  if (options.params) {
    criteria = { ...criteria, ...options.params };
  }
  if (options.withTransactions) {
    criteria['_embed'] = 'transactions';
  }

  if (options.delay) {
    criteria['_delay'] = options.delay;
  }

  if (!_.isEmpty(criteria)) {
    criteriaQuery = stringify(criteria);
  }

  return axios
    .get(`${baseUrl}?${criteriaQuery}`, axiosOptions)
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
