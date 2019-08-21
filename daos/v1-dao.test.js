import dao from './v1-dao';

it('should reject because the Person has an id', () => {
  expect.assertions(2);
  const mockPerson = { firstName: 'John', id: 5 };
  return dao.addPerson(mockPerson).catch(err => {
    expect(err).toHaveProperty('message');
    expect(err.message).toMatch('updated');
  });
});

// TODO: Checks for updatePerson and removePerson
