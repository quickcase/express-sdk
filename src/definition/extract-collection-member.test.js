/**
 * `extractCollectionMember` is a simple decorator of `extractMember`, most tests are omitted as already covered by `extractMember`
 */
import extractCollectionMember from './extract-collection-member.js';
import extractField from './extract-field.js';

const extractor = extractField({
  fields: {
    'collection1': {
      type: 'collection',
      content: {
        type: 'complex',
        members: {
          'member1': {id: 'member1', type: 'string'},
          'member2': {id: 'member2', type: 'string'},
          'member3': {id: 'member3', type: 'string'},
        },
      },
    },
  },
});

test('should extract member from collection', () => {
  expect(
    extractCollectionMember(extractor, 'collection1')('member1')
  ).toEqual({id: 'member1', type: 'string'});
});

test('should extract multiple members from collection', () => {
  expect(
    extractCollectionMember(extractor, 'collection1')([
      'member2',
      'member1',
      'member3',
    ])
  ).toEqual([
    {id: 'member2', type: 'string'},
    {id: 'member1', type: 'string'},
    {id: 'member3', type: 'string'},
  ]);
});
