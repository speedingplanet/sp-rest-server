const lodash = require('lodash');
const { utilities } = require('./banking-resolvers');

const { buildCustomizer } = utilities;

it('should have buildCustomizer', () => {
  expect(buildCustomizer).toBeDefined();
});

it('should build a proper customizer', () => {
  const customizer = buildCustomizer();
  expect(typeof customizer).toBe('function');
});

describe('Tests against mock data', () => {
  let payees;

  beforeEach(() => {
    payees = getPayees();
  });

  it('should match exactly at the top level', () => {
    const criteria = {
      payeeName: payees[0].payeeName,
    };

    const customizer = buildCustomizer();
    const matches = lodash.filter(payees, payee =>
      lodash.isMatchWith(payee, criteria, customizer),
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual(payees[0]);
  });

  it('should match exactly at a sub-level', () => {
    const criteria = {
      address: {
        state: payees[0].address.state,
      },
    };

    const customizer = buildCustomizer();
    const matches = lodash.filter(payees, payee =>
      lodash.isMatchWith(payee, criteria, customizer),
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual(payees[0]);

    // This is redundant
    expect(matches[0].address.state).toEqual(payees[0].address.state);
  });

  it('should match partially at the top level', () => {
    const criteria = {
      payeeName: payees[0].payeeName.substr(3),
    };

    const customizer = buildCustomizer(['payeeName']);
    const matches = lodash.filter(payees, payee =>
      lodash.isMatchWith(payee, criteria, customizer),
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual(payees[0]);
  });

  it('should match partially at a sub-level', () => {
    const criteria = {
      address: {
        city: payees[0].address.city.substr(2),
      },
    };

    const customizer = buildCustomizer(['city']);
    const matches = lodash.filter(payees, payee =>
      lodash.isMatchWith(payee, criteria, customizer),
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual(payees[0]);
  });
});

function getPayees() {
  return [
    {
      id: '1',
      version: 1,
      payeeName: 'DCH Mortgages',
      address: {
        street: '1285 Rezlog Plaza',
        city: 'Powhatan',
        state: 'RI',
        zip: '02212',
      },
      categoryId: '102',
      image: null,
      motto: null,
      active: true,
    },
    {
      id: '2',
      version: 1,
      payeeName: 'Ill Communication Telephones',
      address: {
        street: '1597 Figole Grove',
        city: 'Akron',
        state: 'OH',
        zip: '66345',
      },
      categoryId: '106',
      image: null,
      motto: null,
      active: true,
    },
    {
      id: '3',
      version: 1,
      payeeName: "Erol's Internet",
      address: {
        street: '453 Loma Linda Junction',
        city: 'Kansas City',
        state: 'KS',
        zip: '60019',
      },
      categoryId: '106',
      image: null,
      motto: null,
      active: true,
    },
    {
      id: '4',
      version: 1,
      payeeName: 'Acme Products, Inc',
      address: {
        street: '1669 Divided Court',
        city: 'Cheyenne',
        state: 'WY',
        zip: '48324',
      },
      categoryId: '103',
      image: null,
      motto: null,
      active: true,
    },
    {
      id: '5',
      version: 1,
      payeeName: 'Shop-Rite Grocery Store',
      address: {
        street: '311 St. Paul Ave.',
        city: 'Baltimore',
        state: 'MD',
        zip: '08697',
      },
      categoryId: '103',
      image: null,
      motto: null,
      active: true,
    },
  ];
}
